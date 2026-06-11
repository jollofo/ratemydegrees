import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import prisma from '../../src/lib/prisma';
import fs from 'fs';
import path from 'path';

type SeedAlias = {
    alias: string;
    cip4: string;
    type: 'synonym' | 'slang' | 'abbreviation' | 'program_name';
    notes?: string;
};

async function main() {
    console.log('🔄 Loading major aliases from aliases.json...');

    const jsonPath = path.join(process.cwd(), 'data', 'aliases.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ File not found: ${jsonPath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const aliases: SeedAlias[] = JSON.parse(fileContent);

    // Get all existing CIP4 codes to validate mappings
    const existingMajors = await prisma.major.findMany({ select: { cip4: true } });
    const cip4Set = new Set(existingMajors.map(m => m.cip4));

    console.log(`Verifying target CIP4 codes against ${cip4Set.size} active majors...`);

    let loadedCount = 0;
    let skippedCount = 0;

    for (const item of aliases) {
        if (!cip4Set.has(item.cip4)) {
            console.warn(`⚠️ Warning: Skipping alias "${item.alias}" because target CIP4 "${item.cip4}" does not exist in the database.`);
            skippedCount++;
            continue;
        }

        try {
            await prisma.majorAlias.upsert({
                where: { alias: item.alias },
                update: {
                    cip4: item.cip4,
                    type: item.type,
                    notes: item.notes || null,
                },
                create: {
                    alias: item.alias,
                    cip4: item.cip4,
                    type: item.type,
                    notes: item.notes || null,
                }
            });
            loadedCount++;
        } catch (e: any) {
            console.error(`❌ Failed to upsert alias "${item.alias}":`, e.message || e);
        }
    }

    console.log(`\n✅ Finished loading aliases! Loaded/Updated: ${loadedCount}, Skipped: ${skippedCount}.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
