import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveMajorQuery } from '@/lib/major-resolver';

export const runtime = "nodejs";

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

        // 1. Pre-parsing for Institution Hint ("Major at University")
        let queryForResolution = rawQuery.toLowerCase().trim();
        let institutionHint = null;
        let resolvedInstitutionId = undefined;
        let resolvedInstitution = null;

        if (queryForResolution.includes(" at ")) {
            const parts = queryForResolution.split(" at ");
            if (parts.length > 1) {
                institutionHint = parts[parts.length - 1].trim();
                queryForResolution = parts.slice(0, parts.length - 1).join(" at ").trim();

                // Attempt to resolve the institution hint to an ID
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
                    resolvedInstitutionId = inst.unitid;
                    resolvedInstitution = { id: inst.unitid, name: inst.name };
                }
            }
        }

        // 2. Call the core resolver
        const resolution = await resolveMajorQuery(queryForResolution, resolvedInstitutionId);

        // 3. Map to API response format
        const finalResults = resolution.matches.map(m => ({
            cip4: m.cip4,
            title: m.title,
            label: m.matchType === 'DIRECT' ? 'Exact match' :
                m.matchType === 'ALIAS' ? 'Alias match' :
                    m.matchType === 'PATHWAY' ? 'Career pathway' : 'Related field',
            confidence: m.confidence.charAt(0) + m.confidence.slice(1).toLowerCase(), // HIGH -> High
            source: m.source
        }));

        return NextResponse.json({
            normalized_query: queryForResolution,
            institution_hint: institutionHint,
            institution: resolvedInstitution,
            results: finalResults,
            eventId: resolution.eventId
        });

    } catch (error) {
        console.error("Resolver Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
