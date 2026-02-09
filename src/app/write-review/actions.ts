'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkReviewContent } from '@/lib/moderation';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';

export async function submitReview(formData: ReviewFormData) {
    if (!formData.majorId || !formData.institutionId) {
        throw new Error('Major and Institution are required');
    }

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        throw new Error('You must be signed in to submit a review');
    }

    let user = await prisma.user.findUnique({
        where: { id: authUser.id }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                id: authUser.id,
                email: authUser.email,
                role: 'USER'
            }
        });
    }

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

export async function getMajorsForSearch(): Promise<MajorSearchResult[]> {
    return await prisma.major.findMany({
        select: { cip4: true, title: true, category: true },
        orderBy: { title: 'asc' },
        take: 50 // Just some initial ones
    });
}

export async function getInstitutionsForSearch(): Promise<InstitutionSearchResult[]> {
    return await prisma.institution.findMany({
        where: { active: true },
        select: { unitid: true, name: true, state: true, city: true },
        orderBy: { name: 'asc' },
        take: 50 // Just some initial ones
    });
}

export async function searchInstitutions(query: string): Promise<InstitutionSearchResult[]> {
    if (!query || query.length < 2) return [];

    return await prisma.institution.findMany({
        where: {
            active: true,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { unitid: { contains: query, mode: 'insensitive' } }
            ]
        },
        select: { unitid: true, name: true, state: true, city: true },
        orderBy: { name: 'asc' },
        take: 10
    });
}

import { resolveMajorQuery } from '@/lib/major-resolver';

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
