import prisma from '../../src/lib/prisma';
import { parseCsv } from './utils/parseCsv';
import path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'hd2024.csv');
    const records = await parseCsv<any>(filePath);

    console.log(`Processing ${records.length} institutions...`);

    let count = 0;
    for (const record of records) {
        try {
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

            await prisma.institution.upsert({
                where: { unitid: String(unitid) },
                update: {
                    name,
                    city,
                    state,
                    control,
                    website,
                    sector: String(sector),
                    active
                },
                create: {
                    unitid: String(unitid),
                    name,
                    city,
                    state,
                    control,
                    website,
                    sector: String(sector),
                    active
                }
            });
            count++;
            if (count % 500 === 0) console.log(`Loaded ${count} institutions...`);
        } catch (e) {
            console.error(`Failed to upsert institution: ${record['INSTNM']}`, e);
        }
    }

    console.log(`Finished loading ${count} institutions.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
