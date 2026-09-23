'use server';

import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getOrCreatePrismaUser } from '@/lib/user';
import { revalidatePath } from 'next/cache';
import { checkReviewContent } from '@/lib/moderation';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';
import { reviewFormSchema, reviewIdSchema } from '@/lib/validation';
import { rateLimit, submitReviewLimiter } from '@/lib/rate-limit';

export async function submitReview(formData: ReviewFormData, reviewId?: string) {
    const user = await getOrCreatePrismaUser();
    if (!rateLimit('submit_review:' + user.id, submitReviewLimiter).success) {
        throw new Error('Too many submissions. Please try again later.');
    }
    const data = reviewFormSchema.parse(formData);
    if (reviewId) reviewIdSchema.parse(reviewId);
    const [major, institution] = await Promise.all([
        prisma.major.findUnique({ where: { cip4: data.majorId }, select: { cip4: true } }),
        prisma.institution.findUnique({ where: { unitid: data.institutionId, active: true }, select: { unitid: true } }),
    ]);
    if (!major || !institution) throw new Error('Please select an existing degree and active school.');
    const writtenResponses = { fit: data.fit, challenge: data.challenge, misconception: data.misconception, differently: data.differently };
    const moderation = checkReviewContent(writtenResponses);
    // Updated text is reviewed again, including reviews previously approved by a moderator.
    const status = reviewId || moderation.flagged ? 'PENDING' : 'APPROVED';
    const values = {
        graduationStatus: data.status, graduationYearRange: data.graduationYear || '',
        ratings: JSON.stringify(data.ratings), writtenResponses: JSON.stringify(writtenResponses),
        status, flagReasons: moderation.flagged ? JSON.stringify(moderation.reasons) : null, riskScore: moderation.riskScore,
    };
    try {
        await prisma.$transaction(async tx => {
            let id: string;
            if (reviewId) {
                const owned = await tx.review.findFirst({ where: { id: reviewId, userId: user.id, status: { in: ['APPROVED', 'PENDING'] } } });
                if (!owned) throw new Error('This review is unavailable for editing.');
                if (owned.cip4 !== data.majorId || owned.unitid !== data.institutionId) throw new Error('The degree and school of an existing review cannot be changed.');
                await tx.review.update({ where: { id: owned.id, userId: user.id }, data: values });
                id = owned.id;
            } else {
                const existing = await tx.review.findFirst({ where: { userId: user.id, cip4: data.majorId, unitid: data.institutionId, status: { not: 'DELETED' } } });
                if (existing) throw new Error('You already have a review for this degree at this school. Open My reviews to manage it.');
                const review = await tx.review.create({ data: { ...values, cip4: data.majorId, unitid: data.institutionId, userId: user.id } });
                id = review.id;
            }
            await tx.reviewOutcome.deleteMany({ where: { reviewId: id } });
            if (data.status === 'graduated' && data.outcomeStatus) {
                await tx.reviewOutcome.create({ data: {
                    reviewId: id, status: data.outcomeStatus, jobTitle: data.jobTitle || null,
                    industry: data.industry || null, gradSchool: data.gradSchool || null, timeToOutcome: data.timeToOutcome || null,
                } });
            }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
            throw new Error('Another submission changed this review. Check My reviews before trying again.');
        }
        throw error;
    }
    revalidatePath('/majors', 'layout');
    revalidatePath('/institutions', 'layout');
    revalidatePath('/my-reviews');
    return { status };
}

export async function getInstitutionsForSearch(): Promise<InstitutionSearchResult[]> {
    return prisma.institution.findMany({ where: { active: true }, select: { unitid: true, name: true, state: true, city: true }, orderBy: { name: 'asc' }, take: 50 });
}

export async function getMajorsForSearch(): Promise<MajorSearchResult[]> {
    return prisma.major.findMany({ select: { cip4: true, title: true, category: true }, orderBy: { title: 'asc' }, take: 50 });
}
