import prisma from '../src/lib/prisma';
import fs from 'fs';
import readline from 'readline';

async function main() {
    const dbMajors = new Set((await prisma.major.findMany({ select: { cip4: true } })).map(m => m.cip4));
    console.log(`Database has ${dbMajors.size} majors.`);

    const fileStream = fs.createReadStream('data/c2024_a.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const rochesterCsvCip4s = new Map<string, number>();
    let lineCount = 0;

    for await (const line of rl) {
        lineCount++;
        if (lineCount === 1) continue; // Skip header

        const parts = line.split(',');
        const unitid = parts[0];
        if (unitid !== '195030') continue;

        let cip6raw = parts[1].replace(/[\"=]/g, '');
        const completions = parseInt(parts[5] || '0', 10);
        if (completions <= 0) continue;

        // Implementation of the CURRENT normalization logic to see what it produces
        let cleanCip = cip6raw.replace(/\./g, '');
        if (cleanCip.length < 6) cleanCip = cleanCip.padStart(6, '0');
        const cip4 = `${cleanCip.substring(0, 2)}.${cleanCip.substring(2, 4)}`;

        if (cip4 === '00.00' || cip4 === '99.00') continue;

        rochesterCsvCip4s.set(cip4, (rochesterCsvCip4s.get(cip4) || 0) + completions);
    }

    console.log(`Rochester has ${rochesterCsvCip4s.size} unique CIP4s (normalized) in CSV with completions > 0.`);

    const missingShort = [];
    for (const cip4 of rochesterCsvCip4s.keys()) {
        if (!dbMajors.has(cip4)) {
            missingShort.push(cip4);
        }
    }

    console.log(`Missing from DB: ${missingShort.length}`);
    if (missingShort.length > 0) {
        console.log('Sample missing:', missingShort);
    }

    // Check existing links in DB
    const links = await prisma.institutionMajor.findMany({
        where: { unitid: '195030' },
        select: { cip4: true }
    });
    console.log(`DB has ${links.length} links for Rochester.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
