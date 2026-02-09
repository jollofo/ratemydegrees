'use client';

import { useState } from 'react';
import { Search, X, ArrowRight, GraduationCap, MapPin, Sparkles } from 'lucide-react';

interface Result {
    cip4: string;
    title: string;
    label: string;
    confidence: 'High' | 'Medium' | 'Low';
    note?: string;
}

interface MajorResolverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMajor?: (cip4: string, title: string) => void;
}

export default function MajorResolverModal({ isOpen, onClose, onSelectMajor }: MajorResolverModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(false);
    const [institutionHint, setInstitutionHint] = useState<string | null>(null);
    const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/resolve-major', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            setResults(data.results || []);
            setInstitutionHint(data.institution_hint);
            setInstitution(data.institution);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-earth-terracotta to-earth-mustard p-1">
                    <div className="bg-white/95 p-6 rounded-t-[22px]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-funky text-foreground italic">Major Resolver</h3>
                                <p className="text-sm text-foreground/60 font-bold uppercase tracking-wider">Find your path by any name</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-earth-parchment rounded-full transition-colors">
                                <X className="h-6 w-6 text-foreground/50" />
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. speech therapy at Nazareth, robotics, pre-med..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-earth-parchment/30 border-2 border-transparent focus:border-earth-terracotta focus:bg-white transition-all text-lg font-bold placeholder:font-normal placeholder:text-foreground/30 outline-none"
                                autoFocus
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-earth-sage" />
                            <button
                                type="submit"
                                disabled={loading || !query.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-earth-terracotta text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-earth-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? '...' : 'Resolve'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto p-6 space-y-4 bg-earth-parchment/10 flex-1">
                    {results.length === 0 && !loading && (
                        <div className="text-center py-12 text-foreground/40">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-bold uppercase tracking-widest text-sm">Tell us what you want to study</p>
                        </div>
                    )}

                    {institutionHint && results.length > 0 && (
                        <div className="bg-earth-sage/10 border border-earth-sage/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-earth-sage shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-earth-sage uppercase tracking-wide">Institution Detected</p>
                                <p className="text-foreground font-semibold">Looking for matches at <span className="text-earth-terracotta">{institutionHint}</span></p>
                                {!institution && <p className="text-xs text-red-500 mt-1">Warning: We couldn&apos;t find this institution in our database.</p>}
                            </div>
                        </div>
                    )}

                    {results.map((result) => (
                        <div key={result.cip4} className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md border border-foreground/5 hover:border-earth-terracotta/30 transition-all">
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${result.label === 'Exact match' ? 'bg-green-100 text-green-700' :
                                            result.label === 'Alias match' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {result.label}
                                        </span>
                                        <span className="text-[10px] text-foreground/30 font-mono">{result.cip4}</span>
                                    </div>
                                    <h4 className="text-lg font-funky text-foreground group-hover:text-earth-terracotta transition-colors italic">{result.title}</h4>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Confidence</span>
                                        <span className={`text-xs font-bold ${result.confidence === 'High' ? 'text-green-600' :
                                            result.confidence === 'Medium' ? 'text-amber-600' : 'text-red-500'
                                            }`}>{result.confidence}</span>
                                    </div>
                                </div>
                            </div>

                            {result.note && (
                                <div className="mb-4 bg-foreground/5 rounded-lg p-3 text-sm text-foreground/70 italic border-l-2 border-foreground/20">
                                    &quot;{result.note}&quot;
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-3 border-t border-foreground/5">
                                {onSelectMajor ? (
                                    <button
                                        onClick={() => {
                                            onSelectMajor(result.cip4, result.title);
                                            onClose();
                                        }}
                                        className="flex-1 bg-foreground text-white text-center py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Select Major <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <a href={`/majors/${result.cip4}`} className="flex-1 bg-foreground text-white text-center py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2">
                                        View Major <ArrowRight className="h-4 w-4" />
                                    </a>
                                )}
                                {!onSelectMajor && institution ? (
                                    <a href={`/majors/${result.cip4}/${institution.id}`} className="flex-1 bg-white border-2 border-foreground/10 text-foreground text-center py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-earth-parchment transition-colors flex items-center justify-center gap-2 group/inst">
                                        View at {institution.name} <ArrowRight className="h-4 w-4 group-hover/inst:translate-x-1 transition-transform" />
                                    </a>
                                ) : !onSelectMajor && institutionHint ? (
                                    <a href="#" onClick={(e) => { e.preventDefault(); alert("Institution not found in database."); }} className="flex-1 bg-foreground/5 text-foreground/40 text-center py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide cursor-not-allowed flex items-center justify-center gap-2">
                                        View at {institutionHint} <span className="text-[10px]">(Unknown)</span>
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
