'use server';

import prisma from '@/lib/prisma';
import { getOrCreatePrismaUser } from '@/lib/user';
import { reviewIdSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function deleteOwnReview(id: string) {
    const user = await getOrCreatePrismaUser();
    reviewIdSchema.parse(id);
    // Logical deletion keeps the moderation audit trail and immediately removes public visibility.
    const result = await prisma.review.updateMany({ where: { id, userId: user.id, status: { not: 'DELETED' } }, data: { status: 'DELETED' } });
    if (!result.count) throw new Error('Review not found.');
    revalidatePath('/my-reviews');
    revalidatePath('/majors', 'layout');
    revalidatePath('/institutions', 'layout');
    return { success: true };
}
