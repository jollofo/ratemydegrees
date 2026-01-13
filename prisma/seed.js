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
    await prisma.review.deleteMany({})
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
        }
    ]

    for (const m of majors) {
        await prisma.major.create({ data: m })
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
