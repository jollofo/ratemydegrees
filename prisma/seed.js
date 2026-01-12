const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // Clear existing data (optional, but good for resetting to new schema)
    await prisma.review.deleteMany({})
    await prisma.institution.deleteMany({})
    await prisma.major.deleteMany({})

    const institutions = [
        { name: 'Stanford University', state: 'CA', control: 'PRIVATE', sizeBucket: 'LARGE' },
        { name: 'UC Berkeley', state: 'CA', control: 'PUBLIC', sizeBucket: 'LARGE' },
        { name: 'MIT', state: 'MA', control: 'PRIVATE', sizeBucket: 'SMALL' },
        { name: 'Georgia Tech', state: 'GA', control: 'PUBLIC', sizeBucket: 'LARGE' },
        { name: 'University of Texas at Austin', state: 'TX', control: 'PUBLIC', sizeBucket: 'LARGE' },
    ]

    for (const inst of institutions) {
        await prisma.institution.create({ data: inst })
    }

    const majors = [
        {
            name: 'Computer Science',
            category: 'STEM',
            description: 'Study of computers and computational systems.',
            outcomes: JSON.stringify({
                commonJobs: ['Software Engineer', 'Data Scientist', 'Systems Architect'],
                salaryRange: '$80,000 - $150,000',
                gradPaths: ['MS in Computer Science', 'MBA', 'PhD in AI']
            })
        },
        {
            name: 'Mechanical Engineering',
            category: 'STEM',
            description: 'Design and production of machinery.',
            outcomes: JSON.stringify({
                commonJobs: ['Mechanical Engineer', 'Robotics Engineer', 'Design Engineer'],
                salaryRange: '$70,000 - $120,000',
                gradPaths: ['MS in Engineering', 'Professional Engineer (PE) License']
            })
        },
        {
            name: 'Psychology',
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
