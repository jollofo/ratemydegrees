'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'MODERATOR')) {
        throw new Error('Unauthorized');
    }
    return dbUser;
}

export async function moderateReview(reviewId: string, action: 'APPROVE' | 'REMOVE' | 'SHADOW_HIDE' | 'REJECT', notes?: string) {
    const admin = await checkAdmin();

    let status = 'APPROVED';
    if (action === 'REMOVE') status = 'REMOVED';
    if (action === 'REJECT') status = 'REJECTED';
    if (action === 'SHADOW_HIDE') status = 'SHADOW_HIDDEN';

    return await prisma.$transaction(async (tx) => {
        const review = await tx.review.update({
            where: { id: reviewId },
            data: {
                status,
                lastModeratedAt: new Date()
            }
        });

        await tx.moderationAction.create({
            data: {
                reviewId,
                moderatorId: admin.id,
                action,
                notes
            }
        });

        if (action === 'APPROVE' || action === 'REMOVE' || action === 'REJECT') {
            await tx.report.updateMany({
                where: { reviewId, status: 'OPEN' },
                data: { status: 'RESOLVED' }
            });
        }

        revalidatePath('/admin/moderation');
        revalidatePath(`/majors/${review.cip4}`);
        revalidatePath(`/majors/${review.cip4}/${review.unitid}`);

        return review;
    });
}

export async function getAdminStats() {
    await checkAdmin();

    const [pending, flagged, reports] = await Promise.all([
        prisma.review.count({ where: { status: 'PENDING' } }),
        prisma.review.count({ where: { riskScore: { gt: 0 }, status: 'PENDING' } }),
        prisma.report.count({ where: { status: 'OPEN' } })
    ]);

    return { pending, flagged, reports };
}

export async function getModerationQueue(status: string = 'PENDING') {
    await checkAdmin();

    return await prisma.review.findMany({
        where: { status },
        include: {
            major: true,
            institution: true,
            user: true,
            _count: {
                select: { reports: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}
