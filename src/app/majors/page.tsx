import prisma from '@/lib/prisma';
import { searchMajors } from '@/app/actions/search';
import { ArrowLeft, Search, Star } from 'lucide-react';
import Pagination from '@/components/Pagination';
import BackLink from '@/components/BackLink';

const PAGE_SIZE = 12;

export default async function MajorsPage({
    searchParams,
}: {
    searchParams: { q?: string; category?: string; page?: string };
}) {
    const query = searchParams.q || '';
    const category = searchParams.category || '';
    const page = parseInt(searchParams.page || '1');

    // Use Typesense when there's a query; fall back to Prisma for the unfiltered browse
    let majors: any[] = [];
    let totalPages = 1;
    let totalHits = 0;

    if (query || category) {
        const facetFilters = category ? [`category:${category}`] : undefined;
        const result = await searchMajors(query, {
            page, // Typesense is 1-indexed
            hitsPerPage: PAGE_SIZE,
            ...(category ? { filterBy: `category:=${category}` } : {}),
        });

        if (result.totalHits > 0) {
            majors = result.hits.map((hit) => ({
                id: hit.cip4,
                name: hit.title,
                category: hit.category,
                description: hit.description,
                reviewCount: hit.reviewCount,
                outcomes: hit.commonJobs.length > 0
                    ? { commonJobs: hit.commonJobs, salaryRange: hit.salaryRange }
                    : null,
                rating: 'N/A',
                _highlight: Object.fromEntries((hit.highlights ?? []).map((h: any) => [h.field, { value: h.snippet ?? h.value ?? '' }])),
            }));
            totalPages = result.totalPages;
            totalHits = result.totalHits;
        } else {
            // Typesense index not yet populated — fall back to Prisma text search
            const whereClause: any = {
                ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
                ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
            };
            const [dbMajors, count] = await Promise.all([
                prisma.major.findMany({
                    where: whereClause,
                    include: {
                        _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
                    },
                    orderBy: { title: 'asc' },
                    skip: (page - 1) * PAGE_SIZE,
                    take: PAGE_SIZE,
                }),
                prisma.major.count({ where: whereClause }),
            ]);
            totalPages = Math.ceil(count / PAGE_SIZE);
            totalHits = count;
            majors = dbMajors.map((major: any) => ({
                id: major.cip4,
                name: major.title,
                category: major.category,
                description: major.description,
                reviewCount: major._count.reviews,
                outcomes: null,
                rating: 'N/A',
            }));
        }
    } else {
        // Browse mode — use Prisma with full stats
        const [dbMajors, count] = await Promise.all([
            prisma.major.findMany({
                include: {
                    _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
                    reviews: {
                        where: { status: 'APPROVED' },
                        select: { ratings: true },
                    },
                },
                orderBy: { title: 'asc' },
                skip: (page - 1) * PAGE_SIZE,
                take: PAGE_SIZE,
            }),
            prisma.major.count(),
        ]);

        totalPages = Math.ceil(count / PAGE_SIZE);
        totalHits = count;

        majors = dbMajors.map((major: any) => {
            const reviewCount = major._count.reviews;
            const outcomes = major.outcomes ? JSON.parse(major.outcomes) : null;
            let avgRating: number | 'N/A' = 'N/A';

            if (reviewCount >= 5) {
                const total = major.reviews.reduce((acc: number, rev: any) => {
                    const r = JSON.parse(rev.ratings);
                    return acc + (r.satisfaction || 0);
                }, 0);
                avgRating = Number((total / reviewCount).toFixed(1));
            }

            return {
                id: major.cip4,
                name: major.title,
                category: major.category,
                description: major.description,
                reviewCount,
                outcomes,
                rating: avgRating,
            };
        });
    }

    const buildHref = (p: number) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        params.set('page', String(p));
        return `/majors?${params.toString()}`;
    };

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            <BackLink href="/" label="Back to Home" />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="max-w-2xl">
                    <h1 className="text-6xl font-funky text-foreground tracking-tight leading-[0.9] mb-6">
                        {query ? `Results for "${query}"` : 'Browse Programs'}
                    </h1>
                    {(query || category) && (
                        <p className="text-sm font-bold text-earth-sage uppercase tracking-widest italic">
                            {totalHits} major{totalHits !== 1 ? 's' : ''} found
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-start lg:items-end gap-8 w-full max-w-md">
                    <div className="bg-earth-parchment border-2 border-foreground p-1.5 flex gap-1 rounded-full w-fit">
                        <button className="px-6 py-2.5 bg-foreground text-white rounded-full text-xs font-bold uppercase tracking-widest cursor-default">Majors</button>
                        <a href="/institutions" className="px-6 py-2.5 text-foreground hover:bg-foreground/5 rounded-full transition-colors text-xs font-bold uppercase tracking-widest">Institutions</a>
                    </div>

                    <form method="GET" action="/majors" className="relative w-full">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Find your major..."
                            className="coffee-input pr-16 text-sm font-bold shadow-[4px_4px_0px_#8b9467]"
                        />
                        {category && <input type="hidden" name="category" value={category} />}
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-terracotta hover:scale-110 transition-transform">
                            <Search className="h-6 w-6 stroke-[3]" />
                        </button>
                    </form>
                </div>
            </div>

            {majors.length === 0 ? (
                <div className="py-40 text-center coffee-card border-dashed bg-earth-parchment/30">
                    <h2 className="text-3xl font-funky text-foreground opacity-40 italic">No majors found. Try a different search.</h2>
                    {query && (
                        <a href="/majors" className="mt-6 inline-block text-sm font-bold text-earth-terracotta hover:underline decoration-2 underline-offset-4">
                            Clear search
                        </a>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {majors.map((major: any) => (
                            <a
                                key={major.id}
                                href={`/majors/${major.id}`}
                                className="coffee-card group hover:shadow-[8px_8px_0px_#8b9467] flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-earth-sage bg-earth-sage/10 border border-earth-sage px-3 py-1 rounded-full">
                                        {major.category}
                                    </span>
                                    {major.rating !== 'N/A' && (
                                        <div className="flex items-center gap-1.5 bg-earth-mustard text-foreground px-3 py-1 text-xs font-bold rounded-full border border-foreground/10">
                                            <Star className="h-4 w-4 fill-foreground" />
                                            {major.rating}
                                        </div>
                                    )}
                                </div>

                                <h2
                                    className="text-3xl font-funky text-foreground group-hover:text-earth-terracotta transition-colors leading-tight mb-8 break-words overflow-hidden"
                                    dangerouslySetInnerHTML={{
                                        __html: major._highlight?.title?.value ?? major.name
                                    }}
                                />

                                {major.outcomes ? (
                                    <div className="mt-auto pt-8 border-t border-foreground/5">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Common Outcomes</span>
                                        <div className="flex flex-wrap gap-2 mb-10">
                                            {major.outcomes.commonJobs.slice(0, 2).map((job: string) => (
                                                <span key={job} className="text-[10px] font-bold text-foreground bg-earth-parchment border border-foreground/10 px-3 py-1.5 rounded-lg">{job}</span>
                                            ))}
                                            {major.outcomes.commonJobs.length > 2 && (
                                                <span className="text-[10px] font-bold text-earth-sage flex items-center">+{major.outcomes.commonJobs.length - 2}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-1">Insights</span>
                                                <span className="text-sm font-bold text-foreground">{major.reviewCount} Reviews</span>
                                            </div>
                                            {major.outcomes.salaryRange && (
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-1">Est. Income</span>
                                                    <span className="text-sm font-bold text-foreground">{major.outcomes.salaryRange}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-auto py-10 text-center bg-earth-parchment/50 border-2 border-dotted border-earth-sage/30 rounded-3xl">
                                        <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic">Be the first to share</p>
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>

                    <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
                </>
            )}
        </div>
    );
}
