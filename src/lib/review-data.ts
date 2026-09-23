import 'server-only';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import { publicReviewSelect, toPublicReview, summarizeRatings } from './reviews';

export async function getReviewPage(where: Prisma.ReviewWhereInput, viewerId: string | undefined, page: number) {
    const visible = { ...where, status: 'APPROVED' };
    const [rows, total, groups] = await Promise.all([
        prisma.review.findMany({ where: visible, select: publicReviewSelect(viewerId), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 12, skip: (page - 1) * 12 }),
        prisma.review.count({ where: visible }),
        prisma.review.groupBy({ by: ['ratings'], where: visible, _count: { _all: true } }),
    ]);
    return { reviews: rows.map(toPublicReview), total, averages: summarizeRatings(groups) };
}
