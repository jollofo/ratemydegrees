'use server'

import prisma from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reportReview(reviewId: string, reason: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Must be logged in to report a review')
    }

    // Find or create user in Prisma to match Supabase user
    let prismaUser = await prisma.user.findUnique({
        where: { email: user.email }
    })

    if (!prismaUser) {
        prismaUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                role: 'USER'
            }
        })
    }

    await prisma.report.create({
        data: {
            reviewId,
            userId: prismaUser.id,
            reason
        }
    })

    // We could also flag the review for moderation
    await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'PENDING' } // Move back to pending for review if reported?
    })

    revalidatePath('/majors')
    return { success: true }
}

export async function voteReview(reviewId: string, value: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Must be logged in to vote')
    }

    let prismaUser = await prisma.user.findUnique({
        where: { email: user.email }
    })

    if (!prismaUser) {
        prismaUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                role: 'USER'
            }
        })
    }

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
