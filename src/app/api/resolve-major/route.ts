import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a global prisma instance to avoid "too many connections" in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const runtime = "nodejs";

// Types
interface ResolveRequest {
    query: string;
}

export async function POST(request: Request) {
    try {
        const body: ResolveRequest = await request.json();
        const rawQuery = body.query;

        if (!rawQuery) {
            return NextResponse.json({ results: [] }, { status: 400 });
        }

        // 1. Normalization & Parsing
        let normalized = rawQuery.toLowerCase().trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // remove punctuation
            .replace(/\s{2,}/g, " "); // collapse spaces

        let institutionHint = null;
        if (normalized.includes(" at ")) {
            const parts = normalized.split(" at ");
            if (parts.length > 1) {
                institutionHint = parts[parts.length - 1].trim(); // Take the last part as institution
                normalized = parts.slice(0, parts.length - 1).join(" at ").trim(); // Remove it from query
            }
        }

        const resultsMap = new Map<string, any>();

        // Helper to add result
        const addResult = (cip4: string, title: string, label: string, score: number, note?: string | null) => {
            if (resultsMap.has(cip4)) {
                const existing = resultsMap.get(cip4);
                // specific label overrides generic "Related field"
                if (score > existing.score) {
                    existing.label = label;
                    existing.score = score;
                    if (note) existing.note = note;
                }
            } else {
                resultsMap.set(cip4, { cip4, title, label, score, note });
            }
        }

        // 2. Direct Match (Title)
        // Try exact
        const exactMatches = await prisma.major.findMany({
            where: { title: { equals: normalized, mode: 'insensitive' } }
        });
        exactMatches.forEach(m => addResult(m.cip4, m.title, "Exact match", 100));

        // Try partial (contains)
        const partialMatches = await prisma.major.findMany({
            where: { title: { contains: normalized, mode: 'insensitive' } },
            take: 5
        });
        partialMatches.forEach(m => addResult(m.cip4, m.title, "Exact match", 80)); // Slightly lower than exact

        // 3. Alias Match
        const aliasMatches = await prisma.majorAlias.findMany({
            where: { alias: normalized },
            include: { major: true }
        });
        aliasMatches.forEach(a => addResult(a.cip4, a.major.title, "Alias match", 95, a.notes));

        // Partial alias match
        if (normalized.length > 3) {
            const partialAliases = await prisma.majorAlias.findMany({
                where: { alias: { contains: normalized } },
                include: { major: true },
                take: 5
            });
            partialAliases.forEach(a => addResult(a.cip4, a.major.title, "Alias match", 70, a.notes));
        }


        // 4. Pathway Match
        // Fetch all pathways to check if normalized query contains them (or they equal normalized query)
        const allPathways = await prisma.majorPathway.findMany({
            include: { major: true }
        });

        // Check if normalized query contains the pathway phrase. 
        // Example: Query: "I want to be a speech therapist" -> contains "speech therapist"
        allPathways.forEach(p => {
            if (normalized.includes(p.pathway.toLowerCase())) {
                addResult(p.cip4, p.major.title, "Career pathway", 90);
            }
        });

        // 5. Related Majors Expansion (only if we have results)
        if (resultsMap.size > 0 && resultsMap.size < 3) {
            // Pick top result
            const topResult = Array.from(resultsMap.values()).sort((a, b) => b.score - a.score)[0];
            const meta = await prisma.majorMeta.findUnique({
                where: { cip4: topResult.cip4 }
            });

            if (meta && meta.commonRelatedCip4.length > 0) {
                const related = await prisma.major.findMany({
                    where: { cip4: { in: meta.commonRelatedCip4 } }
                });
                related.forEach(r => addResult(r.cip4, r.title, "Related field", 50));
            } else {
                // Fallback Same CIP2
                const cip2 = topResult.cip4.split('.')[0];
                const related = await prisma.major.findMany({
                    where: { cip4: { startsWith: cip2 }, NOT: { cip4: topResult.cip4 } },
                    take: 3
                });
                related.forEach(r => addResult(r.cip4, r.title, "Related field", 40));
            }
        }

        // Sort
        const sortedResults = Array.from(resultsMap.values())
            .map(({ score, ...rest }) => ({ ...rest, confidence: score >= 90 ? 'High' : score >= 70 ? 'Medium' : 'Low' })) // map score to confidence string for UI if needed, but spec says "Confidence indicator". detailed score internal.
            .sort((a: any, b: any) => {
                // We need to keep access to score for sorting, but I destructured it. 
                // Let's redo.
                return 0;
            }); // Wait, let's fix the map/sort order.

        const finalResults = Array.from(resultsMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 7)
            .map(r => ({
                cip4: r.cip4,
                title: r.title,
                label: r.label,
                confidence: r.score >= 90 ? 'High' : r.score >= 70 ? 'Medium' : 'Low',
                note: r.note
            }));

        // Resolve Institution Hint to ID if present
        let resolvedInstitution = null;
        if (institutionHint) {
            const inst = await prisma.institution.findFirst({
                where: {
                    OR: [
                        { name: { equals: institutionHint, mode: 'insensitive' } },
                        { name: { contains: institutionHint, mode: 'insensitive' } }
                    ]
                },
                select: { unitid: true, name: true }
            });
            if (inst) {
                resolvedInstitution = { id: inst.unitid, name: inst.name };
            }
        }

        // Log
        const topResultCip4 = finalResults.length > 0 ? finalResults[0].cip4 : null;
        await prisma.resolverEvent.create({
            data: {
                queryRaw: rawQuery,
                queryNormalized: normalized,
                institutionHint,
                topResultCip4
            }
        });

        return NextResponse.json({
            normalized_query: normalized,
            institution_hint: institutionHint,
            institution: resolvedInstitution,
            results: finalResults
        });

    } catch (error) {
        console.error("Resolver Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
