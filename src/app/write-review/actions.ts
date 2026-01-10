'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitReview(formData: any) {
    // Validate input (Basic implementation for MVP)
    if (!formData.majorId) {
        throw new Error('Major is required');
    }

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        throw new Error('You must be signed in to submit a review');
    }

    // Find or create user in Prisma to match Supabase user
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

    const review = await prisma.review.create({
        data: {
            majorId: formData.majorId,
            userId: user.id,
            graduationStatus: formData.status,
            graduationYearRange: formData.graduationYear,
            ratings: JSON.stringify(formData.ratings),
            writtenResponses: JSON.stringify({
                fit: formData.fit,
                challenge: formData.challenge,
                misconception: formData.misconception,
                differently: formData.differently
            }),
            status: 'APPROVED' // Auto-approved for MVP demo, usually PENDING
        }
    });

    revalidatePath(`/majors/${formData.majorId}`);
    revalidatePath('/majors');

    redirect(`/majors/${formData.majorId}?success=true`);
}

export async function getMajorsForSearch() {
    return await prisma.major.findMany({
        select: {
            id: true,
            name: true,
            category: true
        },
        orderBy: {
            name: 'asc'
        }
    });
}
