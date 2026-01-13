import prisma from '../../src/lib/prisma';
import fs from 'fs';
import path from 'path';
import { parseCsv } from './utils/parseCsv';

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'IPEDS.csv');
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    console.log(`Parsing ${filePath}...`);
    const records = await parseCsv<any>(filePath);
    console.log(`Processing ${records.length} records from CSV...`);

    const cip6Data = new Map<string, any>();
    const majorsMap = new Map<string, { title: string; definition: string }>();

    // Mapping based on the column research:
    // Column 2 (Title), Column 3 (Definition), Column 5 (CIP Code)
    // Note: Column names might vary if the CSV has quotes/encoding issues, 
    // so we'll look for the fields dynamically or use order.

    for (const record of records) {
        // Values cleaning already handled by parseCsv (trim: true)
        const keys = Object.keys(record);

        // We know from grep that Column 2 is Title, Column 3 is Definition, Column 5 is CIP Code
        // Depending on how csv-parse named them, we might need to find by header name or index
        const title = record['Title'] || record[keys[1]];
        const definition = record['Definition'] || record[keys[2]];
        let rawCip = record['CIP Code'] || record[keys[4]];

        if (!rawCip || rawCip.includes('CIP Code')) continue;

        // Clean rawCip from ="XX.XXXX" format
        if (rawCip.startsWith('="') && rawCip.endsWith('"')) {
            rawCip = rawCip.substring(2, rawCip.length - 1);
        }

        // Normalize CIP
        const cipParts = rawCip.split('.');
        const cip2 = cipParts[0].padStart(2, '0');
        let cip4 = `${cip2}.00`;
        let cip6 = `${cip2}.0000`;

        if (cipParts.length > 1) {
            const part2 = cipParts[1];
            cip4 = `${cip2}.${part2.substring(0, 2).padEnd(2, '0')}`;
            if (part2.length > 2) {
                cip6 = `${cip2}.${part2.padEnd(4, '0')}`;
            } else {
                cip6 = cip4;
            }
        } else {
            cip4 = `${cip2}.00`;
            cip6 = cip4;
        }

        const isCip4 = rawCip.split('.').length === 2 && rawCip.split('.')[1].length <= 2;
        const isCip2 = !rawCip.includes('.');

        if ((isCip4 || isCip2) && title && !title.toLowerCase().startsWith('instructional content')) {
            majorsMap.set(cip4, { title, definition });
        }

        // Always store as CIP6 for the taxonomy table
        if (!cip6Data.has(cip6)) {
            cip6Data.set(cip6, {
                cip6,
                title,
                definition,
                cip2,
                cip4
            });
        }
    }

    console.log(`Upserting ${cip6Data.size} unique CIP6 entries...`);
    let count = 0;
    const cip6Entries = Array.from(cip6Data.values());

    for (const data of cip6Entries) {
        try {
            await prisma.cip6.upsert({
                where: { cip6: data.cip6 },
                update: data,
                create: data
            });
            count++;
            if (count % 1000 === 0) console.log(`Upserted ${count} CIP6 entries...`);
        } catch (e) {
            console.error(`Failed to upsert CIP6: ${data.cip6}`);
        }
    }

    const allCip4s = new Set(cip6Entries.map(d => d.cip4));
    console.log(`Upserting ${allCip4s.size} Majors (CIP4)...`);

    count = 0;
    for (const cip4 of Array.from(allCip4s)) {
        const entry = majorsMap.get(cip4);
        let title = entry?.title || '';

        if (!title) {
            const child = cip6Entries.find(d => d.cip4 === cip4 && d.cip6 !== cip4);
            title = child ? child.title.split(',')[0] : `Program ${cip4}`;
        }

        const cleanTitleForSlug = title.replace(/[^\w\s-]/g, '').trim();
        let slug = cleanTitleForSlug.toLowerCase().replace(/\s+/g, '-') + '-' + cip4.replace('.', '');
        if (!slug) slug = `major-${cip4.replace('.', '')}`;

        try {
            await prisma.major.upsert({
                where: { cip4 },
                update: { title, slug },
                create: {
                    cip4,
                    title,
                    slug,
                    category: cip4.split('.')[0]
                }
            });
            count++;
            if (count % 200 === 0) console.log(`Upserted ${count} Majors...`);
        } catch (e) {
            console.error(`Failed to upsert Major: ${cip4}`);
        }
    }

    console.log('CIP and Majors loaded successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
