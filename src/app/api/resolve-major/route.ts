import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { resolveMajorQuery } from '@/lib/major-resolver';
import { resolveQuerySchema } from '@/lib/validation';
import { rateLimit, resolveLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    // ── Rate limiting ──────────────────────────────────────────────────────────
    const ip =
        headers().get('x-forwarded-for')?.split(',')[0]?.trim() ??
        headers().get('x-real-ip') ??
        'unknown';

    const rl = rateLimit(`resolve:${ip}`, resolveLimiter);
    if (!rl.success) {
        return NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1_000)),
                    'X-RateLimit-Limit': String(resolveLimiter.limit),
                    'X-RateLimit-Remaining': '0',
                },
            },
        );
    }

    try {
        // ── Input validation ───────────────────────────────────────────────────
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
        }

        const parsed = resolveQuerySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid request.' },
                { status: 400 },
            );
        }

        const rawQuery = parsed.data.query;

        // ── Institution hint parsing ("Major at University") ──────────────────
        let queryForResolution = rawQuery.toLowerCase().trim();
        let institutionHint: string | null = null;
        let resolvedInstitutionId: string | undefined;
        let resolvedInstitution: { id: string; name: string } | null = null;

        if (queryForResolution.includes(' at ')) {
            const parts = queryForResolution.split(' at ');
            if (parts.length > 1) {
                institutionHint = parts[parts.length - 1].trim();
                queryForResolution = parts.slice(0, parts.length - 1).join(' at ').trim();

                const inst = await prisma.institution.findFirst({
                    where: {
                        OR: [
                            { name: { equals: institutionHint, mode: 'insensitive' } },
                            { name: { contains: institutionHint, mode: 'insensitive' } },
                        ],
                    },
                    select: { unitid: true, name: true },
                });

                if (inst) {
                    resolvedInstitutionId = inst.unitid;
                    resolvedInstitution = { id: inst.unitid, name: inst.name };
                }
            }
        }

        // ── Core resolver ──────────────────────────────────────────────────────
        const resolution = await resolveMajorQuery(queryForResolution, resolvedInstitutionId);

        const finalResults = resolution.matches.map((m) => ({
            cip4: m.cip4,
            title: m.title,
            label:
                m.matchType === 'DIRECT'
                    ? 'Exact match'
                    : m.matchType === 'ALIAS'
                        ? 'Alias match'
                        : m.matchType === 'PATHWAY'
                            ? 'Career pathway'
                            : 'Related field',
            confidence: m.confidence.charAt(0) + m.confidence.slice(1).toLowerCase(),
            source: m.source,
        }));

        return NextResponse.json(
            {
                normalized_query: queryForResolution,
                institution_hint: institutionHint,
                institution: resolvedInstitution,
                results: finalResults,
                eventId: resolution.eventId,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rl.remaining),
                },
            },
        );
    } catch (error) {
        console.error('Resolver Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
