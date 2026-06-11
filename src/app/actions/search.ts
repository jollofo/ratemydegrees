'use server';

import { searchClient, COLLECTION_MAJORS, COLLECTION_INSTITUTIONS } from '@/lib/typesense';
import { getEmbedding } from '@/lib/embeddings';

export interface MajorHit {
    id: string;
    cip4: string;
    title: string;
    category: string;
    description: string;
    reviewCount: number;
    salaryRange: string;
    commonJobs: string[];
    aliases?: string[];
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

    let vectorQueryString: string | undefined = undefined;
    if (query && query !== '*') {
        try {
            const vector = await getEmbedding(query);
            vectorQueryString = `vec:([${vector.join(',')}], k:10, alpha:0.75)`;
        } catch (err) {
            console.error('Error generating query embedding:', err);
        }
    }

    try {
        const response = await searchClient.multiSearch.perform({
            searches: [
                {
                    collection: COLLECTION_MAJORS,
                    q: query || '*',
                    query_by: 'title,category,description,commonJobs,aliases',
                    ...(vectorQueryString ? { vector_query: vectorQueryString } : {}),
                    page,
                    per_page: hitsPerPage,
                    ...(filterBy ? { filter_by: filterBy } : {}),
                    highlight_full_fields: 'title,category',
                    snippet_threshold: 20,
                }
            ]
        });

        const result = response.results[0];

        const hits: MajorHit[] = (result.hits ?? []).map((h: any) => ({
            id: h.document.id,
            cip4: h.document.cip4,
            title: h.document.title,
            category: h.document.category ?? '',
            description: h.document.description ?? '',
            reviewCount: h.document.reviewCount ?? 0,
            salaryRange: h.document.salaryRange ?? '',
            commonJobs: h.document.commonJobs ?? [],
            aliases: h.document.aliases ?? [],
            highlights: h.highlights,
            _highlightResult: buildHighlightResult(h.highlights),
        }));

        const totalHits = result.found ?? 0;
        const totalPages = Math.ceil(totalHits / hitsPerPage);

        if (totalHits === 0 && query && query !== '*') {
            try {
                const { resolveMajorQuery } = await import('@/lib/major-resolver');
                const resolved = await resolveMajorQuery(query).catch(() => ({ matches: [] }));
                const topMatch = resolved.matches[0];
                const { logSearchGap } = await import('@/lib/search-logger');
                
                logSearchGap({
                    query,
                    type: 'major',
                    cip4: topMatch?.cip4,
                    resolvedMajorTitle: topMatch?.title,
                    details: topMatch ? `Resolved DB-side but 0 hits in Typesense` : 'No DB resolution found'
                });
            } catch (err) {
                console.error('Failed to log search gap:', err);
            }
        }

        return { hits, totalPages, totalHits };
    } catch (err) {
        console.error('Typesense major search failed:', err);
        return { hits: [], totalPages: 0, totalHits: 0 };
    }
}

export async function searchInstitutions(
    query: string,
    options?: { page?: number; hitsPerPage?: number; filterBy?: string }
) {
    const { page = 1, hitsPerPage = 12, filterBy } = options ?? {};

    let vectorQueryString: string | undefined = undefined;
    if (query && query !== '*') {
        try {
            const vector = await getEmbedding(query);
            vectorQueryString = `vec:([${vector.join(',')}], k:10, alpha:0.75)`;
        } catch (err) {
            console.error('Error generating query embedding:', err);
        }
    }

    try {
        const response = await searchClient.multiSearch.perform({
            searches: [
                {
                    collection: COLLECTION_INSTITUTIONS,
                    q: query || '*',
                    query_by: 'name,city,state,aliases',
                    ...(vectorQueryString ? { vector_query: vectorQueryString } : {}),
                    page,
                    per_page: hitsPerPage,
                    ...(filterBy ? { filter_by: filterBy } : {}),
                    highlight_full_fields: 'name,city,state',
                }
            ]
        });

        const result = response.results[0];

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
    } catch (err) {
        console.error('Typesense institution search failed:', err);
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
        try {
            const { logSearchGap } = await import('@/lib/search-logger');
            const major = await prisma.major.findUnique({ where: { cip4 }, select: { title: true } });
            logSearchGap({
                query,
                type: 'institution_for_major',
                cip4,
                resolvedMajorTitle: major?.title ?? 'Unknown Major',
                details: 'Major exists in DB but no institutions offer it (0 completions)'
            });
        } catch (err) {
            console.error('Failed to log search gap:', err);
        }
        return { hits: [], totalPages: 0, totalHits: 0 };
    }

    const completionsMap = new Map(offerings.map((o: { unitid: string; completionsTotal: number }) => [o.unitid, o.completionsTotal]));
    const unitids = offerings.map((o: { unitid: string }) => o.unitid);

    // Bypass Typesense completely if there is no query
    if (!query) {
        const pageUnitIds = unitids.slice((page - 1) * hitsPerPage, page * hitsPerPage);

        const prismaInstitutions = await prisma.institution.findMany({
            where: { unitid: { in: pageUnitIds } },
        });

        // Reorder back to the sorted order (handled by offerings)
        const sortedInstitutions = [];
        for (const id of pageUnitIds) {
            const inst = prismaInstitutions.find(i => i.unitid === id);
            if (inst) sortedInstitutions.push(inst);
        }

        const hits = sortedInstitutions.map((inst: any) => ({
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
            hits,
            totalPages: Math.ceil(unitids.length / hitsPerPage),
            totalHits: unitids.length,
        };
    }

    // Try Typesense first
    try {
        const filterBy = `unitid:=[${unitids.join(',')}]`;

        let vectorQueryString: string | undefined = undefined;
        if (query && query !== '*') {
            try {
                const vector = await getEmbedding(query);
                vectorQueryString = `vec:([${vector.join(',')}], k:10, alpha:0.75)`;
            } catch (err) {
                console.error('Error generating query embedding:', err);
            }
        }

        const response = await searchClient.multiSearch.perform({
            searches: [
                {
                    collection: COLLECTION_INSTITUTIONS,
                    q: query || '*',
                    query_by: 'name,city,state,aliases',
                    ...(vectorQueryString ? { vector_query: vectorQueryString } : {}),
                    filter_by: filterBy,
                    page,
                    per_page: hitsPerPage,
                    highlight_full_fields: 'name,city,state',
                }
            ]
        });

        const result = response.results[0];
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
    } catch (err) {
        console.error('Typesense search for major institutions failed:', err);
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

    if (totalCount === 0 && query) {
        try {
            const { logSearchGap } = await import('@/lib/search-logger');
            logSearchGap({
                query,
                type: 'institution_for_major',
                cip4,
                details: `No institutions matching "${query}" offer major ${cip4}`
            });
        } catch (err) {
            console.error('Failed to log search gap:', err);
        }
    }

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
