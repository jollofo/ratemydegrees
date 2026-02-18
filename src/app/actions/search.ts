'use server';

import { searchClient, COLLECTION_MAJORS, COLLECTION_INSTITUTIONS } from '@/lib/typesense';

export interface MajorHit {
    id: string;
    cip4: string;
    title: string;
    category: string;
    description: string;
    reviewCount: number;
    salaryRange: string;
    commonJobs: string[];
    highlights?: { field: string; snippet?: string; value?: string }[];
}

export interface InstitutionHit {
    id: string;
    unitid: string;
    name: string;
    city: string;
    state: string;
    control: string;
    reviewCount: number;
    highlights?: { field: string; snippet?: string; value?: string }[];
}

function buildHighlightResult(highlights: { field: string; snippet?: string; value?: string }[] = []) {
    const map: Record<string, { value: string }> = {};
    for (const h of highlights) {
        map[h.field] = { value: h.snippet ?? h.value ?? '' };
    }
    return map;
}

export async function searchMajors(
    query: string,
    options?: { page?: number; hitsPerPage?: number; filterBy?: string }
) {
    const { page = 1, hitsPerPage = 12, filterBy } = options ?? {};

    try {
        const result = await searchClient.collections(COLLECTION_MAJORS).documents().search({
            q: query || '*',
            query_by: 'title,category,description,commonJobs',
            page,
            per_page: hitsPerPage,
            ...(filterBy ? { filter_by: filterBy } : {}),
            highlight_full_fields: 'title,category',
            snippet_threshold: 20,
        });

        const hits: MajorHit[] = (result.hits ?? []).map((h: any) => ({
            id: h.document.id,
            cip4: h.document.cip4,
            title: h.document.title,
            category: h.document.category ?? '',
            description: h.document.description ?? '',
            reviewCount: h.document.reviewCount ?? 0,
            salaryRange: h.document.salaryRange ?? '',
            commonJobs: h.document.commonJobs ?? [],
            highlights: h.highlights,
            _highlightResult: buildHighlightResult(h.highlights),
        }));

        const totalHits = result.found ?? 0;
        const totalPages = Math.ceil(totalHits / hitsPerPage);

        return { hits, totalPages, totalHits };
    } catch {
        return { hits: [], totalPages: 0, totalHits: 0 };
    }
}

export async function searchInstitutions(
    query: string,
    options?: { page?: number; hitsPerPage?: number; filterBy?: string }
) {
    const { page = 1, hitsPerPage = 12, filterBy } = options ?? {};

    try {
        const result = await searchClient.collections(COLLECTION_INSTITUTIONS).documents().search({
            q: query || '*',
            query_by: 'name,city,state',
            page,
            per_page: hitsPerPage,
            ...(filterBy ? { filter_by: filterBy } : {}),
            highlight_full_fields: 'name,city,state',
        });

        const hits: InstitutionHit[] = (result.hits ?? []).map((h: any) => ({
            id: h.document.id,
            unitid: h.document.unitid,
            name: h.document.name,
            city: h.document.city ?? '',
            state: h.document.state ?? '',
            control: h.document.control ?? '',
            reviewCount: h.document.reviewCount ?? 0,
            highlights: h.highlights,
            _highlightResult: buildHighlightResult(h.highlights),
        }));

        const totalHits = result.found ?? 0;
        const totalPages = Math.ceil(totalHits / hitsPerPage);

        return { hits, totalPages, totalHits };
    } catch {
        return { hits: [], totalPages: 0, totalHits: 0 };
    }
}

/**
 * Search institutions that offer a specific major (by cip4).
 * Uses Typesense for fast search with a Prisma fallback when the collection is empty or unavailable.
 */
export async function searchInstitutionsForMajor(
    cip4: string,
    query: string,
    options?: { page?: number; hitsPerPage?: number }
) {
    const { page = 1, hitsPerPage = 12 } = options ?? {};

    // Get the unitids that offer this major from Prisma (relational data not in Typesense)
    const { default: prisma } = await import('@/lib/prisma');
    const offerings = await prisma.institutionMajor.findMany({
        where: { cip4 },
        select: { unitid: true, completionsTotal: true },
        orderBy: { completionsTotal: 'desc' },
    });

    if (offerings.length === 0) {
        return { hits: [], totalPages: 0, totalHits: 0 };
    }

    const completionsMap = new Map(offerings.map((o: { unitid: string; completionsTotal: number }) => [o.unitid, o.completionsTotal]));
    const unitids = offerings.map((o: { unitid: string }) => o.unitid);

    // Try Typesense first
    try {
        const filterBy = `unitid:=[${unitids.join(',')}]`;

        const result = await searchClient.collections(COLLECTION_INSTITUTIONS).documents().search({
            q: query || '*',
            query_by: 'name,city,state',
            filter_by: filterBy,
            page,
            per_page: hitsPerPage,
            highlight_full_fields: 'name,city,state',
        });

        const totalHits = result.found ?? 0;

        if (totalHits > 0 || (result.hits ?? []).length > 0) {
            const hits = (result.hits ?? []).map((h: any) => ({
                id: h.document.id,
                unitid: h.document.unitid,
                name: h.document.name,
                city: h.document.city ?? '',
                state: h.document.state ?? '',
                control: h.document.control ?? '',
                reviewCount: h.document.reviewCount ?? 0,
                completionsTotal: completionsMap.get(h.document.unitid) ?? 0,
                highlights: h.highlights,
                _highlightResult: buildHighlightResult(h.highlights),
            }));
            return { hits, totalPages: Math.ceil(totalHits / hitsPerPage), totalHits };
        }
    } catch {
        // Typesense unavailable or collection not populated — fall through to Prisma
    }

    // --- Prisma fallback: Typesense collection not yet populated or unavailable ---
    const prismaInstitutions = await prisma.institution.findMany({
        where: {
            unitid: { in: unitids },
            ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * hitsPerPage,
        take: hitsPerPage,
    });

    const totalCount = await prisma.institution.count({
        where: {
            unitid: { in: unitids },
            ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        },
    });

    const fallbackHits = prismaInstitutions.map((inst: any) => ({
        id: inst.unitid,
        unitid: inst.unitid,
        name: inst.name,
        city: inst.city ?? '',
        state: inst.state ?? '',
        control: inst.control ?? '',
        reviewCount: 0,
        completionsTotal: completionsMap.get(inst.unitid) ?? 0,
    }));

    return {
        hits: fallbackHits,
        totalPages: Math.ceil(totalCount / hitsPerPage),
        totalHits: totalCount,
    };
}
