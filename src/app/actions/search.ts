'use server';

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { parsePage, searchText } from '@/lib/navigation';
import { searchClient, COLLECTION_INSTITUTIONS } from '@/lib/typesense';

export interface MajorHit { id: string; cip4: string; title: string; category: string; description: string; reviewCount: number; }
export interface InstitutionHit { id: string; unitid: string; name: string; city: string; state: string; control: string; reviewCount: number; }
type Options = { page?: number; hitsPerPage?: number; filterBy?: string };
function pagination(options?: Options) {
    const requested = options?.hitsPerPage;
    return { page: parsePage(options?.page), take: typeof requested === 'number' && Number.isFinite(requested) ? Math.max(1, Math.min(50, Math.floor(requested))) : 12 };
}

export async function searchMajors(input: string, options?: Options) {
    const query = searchText(input);
    const { page, take } = pagination(options);
    const category = options?.filterBy?.startsWith('category:=') ? searchText(options.filterBy.slice(10)) : '';
    const terms = query === '*' ? [] : query.split(/\s+/).filter(Boolean);
    const where: Prisma.MajorWhereInput = {
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
        ...(terms.length ? { AND: terms.map(term => ({ OR: [
            { title: { contains: term, mode: 'insensitive' as const } },
            { aliases: { some: { alias: { contains: term, mode: 'insensitive' as const } } } },
        ] })) } : {}),
    };
    try {
        const [rows, totalHits] = await Promise.all([
            prisma.major.findMany({ where, select: { cip4: true, title: true, category: true, description: true, _count: { select: { reviews: { where: { status: 'APPROVED' } } } } }, orderBy: [{ title: 'asc' }, { cip4: 'asc' }], skip: (page - 1) * take, take }),
            prisma.major.count({ where }),
        ]);
        const hits: MajorHit[] = rows.map(row => ({ id: row.cip4, cip4: row.cip4, title: row.title, category: row.category ?? '', description: row.description ?? '', reviewCount: row._count.reviews }));
        return { hits, totalHits, totalPages: Math.ceil(totalHits / take), unavailable: false };
    } catch (error) {
        console.error('Degree search unavailable', error);
        return { hits: [] as MajorHit[], totalHits: 0, totalPages: 0, unavailable: true };
    }
}

export async function searchInstitutions(input: string, options?: Options) {
    const query = searchText(input);
    const { page, take } = pagination(options);
    const state = options?.filterBy?.startsWith('state:=') ? searchText(options.filterBy.slice(7)) : '';
    let where: Prisma.InstitutionWhereInput = {
        active: true, ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
        ...(query && query !== '*' ? { OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { state: { equals: query, mode: 'insensitive' } },
        ] } : {}),
    };
    try {
        let totalHits = await prisma.institution.count({ where });
        // The index supplies aliases only when direct database matching has no result.
        // Public visibility and review counts always come from the database.
        if (!totalHits && query && query !== '*') {
            try {
                const result = await searchClient.collections(COLLECTION_INSTITUTIONS).documents().search({ q: query, query_by: 'name,aliases', per_page: 50, drop_tokens_threshold: 0 });
                const ids = (result.hits ?? []).flatMap(hit => {
                    const row = hit.document as { unitid?: unknown };
                    return typeof row.unitid === 'string' ? [row.unitid] : [];
                });
                if (ids.length) {
                    where = { active: true, unitid: { in: ids }, ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}) };
                    totalHits = await prisma.institution.count({ where });
                }
            } catch { /* Direct database search remains available when the optional alias index is offline. */ }
        }
        const rows = await prisma.institution.findMany({ where, select: { unitid: true, name: true, city: true, state: true, control: true, _count: { select: { reviews: { where: { status: 'APPROVED' } } } } }, orderBy: [{ name: 'asc' }, { unitid: 'asc' }], skip: (page - 1) * take, take });
        const hits: InstitutionHit[] = rows.map(row => ({ id: row.unitid, unitid: row.unitid, name: row.name, city: row.city ?? '', state: row.state ?? '', control: row.control ?? '', reviewCount: row._count.reviews }));
        return { hits, totalHits, totalPages: Math.ceil(totalHits / take), unavailable: false };
    } catch (error) {
        console.error('School search unavailable', error);
        return { hits: [] as InstitutionHit[], totalHits: 0, totalPages: 0, unavailable: true };
    }
}
