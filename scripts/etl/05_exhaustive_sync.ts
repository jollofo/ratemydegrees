import prisma from '../../src/lib/prisma';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

async function main() {
    console.log('Synchronizing Majors with completions data...');

    // 1. Get all unique CIP4 codes from completions
    const filePath = path.join(process.cwd(), 'data', 'c2024_a.csv');
    const records = await parseCsv<any>(filePath);

    const completionsCip4s = new Set<string>();
    for (const record of records) {
        const cip6raw = String(record['CIPCODE']);
        // Robust normalization: split by dot or take first 4 digits
        let cip4 = '';
        if (cip6raw.includes('.')) {
            const [p1, p2] = cip6raw.split('.');
            cip4 = `${p1.padStart(2, '0')}.${p2.substring(0, 2).padEnd(2, '0')}`;
        } else {
            const clean = cip6raw.padStart(6, '0');
            cip4 = `${clean.substring(0, 2)}.${clean.substring(2, 4)}`;
        }

        if (cip4 === '00.00' || cip4 === '99.00') continue;
        completionsCip4s.add(cip4);
    }
    console.log(`Found ${completionsCip4s.size} unique CIP4 codes in completions.`);

    // 2. Get existing majors
    const existing = await prisma.major.findMany({ select: { cip4: true } });
    const existingSet = new Set(existing.map(m => m.cip4));
    console.log(`Database already has ${existingSet.size} majors.`);

    // 3. Create missing majors
    let created = 0;
    for (const cip4 of completionsCip4s) {
        if (!existingSet.has(cip4)) {
            const category = cip4.split('.')[0];
            const slug = `major-${cip4.replace('.', '')}`;
            await prisma.major.upsert({
                where: { cip4 },
                update: {},
                create: {
                    cip4,
                    title: `Program ${cip4}`,
                    slug,
                    category
                }
            });
            created++;
        }
    }
    console.log(`Created ${created} missing majors.`);

    // 4. Rerun link aggregation with robust normalization
    console.log('Recalculating and updating institution-major links...');
    const rollup = new Map<string, number>();
    const activeInstitutions = new Set((await prisma.institution.findMany({ select: { unitid: true } })).map(i => i.unitid));

    // We need all majors now
    const allMajors = new Set((await prisma.major.findMany({ select: { cip4: true } })).map(m => m.cip4));

    for (const record of records) {
        const unitid = String(record['UNITID']);
        if (!activeInstitutions.has(unitid)) continue;

        const cip6raw = String(record['CIPCODE']);
        let cip4 = '';
        if (cip6raw.includes('.')) {
            const [p1, p2] = cip6raw.split('.');
            cip4 = `${p1.padStart(2, '0')}.${p2.substring(0, 2).padEnd(2, '0')}`;
        } else {
            const clean = cip6raw.padStart(6, '0');
            cip4 = `${clean.substring(0, 2)}.${clean.substring(2, 4)}`;
        }

        const completions = parseInt(record['CTOTALT'] || '0', 10);
        if (completions <= 0 || !allMajors.has(cip4)) continue;

        const key = `${unitid}|${cip4}`;
        rollup.set(key, (rollup.get(key) || 0) + completions);
    }

    console.log(`Aggregated ${rollup.size} links. Starting bulk sync...`);

    const data = Array.from(rollup.entries()).map(([key, total]) => {
        const [unitid, cip4] = key.split('|');
        return { unitid, cip4, completionsTotal: total, latestYear: '2024' };
    });

    // Chunked insert
    const CHUNK_SIZE = 500;
    let synced = 0;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await prisma.institutionMajor.createMany({
            data: chunk,
            skipDuplicates: true
        });
        synced += chunk.length;
        if (synced % 5000 === 0) console.log(`Synced ${synced} records...`);
    }

    console.log(`Successfully synced ${synced} links.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
