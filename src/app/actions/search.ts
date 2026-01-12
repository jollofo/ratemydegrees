'use server';

import prisma from '@/lib/prisma';

export async function searchInstitutions(query: string) {
    if (query.length < 2) return [];

    return prisma.institution.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
            ],
            active: true
        },
        orderBy: { name: 'asc' },
        take: 10
    });
}

export async function searchMajors(query: string) {
    if (query.length < 2) return [];

    return prisma.major.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
            ]
        },
        orderBy: { title: 'asc' },
        take: 10
    });
}

export async function getTopInstitutionsForMajor(cip4: string) {
    return prisma.institutionMajor.findMany({
        where: { cip4 },
        include: {
            institution: true
        },
        orderBy: { completionsTotal: 'desc' },
        take: 10
    });
}
