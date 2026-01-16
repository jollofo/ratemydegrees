import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

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
        reviews.forEach((review: any) => {
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
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            <a
                href={`/majors/${major.cip4}`}
                className="inline-flex items-center text-sm font-bold text-earth-terracotta hover:underline mb-8"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {major.title}
            </a>

            <div className="mb-10 border-b-2 border-earth-sage/20 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="bg-earth-mustard/20 border border-earth-mustard/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground rounded-full italic">{major.title}</span>
                        <span className="text-foreground font-bold uppercase tracking-widest text-[10px] opacity-60">Taxonomy: {major.cip4}</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-funky text-foreground tracking-tight leading-[0.85] mb-4">{institution.name}</h1>
                    <p className="text-xl font-funky text-earth-terracotta italic tracking-tight">Academic Department Insights</p>
                </div>
                <a href="/write-review" className="coffee-btn px-8 py-4 text-lg w-full md:w-auto text-center shadow-[6px_6px_0px_#433422]">
                    Share Your Experience
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
                {/* Statistics Column */}
                <div className="lg:col-span-5 space-y-12">
                    <div className="coffee-card bg-earth-parchment/30 !p-6">
                        <h3 className="text-2xl font-funky text-foreground mb-6 italic border-b border-foreground/5 pb-4">Departmental Scorecard</h3>

                        {hideStats ? (
                            <div className="text-center py-12 bg-white/50 border-2 border-dashed border-earth-sage/30 rounded-3xl px-8">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-earth-sage/60 mb-8 italic">
                                    Insights hidden until 5+ reviews are available
                                </p>
                                <div className="h-4 w-full bg-white border border-foreground/10 rounded-full overflow-hidden mx-auto max-w-[240px]">
                                    <div className="h-full bg-earth-terracotta" style={{ width: `${(reviewCount / 5) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-foreground mt-6 font-bold uppercase tracking-widest italic">{reviewCount} / 5 REVIEWS</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="text-6xl font-funky italic tracking-tighter leading-none text-earth-terracotta">{overallRating}</div>
                                    <div className="flex flex-col">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={star <= Math.round(overallRating) ? "var(--earth-mustard)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-earth-mustard"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-earth-sage mt-3 uppercase tracking-widest italic">Average Rating</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {aggregatedRatings.map((r) => (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-[10px] mb-3">
                                                <span className="font-bold text-earth-sage uppercase tracking-widest italic">{r.label}</span>
                                                <span className="font-bold text-foreground">{r.score}</span>
                                            </div>
                                            <div className="h-3 bg-white rounded-full border border-foreground/5 overflow-hidden">
                                                <div
                                                    className="h-full bg-earth-sage"
                                                    style={{ width: `${(r.score / 5) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="coffee-card bg-earth-burgundy text-earth-parchment shadow-[6px_6px_0px_#433422] !p-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                        </div>
                        <h4 className="text-2xl font-funky italic mb-4">Community Guidelines</h4>
                        <p className="text-sm font-medium leading-relaxed italic opacity-70">
                            These reviews focus purely on the departmental curriculum and faculty dynamics. Content unrelated to the academic experience may be removed.
                        </p>
                    </div>
                </div>

                {/* Reviews Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between border-b border-foreground/10 pb-5 mb-8">
                        <div>
                            <h3 className="text-3xl font-funky text-foreground tracking-tight italic">Recent Reviews</h3>
                            <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mt-1 italic">Student experiences</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="bg-earth-mustard text-foreground px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full border border-foreground/10 shadow-sm italic">Latest</span>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="coffee-card bg-earth-parchment/30 border-dashed py-32 text-center">
                            <h4 className="text-3xl font-funky text-foreground mb-6 italic opacity-40">No reviews yet</h4>
                            <p className="text-foreground font-medium mb-12 max-w-sm mx-auto leading-relaxed italic opacity-70 text-lg">
                                Be the first to share your experience about the {major.title} program at {institution.name}.
                            </p>
                            <a href="/write-review" className="coffee-btn bg-white text-foreground hover:bg-earth-parchment px-12 py-5 text-xl">
                                Write a Review
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review: any) => (
                                <ReviewItem key={review.id} review={review} userId={user?.id} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
