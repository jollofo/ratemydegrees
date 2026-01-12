import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { cip4: params.id } });
    return {
        title: `${major?.title || 'Major'} Reviews & Ratings | RateMyDegree`,
        description: `Read verified student and alumni reviews for ${major?.title}. Get insights on rigor, career prospects, and ROI.`,
    };
}

export default async function MajorDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const major = await prisma.major.findUnique({
        where: { cip4: params.id },
        include: {
            reviews: {
                where: { status: 'APPROVED' },
                include: {
                    institution: true
                }
            },
            institutions: {
                include: {
                    institution: true
                },
                orderBy: { completionsTotal: 'desc' },
                take: 10
            },
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    if (!major) {
        notFound();
    }

    const reviewCount = major._count.reviews;
    const hideStats = reviewCount < 5;
    const outcomes = major.outcomes ? JSON.parse(major.outcomes) : null;

    let aggregatedRatings = [
        { label: 'Academic Rigor', score: 0 },
        { label: 'Career Preparedness', score: 0 },
        { label: 'Difficulty vs Payoff', score: 0 },
        { label: 'Flexibility', score: 0 },
        { label: 'Overall Satisfaction', score: 0 },
        { label: 'Value for Time', score: 0 },
    ];

    if (!hideStats) {
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
            <div className="mb-8 border-b pb-8">
                <a href="/majors" className="text-sm font-medium text-gray-400 hover:text-primary-600 flex items-center mb-4 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 rotate-180"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    Back to all majors
                </a>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{major.category}</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{major.title}</h1>
                        <p className="mt-3 text-lg text-gray-500 max-w-2xl leading-relaxed">
                            {major.description || "Detailed program classification and statistics provided by national education monitoring systems."}
                        </p>
                    </div>
                    <a href="/write-review" className="bg-primary-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 hover:-translate-y-1">
                        Review Your Experience
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                    {/* Scorecard */}
                    <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                            </div>
                            Program Quality
                        </h3>

                        {hideStats ? (
                            <div className="text-center py-4">
                                <p className="text-sm font-medium text-gray-400">
                                    Awaiting 5+ national reviews to display aggregate data.
                                </p>
                                <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-400 transition-all" style={{ width: `${(reviewCount / 5) * 100}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="text-5xl font-black text-primary-600">{overallRating}</div>
                                    <div className="flex flex-col">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={star <= Math.round(overallRating) ? "#EAB308" : "none"} stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">{reviewCount} Reviews</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {aggregatedRatings.map((r) => (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-semibold text-gray-500 uppercase tracking-tight">{r.label}</span>
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

                    {/* Contextual Outcomes - Always Visible */}
                    <div className="bg-gray-900 text-white rounded-[32px] p-8 shadow-xl">
                        <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400"><path d="M2 20h20" /><path d="M7 10v10" /><path d="M12 5v15" /><path d="M17 14v6" /></svg>
                            </div>
                            Career Trajectory
                        </h3>
                        {outcomes ? (
                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Typically Leads To</span>
                                    <div className="flex flex-wrap gap-2">
                                        {outcomes.commonJobs.map((job: string) => (
                                            <span key={job} className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">{job}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Salary Context</span>
                                    <p className="text-xl font-bold text-primary-400">{outcomes.salaryRange}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Source: Aggregate self-reported + public data</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Graduate Paths</span>
                                    <div className="flex flex-wrap gap-2">
                                        {outcomes.gradPaths.map((path: string) => (
                                            <span key={path} className="border border-white/20 px-3 py-1 rounded-full text-xs font-medium text-gray-300">{path}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Outcome data currently processing for this major based on CIP {major.cip4}.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8">
                    <h3 className="text-2xl font-black text-gray-900 mb-6">Top Offering Institutions</h3>
                    <p className="text-sm text-gray-500 mb-8 -mt-4 font-medium italic">Ordered by national graduation volume in this program.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {major.institutions.length > 0 ? (
                            major.institutions.map((om) => (
                                <a
                                    key={om.institution.unitid}
                                    href={`/majors/${major.cip4}/${om.institution.unitid}`}
                                    className="group bg-white border border-gray-100 p-6 rounded-3xl hover:border-primary-200 hover:shadow-lg transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors uppercase text-sm leading-tight">{om.institution.name}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{om.institution.city}, {om.institution.state} &bull; {om.institution.control}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-primary-50 text-primary-600 px-2 py-1 rounded-lg text-[10px] font-black">
                                                {om.completionsTotal} GRADS
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:gap-2 transition-all">
                                        View Program Details
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-2 bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium font-italic">Institutional offering data for this specific taxonomy is still populating.</p>
                                <a href="/write-review" className="text-primary-600 font-bold mt-2 inline-block">Contribute a program review &rarr;</a>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 bg-primary-50 rounded-[32px] p-8">
                        <h4 className="text-lg font-bold text-primary-900 mb-2">Help the community grow</h4>
                        <p className="text-primary-700 text-sm mb-6">Verified student reviews are the heart of this platform. If you studied {major.title}, your insights could help thousands of prospective students.</p>
                        <a href="/write-review" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm inline-block shadow-lg shadow-primary-200">
                            Log Your Experience
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
