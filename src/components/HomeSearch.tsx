'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Typesense from 'typesense';
import { Search, ArrowRight } from 'lucide-react';

const searchClient = new Typesense.Client({
    nodes: [{
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST!,
        port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? '443'),
        protocol: (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https') as 'https' | 'http',
    }],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY!,
    connectionTimeoutSeconds: 5,
});

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
                const result = await searchClient.collections('majors').documents().search({
                    q: query,
                    query_by: 'title,category',
                    per_page: 6,
                    highlight_full_fields: 'title',
                    include_fields: 'cip4,title,category,reviewCount',
                });
                const results: MajorHit[] = (result.hits ?? []).map((h: any) => ({
                    objectID: h.document.cip4,
                    cip4: h.document.cip4,
                    title: h.document.title,
                    category: h.document.category ?? '',
                    reviewCount: h.document.reviewCount ?? 0,
                    _highlightResult: {
                        title: { value: h.highlights?.find((hl: any) => hl.field === 'title')?.snippet ?? h.document.title }
                    },
                }));
                setHits(results);
                setShowDropdown(results.length > 0);
            } catch (err) {
                console.error('Typesense search error:', err);
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
                        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-foreground/5">
                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] italic">Instant Results</span>
                            <span className="text-[9px] font-bold text-earth-terracotta bg-earth-terracotta/10 px-2 py-0.5 rounded-full uppercase italic">Powered by Typesense</span>
                        </div>
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-earth-sage/20 shadow-xl animate-in fade-in zoom-in-95 duration-300 mb-8">
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block italic">Tuition</label>
                        <select className="w-full bg-earth-parchment/50 border border-earth-sage/20 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none">
                            <option>Any Range</option>
                            <option>&lt; $10k/yr</option>
                            <option>$10k-$30k</option>
                            <option>$30k-$50k</option>
                            <option>$50k+</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block italic">Outcome</label>
                        <select className="w-full bg-earth-parchment/50 border border-earth-sage/20 rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none">
                            <option>Any Focus</option>
                            <option>High Salary</option>
                            <option>Grad School</option>
                            <option>Research</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic opacity-60">Popular Searches:</p>
                <div className="flex gap-4">
                    <a href="/majors?q=Computer Science" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Computer Science&quot;</a>
                    <a href="/majors?q=Nursing" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Nursing&quot;</a>
                    <a href="/majors?q=Psychology" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Psychology&quot;</a>
                </div>
            </div>
        </div>
    );
}
