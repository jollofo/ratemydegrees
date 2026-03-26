import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import Pagination from '@/components/Pagination';
import BackLink from '@/components/BackLink';
import { searchInstitutionsForMajor } from '@/app/actions/search';
import { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import StructuredMajorContent from '@/components/StructuredMajorContent';
import { Major } from '@prisma/client';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { cip4: params.id } });
    const title = major?.title || 'Major';
    const baseUrl = 'https://ratemydegrees.com';

    return {
        title: `${title} (CIP ${params.id}) Degree | Outcomes, Salary, ROI`,
        description: `Get the facts on a ${title} (CIP ${params.id}) degree: salary expectations, common career paths, and verified student reviews on ROI and rigor.`,
        alternates: {
            canonical: `${baseUrl}/majors/${params.id}`,
        }
    };
}

const INST_PAGE_SIZE = 12;

export default async function MajorDetailPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { q?: string; page?: string }
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const query = searchParams.q || '';
    const page = parseInt(searchParams.page || '1');

    const major = await prisma.major.findUnique({
        where: { cip4: params.id },
        include: {
            reviews: {
                where: { status: 'APPROVED' },
                include: { institution: true }
            },
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    if (!major) notFound();

    const whereClause = {
        cip4: params.id,
        institution: {
            name: {
                contains: query,
            }
        }
    };

    const [institutions, totalInstitutions, relatedMajors] = await Promise.all([
        prisma.institutionMajor.findMany({
            where: whereClause,
            include: {
                institution: true
            },
            orderBy: { completionsTotal: 'desc' },
            skip: (page - 1) * INST_PAGE_SIZE,
            take: INST_PAGE_SIZE
        }),
        prisma.institutionMajor.count({ where: whereClause }),
        prisma.major.findMany({
            where: {
                category: major.category,
                cip4: { not: major.cip4 }
            },
            take: 4,
            select: { cip4: true, title: true }
        })
    ]);

    const totalPages = Math.ceil(totalInstitutions / INST_PAGE_SIZE);

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
        major.reviews.forEach((review: any) => {
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

    const buildHref = (p: number) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        params.set('page', String(p));
        return `/majors/${major.cip4}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto px-6 py-16 max-w-7xl">
            <Breadcrumbs
                items={[
                    { label: 'Majors', href: '/majors' },
                    { label: major.title, href: `/majors/${major.cip4}` }
                ]}
            />

            <div className="mb-20 border-b-2 border-earth-sage/20 pb-16 flex flex-col md:flex-row md:items-end justify-between gap-12">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="bg-earth-sage/10 border border-earth-sage px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-earth-sage rounded-full">{major.category}</span>
                        <span className="text-foreground/40 font-bold uppercase tracking-widest text-[10px]">Taxonomy: {major.cip4}</span>
                    </div>
                    <h1 className="text-7xl font-funky text-foreground tracking-tight leading-[0.85] mb-8">{major.title}</h1>
                    <p className="text-xl text-foreground/70 font-medium leading-relaxed italic max-w-2xl">
                        {major.description || "Explore verified student reviews for this program. Find out about workload, career outcomes, and what students really think."}
                    </p>
                </div>
                <a href={`/write-review?majorId=${major.cip4}`} className="coffee-btn px-10 py-5 text-xl w-full md:w-auto text-center">
                    Write a Review
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
                <div className="lg:col-span-3 space-y-12 self-start sticky top-8">
                    {/* Scorecard */}
                    <div className="coffee-card bg-earth-parchment/30">
                        <h3 className="text-2xl font-funky text-foreground mb-10 italic border-b border-foreground/5 pb-6">Community Sentiment</h3>

                        {hideStats ? (
                            <div className="text-center py-10 bg-white/50 border-2 border-dashed border-earth-sage/30 rounded-3xl">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-earth-sage/60 mb-6 italic">
                                    Need 5+ Reviews to Show Ratings
                                </p>
                                <div className="h-4 w-full bg-white border border-foreground/10 rounded-full overflow-hidden mx-auto max-w-[240px]">
                                    <div className="h-full bg-earth-terracotta" style={{ width: `${(reviewCount / 5) * 100}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-8 mb-12">
                                    <div className="text-8xl font-funky italic tracking-tighter leading-none text-earth-terracotta">{overallRating}</div>
                                    <div className="flex flex-col">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={star <= Math.round(overallRating) ? "var(--earth-mustard)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-earth-mustard"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-bold text-earth-sage mt-3 uppercase tracking-widest italic">{reviewCount} Verified Contributions</span>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    {aggregatedRatings.map((r) => (
                                        <div key={r.label}>
                                            <div className="flex justify-between text-[10px] mb-3">
                                                <span className="font-bold text-earth-sage uppercase tracking-widest italic">{r.label}</span>
                                                <span className="font-bold text-foreground">{r.score}</span>
                                            </div>
                                            <div className="h-3 bg-white rounded-full border border-foreground/5 overflow-hidden">
                                                <div className="h-full bg-earth-sage" style={{ width: `${(r.score / 5) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Outcomes */}
                    <div className="coffee-card bg-earth-burgundy text-earth-parchment shadow-[6px_6px_0px_#433422]">
                        <h3 className="text-2xl font-funky mb-10 italic border-b border-white/5 pb-6">Life After this course</h3>
                        {outcomes ? (
                            <div className="space-y-10">
                                <div>
                                    <span className="text-[10px] font-bold text-earth-parchment/60 uppercase tracking-widest block mb-6 italic">Common Roles</span>
                                    <div className="flex flex-wrap gap-2">
                                        {outcomes.commonJobs.map((job: string) => (
                                            <span key={job} className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">{job}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="py-8 bg-white/5 rounded-3xl text-center border border-white/5">
                                    <span className="text-[10px] font-bold text-earth-parchment/60 uppercase tracking-widest block mb-3 italic">Est. Mid-Career Income</span>
                                    <p className="text-5xl font-funky text-earth-mustard italic tracking-tight">{outcomes.salaryRange}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs font-medium leading-relaxed text-earth-parchment/60 italic">No outcome data available yet for this program (CIP {major.cip4}).</p>
                        )}
                    </div>

                    {/* Related Majors */}
                    {relatedMajors.length > 0 && (
                        <div className="coffee-card bg-earth-sage/5 border-earth-sage/10">
                            <h3 className="text-xl font-funky text-foreground mb-6 italic border-b border-foreground/5 pb-4">Related Fields</h3>
                            <div className="flex flex-col gap-3">
                                {relatedMajors.map((rm) => (
                                    <a
                                        key={rm.cip4}
                                        href={`/majors/${rm.cip4}`}
                                        className="text-sm font-bold text-earth-sage hover:text-earth-terracotta flex items-center justify-between group transition-colors"
                                    >
                                        <span className="truncate">{rm.title}</span>
                                        <ArrowLeft className="h-3 w-3 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-9">
                    <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                        <div>
                            <h3 className="text-4xl font-funky text-foreground mb-3 tracking-tight italic">Institutions</h3>
                            <p className="text-sm font-bold text-earth-sage uppercase tracking-widest italic">
                                {query ? `${totalInstitutions} results for "${query}"` : `${totalInstitutions} institutions offering this major`}
                            </p>
                        </div>

                        <form method="GET" action={`/majors/${major.cip4}`} className="relative w-full max-w-xs">
                            <input
                                type="text"
                                name="q"
                                defaultValue={query}
                                placeholder="Find a university..."
                                className="coffee-input py-3.5 text-sm font-bold bg-earth-parchment/30"
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-terracotta hover:scale-110 transition-transform">
                                <Search className="h-5 w-5 stroke-[3]" />
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {institutions.length > 0 ? (
                            (institutions as any[]).map((inst) => (
                                <a
                                    key={inst.unitid}
                                    href={`/majors/${major.cip4}/${inst.unitid}`}
                                    className="coffee-card !p-10 group hover:shadow-[10px_10px_0px_#d4a017] flex flex-col justify-between h-full bg-[#fffefb]/50"
                                >
                                    <div className="mb-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="bg-earth-mustard/20 text-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-earth-mustard/30">
                                                {inst.completionsTotal} / YR
                                            </span>
                                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest truncate max-w-[100px] italic">{inst.institution.city}, {inst.institution.state}</span>
                                        </div>
                                        <h4
                                            className="text-2xl font-funky text-foreground group-hover:text-earth-terracotta transition-colors leading-tight italic"
                                            dangerouslySetInnerHTML={{ __html: (inst as any)._highlightResult?.name?.value ?? inst.institution.name }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-8 border-t border-foreground/5 transition-colors group-hover:border-earth-terracotta">
                                        <span className="text-[10px] font-bold uppercase tracking-widest italic">Explore Path</span>
                                        <div className="w-8 h-8 rounded-full bg-earth-parchment flex items-center justify-center text-foreground group-hover:bg-earth-terracotta group-hover:text-white transition-all">
                                            <ArrowRight className="h-4 w-4 stroke-[3]" />
                                        </div>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center coffee-card border-dashed bg-earth-parchment/30">
                                <p className="text-foreground/40 font-bold uppercase tracking-widest mb-6 italic">
                                    {query ? `No institutions found for "${query}".` : 'No institutions found.'}
                                </p>
                                {query && (
                                    <a href={`/majors/${major.cip4}`} className="text-sm font-bold text-earth-terracotta hover:underline decoration-2 underline-offset-8">Clear Search</a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-20">
                        <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
                    </div>

                    <div className="mt-32 coffee-card bg-earth-mustard/10 border-earth-mustard/20 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-earth-mustard wavy-border mb-10 flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                        </div>
                        <h4 className="text-4xl font-funky text-foreground mb-6 italic">Write a Review</h4>
                        <p className="text-xl text-foreground font-medium max-w-2xl mb-12 leading-relaxed opacity-70 italic">Verified student reviews are the heart of this platform. If you have studied {major.title}, your experience could help the next student choose wisely.</p>
                        <a href={`/write-review?majorId=${major.cip4}`} className="coffee-btn bg-white text-foreground hover:bg-earth-parchment px-12 py-5 text-xl shadow-[6px_6px_0px_#433422]">
                            Write a Review
                        </a>
                    </div>
                </div>
            </div>

            <StructuredMajorContent major={major as any} />
        </div>
    );
}
