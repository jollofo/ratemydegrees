'use client';

import { useState } from 'react';
import { Search, ArrowRight, BookOpen } from 'lucide-react';

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
}

export default function ProgramIndex({ majors, unitid }: ProgramIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredMajors = majors.filter(major =>
        major.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        major.id.includes(searchQuery) ||
        (major.category && major.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
                <div>
                    <h2 className="text-4xl font-funky text-foreground tracking-tight mb-3 italic">Pathways Found</h2>
                    <span className="text-earth-sage text-[10px] font-bold uppercase tracking-widest italic">{filteredMajors.length} Academic Areas Available</span>
                </div>

                <div className="relative w-full md:w-80">
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
                </div>
            </div>

            {filteredMajors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {filteredMajors.map((major) => (
                        <a
                            key={major.id}
                            href={`/majors/${major.id}/${unitid}`}
                            className="coffee-card group !p-10 hover:shadow-[10px_10px_0px_#8b9467] flex flex-col justify-between h-full bg-[#fffefb]/50"
                        >
                            <div>
                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-6 italic">{major.category || 'Gathering Area'}</span>
                                <h4 className="text-2xl font-funky text-foreground group-hover:text-earth-terracotta transition-colors leading-tight mb-10 italic">{major.name}</h4>
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
            ) : (
                <div className="py-32 coffee-card border-dashed bg-earth-parchment/30 text-center">
                    <div className="w-20 h-20 bg-white wavy-border flex items-center justify-center mx-auto mb-10 text-earth-terracotta">
                        <BookOpen className="h-10 w-10" />
                    </div>
                    <p className="text-foreground font-bold uppercase tracking-widest mb-8 italic">No matching paths reveal themselves.</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="coffee-btn bg-white text-foreground hover:bg-earth-parchment px-8 py-3 text-xs"
                    >
                        Reset Local Seeking
                    </button>
                </div>
            )}
        </div>
    );
}
