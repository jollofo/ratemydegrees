'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Major {
    id: string;
    name: string;
    category: string | null;
    reviewCount: number;
    completions: number;
}

interface ProgramIndexProps {
    majors: Major[];
    unitid: string;
    totalPages: number;
    currentPage: number;
    query: string;
}

export default function ProgramIndex({
    majors,
    unitid,
    totalPages,
    currentPage,
    query
}: ProgramIndexProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(query);

    // Update local state when prop changes
    useEffect(() => {
        setSearchQuery(query);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) {
            params.set('q', searchQuery);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (pageNum: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', pageNum.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                <div>
                    <h2 className="text-4xl font-funky text-foreground tracking-tight mb-3 italic">Majors Found</h2>
                    <span className="text-earth-sage text-[10px] font-bold uppercase tracking-widest italic">{majors.length > 0 ? 'Academic Areas Available' : 'Searching for paths...'}</span>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-earth-terracotta stroke-[3]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter the catalog..."
                        className="coffee-input pl-14 py-4 text-sm font-bold bg-white/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            {majors.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {majors.map((major) => (
                            <a
                                key={major.id}
                                href={`/majors/${major.id}/${unitid}`}
                                className="coffee-card group !p-6 hover:shadow-[10px_10px_0px_#8b9467] flex flex-col justify-between h-full bg-[#fffefb]/50 transition-all border-earth-sage/20"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic">{major.category || 'Gathering Area'}</span>
                                        <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">{major.id}</span>
                                    </div>
                                    <h4 className="text-2xl font-funky text-foreground group-hover:text-earth-terracotta transition-all leading-tight mb-10 italic break-words overflow-hidden">{major.name}</h4>
                                </div>
                                <div className="flex items-center justify-between pt-8 border-t border-foreground/5 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-earth-mustard/20 border border-earth-mustard/30 flex items-center justify-center text-foreground">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                                        </div>
                                        <span className="text-[10px] font-bold text-foreground uppercase tracking-widest italic">{major.completions} Grads / Year</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-earth-parchment flex items-center justify-center text-foreground group-hover:bg-earth-terracotta group-hover:text-white transition-all">
                                        <ArrowRight className="h-5 w-5 stroke-[2.5]" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-16 pt-12 border-t border-foreground/5">
                            {currentPage > 1 && (
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="w-12 h-12 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                                </button>
                            )}

                            <div className="flex items-center gap-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Only show current, 2 before, 2 after
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-lg'
                                                    : 'bg-white border-foreground hover:bg-earth-parchment'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <span key={pageNum} className="text-foreground/40 px-1 font-bold">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            {currentPage < totalPages && (
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="w-12 h-12 bg-white border-2 border-foreground rounded-2xl flex items-center justify-center hover:bg-earth-parchment transition-colors"
                                >
                                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="py-32 coffee-card border-dashed bg-earth-parchment/30 text-center">
                    <div className="w-20 h-20 bg-white wavy-border flex items-center justify-center mx-auto mb-10 text-earth-terracotta">
                        <BookOpen className="h-10 w-10" />
                    </div>
                    <p className="text-foreground font-bold uppercase tracking-widest mb-8 italic">No matching paths reveal themselves.</p>
                    {query && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                router.push(pathname);
                            }}
                            className="coffee-btn bg-white text-foreground hover:bg-earth-parchment px-8 py-3 text-xs"
                        >
                            Reset Seeking
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
