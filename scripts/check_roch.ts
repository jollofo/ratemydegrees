
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

    const institutions = await prisma.institution.findMany({
        where: {
            OR: [
                { unitid: '195030' },
                { name: { contains: 'Rochester', mode: 'insensitive' } }
            ]
        }
    })

    console.log('Institutions found:', JSON.stringify(institutions, null, 2))

    const count = await prisma.institution.count();
    console.log('Total institutions in DB:', count);

    await prisma.$disconnect()
}

main().catch(console.error)
