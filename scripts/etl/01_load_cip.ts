import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'data', 'IPEDS.csv');
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const lines = rawContent.split(/\r?\n/);

    console.log(`Processing ${lines.length} lines manually...`);

    const cip6Data: any[] = [];
    const majorsMap = new Map<string, { title: string; definition: string }>();

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Regex to split by comma but ignore commas inside quotes
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        if (parts.length < 5) continue;

        // Clean values
        const clean = (val: string) => {
            if (!val) return '';
            let v = val.trim();
            if (v.startsWith('="') && v.endsWith('"')) {
                v = v.substring(2, v.length - 1);
            }
            if (v.startsWith('"') && v.endsWith('"')) {
                v = v.substring(1, v.length - 1);
            }
            return v.replace(/""/g, '"');
        };

        const title = clean(parts[1]);
        const definition = clean(parts[2]);
        const cip6 = clean(parts[4]);

        if (!cip6 || cip6.includes('CIP Code')) continue;

        // Derive cip2, cip4
        const cipParts = cip6.split('.');
        const cip2 = cipParts[0].padStart(2, '0');
        let cip4 = `${cip2}.00`;
        if (cipParts.length > 1) {
            cip4 = `${cip2}.${cipParts[1].substring(0, 2).padEnd(2, '0')}`;
        }

        if (cip6.length === 5 && cip6.includes('.')) {
            if (!title.toLowerCase().startsWith('instructional content')) {
                majorsMap.set(cip6, { title, definition });
            }
        }

        if (cip6.includes('.')) {
            cip6Data.push({
                cip6,
                title,
                definition,
                cip2,
                cip4
            });
        }
    }

    console.log(`Found ${cip6Data.length} CIP entries.`);

    for (const data of cip6Data) {
        await prisma.cip6.upsert({
            where: { cip6: data.cip6 },
            update: data,
            create: data
        });
    }

    const allCip4s = new Set(cip6Data.map(d => d.cip4));
    console.log(`Upserting ${allCip4s.size} Majors (CIP4)...`);

    for (const cip4 of Array.from(allCip4s)) {
        const entry = majorsMap.get(cip4);
        let title = entry?.title || '';

        if (!title) {
            const child = cip6Data.find(d => d.cip4 === cip4 && d.cip6 !== cip4);
            title = child ? child.title.split(',')[0] : `Program ${cip4}`;
        }

        const cleanTitleForSlug = title.replace(/[^\w\s-]/g, '').trim();
        const slug = cleanTitleForSlug.toLowerCase().replace(/\s+/g, '-') + '-' + cip4.replace('.', '');

        await prisma.major.upsert({
            where: { cip4 },
            update: { title },
            create: {
                cip4,
                title,
                slug,
                category: cip4.split('.')[0]
            }
        });
    }

    console.log('CIP and Majors loaded successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
