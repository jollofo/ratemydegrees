'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, School, PenTool, Shield, User } from 'lucide-react';
import { searchMajors } from '@/app/actions/search';

interface MajorHit {
    objectID: string;
    cip4: string;
    title: string;
    category: string;
    reviewCount: number;
    _highlightResult?: { title?: { value: string } };
}

export default function HomeSearch() {
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<MajorHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const router = useRouter();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced Typesense search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setHits([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const result = await searchMajors(query, { hitsPerPage: 6 });
                const results: MajorHit[] = (result.hits ?? []).map((h: any) => ({
                    objectID: h.cip4,
                    cip4: h.cip4,
                    title: h.title,
                    category: h.category ?? '',
                    reviewCount: h.reviewCount ?? 0,
                    _highlightResult: {
                        title: { value: h._highlightResult?.title?.value ?? h.title }
                    },
                }));
                setHits(results);
                setShowDropdown(results.length > 0);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowDropdown(false);
            router.push(`/majors?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleSelect = (hit: MajorHit) => {
        setShowDropdown(false);
        setQuery(hit.title);
        router.push(`/majors/${hit.cip4}`);
    };

    return (
        <div className="w-full max-w-3xl mx-auto" ref={containerRef}>
            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    placeholder="Search college major reviews (e.g. Anthropology, Music, Coding...)"
                    className="coffee-input text-lg py-7 pr-40 shadow-[8px_8px_0px_#c36b4e] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => hits.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${showFilters ? 'bg-earth-terracotta text-white' : 'bg-earth-parchment text-earth-sage hover:bg-earth-sage/10'}`}
                    >
                        {showFilters ? 'Hide Filters' : 'Filters'}
                    </button>
                    <button
                        type="submit"
                        className="w-14 h-14 bg-earth-sage text-white rounded-2xl flex items-center justify-center hover:bg-earth-sage/90 shadow-[3px_3px_0px_#433422] transition-all active:scale-95"
                    >
                        {loading
                            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <Search className="w-6 h-6 stroke-[3]" />
                        }
                    </button>
                </div>

                {/* Typesense autocomplete dropdown */}
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl border-2 border-earth-sage/20 shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <ul>
                            {hits.map((hit) => (
                                <li key={hit.objectID}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(hit)}
                                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-earth-parchment/50 transition-colors group text-left"
                                    >
                                        <div>
                                            <p
                                                className="font-bold text-foreground group-hover:text-earth-terracotta transition-colors text-sm"
                                                dangerouslySetInnerHTML={{
                                                    __html: hit._highlightResult?.title?.value ?? hit.title
                                                }}
                                            />
                                            <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mt-0.5 italic">
                                                {hit.category} &bull; {hit.reviewCount} review{hit.reviewCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-foreground/20 group-hover:text-earth-terracotta transition-colors shrink-0" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="px-6 py-3 border-t border-foreground/5 bg-earth-parchment/20">
                            <button
                                type="submit"
                                className="text-[10px] font-bold text-earth-sage uppercase tracking-widest hover:text-earth-terracotta transition-colors italic"
                            >
                                See all results for &quot;{query}&quot; →
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-earth-sage/20 shadow-xl animate-in fade-in zoom-in-95 duration-300 mb-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block italic">Category</label>
                        <select className="w-full bg-earth-parchment/50 border border-earth-sage/20 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none">
                            <option>All Majors</option>
                            <option>STEM</option>
                            <option>Humanities</option>
                            <option>Business</option>
                            <option>Arts</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block italic">Inst. Type</label>
                        <select className="w-full bg-earth-parchment/50 border border-earth-sage/20 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none">
                            <option>Any Type</option>
                            <option>Public</option>
                            <option>Private</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block italic">Location</label>
                        <select className="w-full bg-earth-parchment/50 border border-earth-sage/20 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none">
                            <option>Anywhere</option>
                            <option>Northeast</option>
                            <option>South</option>
                            <option>Midwest</option>
                            <option>West</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Onboarding Guide */}
            <div className="mt-16 bg-white/40 backdrop-blur-sm border-2 border-dashed border-earth-sage/20 rounded-3xl p-8 md:p-10 relative overflow-hidden group/container">
                <div className="absolute inset-0 bg-earth-parchment/40 opacity-0 group-hover/container:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Steps */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-earth-sage/20 flex items-center justify-center shadow-[4px_4px_0px_#8b9467] group-hover:scale-110 group-hover:shadow-[8px_8px_0px_#8b9467] group-hover:-translate-y-1 transition-all duration-300">
                            <Search className="w-8 h-8 text-earth-sage group-hover:text-earth-terracotta transition-colors stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-earth-sage group-hover:text-earth-terracotta transition-colors">1. Find Major</p>
                    </div>

                    <ArrowRight className="w-6 h-6 text-earth-sage/30 rotate-90 md:rotate-0" />

                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-earth-sage/20 flex items-center justify-center shadow-[4px_4px_0px_#8b9467] group-hover:scale-110 group-hover:shadow-[8px_8px_0px_#8b9467] group-hover:-translate-y-1 transition-all duration-300">
                            <School className="w-8 h-8 text-earth-sage group-hover:text-earth-terracotta transition-colors stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-earth-sage group-hover:text-earth-terracotta transition-colors">2. Find School</p>
                    </div>

                    <ArrowRight className="w-6 h-6 text-earth-sage/30 rotate-90 md:rotate-0" />

                    <div className="flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-3xl bg-white border-2 border-earth-sage/20 flex items-center justify-center shadow-[4px_4px_0px_#8b9467] group-hover:scale-110 group-hover:shadow-[8px_8px_0px_#8b9467] group-hover:-translate-y-1 transition-all duration-300">
                            <PenTool className="w-8 h-8 text-earth-sage group-hover:text-earth-terracotta transition-colors stroke-[2.5]" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-earth-sage group-hover:text-earth-terracotta transition-colors">3. Write Review</p>
                    </div>
                </div>

                {/* Sign In Callout */}
                <div className="relative z-10 mt-10 pt-8 border-t-2 border-dashed border-earth-sage/10 flex flex-col items-center text-center">
                    <p className="font-funky text-2xl text-foreground mb-4">
                        Ready to share your experience?
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-foreground/70 mb-6 italic">
                        <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-earth-sage" />
                            Reviews are always anonymous
                        </span>
                        <span className="hidden md:inline text-earth-sage/30">•</span>
                        <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-earth-sage" />
                            Manage & edit your reviews
                        </span>
                    </div>
                    <a href="/login" className="inline-flex items-center gap-2 bg-earth-terracotta text-white px-8 py-3 rounded-xl font-bold hover:bg-earth-terracotta/90 transition-colors shadow-lg shadow-earth-terracotta/20 active:scale-95 duration-200">
                        Sign In to Start Reviewing
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
