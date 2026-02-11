import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import prisma from '../../src/lib/prisma';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'hd2024.csv');
    const records = await parseCsv<any>(filePath);

    console.log(`Processing ${records.length} institutions...`);

    const institutions = [];
    for (const record of records) {
        const unitid = record['UNITID'];
        const name = (record['INSTNM'] || '').trim();
        const city = record['CITY'];
        const state = record['STABBR'];
        const website = record['GWEBSURL'];

        // CONTROL: 1=Public, 2=Private non-profit, 3=Private for-profit
        const controlRaw = record['CONTROL'];
        const control = controlRaw === '1' ? 'PUBLIC' : (controlRaw === '2' || controlRaw === '3' ? 'PRIVATE' : 'OTHER');

        const sector = record['SECTOR'];

        // CYACTIVE: 1=Yes, 2=No
        const active = record['CYACTIVE'] === '1';

        if (!name || !state || !unitid) continue;

        institutions.push({
            unitid: String(unitid),
            name,
            city,
            state,
            control,
            website,
            sector: String(sector),
            active,
            updatedAt: new Date(),
        });
    }

    console.log(`Prepared ${institutions.length} institutions for loading.`);

    const CHUNK_SIZE = 500;
    let count = 0;
    for (let i = 0; i < institutions.length; i += CHUNK_SIZE) {
        const chunk = institutions.slice(i, i + CHUNK_SIZE);
        await prisma.institution.createMany({
            data: chunk,
            skipDuplicates: true,
        });
        count += chunk.length;
        if (count % 1000 === 0) console.log(`Processed ${count} institutions...`);
    }

    console.log(`Finished loading ${institutions.length} institutions.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
