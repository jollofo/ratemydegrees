const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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

    const institutions = [
        { unitid: '243744', name: 'Stanford University', state: 'CA', control: 'PRIVATE' },
        { unitid: '110662', name: 'UC Berkeley', state: 'CA', control: 'PUBLIC' },
        { unitid: '166683', name: 'MIT', state: 'MA', control: 'PRIVATE' },
        { unitid: '139755', name: 'Georgia Tech', state: 'GA', control: 'PUBLIC' },
        { unitid: '228778', name: 'University of Texas at Austin', state: 'TX', control: 'PUBLIC' },
    ]

    for (const inst of institutions) {
        await prisma.institution.create({ data: inst })
    }

    const majors = [
        {
            cip4: '11.07',
            title: 'Computer Science',
            category: 'STEM',
            description: 'Study of computers and computational systems.',
            outcomes: JSON.stringify({
                commonJobs: ['Software Engineer', 'Data Scientist', 'Systems Architect'],
                salaryRange: '$80,000 - $150,000',
                gradPaths: ['MS in Computer Science', 'MBA', 'PhD in AI']
            })
        },
        {
            cip4: '14.19',
            title: 'Mechanical Engineering',
            category: 'STEM',
            description: 'Design and production of machinery.',
            outcomes: JSON.stringify({
                commonJobs: ['Mechanical Engineer', 'Robotics Engineer', 'Design Engineer'],
                salaryRange: '$70,000 - $120,000',
                gradPaths: ['MS in Engineering', 'Professional Engineer (PE) License']
            })
        },
        {
            cip4: '42.01',
            title: 'Psychology',
            category: 'Social Sciences',
            description: 'Scientific study of the mind and behavior.',
            outcomes: JSON.stringify({
                commonJobs: ['Mental Health Counselor', 'HR Specialist', 'Market Research Analyst'],
                salaryRange: '$45,000 - $90,000',
                gradPaths: ['Masters in Counseling', 'PhD in Psychology', 'Law School']
            })
        },
        {
            cip4: '51.02',
            title: 'Communication Disorders Sciences and Services',
            category: 'Health',
            description: 'Audiology and speech-language pathology.',
            outcomes: JSON.stringify({
                commonJobs: ['Speech-Language Pathologist', 'Audiologist'],
                salaryRange: '$60,000 - $90,000',
                gradPaths: ['MA in Speech-Language Pathology', 'AuD']
            })
        }
    ]

    for (const m of majors) {
        await prisma.major.upsert({
            where: { cip4: m.cip4 },
            update: {},
            create: m
        })
    }

    // Seed Aliases
    const aliases = [
        { alias: 'comp sci', cip4: '11.07', type: 'abbreviation' },
        { alias: 'mech e', cip4: '14.19', type: 'abbreviation' },
        { alias: 'speech therapy', cip4: '51.02', type: 'synonym' },
        { alias: 'csd', cip4: '51.02', type: 'abbreviation' },
        { alias: 'psych', cip4: '42.01', type: 'abbreviation' }
    ]

    for (const a of aliases) {
        await prisma.majorAlias.upsert({
            where: { alias: a.alias },
            update: {},
            create: a
        })
    }

    // Seed Pathways
    const pathways = [
        { pathway: 'speech therapist', cip4: '51.02', weight: 10 },
        { pathway: 'robotics engineer', cip4: '14.19', weight: 8 },
        { pathway: 'software developer', cip4: '11.07', weight: 10 }
    ]

    for (const p of pathways) {
        // Simple create for now as pathway is not unique, but maybe we want to avoid dupes in seed
        const existing = await prisma.majorPathway.findFirst({
            where: { pathway: p.pathway, cip4: p.cip4 }
        })
        if (!existing) {
            await prisma.majorPathway.create({ data: p })
        }
    }

    // Seed Meta
    const metas = [
        { cip4: '51.02', requiresGradDegree: true, gradDegreeNotes: 'Master\'s degree typically required for licensure/certification.' },
        { cip4: '42.01', requiresGradDegree: false, gradDegreeNotes: 'Graduate degree often required for clinical practice.', commonRelatedCip4: ['51.02'] }
    ]

    for (const meta of metas) {
        await prisma.majorMeta.upsert({
            where: { cip4: meta.cip4 },
            update: {},
            create: meta
        })
    }

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
