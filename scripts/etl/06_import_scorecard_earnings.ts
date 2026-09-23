import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';

const SOURCE_RELEASE = process.argv[3] || '2026-06-10';
if (!/^\d{4}-\d{2}-\d{2}$/.test(SOURCE_RELEASE)) throw new Error('Release date must be YYYY-MM-DD');
const BATCH_SIZE = 400;
const input = process.argv[2] || path.join(process.cwd(), 'data', 'Most-Recent-Cohorts-Field-of-Study.csv');

type ProgramRow = [string, string, number, number | null, number | null, number | null, number | null, number | null, number | null, string];
type NationalRow = [string, number, number, number | null, number | null, string];

function publishedNumber(value: unknown): number | null {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

function cip4(value: unknown): string | null {
    if (typeof value !== 'string' || !/^\d{4}$/.test(value)) return null;
    return `${value.slice(0, 2)}.${value.slice(2)}`;
}

async function insertBatch(prisma: PrismaClient, table: string, columns: string[], rows: (string | number | null)[][], keyColumns: string[]) {
    if (!rows.length) return;
    const values = rows.flat();
    const placeholders = rows.map((row, rowIndex) => `(${row.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(',')})`).join(',');
    const updates = columns.filter(column => !keyColumns.includes(column)).map(column => `"${column}" = EXCLUDED."${column}"`).join(', ');
    const sql = `INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(',')}) VALUES ${placeholders} ON CONFLICT (${keyColumns.map(column => `"${column}"`).join(',')}) DO UPDATE SET ${updates}`;
    await prisma.$executeRawUnsafe(sql, ...values);
}

async function main() {
    if (!fs.existsSync(input)) throw new Error(`CSV not found: ${input}`);
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

    const prisma = new PrismaClient();
    try {
        const [institutionResult, majorResult] = await Promise.all([
            prisma.institution.findMany({ select: { unitid: true } }),
            prisma.major.findMany({ select: { cip4: true } }),
        ]);
        const institutions = new Set(institutionResult.map(row => row.unitid));
        const majors = new Set(majorResult.map(row => row.cip4));
        console.log(`Matching against ${institutions.size} institutions and ${majors.size} majors.`);

        const programColumns = ['unitid', 'cip4', 'credentialLevel', 'medianEarnings1Yr', 'medianEarnings4Yr', 'medianEarnings5Yr', 'earningsCount1Yr', 'earningsCount4Yr', 'earningsCount5Yr', 'sourceRelease'];
        const nationalColumns = ['cip4', 'credentialLevel', 'medianEarnings4Yr', 'p25Earnings4Yr', 'p75Earnings4Yr', 'sourceRelease'];
        const national = new Map<string, NationalRow>();
        let batch: ProgramRow[] = [];
        let read = 0;
        let imported = 0;

        const parser = fs.createReadStream(input).pipe(parse({ columns: true, bom: true, skip_empty_lines: true }));
        for await (const record of parser) {
            read++;
            const code = cip4(record.CIPCODE);
            const credentialLevel = publishedNumber(record.CREDLEV);
            if (!code || !majors.has(code) || credentialLevel === null) continue;

            const nationalMedian = publishedNumber(record.EARN_MDN_4YR_NAT);
            if (nationalMedian !== null) {
                const key = `${code}|${credentialLevel}`;
                const existing = national.get(key);
                if (existing && existing[2] !== nationalMedian) throw new Error(`Conflicting national median for ${key}`);
                national.set(key, [code, credentialLevel, nationalMedian, publishedNumber(record.EARN_P25_4YR_NAT), publishedNumber(record.EARN_P75_4YR_NAT), SOURCE_RELEASE]);
            }

            if (!institutions.has(record.UNITID)) continue;
            const earnings = [record.EARN_MDN_1YR, record.EARN_MDN_4YR, record.EARN_MDN_5YR].map(publishedNumber);
            if (earnings.every(value => value === null)) continue;
            batch.push([
                record.UNITID, code, credentialLevel,
                earnings[0], earnings[1], earnings[2],
                publishedNumber(record.EARN_COUNT_WNE_1YR),
                publishedNumber(record.EARN_COUNT_WNE_4YR),
                publishedNumber(record.EARN_COUNT_WNE_5YR),
                SOURCE_RELEASE,
            ]);
            if (batch.length >= BATCH_SIZE) {
                await insertBatch(prisma, 'ScorecardProgramEarnings', programColumns, batch, ['unitid', 'cip4', 'credentialLevel']);
                imported += batch.length;
                batch = [];
                if (imported % 10000 < BATCH_SIZE) console.log(`Imported ${imported} program earnings rows...`);
            }
        }
        if (batch.length) {
            await insertBatch(prisma, 'ScorecardProgramEarnings', programColumns, batch, ['unitid', 'cip4', 'credentialLevel']);
            imported += batch.length;
        }

        const nationalRows = [...national.values()];
        for (let i = 0; i < nationalRows.length; i += BATCH_SIZE) {
            await insertBatch(prisma, 'ScorecardNationalEarnings', nationalColumns, nationalRows.slice(i, i + BATCH_SIZE), ['cip4', 'credentialLevel']);
        }
        console.log(`Read ${read} source rows; imported ${imported} school-program rows and ${nationalRows.length} national major rows.`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
