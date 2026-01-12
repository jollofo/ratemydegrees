import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string, institutionId: string } }): Promise<Metadata> {
    const [major, institution] = await Promise.all([
        prisma.major.findUnique({ where: { cip4: params.id } }),
        prisma.institution.findUnique({ where: { unitid: params.institutionId } })
    ]);
    return {
        title: `${major?.title} at ${institution?.name} | Program Reviews`,
        description: `Verified student experiences for ${major?.title} at ${institution?.name}. See rigor, satisfaction, and outcomes for this specific department.`,
    };
}

export default async function ProgramDetailPage({ params }: { params: { id: string, institutionId: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const major = await prisma.major.findUnique({
        where: { cip4: params.id },
    });

    const institution = await prisma.institution.findUnique({
        where: { unitid: params.institutionId },
    });

    if (!major || !institution) {
        notFound();
    }

    const reviews = await prisma.review.findMany({
        where: {
            cip4: params.id,
            unitid: params.institutionId,
            status: 'APPROVED'
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: true,
            _count: {
                select: { votes: true }
            }
        }
    });

    const reviewCount = reviews.length;
    const hideStats = reviewCount < 5;

    let aggregatedRatings = [
        { label: 'Academic Rigor', score: 0 },
        { label: 'Curriculum Relevance', score: 0 }, // Updated rubric name
        { label: 'Faculty Accessibility', score: 0 },
        { label: 'Workload vs Payoff', score: 0 },
        { label: 'Career Preparedness', score: 0 },
        { label: 'Overall Satisfaction', score: 0 },
    ];

    if (!hideStats) {
        const sums = { rigor: 0, career: 0, difficulty: 0, flexibility: 0, satisfaction: 0, value: 0 };
        reviews.forEach(review => {
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
            { label: 'Curriculum Relevance', score: Number((sums.flexibility / reviewCount).toFixed(1)) },
            { label: 'Faculty Accessibility', score: Number((sums.value / reviewCount).toFixed(1)) },
            { label: 'Workload vs Payoff', score: Number((sums.difficulty / reviewCount).toFixed(1)) },
            { label: 'Career Preparedness', score: Number((sums.career / reviewCount).toFixed(1)) },
            { label: 'Overall Satisfaction', score: Number((sums.satisfaction / reviewCount).toFixed(1)) },
        ];
    }

    const overallRating = !hideStats
        ? aggregatedRatings.find(r => r.label === 'Overall Satisfaction')?.score || 0
        : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8">
                <a href={`/majors/${major.cip4}`} className="text-sm font-medium text-gray-400 hover:text-primary-600 flex items-center mb-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rotate-180"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    Back to National {major.title}
                </a>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{major.title}</span>
                            <span className="text-gray-300">@</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{institution.name}</h1>
                        <p className="mt-2 text-lg text-gray-500 font-medium">
                            Academic Program Experience
                        </p>
                    </div>
                    <a href="/write-review" className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-100">
                        Rate This Program
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Statistics Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Program Scorecard</h3>

                        {hideStats ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4 inline-block p-4 bg-gray-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500 px-4">
                                    Specific aggregates for this department are hidden until we reach 5 reviews.
                                </p>
                                <div className="mt-6 px-12">
                                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-400" style={{ width: `${(reviewCount / 5) * 100}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{reviewCount} / 5 PROGRESS</p>
                                </div>
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
                                        <span className="text-xs font-bold text-gray-400 mt-1">DEPARTMENTAL AVERAGE</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {aggregatedRatings.map((r) => (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-semibold text-gray-500 tracking-tight uppercase">{r.label}</span>
                                                <span className="font-bold text-gray-900">{r.score}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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

                    <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100">
                        <h4 className="text-sm font-bold text-primary-900 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            Academic Guardrails
                        </h4>
                        <p className="text-xs text-primary-700 leading-relaxed">
                            These reviews focus exclusively on the academic department and curriculum. Comments regarding housing, dining, or administration are moderated out.
                        </p>
                    </div>
                </div>

                {/* Reviews Column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="text-2xl font-black text-gray-900">Student Experiences</h3>
                        <div className="flex gap-2">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Newest</span>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="bg-white border border-gray-100 border-dashed rounded-[40px] p-16 text-center">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">No reviews for this program yet</h4>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                Be the first to help others understand what it&apos;s really like to study {major.title} at {institution.name}.
                            </p>
                            <a href="/write-review" className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-primary-200 inline-block">
                                Start a Review
                            </a>
                        </div>
                    ) : (
                        reviews.map((review: any) => (
                            <ReviewItem key={review.id} review={review} userId={user?.id} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
