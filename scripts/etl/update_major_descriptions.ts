import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import prisma from '../../src/lib/prisma';

async function main() {
    console.log('🔄 Starting Major description updates from Cip6 taxonomy...');

    const majors = await prisma.major.findMany({
        select: {
            cip4: true,
            title: true,
            description: true,
        }
    });

    console.log(`Found ${majors.length} majors to verify.`);
    let updatedCount = 0;

    for (const major of majors) {
        let definition: string | null = null;

        // 1. Try to find a Cip6 entry that matches the major's cip4 code directly (e.g. cip6 === '14.05')
        const directMatch = await prisma.cip6.findUnique({
            where: { cip6: major.cip4 },
            select: { definition: true }
        });

        if (directMatch && directMatch.definition && directMatch.definition.trim()) {
            definition = directMatch.definition;
        }

        // 2. If no direct match definition, fall back to any child Cip6 entry under this cip4 (e.g. cip4 === '14.05')
        if (!definition) {
            const childMatch = await prisma.cip6.findFirst({
                where: {
                    cip4: major.cip4,
                    definition: { not: null, lte: undefined } // non-empty definition
                },
                select: { definition: true }
            });

            if (childMatch && childMatch.definition && childMatch.definition.trim()) {
                definition = childMatch.definition;
            }
        }

        // 3. Update the Major record if a valid definition is found and differs from the current description
        if (definition) {
            const cleanDef = definition.trim();
            if (major.description !== cleanDef || !major.description || major.description.startsWith('Placeholder')) {
                await prisma.major.update({
                    where: { cip4: major.cip4 },
                    data: { description: cleanDef }
                });
                updatedCount++;
            }
        }
    }

    console.log(`✅ Completed Major descriptions sync! Updated ${updatedCount} majors with rich definitions.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
