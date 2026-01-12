import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

const PAGE_SIZE = 12;

export default async function InstitutionsPage({
    searchParams,
}: {
    searchParams: { q?: string; state?: string; page?: string };
}) {
    const query = searchParams.q || '';
    const state = searchParams.state || '';
    const page = parseInt(searchParams.page || '1');

    const whereClause = {
        active: true,
        AND: [
            query ? { name: { contains: query, mode: 'insensitive' } } : {},
            state ? { state: state } : {},
        ],
    };

    const [institutions, totalCount] = await Promise.all([
        prisma.institution.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { reviews: { where: { status: 'APPROVED' } } },
                },
            },
            orderBy: { name: 'asc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE
        }),
        prisma.institution.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const handleSearch = async (formData: FormData) => {
        'use server';
        const q = formData.get('q') as string;
        redirect(`/institutions?q=${encodeURIComponent(q)}`);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="max-w-xl">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        {query ? `Search: ${query}` : 'Institutions'}
                    </h1>
                    <p className="text-xl text-gray-500 mt-4 font-medium leading-relaxed">
                        Explore degree rankings and program quality by college or university.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-1 flex gap-1 shadow-sm">
                        <a href="/majors" className="px-5 py-2.5 text-gray-400 hover:text-gray-900 rounded-xl text-sm font-bold transition-colors">All Majors</a>
                        <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold cursor-default">By Institution</button>
                    </div>

                    <form action={handleSearch} className="relative w-full max-w-sm">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search institutions..."
                            className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary-50 outline-none transition-all font-medium text-sm pr-12"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </button>
                    </form>
                </div>
            </div>

            {institutions.length === 0 ? (
                <div className="py-32 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <h2 className="text-2xl font-black text-gray-900">No matching institutions</h2>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {institutions.map((inst) => (
                            <a
                                key={inst.unitid}
                                href={`/institutions/${inst.unitid}`}
                                className="group bg-white border border-gray-100 p-8 rounded-[32px] hover:border-primary-100 hover:shadow-xl transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors uppercase text-sm leading-tight">{inst.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{inst.city}, {inst.state} &bull; {inst.control}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
                                    <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">
                                        {inst._count.reviews} REVIEWS
                                    </span>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-primary-600 transition-colors">
                                        View Programs
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-8 border-t border-gray-100">
                            {page > 1 && (
                                <a
                                    href={`/institutions?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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
                                            href={`/institutions?page=${pageNum}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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
                                    href={`/institutions?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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

