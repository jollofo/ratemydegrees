'use server'

import prisma from '@/lib/prisma'
import { getOrCreatePrismaUser } from '@/lib/user'
import { revalidatePath } from 'next/cache'
import { reportSchema, voteSchema } from '@/lib/validation'
import { rateLimit, reportLimiter, voteLimiter } from '@/lib/rate-limit'

export async function reportReview(reviewId: string, reason: string) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const prismaUser = await getOrCreatePrismaUser()

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const rl = rateLimit(`report:${prismaUser.id}`, reportLimiter)
    if (!rl.success) {
        throw new Error('You have submitted too many reports recently. Please try again later.')
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const parsed = reportSchema.safeParse({ reviewId, reason })
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid report data.')
    }

    // ── Verify the review actually exists and is visible ─────────────────────
    const review = await prisma.review.findUnique({
        where: { id: parsed.data.reviewId },
        select: { status: true }
    })
    if (!review || review.status === 'REMOVED' || review.status === 'REJECTED') {
        throw new Error('Review not found.')
    }

    // ── Prevent duplicate open reports from the same user ─────────────────────
    const existing = await prisma.report.findFirst({
        where: {
            reviewId: parsed.data.reviewId,
            userId: prismaUser.id,
            status: 'OPEN'
        }
    })
    if (existing) {
        throw new Error('You have already reported this review.')
    }

    await prisma.report.create({
        data: {
            reviewId: parsed.data.reviewId,
            userId: prismaUser.id,
            reason: parsed.data.reason
        }
    })

    // Flag the review for re-moderation
    await prisma.review.update({
        where: { id: parsed.data.reviewId },
        data: { status: 'PENDING' }
    })

    revalidatePath('/majors')
    return { success: true }
}

export async function voteReview(reviewId: string, value: number) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const prismaUser = await getOrCreatePrismaUser()

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const rl = rateLimit(`vote:${prismaUser.id}`, voteLimiter)
    if (!rl.success) {
        throw new Error('You are voting too quickly. Please slow down.')
    }

    // ── Input validation ──────────────────────────────────────────────────────
    const parsed = voteSchema.safeParse({ reviewId, value })
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Invalid vote data.')
    }

    // ── Verify the review exists ──────────────────────────────────────────────
    const review = await prisma.review.findUnique({
        where: { id: parsed.data.reviewId },
        select: { status: true }
    })
    if (!review || review.status === 'REMOVED' || review.status === 'REJECTED') {
        throw new Error('Review not found.')
    }

    await prisma.vote.upsert({
        where: {
            reviewId_userId: {
                reviewId: parsed.data.reviewId,
                userId: prismaUser.id
            }
        },
        update: { value: parsed.data.value },
        create: {
            reviewId: parsed.data.reviewId,
            userId: prismaUser.id,
            value: parsed.data.value
        }
    })

    revalidatePath('/majors')
    return { success: true }
}
