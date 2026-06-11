import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import prisma from '../src/lib/prisma';

async function main() {
    const count = await prisma.majorAlias.count();
    console.log(`MajorAlias count: ${count}`);
    const aliases = await prisma.majorAlias.findMany({ take: 10 });
    console.log('Sample aliases:', aliases);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
