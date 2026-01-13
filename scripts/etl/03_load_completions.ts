import prisma from '../../src/lib/prisma';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'c2024_a.csv');
    const records = await parseCsv<any>(filePath);

    console.log(`Processing ${records.length} completion records...`);

    // Map to group by (unitid, cip4)
    const rollup = new Map<string, number>();

    // We only want to link to majors/insitutions we actually have
    const activeInstitutionsList = await prisma.institution.findMany({ select: { unitid: true } });
    const activeInstitutions = new Set(activeInstitutionsList.map(i => i.unitid));

    const activeMajorsList = await prisma.major.findMany({ select: { cip4: true } });
    const activeMajors = new Set(activeMajorsList.map(m => m.cip4));

    console.log(`Checking against ${activeInstitutions.size} institutions and ${activeMajors.size} majors.`);

    for (const record of records) {
        try {
            const unitid = String(record['UNITID']);
            let cip6raw = String(record['CIPCODE']);
            const completions = parseInt(record['CTOTALT'] || '0', 10);

            if (completions <= 0) continue;
            if (!activeInstitutions.has(unitid)) continue;

            // Clean CIPCODE (remove dots if present, then normalize to XX.XXXX)
            let cleanCip = cip6raw.replace(/\./g, '');
            if (cleanCip.length < 6) cleanCip = cleanCip.padStart(6, '0');

            // Derive CIP4
            const cip4 = `${cleanCip.substring(0, 2)}.${cleanCip.substring(2, 4)}`;

            if (!activeMajors.has(cip4)) continue;

            const key = `${unitid}|${cip4}`;
            rollup.set(key, (rollup.get(key) || 0) + completions);
        } catch (e) {
            // Silently skip corrupted rows
        }
    }

    console.log(`Aggregated into ${rollup.size} institution-major pairs.`);

    const data = Array.from(rollup.entries()).map(([key, total]) => {
        const [unitid, cip4] = key.split('|');
        return { unitid, cip4, completionsTotal: total, latestYear: '2024' };
    });

    console.log(`Starting bulk insert of ${data.length} records...`);

    // SQLite/PG variable limit
    const CHUNK_SIZE = 240;
    let count = 0;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        try {
            await prisma.institutionMajor.createMany({
                data: chunk,
                skipDuplicates: true
            });
            count += chunk.length;
            if (count % 4800 === 0) console.log(`Synced ${count} link records...`);
        } catch (e) {
            console.error('Failed chunk sync:', e);
        }
    }

    console.log('Institution-Major links loaded successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
