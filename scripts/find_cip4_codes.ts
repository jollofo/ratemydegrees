import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import prisma from '../src/lib/prisma';

const searchTerms = [
    'Biomedical',
    'Computer Science',
    'Mechanical Engineering',
    'Electrical',
    'Computer Engineering',
    'Chemical Engineering',
    'Civil Engineering',
    'Mathematics',
    'Statistics',
    'Psychology',
    'Political Science',
    'Economics',
    'Business Administration',
    'Finance',
    'Accounting',
    'Communication',
    'Kinesiology',
    'Neuroscience',
    'Criminology',
    'Journalism'
];

async function main() {
    for (const term of searchTerms) {
        const matches = await prisma.major.findMany({
            where: {
                title: { contains: term, mode: 'insensitive' }
            },
            select: {
                cip4: true,
                title: true
            },
            take: 3
        });
        console.log(`\n🔍 Matches for "${term}":`);
        matches.forEach(m => console.log(`  - CIP4: ${m.cip4} | Title: ${m.title}`));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
