import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const DATA = path.join(process.cwd(), 'data');
const CROSSWALK = path.join(DATA, 'cip_soc_crosswalk.csv');
const COMPLETIONS = path.join(DATA, 'c2024_a.csv');
const SOURCE = 'NCES 2020 CIP–2018 SOC crosswalk';
const SOURCE_YEAR = 2024;
const BATCH_SIZE = 400;

async function insertBatch(prisma: PrismaClient, table: string, columns: string[], rows: (string | number)[][], keyColumns: string[]) {
    if (!rows.length) return;
    const placeholders = rows.map((row, rowIndex) => `(${row.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(',')})`).join(',');
    const updates = columns.filter(column => !keyColumns.includes(column)).map(column => `"${column}" = EXCLUDED."${column}"`).join(', ');
    const sql = `INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(',')}) VALUES ${placeholders} ON CONFLICT (${keyColumns.map(column => `"${column}"`).join(',')}) DO UPDATE SET ${updates}`;
    await prisma.$executeRawUnsafe(sql, ...rows.flat());
}

async function main() {
    for (const file of [CROSSWALK, COMPLETIONS]) {
        if (!fs.existsSync(file)) throw new Error(`Data file missing: ${file}`);
    }
    const prisma = new PrismaClient();
    try {
        const [majorRows, institutionRows] = await Promise.all([
            prisma.major.findMany({ select: { cip4: true } }),
            prisma.institution.findMany({ select: { unitid: true } }),
        ]);
        const majors = new Set(majorRows.map(row => row.cip4));
        const institutions = new Set(institutionRows.map(row => row.unitid));

        const occupationMap = new Map<string, { cip4: string; socCode: string; title: string; cip6Codes: Set<string> }>();
        const crosswalkParser = fs.createReadStream(CROSSWALK).pipe(parse({ columns: true, bom: true, skip_empty_lines: true }));
        for await (const row of crosswalkParser) {
            const cip6 = String(row.CIP2020Code || '');
            const socCode = String(row.SOC2018Code || '');
            if (!/^\d{2}\.\d{4}$/.test(cip6) || !/^\d{2}-\d{4}$/.test(socCode) || socCode === '99-9999') continue;
            const cip4 = cip6.slice(0, 5);
            if (!majors.has(cip4)) continue;
            const key = `${cip4}|${socCode}`;
            let occupation = occupationMap.get(key);
            if (!occupation) {
                occupation = { cip4, socCode, title: String(row.SOC2018Title || '').trim(), cip6Codes: new Set() };
                occupationMap.set(key, occupation);
            }
            occupation.cip6Codes.add(cip6);
        }
        const occupations = [...occupationMap.values()].map(row => [row.cip4, row.socCode, row.title, row.cip6Codes.size, SOURCE]);
        for (let i = 0; i < occupations.length; i += BATCH_SIZE) {
            await insertBatch(prisma, 'MajorOccupation', ['cip4', 'socCode', 'title', 'matchedCip6Count', 'source'], occupations.slice(i, i + BATCH_SIZE), ['cip4', 'socCode']);
        }
        console.log(`Imported ${occupations.length} major–occupation links.`);

        const graduateMap = new Map<string, { unitid: string; cip4: string; awardLevel: number; completionsTotal: number }>();
        const completionParser = fs.createReadStream(COMPLETIONS).pipe(parse({ columns: true, bom: true, skip_empty_lines: true }));
        for await (const row of completionParser) {
            if (row.MAJORNUM !== '1' || !['7', '17', '18', '19'].includes(row.AWLEVEL)) continue;
            const cip6 = String(row.CIPCODE || '');
            if (!/^\d{2}\.\d{4}$/.test(cip6) || !/^\d+$/.test(row.CTOTALT)) continue;
            const completions = Number(row.CTOTALT);
            if (!Number.isSafeInteger(completions) || completions <= 0) continue;
            const cip4 = cip6.slice(0, 5);
            if (!majors.has(cip4) || !institutions.has(row.UNITID)) continue;
            const awardLevel = Number(row.AWLEVEL);
            const key = `${row.UNITID}|${cip4}|${awardLevel}`;
            const previous = graduateMap.get(key);
            if (previous) previous.completionsTotal += completions;
            else graduateMap.set(key, { unitid: row.UNITID, cip4, awardLevel, completionsTotal: completions });
        }
        const graduateRows = [...graduateMap.values()].map(row => [row.unitid, row.cip4, row.awardLevel, row.completionsTotal, SOURCE_YEAR]);
        for (let i = 0; i < graduateRows.length; i += BATCH_SIZE) {
            await insertBatch(prisma, 'GraduateProgram', ['unitid', 'cip4', 'awardLevel', 'completionsTotal', 'sourceYear'], graduateRows.slice(i, i + BATCH_SIZE), ['unitid', 'cip4', 'awardLevel']);
            if (i > 0 && i % 10000 < BATCH_SIZE) console.log(`Imported ${i} graduate program rows...`);
        }
        console.log(`Imported ${graduateRows.length} institution–major–graduate-degree rows from IPEDS ${SOURCE_YEAR}.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
