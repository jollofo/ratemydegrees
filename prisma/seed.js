const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const majors = [
        { name: 'Computer Science', category: 'STEM', description: 'Study of computers and computational systems.' },
        { name: 'Mechanical Engineering', category: 'STEM', description: 'Branch of engineering that involves the design, production, and operation of machinery.' },
        { name: 'Psychology', category: 'Social Sciences', description: 'Scientific study of the mind and behavior.' },
        { name: 'Business Administration', category: 'Business', description: 'Management of a business or non-profit organization.' },
        { name: 'Nursing', category: 'Health', description: 'Profession within the health care sector focused on the care of individuals, families, and communities.' },
        { name: 'Biology', category: 'STEM', description: 'Natural science that studies life and living organisms.' },
        { name: 'English Literature', category: 'Humanities', description: 'Study of literature written in the English language.' },
        { name: 'Political Science', category: 'Social Sciences', description: 'Study of systems of government, and the analysis of political activities, thoughts, and behavior.' },
        { name: 'Electrical Engineering', category: 'STEM', description: 'Engineering discipline concerned with the study, design, and application of equipment, devices, and systems which use electricity, electronics, and electromagnetism.' },
        { name: 'Economics', category: 'Social Sciences', description: 'Social science that studies the production, distribution, and consumption of goods and services.' },
    ]

    console.log('Start seeding...')
    for (const m of majors) {
        const major = await prisma.major.upsert({
            where: { name: m.name },
            update: {},
            create: m,
        })
        console.log(`Created major with id: ${major.id}`)
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
