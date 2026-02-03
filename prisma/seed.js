const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL disabled for local dev if not supported
    // ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Start seeding...')

    // Clear existing data (optional, but good for resetting to new schema)
    // Clear existing data (optional, but good for resetting to new schema)
    // Must clear dependent tables first
    await prisma.review.deleteMany({})
    await prisma.majorAlias.deleteMany({})
    await prisma.majorPathway.deleteMany({})
    await prisma.majorMeta.deleteMany({})
    await prisma.resolverEvent.deleteMany({})
    await prisma.institutionMajor.deleteMany({})

    await prisma.institution.deleteMany({})
    await prisma.major.deleteMany({})

    // Data is now loaded via ETL scripts from real government sources.
    // seed.js is reserved for functional testing or minimal config if needed.
    console.log('Database cleared. Please run ETL scripts to populate from IPEDS data.');

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
