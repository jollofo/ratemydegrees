import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const [programCount, nationalCount, programSample, nationalSample] = await Promise.all([
            prisma.scorecardProgramEarnings.count(),
            prisma.scorecardNationalEarnings.count(),
            prisma.scorecardProgramEarnings.findUnique({ where: { unitid_cip4_credentialLevel: { unitid: '100654', cip4: '11.01', credentialLevel: 3 } } }),
            prisma.scorecardNationalEarnings.findUnique({ where: { cip4_credentialLevel: { cip4: '11.01', credentialLevel: 3 } } }),
        ]);
        console.log(JSON.stringify({ programCount, nationalCount, programSample, nationalSample }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
