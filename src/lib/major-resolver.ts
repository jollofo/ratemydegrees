
import prisma from '@/lib/prisma';
import { searchInstitutionDegrees } from './institution-degree-search';

export type MajorResolutionMatch = {
    cip4: string;
    title: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    matchType: 'DIRECT' | 'ALIAS';
    source: string;
    category?: string | null;
    catalogListed?: boolean;
};

export type MajorResolutionResult = {
    matches: MajorResolutionMatch[];
    eventId: string;
};

export async function resolveMajorQuery(
    query: string,
    institutionId?: string
): Promise<MajorResolutionResult> {
    const normalizedQuery = query.trim().toLowerCase();

    // Log the resolution attempt
    const event = await prisma.resolverEvent.create({
        data: {
            queryRaw: query,
            queryNormalized: normalizedQuery,
            institutionHint: institutionId,
        }
    });

    if (normalizedQuery.length < 2) {
        return { matches: [], eventId: event.id };
    }

    if (institutionId) {
        const { items } = await searchInstitutionDegrees(institutionId, query, 1, 5);
        const matches: MajorResolutionMatch[] = items.map(item => ({
            cip4: item.id, title: item.name, confidence: 'MEDIUM',
            matchType: item.name.toLowerCase().includes(normalizedQuery) || item.id === normalizedQuery ? 'DIRECT' : 'ALIAS',
            source: item.name, catalogListed: item.catalogListed,
        }));
        if (matches.length) await prisma.resolverEvent.update({ where: { id: event.id }, data: { topResultCip4: matches[0].cip4 } });
        return { matches, eventId: event.id };
    }

    const matches: MajorResolutionMatch[] = [];
    const seenCip4 = new Set<string>();

    // 1. Exact/Direct Matches on Major Title
    const directMatches = await prisma.major.findMany({
        where: {
            OR: [
                { title: { equals: normalizedQuery, mode: 'insensitive' } },
                { title: { contains: normalizedQuery, mode: 'insensitive' } },
                { cip4: { equals: normalizedQuery } }
            ]
        },
        take: 5
    });

    for (const m of directMatches) {
        if (seenCip4.has(m.cip4)) continue;

        let confidence: 'HIGH' | 'MEDIUM' = 'MEDIUM';
        if (m.title.toLowerCase() === normalizedQuery || m.cip4 === normalizedQuery) {
            confidence = 'HIGH';
        }

        matches.push({
            cip4: m.cip4,
            title: m.title,
            confidence,
            matchType: 'DIRECT',
            source: m.title,
            category: m.category
        });
        seenCip4.add(m.cip4);
    }

    // 2. Alias Matches
    if (matches.length < 5) {
        const aliasMatches = await prisma.majorAlias.findMany({
            where: {
                alias: { contains: normalizedQuery, mode: 'insensitive' }
            },
            include: { major: true },
            take: 5
        });

        for (const a of aliasMatches) {
            if (seenCip4.has(a.cip4)) continue;

            let confidence: 'HIGH' | 'MEDIUM' = 'MEDIUM';
            if (a.alias.toLowerCase() === normalizedQuery) {
                confidence = 'HIGH';
            }

            matches.push({
                cip4: a.cip4,
                title: a.major.title,
                confidence,
                matchType: 'ALIAS',
                source: a.alias,
                category: a.major.category
            });
            seenCip4.add(a.cip4);
        }
    }

    // Update event if we have a top result
    if (matches.length > 0) {
        await prisma.resolverEvent.update({
            where: { id: event.id },
            data: { topResultCip4: matches[0].cip4 }
        });
    }

    return {
        matches,
        eventId: event.id
    };
}
