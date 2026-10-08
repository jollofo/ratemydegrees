import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirectToLogin } from '@/lib/auth-redirect';
import { parsePage } from '@/lib/navigation';
import { jsonRecord } from '@/lib/reviews';
import DeleteReviewButton from '@/components/DeleteReviewButton';
import Pagination from '@/components/Pagination';
import ShareLink from '@/components/ShareLink';
import { programUrl } from '@/lib/review-links';

export const metadata = { title: 'My reviews | RateMyDegrees', robots: { index: false, follow: false } };
export default async function MyReviews({ searchParams }: { searchParams: { submitted?: string; reviewId?: string; page?: string } }) {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) redirectToLogin('/my-reviews');
    const page = parsePage(searchParams.page);
    const where = { userId: user.id, status: { not: 'DELETED' } };
    const [reviews, count] = await Promise.all([
        prisma.review.findMany({ where, select: { id: true, cip4: true, unitid: true, status: true, writtenResponses: true, major: { select: { title: true } }, institution: { select: { name: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 12, skip: (page - 1) * 12 }),
        prisma.review.count({ where }),
    ]);
    const labels: Record<string, string> = { APPROVED: 'Published', PENDING: 'Awaiting moderation', REMOVED: 'Removed by moderation', REJECTED: 'Not published', SHADOW_HIDDEN: 'Not publicly visible' };
    const submittedReview = searchParams.reviewId ? reviews.find(review => review.id === searchParams.reviewId && ['APPROVED', 'PENDING'].includes(review.status)) : undefined;
    return <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-4">My reviews</h1>
        <p className="mb-6">Manage your contributions. Edited reviews return to moderation. Deleting removes a review from public view; an internal record is retained.</p>
        {['approved', 'pending'].includes(searchParams.submitted ?? '') && <p role="status" className="coffee-card mb-6">{searchParams.submitted === 'approved' ? 'Review saved. Check its current publication status below.' : 'Review saved for moderation. Your current status is shown below.'}</p>}
        {submittedReview && ['approved', 'pending'].includes(searchParams.submitted ?? '') && <div className="coffee-card mb-6">
            <h2 className="text-xl font-bold mb-2">Share this degree at your school</h2>
            <p className="mb-3">{submittedReview.status === 'APPROVED' ? 'Your review is published. This degree page lists public reviews.' : 'Your review is awaiting moderation and is not public yet. You can still share the degree page.'}</p>
            <ShareLink url={programUrl(submittedReview.cip4, submittedReview.unitid)} title={submittedReview.major.title + ' at ' + submittedReview.institution.name} label="Share degree at this school" />
        </div>}
        {!reviews.length && <p className="coffee-card">No reviews on this page. <a href="/write-review" className="underline">Write a review</a></p>}
        <div className="space-y-5">{reviews.map(review => <article key={review.id} className="coffee-card">
            <h2 className="text-xl font-bold">{review.major.title} at {review.institution.name}</h2>
            <p className="font-bold my-3">{labels[review.status] ?? 'Not publicly visible'}</p>
            <p className="whitespace-pre-wrap break-words">{String(jsonRecord(review.writtenResponses).fit ?? '')}</p>
            <div className="flex flex-wrap gap-5 mt-4">
                {['APPROVED', 'PENDING'].includes(review.status) && <a href={'/my-reviews/' + review.id + '/edit'} className="underline py-2">Edit review</a>}
                {review.status === 'APPROVED' && <a href={'/majors/' + review.cip4 + '/' + review.unitid} className="underline py-2">View program reviews</a>}
                <DeleteReviewButton id={review.id} />
            </div>
        </article>)}</div>
        <Pagination currentPage={page} totalPages={Math.ceil(count / 12)} buildHref={next => '/my-reviews?page=' + next} />
    </div>;
}
