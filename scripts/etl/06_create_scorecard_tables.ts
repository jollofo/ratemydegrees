import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

async function main() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    const sql = fs.readFileSync(path.join(process.cwd(), 'prisma', 'scorecard_earnings.sql'), 'utf8');
    const prisma = new PrismaClient();
    try {
        for (const statement of sql.split(';').map(part => part.trim()).filter(Boolean)) {
            await prisma.$executeRawUnsafe(statement);
        }
        console.log('Scorecard earnings tables are ready.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
