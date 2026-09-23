import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirectToLogin } from '@/lib/auth-redirect';
import { jsonRecord } from '@/lib/reviews';
import { reviewRatingsSchema } from '@/lib/validation';
import WriteReviewForm from '@/app/write-review/ReviewForm';
import type { ReviewFormData } from '@/app/write-review/types';

export const metadata = { title: 'Edit my review | RateMyDegrees', robots: { index: false, follow: false } };
export default async function EditReview({ params }: { params: { id: string } }) {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) redirectToLogin('/my-reviews/' + params.id + '/edit');
    const review = await prisma.review.findFirst({ where: { id: params.id, userId: user.id, status: { in: ['APPROVED', 'PENDING'] } }, include: { major: true, institution: true, outcome: true } });
    if (!review) notFound();
    const written = jsonRecord(review.writtenResponses);
    const ratings = reviewRatingsSchema.safeParse(jsonRecord(review.ratings));
    const text = (key: string) => typeof written[key] === 'string' ? written[key] as string : '';
    const data: ReviewFormData = {
        majorId: review.cip4, institutionId: review.unitid,
        status: ['graduated', 'current', 'switched'].includes(review.graduationStatus) ? review.graduationStatus as ReviewFormData['status'] : 'current',
        graduationYear: review.graduationYearRange ?? '', ratings: ratings.success ? ratings.data : { satisfaction: 0 },
        fit: text('fit'), challenge: text('challenge'), misconception: text('misconception'), differently: text('differently'),
        outcomeStatus: (review.outcome?.status ?? '') as ReviewFormData['outcomeStatus'],
        jobTitle: review.outcome?.jobTitle ?? '', industry: (review.outcome?.industry ?? '') as ReviewFormData['industry'],
        gradSchool: review.outcome?.gradSchool ?? '', timeToOutcome: (review.outcome?.timeToOutcome ?? '') as ReviewFormData['timeToOutcome'],
    };
    return <div className="max-w-3xl mx-auto px-6 py-10"><h1 className="text-4xl font-bold mb-6">Edit your review</h1>
        <WriteReviewForm majors={[review.major]} institutions={[review.institution]} preSelectedMajor={review.major} preSelectedInstitution={review.institution} initialData={data} reviewId={review.id} />
    </div>;
}
