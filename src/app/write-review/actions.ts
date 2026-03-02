'use server';

import prisma from '@/lib/prisma';
import { getOrCreatePrismaUser } from '@/lib/user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkReviewContent } from '@/lib/moderation';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';
import { resolveMajorQuery } from '@/lib/major-resolver';
import { searchClient, COLLECTION_MAJORS, COLLECTION_INSTITUTIONS } from '@/lib/typesense';
import { reviewFormSchema, searchQuerySchema } from '@/lib/validation';
import { rateLimit, submitReviewLimiter, searchLimiter } from '@/lib/rate-limit';

export async function submitReview(formData: ReviewFormData) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const user = await getOrCreatePrismaUser();

    // ── Rate limiting (per user) ───────────────────────────────────────────────
    const rl = rateLimit(`submit_review:${user.id}`, submitReviewLimiter);
    if (!rl.success) {
        throw new Error('You have submitted too many reviews recently. Please try again later.');
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const parsed = reviewFormSchema.safeParse(formData);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        throw new Error(firstError?.message ?? 'Invalid review data. Please check your inputs.');
    }

    const data = parsed.data;

    if (!data.majorId || !data.institutionId) {
        throw new Error('Major and Institution are required');
    }

    // ── Verify major + institution exist ──────────────────────────────────────
    const [majorExists, institutionExists] = await Promise.all([
        prisma.major.findUnique({ where: { cip4: data.majorId }, select: { cip4: true } }),
        prisma.institution.findUnique({ where: { unitid: data.institutionId }, select: { unitid: true } }),
    ]);

    if (!majorExists) throw new Error('Selected major does not exist.');
    if (!institutionExists) throw new Error('Selected institution does not exist.');

    // ── Content moderation ────────────────────────────────────────────────────
    const writtenResponses = {
        fit: data.fit,
        challenge: data.challenge,
        misconception: data.misconception,
        differently: data.differently,
    };

    const modCheck = checkReviewContent(writtenResponses);

    // ── Persist ───────────────────────────────────────────────────────────────
    const review = await prisma.review.create({
        data: {
            cip4: data.majorId,
            unitid: data.institutionId,
            userId: user.id,
            graduationStatus: data.status,
            graduationYearRange: data.graduationYear ?? '',
            ratings: JSON.stringify(data.ratings),
            writtenResponses: JSON.stringify(writtenResponses),
            status: modCheck.flagged ? 'PENDING' : 'APPROVED',
            flagReasons: modCheck.flagged ? JSON.stringify(modCheck.reasons) : null,
            riskScore: modCheck.riskScore,
        },
    });

    if (data.status === 'graduated' && data.outcomeStatus) {
        await prisma.reviewOutcome.create({
            data: {
                reviewId: review.id,
                status: data.outcomeStatus,
                jobTitle: data.jobTitle ?? null,
                industry: data.industry ?? null,
                gradSchool: data.gradSchool ?? null,
                timeToOutcome: data.timeToOutcome ?? null,
            },
        });
    }

    revalidatePath(`/majors/${data.majorId}`);
    revalidatePath(`/majors/${data.majorId}/${data.institutionId}`);
    revalidatePath(`/institutions/${data.institutionId}`);
    revalidatePath('/majors');

    redirect(`/majors/${data.majorId}/${data.institutionId}?success=true`);
}

/** Initial load: top 50 institutions by review count from Typesense */
export async function getInstitutionsForSearch(): Promise<InstitutionSearchResult[]> {
    const result = await searchClient.collections(COLLECTION_INSTITUTIONS).documents().search({
        q: '*',
        query_by: 'name',
        per_page: 50,
        sort_by: 'reviewCount:desc',
        include_fields: 'unitid,name,state,city',
    });
    return (result.hits ?? []).map((h: any) => ({
        unitid: h.document.unitid,
        name: h.document.name,
        state: h.document.state ?? null,
        city: h.document.city ?? null,
    }));
}

/** Initial load: top 50 majors by review count from Typesense */
export async function getMajorsForSearch(): Promise<MajorSearchResult[]> {
    const result = await searchClient.collections(COLLECTION_MAJORS).documents().search({
        q: '*',
        query_by: 'title',
        per_page: 50,
        sort_by: 'reviewCount:desc',
        include_fields: 'cip4,title,category',
    });
    return (result.hits ?? []).map((h: any) => ({
        cip4: h.document.cip4,
        title: h.document.title,
        category: h.document.category ?? null,
    }));
}

/**
 * Major search via the resolver (alias + pathway matching).
 * Used by the MajorResolverModal and as a fallback when Typesense
 * returns no results for an unusual query.
 */
export async function searchMajors(query: string, institutionId?: string): Promise<MajorSearchResult[]> {
    // ── Rate limiting (per user where available, else global bucket) ──────────
    const user = await getOrCreatePrismaUser().catch(() => null);
    const bucket = user ? `search_major:${user.id}` : 'search_major:anon';
    const rl = rateLimit(bucket, searchLimiter);
    if (!rl.success) return []; // silently return empty — UI already debounced

    // ── Input validation ─────────────────────────────────────────────────────
    const parsed = searchQuerySchema.safeParse(query);
    if (!parsed.success || parsed.data.length < 2) return [];

    const resolution = await resolveMajorQuery(parsed.data, institutionId);

    return resolution.matches.map((m) => ({
        cip4: m.cip4,
        title: m.title,
        category: m.category ?? null,
        matchType: m.matchType,
        confidence: m.confidence,
    }));
}
