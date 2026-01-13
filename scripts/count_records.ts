import prisma from '../src/lib/prisma';

async function main() {
    console.log('Counting records...');
    try {
        const institutionCount = await prisma.institution.count();
        console.log(`Institutions: ${institutionCount}`);
    } catch (e: any) { console.error('Error counting Institutions:', e.message || e); }

    try {
        const majorCount = await prisma.major.count();
        console.log(`Majors (CIP4): ${majorCount}`);
    } catch (e) { console.error('Error counting Majors:', e); }

    try {
        const cip6Count = await prisma.cip6.count();
        console.log(`CIP6 Entries: ${cip6Count}`);
    } catch (e) { console.error('Error counting CIP6:', e); }

    try {
        const linkCount = await prisma.institutionMajor.count();
        console.log(`Links: ${linkCount}`);
    } catch (e) { console.error('Error counting Links:', e); }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
