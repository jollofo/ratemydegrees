import prisma from '../src/lib/prisma';
import { parseCsv } from './etl/utils/parseCsv';
import path from 'path';

async function main() {
    // Get all CIP4 codes from completions data
    const filePath = path.join(process.cwd(), 'data', 'c2024_a.csv');
    const records = await parseCsv<any>(filePath);

    const completionsCip4s = new Set<string>();
    for (const record of records) {
        let cip6raw = String(record['CIPCODE']);
        let cleanCip = cip6raw.replace(/\./g, '');
        if (cleanCip.length < 6) cleanCip = cleanCip.padStart(6, '0');
        const cip4 = `${cleanCip.substring(0, 2)}.${cleanCip.substring(2, 4)}`;
        completionsCip4s.add(cip4);
    }

    console.log(`Unique CIP4 codes in completions data: ${completionsCip4s.size}`);

    // Get all CIP4 codes from database
    const dbMajors = await prisma.major.findMany({ select: { cip4: true } });
    const dbCip4s = new Set(dbMajors.map(m => m.cip4));

    console.log(`CIP4 codes in database: ${dbCip4s.size}`);

    // Find missing codes
    const missing = Array.from(completionsCip4s).filter(c => !dbCip4s.has(c));
    console.log(`\nMissing CIP4 codes: ${missing.length}`);
    console.log('First 20 missing codes:', missing.slice(0, 20));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
