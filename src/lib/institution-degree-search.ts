import prisma from './prisma';
import type { Prisma } from '@prisma/client';
import { parsePage, searchText } from './navigation';

// A missing completion/catalog record must not prevent a student from reviewing
// an existing degree. Keep known pairings first and label other matches explicitly.
export async function searchInstitutionDegrees(unitid: string, input: string, requestedPage = 1, take = 12) {
    const query = searchText(input);
    const page = parsePage(requestedPage);
    const size = Math.max(1, Math.min(50, Math.floor(take) || 12));
    const known: Prisma.MajorWhereInput = {
        OR: [{ institutions: { some: { unitid } } }, { reviews: { some: { unitid, status: 'APPROVED' } } }],
    };
    const matching: Prisma.MajorWhereInput = {
        AND: query.split(/\s+/).filter(Boolean).map(term => ({ OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { aliases: { some: { alias: { contains: term, mode: 'insensitive' } } } },
            { cip4: { contains: term } },
        ] })),
    };
    const listedWhere: Prisma.MajorWhereInput = { AND: [known, matching] };
    const additionalWhere: Prisma.MajorWhereInput = { AND: [matching, { NOT: known }] };
    const [listedCount, additionalCount] = await Promise.all([
        prisma.major.count({ where: listedWhere }),
        query.length >= 2 ? prisma.major.count({ where: additionalWhere }) : Promise.resolve(0),
    ]);
    const offset = (page - 1) * size;
    const listedTake = Math.min(size, Math.max(0, listedCount - offset));
    const select = { cip4: true, title: true, _count: { select: { reviews: { where: { unitid, status: 'APPROVED' } } } } } as const;
    const orderBy = [{ title: 'asc' }, { cip4: 'asc' }] as Prisma.MajorOrderByWithRelationInput[];
    const [listed, additional] = await Promise.all([
        listedTake ? prisma.major.findMany({ where: listedWhere, select, orderBy, skip: offset, take: listedTake }) : Promise.resolve([]),
        additionalCount && listedTake < size ? prisma.major.findMany({ where: additionalWhere, select, orderBy, skip: Math.max(0, offset - listedCount), take: size - listedTake }) : Promise.resolve([]),
    ]);
    const items = [
        ...listed.map(row => ({ id: row.cip4, name: row.title, reviewCount: row._count.reviews, catalogListed: true })),
        ...additional.map(row => ({ id: row.cip4, name: row.title, reviewCount: row._count.reviews, catalogListed: false })),
    ];
    return { items, totalPages: Math.ceil((listedCount + additionalCount) / size) };
}
