import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { id: params.id } });
    return {
        title: `${major?.name || 'Major'} Reviews & Ratings | RateMyDegree`,
        description: `Read verified student and alumni reviews for ${major?.name}. Get insights on rigor, career prospects, and ROI.`,
    };
}

export default async function MajorDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const major = await prisma.major.findUnique({
        where: { id: params.id },
        include: {
            reviews: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    _count: {
                        select: { votes: true }
                    }
                }
            },
            _count: {
                select: { reviews: true }
            }
        }
    });

    if (!major) {
        notFound();
    }

    const reviewCount = major._count.reviews;
    const hideStats = reviewCount < 5;

    // Calculate aggregated ratings if enough reviews
    let aggregatedRatings = [
        { label: 'Academic Rigor', score: 0 },
        { label: 'Career Preparedness', score: 0 },
        { label: 'Difficulty vs Payoff', score: 0 },
        { label: 'Flexibility', score: 0 },
        { label: 'Overall Satisfaction', score: 0 },
        { label: 'Value for Time', score: 0 },
    ];

    if (!hideStats) {
        // Logic to aggregate from JSON fields
        const sums = { rigor: 0, career: 0, difficulty: 0, flexibility: 0, satisfaction: 0, value: 0 };
        major.reviews.forEach(review => {
            const r = JSON.parse(review.ratings);
            sums.rigor += r.rigor || 0;
            sums.career += r.career || 0;
            sums.difficulty += r.difficulty || 0;
            sums.flexibility += r.flexibility || 0;
            sums.satisfaction += r.satisfaction || 0;
            sums.value += r.value || 0;
        });

        aggregatedRatings = [
            { label: 'Academic Rigor', score: Number((sums.rigor / reviewCount).toFixed(1)) },
            { label: 'Career Preparedness', score: Number((sums.career / reviewCount).toFixed(1)) },
            { label: 'Difficulty vs Payoff', score: Number((sums.difficulty / reviewCount).toFixed(1)) },
            { label: 'Flexibility', score: Number((sums.flexibility / reviewCount).toFixed(1)) },
            { label: 'Overall Satisfaction', score: Number((sums.satisfaction / reviewCount).toFixed(1)) },
            { label: 'Value for Time', score: Number((sums.value / reviewCount).toFixed(1)) },
        ];
    }

    const overallRating = !hideStats
        ? aggregatedRatings.find(r => r.label === 'Overall Satisfaction')?.score || 0
        : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <a href="/majors" className="text-sm font-medium text-gray-500 hover:text-primary-600 flex items-center mb-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rotate-180"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    Back to all majors
                </a>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 rounded-md mb-2">
                            {major.category}
                        </span>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{major.name}</h1>
                        <p className="mt-2 text-lg text-gray-600 max-w-2xl">
                            {major.description || `An in-depth look at what students and alumni think about ${major.name}.`}
                            {reviewCount > 0 ? ` Based on ${reviewCount} peer reviews.` : ''}
                        </p>
                    </div>
                    <a href="/write-review" className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200 hover:-translate-y-0.5 whitespace-nowrap inline-block text-center">
                        Write a Review
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Scorecard</h3>

                        {hideStats ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4 inline-block p-4 bg-gray-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    Aggregate ratings are hidden until this major has at least 5 reviews.
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Current reviews: {reviewCount}/5</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="text-5xl font-black text-primary-600">{overallRating}</div>
                                    <div className="flex flex-col">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={star <= Math.round(overallRating) ? "#EAB308" : "none"} stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-gray-500 mt-1">Based on {reviewCount} reviews</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {aggregatedRatings.map((r) => (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{r.label}</span>
                                                <span className="font-bold text-gray-900">{r.score}/5</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full"
                                                    style={{ width: `${(r.score / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Reviews Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">Student Reviews</h3>
                        <div className="text-sm text-gray-500">Sorted by Newest</div>
                    </div>

                    {major.reviews.length === 0 ? (
                        <div className="bg-white border border-gray-100 border-dashed rounded-3xl p-12 text-center">
                            <h4 className="text-lg font-bold text-gray-900 mb-2">No reviews yet</h4>
                            <p className="text-gray-500 mb-6">Be the first to share your experience with {major.name}.</p>
                            <a href="/write-review" className="text-primary-600 font-bold hover:underline">Write a Review &rarr;</a>
                        </div>
                    ) : (
                        major.reviews.map((review: any) => (
                            <ReviewItem key={review.id} review={review} userId={user?.id} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
