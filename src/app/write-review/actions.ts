'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkReviewContent } from '@/lib/moderation';

export async function submitReview(formData: any) {
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

export async function getMajorsForSearch() {
    return await prisma.major.findMany({
        select: { cip4: true, title: true, category: true },
        orderBy: { title: 'asc' },
        take: 50 // Just some initial ones
    });
}

export async function getInstitutionsForSearch() {
    return await prisma.institution.findMany({
        where: { active: true },
        select: { unitid: true, name: true, state: true },
        orderBy: { name: 'asc' },
        take: 50 // Just some initial ones
    });
}

export async function searchInstitutions(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.institution.findMany({
        where: {
            active: true,
            OR: [
                { name: { contains: query } },
                { unitid: { contains: query } }
            ]
        },
        select: { unitid: true, name: true, state: true },
        orderBy: { name: 'asc' },
        take: 10
    });
}

export async function searchMajors(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.major.findMany({
        where: {
            OR: [
                { title: { contains: query } },
                { cip4: { contains: query } }
            ]
        },
        select: { cip4: true, title: true, category: true },
        orderBy: { title: 'asc' },
        take: 10
    });
}
