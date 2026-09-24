import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { searchMajors, searchInstitutions } from '@/app/actions/search';
import { rateLimit, searchLimiter } from '@/lib/rate-limit';
import { searchInstitutionDegrees } from '@/lib/institution-degree-search';
import { searchDegreeSchools } from '@/lib/degree-school-search';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
    const kind = url.searchParams.get('kind');
    const scope = url.searchParams.get('scope') ?? '';
    if (query.length < 2 || !['degrees', 'schools', 'graduate-schools'].includes(kind ?? '') || scope.length > 30) {
        return NextResponse.json({ suggestions: [] });
    }

    const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers().get('x-real-ip') ?? 'unknown';
    if (!rateLimit(`suggestions:${ip}`, searchLimiter).success) {
        return NextResponse.json({ suggestions: [] }, { status: 429 });
    }

    try {
        if (kind === 'degrees' && !scope) {
            const result = await searchMajors(query, { hitsPerPage: 6 });
            if (result.unavailable) throw new Error('Degree search unavailable');
            return NextResponse.json({ suggestions: result.hits.map(row => ({ id: row.cip4, label: row.title.replace(/[.\s]+$/, ''), detail: row.category, href: `/majors/${row.cip4}` })) });
        }
        if (kind === 'schools' && !scope) {
            const result = await searchInstitutions(query, { hitsPerPage: 6 });
            if (result.unavailable) throw new Error('School search unavailable');
            return NextResponse.json({ suggestions: result.hits.map(row => ({ id: row.unitid, label: row.name, detail: [row.city, row.state].filter(Boolean).join(', '), href: `/institutions/${row.unitid}` })) });
        }
        if (kind === 'degrees' && scope) {
            const { items } = await searchInstitutionDegrees(scope, query, 1, 6);
            return NextResponse.json({ suggestions: items.map(row => ({ id: row.id, label: row.name.replace(/[.\s]+$/, ''), detail: row.catalogListed ? '' : 'Missing from this school’s catalog? You can still review it.', href: row.catalogListed ? `/majors/${row.id}/${encodeURIComponent(scope)}` : `/write-review?${new URLSearchParams({ majorId: row.id, institutionId: scope })}` })) });
        }
        if (kind === 'schools' && scope) {
            const { schools } = await searchDegreeSchools(scope, query, 1, 6);
            return NextResponse.json({ suggestions: schools.map(row => ({ id: row.unitid, label: row.name, detail: row.catalogListed ? [row.city, row.state].filter(Boolean).join(', ') : 'Degree not yet linked here. You can still write a review.', href: `/majors/${encodeURIComponent(scope)}/${row.unitid}` })) });
        }
        if (kind === 'graduate-schools' && scope) {
            const degree = url.searchParams.get('degree');
            const rows = await prisma.institution.findMany({
                where: { active: true, name: { contains: query, mode: 'insensitive' }, graduatePrograms: { some: { cip4: scope, ...(degree === 'masters' ? { awardLevel: 7 } : degree === 'doctorate' ? { awardLevel: { in: [17, 18, 19] } } : {}) } } },
                select: { unitid: true, name: true, city: true, state: true }, orderBy: [{ name: 'asc' }, { unitid: 'asc' }], take: 6,
            });
            return NextResponse.json({ suggestions: rows.map(row => ({ id: row.unitid, label: row.name, detail: [row.city, row.state].filter(Boolean).join(', '), href: '' })) });
        }
        return NextResponse.json({ suggestions: [] });
    } catch (error) {
        console.error('Suggestions unavailable', error);
        return NextResponse.json({ suggestions: [] }, { status: 503 });
    }
}
