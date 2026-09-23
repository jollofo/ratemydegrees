import ReviewItem from './ReviewItem';
import Pagination from './Pagination';
import type { PublicReview } from '@/lib/reviews';

export default function ReviewList({ reviews, total, page, signedIn, buildHref, scope }: {
    reviews: PublicReview[]; total: number; page: number; signedIn: boolean;
    buildHref: (page: number) => string; scope: string;
}) {
    return <section id="student-reviews" className="scroll-mt-24 my-10" aria-labelledby="student-review-title">
        <h2 id="student-review-title" className="text-3xl font-bold mb-3">Student reviews</h2>
        <p className="mb-6">{total} {total === 1 ? 'review' : 'reviews'} · {scope} · Newest first</p>
        {!reviews.length ? <div className="coffee-card"><p>{total ? 'No reviews on this page.' : 'No student reviews yet. This reflects participation, not program quality.'}</p>{total > 0 && <a href={buildHref(1)} className="underline">First page</a>}</div> : reviews.map(review => <ReviewItem key={review.id} review={review} signedIn={signedIn} />)}
        <Pagination currentPage={page} totalPages={Math.ceil(total / 12)} buildHref={buildHref} />
    </section>;
}
