
import prisma from '@/lib/prisma';

export type MajorResolutionMatch = {
    cip4: string;
    title: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    matchType: 'DIRECT' | 'ALIAS' | 'PATHWAY' | 'RELATED';
    source: string;
    category?: string | null;
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

    // 3. Pathway Matches
    if (matches.length < 5) {
        const pathwayMatches = await prisma.majorPathway.findMany({
            where: {
                pathway: { contains: normalizedQuery, mode: 'insensitive' }
            },
            include: { major: true },
            orderBy: { weight: 'desc' },
            take: 5
        });

        for (const p of pathwayMatches) {
            if (seenCip4.has(p.cip4)) continue;

            matches.push({
                cip4: p.cip4,
                title: p.major.title,
                confidence: 'MEDIUM', // Pathways are inherently less certain
                matchType: 'PATHWAY',
                source: p.pathway,
                category: p.major.category
            });
            seenCip4.add(p.cip4);
        }
    }


    // 4. Verification Step (Filter by Institution)
    let verifiedMatches = matches;
    if (institutionId) {
        verifiedMatches = [];
        for (const m of matches) {
            const isOffered = await prisma.institutionMajor.findUnique({
                where: {
                    unitid_cip4: {
                        unitid: institutionId,
                        cip4: m.cip4
                    }
                }
            });

            if (isOffered) {
                verifiedMatches.push(m);
            }
        }
    }

    // 5. Related Majors Expansion (only if we have high-confidence matches)
    // If we have strong matches, check if they have related majors that are also applicable
    const highConfidenceMatches = verifiedMatches.filter(m => m.confidence === 'HIGH');
    if (highConfidenceMatches.length > 0 && verifiedMatches.length < 5) {
        // Collect all related cip4s
        const relatedCip4s = new Set<string>();

        for (const m of highConfidenceMatches) {
            const meta = await prisma.majorMeta.findUnique({
                where: { cip4: m.cip4 },
                select: { commonRelatedCip4: true }
            });

            if (meta && meta.commonRelatedCip4) {
                meta.commonRelatedCip4.forEach(c => relatedCip4s.add(c));
            }
        }

        // Remove ones we already have
        verifiedMatches.forEach(m => relatedCip4s.delete(m.cip4));

        if (relatedCip4s.size > 0) {
            const relatedMajors = await prisma.major.findMany({
                where: { cip4: { in: Array.from(relatedCip4s) } },
                take: 5
            });

            for (const related of relatedMajors) {
                // If institution context is active, verify this related major too
                if (institutionId) {
                    const isOffered = await prisma.institutionMajor.findUnique({
                        where: {
                            unitid_cip4: {
                                unitid: institutionId,
                                cip4: related.cip4
                            }
                        }
                    });
                    if (!isOffered) continue;
                }

                verifiedMatches.push({
                    cip4: related.cip4,
                    title: related.title,
                    confidence: 'LOW',
                    matchType: 'RELATED',
                    source: 'Related Major Expansion',
                    category: related.category
                });
            }
        }
    }

    // Update event if we have a top result
    if (verifiedMatches.length > 0) {
        await prisma.resolverEvent.update({
            where: { id: event.id },
            data: { topResultCip4: verifiedMatches[0].cip4 }
        });
    }

    return {
        matches: verifiedMatches,
        eventId: event.id
    };
}
