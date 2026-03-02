'use server'

import prisma from '@/lib/prisma'
import { getOrCreatePrismaUser } from '@/lib/user'
import { revalidatePath } from 'next/cache'

export async function reportReview(reviewId: string, reason: string) {
    const prismaUser = await getOrCreatePrismaUser()

    await prisma.report.create({
        data: {
            reviewId,
            userId: prismaUser.id,
            reason
        }
    })

    // Flag the review for re-moderation
    await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'PENDING' }
    })

    revalidatePath('/majors')
    return { success: true }
}

export async function voteReview(reviewId: string, value: number) {
    const prismaUser = await getOrCreatePrismaUser()

    await prisma.vote.upsert({
        where: {
            reviewId_userId: {
                reviewId,
                userId: prismaUser.id
            }
        },
        update: { value },
        create: {
            reviewId,
            userId: prismaUser.id,
            value
        }
    })

    revalidatePath('/majors')
    return { success: true }
}
