import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const [occupationCount, graduateCount, occupations, graduatePrograms] = await Promise.all([
            prisma.majorOccupation.count(),
            prisma.graduateProgram.count(),
            prisma.majorOccupation.findMany({ where: { cip4: '11.01' }, orderBy: [{ matchedCip6Count: 'desc' }, { title: 'asc' }], take: 8 }),
            prisma.graduateProgram.findMany({ where: { cip4: '11.01' }, include: { institution: { select: { name: true } } }, orderBy: { completionsTotal: 'desc' }, take: 5 }),
        ]);
        console.log(JSON.stringify({ occupationCount, graduateCount, occupations, graduatePrograms }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
