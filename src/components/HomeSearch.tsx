'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
    const [query, setQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/majors?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    placeholder="Search college major reviews (e.g. Anthropology, Music, Coding...)"
                    className="coffee-input text-lg py-7 pr-40 shadow-[8px_8px_0px_#c36b4e] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </button>
                </div>

                {query.length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl border-2 border-earth-sage/20 shadow-2xl p-6 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] italic">Instant Insights</h4>
                            <span className="text-[9px] font-bold text-earth-terracotta bg-earth-terracotta/10 px-2 py-0.5 rounded-full uppercase italic">Live Preview</span>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="shrink-0 w-10 h-10 bg-earth-parchment rounded-xl flex items-center justify-center text-lg">💡</div>
                            <div>
                                <p className="text-sm font-medium italic text-foreground/80 leading-relaxed mb-3">
                                    &quot;Students searching for <span className="text-earth-terracotta font-bold">&quot;{query}&quot;</span> often prioritize career readiness over theory. Average ROI for this path is 4.2/5 stars.&quot;
                                </p>
                                <a href={`/majors?q=${query}`} className="text-[10px] font-bold text-earth-sage uppercase tracking-widest hover:text-earth-terracotta transition-colors underline decoration-dotted underline-offset-4">
                                    View 100+ Detailed Reviews &rarr;
                                </a>
                            </div>
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
                            <option>Land-Grant</option>
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
                <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest italic opacity-60">Popular Collections:</p>
                <div className="flex gap-4">
                    <a href="/majors?q=Computer Science" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Computer Science&quot;</a>
                    <a href="/majors?q=Nursing" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Nursing&quot;</a>
                    <a href="/majors?q=Psychology" className="text-xs font-bold text-earth-terracotta hover:underline italic">&quot;Psychology&quot;</a>
                </div>
            </div>
        </div>
    );
}
