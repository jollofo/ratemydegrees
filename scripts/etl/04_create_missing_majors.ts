import prisma from '../../src/lib/prisma';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

async function main() {
    console.log('Creating missing majors from completions data...');

    // Get all CIP4 codes from completions data
    const filePath = path.join(process.cwd(), 'data', 'c2024_a.csv');
    const records = await parseCsv<any>(filePath);

    const completionsCip4s = new Set<string>();
    for (const record of records) {
        let cip6raw = String(record['CIPCODE']);
        let cleanCip = cip6raw.replace(/\./g, '');
        if (cleanCip.length < 6) cleanCip = cleanCip.padStart(6, '0');
        const cip4 = `${cleanCip.substring(0, 2)}.${cleanCip.substring(2, 4)}`;

        // Skip invalid codes
        if (cip4 === '00.00' || cip4 === '99.00') continue;

        completionsCip4s.add(cip4);
    }

    console.log(`Found ${completionsCip4s.size} unique CIP4 codes in completions data`);

    // Get existing majors
    const existingMajors = await prisma.major.findMany({ select: { cip4: true } });
    const existingCip4s = new Set(existingMajors.map(m => m.cip4));

    console.log(`Existing majors in database: ${existingCip4s.size}`);

    // Find and create missing majors
    const missing = Array.from(completionsCip4s).filter(c => !existingCip4s.has(c));
    console.log(`Creating ${missing.length} missing majors...`);

    let count = 0;
    for (const cip4 of missing) {
        const category = cip4.split('.')[0];
        const slug = `major-${cip4.replace('.', '')}`;
        const title = `CIP ${cip4}`;

        try {
            await prisma.major.create({
                data: {
                    cip4,
                    title,
                    slug,
                    category,
                    description: 'Placeholder for CIP code found in completions data but not in IPEDS taxonomy'
                }
            });
            count++;
            if (count % 10 === 0) console.log(`Created ${count} majors...`);
        } catch (e: any) {
            console.error(`Failed to create major ${cip4}:`, e.message);
        }
    }

    console.log(`Successfully created ${count} missing majors`);

    // Final count
    const finalCount = await prisma.major.count();
    console.log(`Total majors in database: ${finalCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
