
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
    const dbUrl = process.env.DATABASE_URL
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    })
    const adapter = new PrismaPg(pool)
    // @ts-ignore
    const prisma = new PrismaClient({ adapter })

    const searchNames = ['University of Rochester', 'Cornell University', 'Stanford University', 'Harvard University'];

    for (const name of searchNames) {
        const inst = await prisma.institution.findFirst({
            where: { name: { contains: name, mode: 'insensitive' } }
        });
        if (inst) {
            console.log(`FOUND: ${name} -> ${inst.name} (${inst.unitid})`);
        } else {
            console.log(`MISSING: ${name}`);
        }
    }

    await prisma.$disconnect()
}

main().catch(console.error)
