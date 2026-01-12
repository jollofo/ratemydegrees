import { PrismaClient } from '@prisma/client';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'c2024_a.csv');
    const records = await parseCsv<any>(filePath);

    console.log(`Processing ${records.length} completion records...`);

    // Map to group by (unitid, cip4)
    const rollup = new Map<string, number>();

    // We only want to link to majors/insitutions we actually have
    const activeInstitutions = new Set((await prisma.institution.findMany({ select: { unitid: true } })).map(i => i.unitid));
    const activeMajors = new Set((await prisma.major.findMany({ select: { cip4: true } })).map(m => m.cip4));

    console.log(`Checking against ${activeInstitutions.size} institutions and ${activeMajors.size} majors.`);

    for (const record of records) {
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
    }

    console.log(`Aggregated into ${rollup.size} institution-major pairs.`);

    const data = Array.from(rollup.entries()).map(([key, total]) => {
        const [unitid, cip4] = key.split('|');
        return { unitid, cip4, completionsTotal: total, latestYear: '2024' };
    });

    console.log(`Starting bulk insert of ${data.length} records...`);

    // SQLite variable limit is 999. 4 variables per record.
    const CHUNK_SIZE = 240;
    let count = 0;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await prisma.institutionMajor.createMany({
            data: chunk,
            skipDuplicates: true
        });
        count += chunk.length;
        if (count % 4800 === 0) console.log(`Synced ${count} link records...`);
    }

    console.log('Institution-Major links loaded successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
