'use server';

import prisma from '@/lib/prisma';
import { getOrCreatePrismaUser } from '@/lib/user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkReviewContent } from '@/lib/moderation';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';
import { resolveMajorQuery } from '@/lib/major-resolver';
import { searchClient, COLLECTION_MAJORS, COLLECTION_INSTITUTIONS } from '@/lib/typesense';

export async function submitReview(formData: ReviewFormData) {
    if (!formData.majorId || !formData.institutionId) {
        throw new Error('Major and Institution are required');
    }

    const user = await getOrCreatePrismaUser();

    const writtenResponses = {
        fit: formData.fit,
        challenge: formData.challenge,
        misconception: formData.misconception,
        differently: formData.differently
    };

    const modCheck = checkReviewContent(writtenResponses);

    const review = await prisma.review.create({
        data: {
            cip4: formData.majorId,
            unitid: formData.institutionId,
            userId: user.id,
            graduationStatus: formData.status,
            graduationYearRange: formData.graduationYear,
            ratings: JSON.stringify(formData.ratings),
            writtenResponses: JSON.stringify(writtenResponses),
            status: modCheck.flagged ? 'PENDING' : 'APPROVED',
            flagReasons: modCheck.flagged ? JSON.stringify(modCheck.reasons) : null,
            riskScore: modCheck.riskScore
        }
    });

    if (formData.status === 'graduated' && formData.outcomeStatus) {
        await prisma.reviewOutcome.create({
            data: {
                reviewId: review.id,
                status: formData.outcomeStatus,
                jobTitle: formData.jobTitle,
                industry: formData.industry,
                gradSchool: formData.gradSchool,
                timeToOutcome: formData.timeToOutcome
            }
        });
    }

    revalidatePath(`/majors/${formData.majorId}`);
    revalidatePath(`/majors/${formData.majorId}/${formData.institutionId}`);
    revalidatePath(`/institutions/${formData.institutionId}`);
    revalidatePath('/majors');

    redirect(`/majors/${formData.majorId}/${formData.institutionId}?success=true`);
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
    if (!query || query.length < 2) return [];

    const resolution = await resolveMajorQuery(query, institutionId);

    return resolution.matches.map(m => ({
        cip4: m.cip4,
        title: m.title,
        category: m.category ?? null,
        matchType: m.matchType,
        confidence: m.confidence
    }));
}
