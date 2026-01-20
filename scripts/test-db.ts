
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
    const dbUrl = process.env.DATABASE_URL
    console.log('DATABASE_URL:', dbUrl)

    let prisma: PrismaClient;

    if (dbUrl?.startsWith('postgresql://') || dbUrl?.startsWith('postgres://')) {
        console.log('Using Postgres adapter...')
        const pool = new Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        })
        const adapter = new PrismaPg(pool)
        // @ts-ignore
        prisma = new PrismaClient({ adapter })
    } else {
        console.log('Using default Prisma driver (likely SQLite)...')
        prisma = new PrismaClient()
    }

    try {
        console.log('Attempting to count majors...')
        const count = await prisma.major.count()
        console.log('Major count:', count)
    } catch (e: any) {
        console.error('Error during prisma query:', e.message)
        if (e.message.includes('Foreign key constraint failed')) {
            console.log('This is a common SQLite error if the schema doesn\'t match.')
        }
    } finally {
        await prisma.$disconnect()
    }
}

main()
