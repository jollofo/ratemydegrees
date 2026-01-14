import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';

const PAGE_SIZE = 12;

export default async function InstitutionsPage({
    searchParams,
}: {
    searchParams: { q?: string; state?: string; page?: string };
}) {
    const query = searchParams.q || '';
    const state = searchParams.state || '';
    const page = parseInt(searchParams.page || '1');

    const andConditions: Prisma.InstitutionWhereInput[] = [];

    if (query) {
        andConditions.push({
            name: {
                contains: query,
                mode: 'insensitive' as Prisma.QueryMode
            }
        });
    }

    if (state) {
        andConditions.push({ state: state });
    }

    const whereClause: Prisma.InstitutionWhereInput = {
        active: true,
        AND: andConditions.length > 0 ? andConditions : undefined,
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
                        {query ? `Seeking: ${query}` : 'Academic Institutions'}
                    </h1>
                    <p className="text-xl text-foreground font-medium leading-relaxed italic opacity-80">
                        Explore degree rankings and program quality across national centers of learning.
                    </p>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-8 w-full max-w-md">
                    <div className="bg-earth-parchment border-2 border-foreground p-1.5 flex gap-1 rounded-full w-fit">
                        <a href="/majors" className="px-6 py-2.5 text-foreground hover:bg-foreground/5 rounded-full transition-colors text-xs font-bold uppercase tracking-widest">Majors</a>
                        <button className="px-6 py-2.5 bg-foreground text-white rounded-full text-xs font-bold uppercase tracking-widest cursor-default">Institutions</button>
                    </div>

                    <form action={handleSearch} className="relative w-full">
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Search universities..."
                            className="coffee-input pr-16 text-sm font-bold shadow-[4px_4px_0px_#8b9467]"
                        />
                        <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-terracotta hover:scale-110 transition-transform">
                            <Search className="h-6 w-6 stroke-[3]" />
                        </button>
                    </form>
                </div>
            </div>

            {institutions.length === 0 ? (
                <div className="py-40 text-center coffee-card border-dashed bg-earth-parchment/30">
                    <h2 className="text-3xl font-funky text-foreground opacity-40 italic">No institutions have gathered here yet.</h2>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {institutions.map((inst) => (
                            <a
                                key={inst.unitid}
                                href={`/institutions/${inst.unitid}`}
                                className="coffee-card group hover:shadow-[8px_8px_0px_#d4a017] flex flex-col justify-between"
                            >
                                <div className="mb-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-earth-sage/10 rounded-2xl flex items-center justify-center text-earth-sage">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" /><path d="M5 21V10.85" /><path d="M19 21V10.85" /><path d="M9 21V14" /><path d="M15 21V14" /></svg>
                                        </div>
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic">{inst.state}</span>
                                    </div>
                                    <h3 className="font-funky text-2xl text-foreground group-hover:text-earth-terracotta transition-colors leading-tight italic break-words overflow-hidden">{inst.name}</h3>
                                    <p className="text-[10px] text-foreground font-bold uppercase tracking-widest mt-4 opacity-60">{inst.city} &bull; {inst.control}</p>
                                </div>
                                <div className="flex items-center justify-between mt-8 pt-8 border-t border-foreground/5">
                                    <span className="text-[10px] font-bold text-foreground bg-earth-mustard px-4 py-1.5 rounded-full border border-foreground/10 uppercase tracking-widest">
                                        {inst._count.reviews} Reviews
                                    </span>
                                    <div className="flex items-center gap-2 text-xs font-bold text-foreground group-hover:gap-3 transition-all uppercase tracking-widest">
                                        View Majors
                                        <ArrowLeft className="h-4 w-4 rotate-180 stroke-[3]" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-16 border-t border-foreground/10">
                            {page > 1 && (
                                <a
                                    href={`/institutions?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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
                                            href={`/institutions?page=${pageNum}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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
                                    href={`/institutions?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
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

