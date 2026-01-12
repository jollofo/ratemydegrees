import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

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

    const whereClause = {
        AND: [
            query ? { title: { contains: query, mode: 'insensitive' } } : {},
            category && category !== 'All Categories' ? { category: category } : {},
            unitid ? {
                institutions: {
                    some: { unitid: unitid }
                }
            } : {},
        ],
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

    const majorsWithStats = majors.map((major) => {
        const reviews = major.reviews;
        const reviewCount = major._count.reviews;
        const outcomes = major.outcomes ? JSON.parse(major.outcomes) : null;

        let avgRating = 0;
        let avgDifficulty = 0;

        if (reviewCount >= 5) {
            const totalRating = reviews.reduce((acc, rev) => {
                const ratings = JSON.parse(rev.ratings);
                return acc + (ratings.satisfaction || 0);
            }, 0);

            const totalDifficulty = reviews.reduce((acc, rev) => {
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
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="max-w-xl">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {query ? `Search: ${query}` : 'Academic Programs'}
                    </h1>
                    <p className="text-xl text-gray-500 mt-4 font-medium leading-relaxed">
                        Compare department-level quality and verified career outcomes across national aggregates.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-1 flex gap-1 shadow-sm">
                        <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold cursor-default">All Majors</button>
                        <a href="/institutions" className="px-5 py-2.5 text-gray-400 hover:text-gray-900 rounded-xl text-sm font-bold transition-colors">By Institution</a>
                    </div>

                    <form action={handleSearch} className="relative w-full max-w-sm">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search programs..."
                            className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary-50 outline-none transition-all font-medium text-sm pr-12"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </button>
                    </form>
                </div>
            </div>

            {majorsWithStats.length === 0 ? (
                <div className="py-32 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <div className="bg-white p-6 rounded-3xl shadow-sm inline-block mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">No matching programs</h2>
                    <p className="text-gray-500 mt-2 font-medium">Try broadening your search criteria.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                        {majorsWithStats.map((major) => (
                            <a
                                key={major.id}
                                href={`/majors/${major.id}`}
                                className="group flex flex-col bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary-100 hover:border-primary-100 transition-all duration-500"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 rounded-lg">
                                        {major.category}
                                    </span>
                                    {major.rating !== 'N/A' && (
                                        <div className="flex items-center gap-1.5 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-yellow-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            {major.rating}
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-2xl font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-tight mb-4 text-balance">
                                    {major.name}
                                </h2>

                                {major.outcomes && (
                                    <div className="mt-auto pt-6 border-t border-gray-50">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Typical Roles</span>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {major.outcomes.commonJobs.slice(0, 2).map((job: string) => (
                                                <span key={job} className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100/50">{job}</span>
                                            ))}
                                            {major.outcomes.commonJobs.length > 2 && (
                                                <span className="text-[10px] font-black text-gray-300 flex items-center">+{major.outcomes.commonJobs.length - 2}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Est. Salary</span>
                                                <span className="text-sm font-black text-gray-900">{major.outcomes.salaryRange}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Volume</span>
                                                <span className="text-sm font-black text-gray-900">{major.reviewCount} Reviews</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!major.outcomes && (
                                    <div className="mt-auto py-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Be the first to review</p>
                                    </div>
                                )}
                            </a>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-100">
                            {page > 1 && (
                                <a
                                    href={`/majors?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                                    className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="m9 18 6-6-6-6" /></svg>
                                </a>
                            )}

                            <div className="flex items-center gap-1">
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
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${page === pageNum
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
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
                                    className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

