import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ReviewItem from '@/components/ReviewItem';
import Pagination from '@/components/Pagination';
import { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import MajorPostDegreeOverview from '@/components/MajorPostDegreeOverview';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const major = await prisma.major.findUnique({ where: { cip4: params.id } });
    const title = major?.title || 'Major';
    const baseUrl = 'https://ratemydegrees.com';

    return {
        title: `${title} Degree | Student Reviews and Outcomes`,
        description: `Read student reviews of ${title} and explore salary, related careers, graduate study, and schools offering the major.`,
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
                orderBy: { createdAt: 'desc' },
                include: { institution: true, major: true, _count: { select: { votes: true } } }
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

    const [institutions, totalInstitutions, relatedMajors, nationalEarnings, relatedOccupations, graduatePrograms] = await Promise.all([
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
        }),
        prisma.scorecardNationalEarnings.findUnique({
            where: { cip4_credentialLevel: { cip4: major.cip4, credentialLevel: 3 } }
        }),
        prisma.majorOccupation.findMany({
            where: { cip4: major.cip4 },
            orderBy: [{ matchedCip6Count: 'desc' }, { title: 'asc' }],
            take: 8,
            select: { socCode: true, title: true }
        }),
        prisma.graduateProgram.findMany({
            where: { cip4: major.cip4, institution: { active: true } },
            include: { institution: { select: { name: true } } },
            orderBy: { completionsTotal: 'desc' },
            take: 8
        })
    ]);

    const totalPages = Math.ceil(totalInstitutions / INST_PAGE_SIZE);

    const reviewCount = major._count.reviews;
    const overallRating = reviewCount >= 5
        ? (major.reviews.reduce((sum, review) => sum + (JSON.parse(review.ratings).satisfaction || 0), 0) / reviewCount).toFixed(1)
        : null;
    const description = major.description && !/(instructional content|taxonomy|\bCIP\b|\bcodes?\s*\d)/i.test(major.description)
        ? major.description
        : `Explore student experiences and what you can do with a degree in ${major.title.replace(/[.\s]+$/, '')}.`;

    const buildHref = (p: number) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        params.set('page', String(p));
        return `/majors/${major.cip4}?${params.toString()}`;
    };

    return (
        <div className="container mx-auto px-6 py-8 md:py-10 max-w-7xl">
            <Breadcrumbs
                items={[
                    { label: 'Majors', href: '/majors' },
                    { label: major.title, href: `/majors/${major.cip4}` }
                ]}
            />

            <div className="mb-6 border-b-2 border-earth-sage/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-6xl font-funky text-foreground tracking-tight leading-[0.95] mb-4">{major.title}</h1>
                    <p className="text-xl text-foreground/70 font-medium leading-relaxed italic max-w-2xl">
                        {description}
                    </p>
                    <a href="#student-reviews" className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-earth-terracotta hover:text-earth-sage underline underline-offset-4">Read student reviews <ArrowRight className="h-4 w-4" /></a>
                </div>
                <a href={`/write-review?majorId=${major.cip4}`} className="coffee-btn px-10 py-5 text-xl w-full md:w-auto text-center">
                    Write a Review
                </a>
            </div>

            <section id="student-reviews" className="mb-16 scroll-mt-8" aria-labelledby="student-reviews-heading">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-earth-terracotta mb-2">Real student experiences</p>
                        <h2 id="student-reviews-heading" className="text-3xl md:text-4xl font-funky text-foreground italic">Student reviews</h2>
                        <p className="text-sm text-foreground/70 mt-2">{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}{overallRating && ` · ${overallRating} / 5 average satisfaction`}</p>
                    </div>
                    <a href={`/write-review?majorId=${major.cip4}`} className="text-sm font-bold text-earth-sage hover:text-earth-terracotta">Share your experience →</a>
                </div>
                {reviewCount === 0 ? (
                    <div className="coffee-card bg-earth-parchment/30 !p-8">
                        <p className="text-lg font-funky italic text-foreground">No reviews yet</p>
                        <p className="text-sm text-foreground/70 mt-2">Studied this major? Help future students by sharing what it was like.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                            {major.reviews.slice(0, 2).map(review => <ReviewItem key={review.id} review={review} userId={user?.id} />)}
                        </div>
                        {reviewCount > 2 && (
                            <details className="mt-3 group">
                                <summary className="cursor-pointer text-sm font-bold text-earth-sage hover:text-earth-terracotta">Read all {reviewCount} reviews</summary>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start mt-6">
                                    {major.reviews.slice(2).map(review => <ReviewItem key={review.id} review={review} userId={user?.id} />)}
                                </div>
                            </details>
                        )}
                    </>
                )}
            </section>

            <MajorPostDegreeOverview
                cip4={major.cip4}
                nationalEarnings={nationalEarnings}
                occupations={relatedOccupations}
                graduatePrograms={graduatePrograms}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
                {relatedMajors.length > 0 && <div className="lg:col-span-3 space-y-12 self-start sticky top-8">
                    {/* Related Majors */}
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
                </div>}

                <div id="schools" className={`${relatedMajors.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'} scroll-mt-8`}>
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

        </div>
    );
}
