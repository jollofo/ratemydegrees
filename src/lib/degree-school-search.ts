import prisma from './prisma';
import type { Prisma } from '@prisma/client';
import { parsePage, searchText } from './navigation';

export async function searchDegreeSchools(cip4: string, input: string, requestedPage = 1, take = 12) {
    const query = searchText(input);
    const page = parsePage(requestedPage);
    const size = Number.isFinite(take) ? Math.max(1, Math.min(50, Math.floor(take))) : 12;
    const known: Prisma.InstitutionWhereInput = {
        OR: [{ offeredMajors: { some: { cip4 } } }, { reviews: { some: { cip4, status: 'APPROVED' } } }],
    };
    const matching: Prisma.InstitutionWhereInput = { active: true, name: { contains: query, mode: 'insensitive' } };
    const listedWhere: Prisma.InstitutionWhereInput = { AND: [matching, known] };
    const additionalWhere: Prisma.InstitutionWhereInput = { AND: [matching, { NOT: known }] };
    const [listedCount, additionalCount] = await Promise.all([
        prisma.institution.count({ where: listedWhere }),
        query.length >= 2 ? prisma.institution.count({ where: additionalWhere }) : Promise.resolve(0),
    ]);
    const offset = (page - 1) * size;
    const listedTake = Math.min(size, Math.max(0, listedCount - offset));
    const select = { unitid: true, name: true, city: true, state: true, _count: { select: { reviews: { where: { cip4, status: 'APPROVED' } } } } } as const;
    const orderBy: Prisma.InstitutionOrderByWithRelationInput[] = [{ name: 'asc' }, { unitid: 'asc' }];
    const [listed, additional] = await Promise.all([
        listedTake ? prisma.institution.findMany({ where: listedWhere, select, orderBy, skip: offset, take: listedTake }) : Promise.resolve([]),
        additionalCount && listedTake < size ? prisma.institution.findMany({ where: additionalWhere, select, orderBy, skip: Math.max(0, offset - listedCount), take: size - listedTake }) : Promise.resolve([]),
    ]);
    return {
        schools: [...listed.map(row => ({ ...row, catalogListed: true })), ...additional.map(row => ({ ...row, catalogListed: false }))],
        total: listedCount + additionalCount,
        totalPages: Math.ceil((listedCount + additionalCount) / size),
    };
}
