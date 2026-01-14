import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search, Star } from 'lucide-react';

const PAGE_SIZE = 12;

export default async function MajorsPage({
    searchParams,
}: {
    searchParams: { q?: string; category?: string; unitid?: string; page?: string };
}) {
    const query = searchParams.q || '';
    const category = searchParams.category || '';
    const unitid = searchParams.unitid || '';
    const page = parseInt(searchParams.page || '1');

    const andConditions: Prisma.MajorWhereInput[] = [];

    if (query) {
        andConditions.push({
            title: {
                contains: query,
                mode: 'insensitive' as Prisma.QueryMode
            }
        });
    }

    if (category && category !== 'All Categories') {
        andConditions.push({ category: category });
    }

    if (unitid) {
        andConditions.push({
            institutions: {
                some: { unitid: unitid }
            }
        });
    }

    const whereClause: Prisma.MajorWhereInput = {
        AND: andConditions.length > 0 ? andConditions : undefined,
    };

    const [majors, totalCount] = await Promise.all([
        prisma.major.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { reviews: { where: { status: 'APPROVED' } } },
                },
                reviews: {
                    where: { status: 'APPROVED' },
                    select: {
                        ratings: true,
                    },
                },
            },
            orderBy: { title: 'asc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE
        }),
        prisma.major.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const majorsWithStats = majors.map((major: any) => {
        const reviews = major.reviews;
        const reviewCount = major._count.reviews;
        const outcomes = major.outcomes ? JSON.parse(major.outcomes) : null;

        let avgRating = 0;
        let avgDifficulty = 0;

        if (reviewCount >= 5) {
            const totalRating = reviews.reduce((acc: number, rev: any) => {
                const ratings = JSON.parse(rev.ratings);
                return acc + (ratings.satisfaction || 0);
            }, 0);

            const totalDifficulty = reviews.reduce((acc: number, rev: any) => {
                const ratings = JSON.parse(rev.ratings);
                return acc + (ratings.difficulty || 0);
            }, 0);

            avgRating = Number((totalRating / reviewCount).toFixed(1));
            avgDifficulty = Number((totalDifficulty / reviewCount).toFixed(1));
        }

        return {
            ...major,
            id: major.cip4,
            name: major.title,
            reviewCount,
            outcomes,
            rating: reviewCount >= 5 ? avgRating : 'N/A',
            difficulty: reviewCount >= 5 ? avgDifficulty : 'N/A',
        };
    });

    const handleSearch = async (formData: FormData) => {
        'use server';
        const q = formData.get('q') as string;
        redirect(`/majors?q=${encodeURIComponent(q)}`);
    };

    return (
        <div className="container mx-auto px-6 py-10 max-w-7xl">
            <a
                href="/"
                className="inline-flex items-center text-sm font-bold text-earth-terracotta hover:underline mb-12"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
            </a>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="max-w-2xl">
                    <h1 className="text-6xl font-funky text-foreground tracking-tight leading-[0.9] mb-6">
                        {query ? `Seeking: ${query}` : 'Academic Collections'}
                    </h1>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-8 w-full max-w-md">
                    <div className="bg-earth-parchment border-2 border-foreground p-1.5 flex gap-1 rounded-full w-fit">
                        <button className="px-6 py-2.5 bg-foreground text-white rounded-full text-xs font-bold uppercase tracking-widest cursor-default">Majors</button>
                        <a href="/institutions" className="px-6 py-2.5 text-foreground hover:bg-foreground/5 rounded-full transition-colors text-xs font-bold uppercase tracking-widest">Institutions</a>
                    </div>

                    <form action={handleSearch} className="relative w-full">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Find your major..."
                            className="coffee-input pr-16 text-sm font-bold shadow-[4px_4px_0px_#8b9467]"
                        />
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-terracotta hover:scale-110 transition-transform">
                            <Search className="h-6 w-6 stroke-[3]" />
                        </button>
                    </form>
                </div>
            </div>

            {majorsWithStats.length === 0 ? (
                <div className="py-40 text-center coffee-card border-dashed bg-earth-parchment/30">
                    <h2 className="text-3xl font-funky text-foreground opacity-40 italic">The collection is silent. Try another query.</h2>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {majorsWithStats.map((major: any) => (
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

                                <h2 className="text-3xl font-funky text-foreground group-hover:text-earth-terracotta transition-colors leading-tight mb-8 break-words overflow-hidden">
                                    {major.name}
                                </h2>

                                {major.outcomes && (
                                    <div className="mt-auto pt-8 border-t border-foreground/5">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Common Paths</span>
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
                                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-1">Wisdom</span>
                                                <span className="text-sm font-bold text-foreground">{major.reviewCount} Voices</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-1">Est. Income</span>
                                                <span className="text-sm font-bold text-foreground">{major.outcomes.salaryRange}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!major.outcomes && (
                                    <div className="mt-auto py-10 text-center bg-earth-parchment/50 border-2 border-dotted border-earth-sage/30 rounded-3xl">
                                        <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic">Be the first to share</p>
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-16 border-t border-foreground/10">
                            {page > 1 && (
                                <a
                                    href={`/majors?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                    className="w-14 h-14 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                                </a>
                            )}

                            <div className="flex items-center gap-3">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum = page;
                                    if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    if (pageNum <= 0 || pageNum > totalPages) return null;

                                    return (
                                        <a
                                            key={pageNum}
                                            href={`/majors?page=${pageNum}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                            className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 font-bold transition-all ${page === pageNum
                                                ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-lg scale-110'
                                                : 'bg-white border-foreground hover:bg-earth-parchment'
                                                }`}
                                        >
                                            {pageNum}
                                        </a>
                                    );
                                })}
                            </div>

                            {page < totalPages && (
                                <a
                                    href={`/majors?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                    className="w-14 h-14 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5 rotate-180 stroke-[2.5]" />
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

