'use client';

import { useState, useEffect, useRef } from 'react';
import { submitReview, searchInstitutions, searchMajors } from './actions';

export default function WriteReviewForm({ majors: initialMajors, institutions: initialInstitutions }: { majors: any[], institutions: any[] }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search states
    const [instQuery, setInstQuery] = useState('');
    const [instResults, setInstResults] = useState(initialInstitutions);
    const [isSearchingInst, setIsSearchingInst] = useState(false);
    const [showInstResults, setShowInstResults] = useState(false);

    const [majorQuery, setMajorQuery] = useState('');
    const [majorResults, setMajorResults] = useState(initialMajors);
    const [isSearchingMajor, setIsSearchingMajor] = useState(false);
    const [showMajorResults, setShowMajorResults] = useState(false);

    const instSearchRef = useRef<HTMLDivElement>(null);
    const majorSearchRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        majorId: '',
        institutionId: '',
        status: 'graduated',
        graduationYear: '',
        ratings: {
            rigor: 3,
            career: 3,
            difficulty: 3,
            flexibility: 3,
            satisfaction: 3,
            value: 3
        },
        fit: '',
        challenge: '',
        misconception: '',
        differently: ''
    });

    // Handle clicks outside search results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (instSearchRef.current && !instSearchRef.current.contains(event.target as Node)) {
                setShowInstResults(false);
            }
            if (majorSearchRef.current && !majorSearchRef.current.contains(event.target as Node)) {
                setShowMajorResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search for institutions
    useEffect(() => {
        if (!instQuery || instQuery.length < 2) {
            setInstResults(initialInstitutions);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingInst(true);
            try {
                const results = await searchInstitutions(instQuery);
                setInstResults(results);
            } finally {
                setIsSearchingInst(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [instQuery, initialInstitutions]);

    // Debounced search for majors
    useEffect(() => {
        if (!majorQuery || majorQuery.length < 2) {
            setMajorResults(initialMajors);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingMajor(true);
            try {
                const results = await searchMajors(majorQuery);
                setMajorResults(results);
            } finally {
                setIsSearchingMajor(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [majorQuery, initialMajors]);

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const ratingCategories = [
        { key: 'rigor', label: 'Academic Rigor' },
        { key: 'flexibility', label: 'Curriculum Relevance' },
        { key: 'value', label: 'Faculty Accessibility (no names)' },
        { key: 'difficulty', label: 'Workload vs Payoff' },
        { key: 'career', label: 'Career Preparedness' },
        { key: 'satisfaction', label: 'Overall Satisfaction' },
    ];

    const handleSubmit = async () => {
        if (!formData.majorId || !formData.institutionId) {
            alert('Please select both a major and an institution');
            setStep(1);
            return;
        }

        setIsSubmitting(true);
        try {
            await submitReview(formData);
        } catch (error) {
            console.error(error);
            alert('Something went wrong. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {/* Anonymity Notice banner */}
            <div className="mb-16 coffee-card bg-earth-sage/10 border-earth-sage/30 p-8 flex items-center gap-8">
                <div className="w-14 h-14 bg-white wavy-border flex items-center justify-center text-earth-sage shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <div>
                    <p className="text-xl font-funky text-foreground italic mb-1">Encrypted Anonymity</p>
                    <p className="text-sm font-medium text-foreground opacity-60 leading-relaxed italic">Your identity is protected by the community veil. We only use your account to preserve the integrity of our collective wisdom.</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-20 flex items-center justify-center gap-10">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                        <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-lg transition-all ${step >= i
                            ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-lg scale-110'
                            : 'bg-white border-foreground/10 text-foreground/20'
                            }`}>
                            {i}
                        </div>
                        {i < 3 && (
                            <div className={`w-20 h-0.5 border-t-2 border-foreground/10 border-dashed mx-4 ${step > i ? 'border-earth-terracotta opacity-100' : 'opacity-20'}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="coffee-card !p-12 bg-[#fffefb]/80 backdrop-blur-sm">
                {step === 1 && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-10">
                            <h2 className="text-5xl font-funky text-foreground tracking-tight italic mb-4">1. The Context</h2>
                            <p className="text-earth-sage text-xs font-bold uppercase tracking-[0.2em] italic">Where did your educational journey unfold?</p>
                        </div>

                        <div className="space-y-12">
                            <div className="relative" ref={instSearchRef}>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">National Institution / University</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Seek your college..."
                                            className="coffee-input pr-14 !py-5 shadow-[4px_4px_0px_#8b9467] text-lg"
                                            value={instQuery}
                                            onChange={(e) => {
                                                setInstQuery(e.target.value);
                                                setShowInstResults(true);
                                            }}
                                            onFocus={() => setShowInstResults(true)}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-earth-terracotta opacity-40">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                    {formData.institutionId && (
                                        <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-earth-sage/10 border border-earth-sage/30 rounded-full text-xs font-bold text-earth-sage uppercase tracking-widest italic">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
                                            Pinned: {instResults.find(i => i.unitid === formData.institutionId)?.name || 'The Academy'}
                                        </div>
                                    )}
                                </label>

                                {showInstResults && (instResults.length > 0 || isSearchingInst) && (
                                    <div className="absolute z-50 w-full mt-6 bg-[#fffefb] border-2 border-foreground rounded-[2rem] shadow-[12px_12px_0px_rgba(67,52,34,0.1)] overflow-hidden">
                                        {isSearchingInst ? (
                                            <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-earth-sage animate-pulse italic">Seeking Archives...</div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {instResults.map(inst => (
                                                    <button
                                                        key={inst.unitid}
                                                        type="button"
                                                        className="w-full text-left px-8 py-6 hover:bg-earth-parchment transition-colors border-b border-foreground/5 last:border-0 group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, institutionId: inst.unitid });
                                                            setInstQuery(inst.name);
                                                            setShowInstResults(false);
                                                        }}
                                                    >
                                                        <div className="font-funky text-2xl text-foreground group-hover:text-earth-terracotta transition-colors italic leading-none">{inst.name}</div>
                                                        <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest mt-3 opacity-60">{inst.city}, {inst.state}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={majorSearchRef}>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Academic Discipline / Major</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Seek your program..."
                                            className="coffee-input pr-14 !py-5 shadow-[4px_4px_0px_#d4a017] text-lg"
                                            value={majorQuery}
                                            onChange={(e) => {
                                                setMajorQuery(e.target.value);
                                                setShowMajorResults(true);
                                            }}
                                            onFocus={() => setShowMajorResults(true)}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-earth-mustard opacity-40">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2M6.5 2h13.5A2.5 2.5 0 0122.5 4.5v15a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                                        </div>
                                    </div>
                                    {formData.majorId && (
                                        <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-earth-mustard/10 border border-earth-mustard/30 rounded-full text-xs font-bold text-earth-mustard uppercase tracking-widest italic">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
                                            Pinned: {majorResults.find(m => m.cip4 === formData.majorId)?.title || 'The Discipline'}
                                        </div>
                                    )}
                                </label>

                                {showMajorResults && (majorResults.length > 0 || isSearchingMajor) && (
                                    <div className="absolute z-50 w-full mt-6 bg-[#fffefb] border-2 border-foreground rounded-[2rem] shadow-[12px_12px_0px_rgba(67,52,34,0.1)] overflow-hidden">
                                        {isSearchingMajor ? (
                                            <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-earth-mustard animate-pulse italic">Seeking Taxonomy...</div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {majorResults.map(m => (
                                                    <button
                                                        key={m.cip4}
                                                        type="button"
                                                        className="w-full text-left px-8 py-6 hover:bg-earth-parchment transition-colors border-b border-foreground/5 last:border-0 group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, majorId: m.cip4 });
                                                            setMajorQuery(m.title);
                                                            setShowMajorResults(false);
                                                        }}
                                                    >
                                                        <div className="font-funky text-2xl text-foreground group-hover:text-earth-terracotta transition-colors italic leading-none">{m.title}</div>
                                                        <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest mt-3 opacity-60">{m.category}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Wayfarer Status</span>
                                    <div className="relative">
                                        <select
                                            className="coffee-input !py-5 shadow-[4px_4px_0px_#433422] text-sm font-bold appearance-none cursor-pointer pr-12"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="graduated">STUDY COMPLETED / GRADUATED</option>
                                            <option value="current">CURRENTLY PRACTICING</option>
                                            <option value="switched">DIVERGED / SWITCHED OUT</option>
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground opacity-30">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Era of Study</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2020 — 2024"
                                        className="coffee-input !py-5 shadow-[4px_4px_0px_#433422] text-sm font-bold"
                                        value={formData.graduationYear}
                                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-10">
                            <h2 className="text-5xl font-funky text-foreground tracking-tight italic mb-4">2. The Experience</h2>
                            <p className="text-earth-sage text-xs font-bold uppercase tracking-[0.2em] italic">Rate the academic core, not the peripheral amenities.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                            {ratingCategories.map((cat) => (
                                <div key={cat.key} className="space-y-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-earth-sage uppercase tracking-widest italic">{cat.label}</span>
                                        <span className="text-2xl font-funky text-earth-terracotta italic leading-none">{formData.ratings[cat.key as keyof typeof formData.ratings]} / 5</span>
                                    </div>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, ratings: { ...formData.ratings, [cat.key]: val } })}
                                                className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-lg transition-all ${formData.ratings[cat.key as keyof typeof formData.ratings] === val
                                                    ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-lg scale-110 -translate-y-1'
                                                    : 'bg-white border-foreground/5 text-foreground/40 hover:bg-earth-parchment hover:border-foreground/10'
                                                    }`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-10">
                            <h2 className="text-5xl font-funky text-foreground tracking-tight italic mb-4">3. Wisdom Shared</h2>
                            <p className="text-earth-sage text-xs font-bold uppercase tracking-[0.2em] italic">Leave insights for those who follow.</p>
                        </div>

                        <div className="space-y-12">
                            <label className="block">
                                <span className="text-xs font-bold text-earth-sage uppercase tracking-widest block mb-6 italic">Who is this gathering for? (The "Ideal Seeker")</span>
                                <textarea
                                    rows={5}
                                    className="coffee-input shadow-[6px_6px_0px_#8b9467] text-lg font-medium italic resize-none min-h-[160px] bg-white/50"
                                    placeholder="Seekers who find solace in practical application over theoretical abstraction..."
                                    value={formData.fit}
                                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                                ></textarea>
                            </label>
                            <label className="block">
                                <span className="text-xs font-bold text-earth-sage uppercase tracking-widest block mb-6 italic">The Crucible (Most Significant Challenge)</span>
                                <textarea
                                    rows={5}
                                    className="coffee-input shadow-[6px_6px_0px_#c36b4e] text-lg font-medium italic resize-none min-h-[160px] bg-white/50"
                                    placeholder="Navigating the intense workload during the clinical rotation phase..."
                                    value={formData.challenge}
                                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                                ></textarea>
                            </label>

                            <div className="p-10 coffee-card border-dashed bg-earth-parchment/30 flex gap-8 items-start mt-20">
                                <div className="shrink-0 w-14 h-14 bg-earth-burgundy text-earth-parchment wavy-border flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                                </div>
                                <div>
                                    <p className="text-xl font-funky text-foreground italic mb-2 tracking-tight">The Community Scroll</p>
                                    <p className="text-sm font-medium leading-relaxed text-foreground opacity-60 italic">
                                        By publishing this experience, you contribute to the collective wisdom. Focus on the truth of the department. Comments on auxiliary services or campus politics are filtered to preserve academic clarity.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-24 flex justify-between items-center pt-16 border-t border-secondary-100">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className={`text-xs font-bold uppercase tracking-[0.2em] italic transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-earth-sage hover:text-earth-terracotta'
                            }`}
                    >
                        &larr; Previous Phase
                    </button>

                    <div className="flex gap-6">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="coffee-btn shadow-[6px_6px_0px_#433422] px-12"
                            >
                                NEXT PHASE &rarr;
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`coffee-btn bg-earth-burgundy text-white px-16 py-5 shadow-[8px_8px_0px_#433422] ${isSubmitting ? 'opacity-70 cursor-not-allowed scale-95 shadow-none' : ''}`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-4">
                                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ETCHING WISDOM...
                                    </div>
                                ) : 'PUBLISH EXPERIENCE'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
