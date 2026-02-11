'use client';

import { useState, useEffect, useRef } from 'react';
import { submitReview, searchInstitutions, searchMajors } from './actions';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';
import MajorResolverModal from '@/components/MajorResolverModal';

export default function WriteReviewForm({ majors: initialMajors, institutions: initialInstitutions }: { majors: MajorSearchResult[], institutions: InstitutionSearchResult[] }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search states
    const [instQuery, setInstQuery] = useState('');
    const [instResults, setInstResults] = useState<InstitutionSearchResult[]>(initialInstitutions);
    const [isSearchingInst, setIsSearchingInst] = useState(false);
    const [showInstResults, setShowInstResults] = useState(false);

    const [majorQuery, setMajorQuery] = useState('');
    const [majorResults, setMajorResults] = useState<MajorSearchResult[]>(initialMajors);
    const [isSearchingMajor, setIsSearchingMajor] = useState(false);
    const [showMajorResults, setShowMajorResults] = useState(false);
    const [isResolverOpen, setIsResolverOpen] = useState(false);

    const instSearchRef = useRef<HTMLDivElement>(null);
    const majorSearchRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<ReviewFormData>({
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
        differently: '',
        // Outcome fields
        outcomeStatus: '',
        jobTitle: '',
        industry: '',
        gradSchool: '',
        timeToOutcome: ''
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
                const results = await searchMajors(majorQuery, formData.institutionId);
                setMajorResults(results);
            } finally {
                setIsSearchingMajor(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [majorQuery, formData.institutionId, initialMajors]);

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const ratingCategories = [
        { key: 'rigor', label: 'Academic Rigor' },
        { key: 'flexibility', label: 'Curriculum Relevance' },
        { key: 'value', label: 'Faculty Accessibility' },
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
            <div className="mb-8 coffee-card bg-earth-sage/10 border-earth-sage/30 p-6 flex items-center gap-6">
                <div className="w-12 h-12 bg-white wavy-border flex items-center justify-center text-earth-sage shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-10 flex items-center justify-center gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base transition-all ${step >= i
                            ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-md scale-105'
                            : 'bg-white border-foreground/10 text-foreground/20'
                            }`}>
                            {i}
                        </div>
                        {i < 3 && (
                            <div className={`w-12 h-0.5 border-t-2 border-foreground/10 border-dashed mx-3 ${step > i ? 'border-earth-terracotta opacity-100' : 'opacity-20'}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="coffee-card !p-8 bg-[#fffefb]/80 backdrop-blur-sm">
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-6">
                            <h2 className="text-3xl font-funky text-foreground tracking-tight italic mb-2">1. Basic Information</h2>
                            <p className="text-earth-sage text-[10px] font-bold uppercase tracking-[0.2em] italic">Where did you study?</p>
                        </div>

                        <div className="space-y-10">
                            <div className="relative" ref={instSearchRef}>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Institution / University</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search university..."
                                            className="coffee-input pr-12 !py-4 shadow-[3px_3px_0px_#8b9467] text-base"
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
                                            Selected: {instResults.find(i => i.unitid === formData.institutionId)?.name || 'The Academy'}
                                        </div>
                                    )}
                                </label>

                                {showInstResults && (instResults.length > 0 || isSearchingInst) && (
                                    <div className="absolute z-50 w-full mt-6 bg-[#fffefb] border-2 border-foreground rounded-[2rem] shadow-[12px_12px_0px_rgba(67,52,34,0.1)] overflow-hidden">
                                        {isSearchingInst ? (
                                            <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-earth-sage animate-pulse italic">Searching...</div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {instResults.map(inst => (
                                                    <button
                                                        key={inst.unitid}
                                                        type="button"
                                                        className="w-full text-left px-8 py-6 hover:bg-earth-parchment transition-colors border-b border-foreground/5 last:border-0 group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, institutionId: inst.unitid, majorId: '' }); // Clear major on institution change
                                                            setMajorQuery(''); // Clear major query visual
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
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Degree / Major</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search program..."
                                            className="coffee-input pr-12 !py-4 shadow-[3px_3px_0px_#d4a017] text-base"
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
                                            Selected: {majorResults.find(m => m.cip4 === formData.majorId)?.title || 'The Discipline'}
                                        </div>
                                    )}
                                </label>

                                {showMajorResults && (
                                    <div className="absolute z-50 w-full mt-6 bg-[#fffefb] border-2 border-foreground rounded-[2rem] shadow-[12px_12px_0px_rgba(67,52,34,0.1)] overflow-hidden">
                                        {isSearchingMajor ? (
                                            <div className="p-10 text-center text-xs font-bold uppercase tracking-widest text-earth-mustard animate-pulse italic">Searching...</div>
                                        ) : majorResults.length > 0 ? (
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
                                                        <div className="flex items-center gap-2 mt-3">
                                                            {m.matchType && m.matchType !== 'DIRECT' && (
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${m.matchType === 'ALIAS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                                    }`}>
                                                                    {m.matchType === 'ALIAS' ? 'Alias' : 'Related'}
                                                                </span>
                                                            )}
                                                            <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest opacity-60">{m.category}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-earth-parchment/10">
                                                <p className="text-sm text-foreground/60 mb-4 italic">No majors found matching that name.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowMajorResults(false);
                                                        setIsResolverOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-earth-terracotta text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-earth-terracotta/90 transition-all shadow-sm hover:translate-y-[-1px]"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
                                                    Try Advanced Resolver
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Education Status</span>
                                    <div className="relative">
                                        <select
                                            className="coffee-input !py-4 shadow-[3px_3px_0px_#433422] text-sm font-bold appearance-none cursor-pointer pr-10"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="graduated">GRADUATED</option>
                                            <option value="current">CURRENT STUDENT</option>
                                            <option value="switched">SWITCHED MAJOR / DROPPED OUT</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground opacity-30">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Graduation Year / Range</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2020 — 2024"
                                        className="coffee-input !py-4 shadow-[3px_3px_0px_#433422] text-sm font-bold"
                                        value={formData.graduationYear}
                                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                    />
                                </label>
                            </div>

                            {formData.status === 'graduated' && (
                                <div className="space-y-6 pt-6 border-t border-foreground/5 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="text-xl font-funky text-foreground italic leading-none">Post-Graduation Journey</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Current Status</span>
                                            <select
                                                className="coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer"
                                                value={formData.outcomeStatus || ''}
                                                onChange={(e) => setFormData({ ...formData, outcomeStatus: e.target.value })}
                                            >
                                                <option value="">Select Status...</option>
                                                <option value="employed_full">Employed Full-Time</option>
                                                <option value="employed_part">Employed Part-Time</option>
                                                <option value="grad_school">Graduate School</option>
                                                <option value="professional_school">Professional School (Med/Law/etc)</option>
                                                <option value="founder">Self-Employed / Founder</option>
                                                <option value="seeking">Still Seeking</option>
                                            </select>
                                        </label>

                                        {['employed_full', 'employed_part', 'founder'].includes(formData.outcomeStatus) && (
                                            <>
                                                <label className="block">
                                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">First Role Title</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Junior Analyst"
                                                        className="coffee-input !py-4 text-sm font-bold"
                                                        value={formData.jobTitle || ''}
                                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                                    />
                                                </label>
                                                <label className="block">
                                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Industry</span>
                                                    <select
                                                        className="coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer"
                                                        value={formData.industry || ''}
                                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                    >
                                                        <option value="">Select Industry...</option>
                                                        <option value="tech">Technology</option>
                                                        <option value="finance">Finance</option>
                                                        <option value="health">Healthcare</option>
                                                        <option value="education">Education</option>
                                                        <option value="manufacturing">Manufacturing</option>
                                                        <option value="arts">Arts & Design</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}

                                        {['grad_school', 'professional_school'].includes(formData.outcomeStatus) && (
                                            <label className="block">
                                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Program / Degree</span>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. MBA, PhD in Physics"
                                                    className="coffee-input !py-4 text-sm font-bold"
                                                    value={formData.gradSchool || ''}
                                                    onChange={(e) => setFormData({ ...formData, gradSchool: e.target.value })}
                                                />
                                            </label>
                                        )}

                                        <label className="block">
                                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Time to First Outcome</span>
                                            <select
                                                className="coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer"
                                                value={formData.timeToOutcome || ''}
                                                onChange={(e) => setFormData({ ...formData, timeToOutcome: e.target.value })}
                                            >
                                                <option value="">Select Duration...</option>
                                                <option value="0-3_mo">Less than 3 months</option>
                                                <option value="3-6_mo">3 - 6 months</option>
                                                <option value="6-12_mo">6 - 12 months</option>
                                                <option value="12_mo_plus">Over a year</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-6">
                            <h2 className="text-3xl font-funky text-foreground tracking-tight italic mb-2">2. Academic Ratings</h2>
                            <p className="text-earth-sage text-[10px] font-bold uppercase tracking-[0.2em] italic">Rate the academic program based on your experience.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
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
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-6">
                            <h2 className="text-3xl font-funky text-foreground tracking-tight italic mb-2">3. Detailed Feedback</h2>
                            <p className="text-earth-sage text-[10px] font-bold uppercase tracking-[0.2em] italic">Help other students by providing more context.</p>
                        </div>

                        {/* Review Template & Sample Sidecar */}
                        <div className="bg-earth-parchment/40 rounded-3xl p-6 border border-earth-sage/20 mb-8">
                            <h3 className="text-lg font-funky text-foreground italic mb-4">Pro Tips for a Great Review</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-earth-sage uppercase tracking-widest italic">What to include:</p>
                                    <ul className="text-sm text-foreground/70 space-y-2 italic list-disc pl-4">
                                        <li><span className="font-bold text-earth-terracotta">Workload:</span> How many hours/week?</li>
                                        <li><span className="font-bold text-earth-terracotta">Cost:</span> Was it worth the tuition?</li>
                                        <li><span className="font-bold text-earth-terracotta">Career:</span> Real-world impact & prep?</li>
                                        <li><span className="font-bold text-earth-terracotta">Tips:</span> What should new students know?</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-earth-sage uppercase tracking-widest italic">Sample Review:</p>
                                    <div className="bg-white/60 p-4 rounded-xl text-xs text-foreground/60 italic leading-relaxed border border-earth-sage/10">
                                        "The CS program was rigorous but rewarding. Workload was high (20+ hrs/week), but faculty were accessible. Career prep was excellent; I had a full-time offer before graduating. Tip: Start projects early!"
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <label className="block">
                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Who is this program for?</span>
                                <textarea
                                    rows={4}
                                    className="coffee-input shadow-[4px_4px_0px_#8b9467] text-base font-medium italic resize-none min-h-[120px] bg-white/50"
                                    placeholder="Students who prefer hands-on learning over theory..."
                                    value={formData.fit}
                                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                                ></textarea>
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Most Significant Challenge</span>
                                <textarea
                                    rows={4}
                                    className="coffee-input shadow-[4px_4px_0px_#c36b4e] text-base font-medium italic resize-none min-h-[120px] bg-white/50"
                                    placeholder="e.g. Navigating workload during clinicals..."
                                    value={formData.challenge}
                                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                                ></textarea>
                            </label>

                            <div className="p-6 coffee-card border-dashed bg-earth-parchment/30 flex gap-6 items-start mt-10">
                                <div className="shrink-0 w-12 h-12 bg-earth-burgundy text-earth-parchment wavy-border flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                                </div>
                                <div>
                                    <p className="text-lg font-funky text-foreground italic mb-1 tracking-tight">Review Guidelines</p>
                                    <p className="text-xs font-medium leading-relaxed text-foreground opacity-60 italic">
                                        Focus on the academic experience. Unrelated reviews may be removed. Identity protected.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-between items-center pt-8 border-t border-secondary-100">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className={`text-xs font-bold uppercase tracking-[0.2em] italic transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-earth-sage hover:text-earth-terracotta'
                            }`}
                    >
                        &larr; Previous Step
                    </button>

                    <div className="flex gap-6">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="coffee-btn shadow-[6px_6px_0px_#433422] px-12"
                            >
                                NEXT STEP &rarr;
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
                                        SUBMITTING...
                                    </div>
                                ) : 'SUBMIT REVIEW'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <MajorResolverModal
                isOpen={isResolverOpen}
                onClose={() => setIsResolverOpen(false)}
                onSelectMajor={(cip4, title) => {
                    setFormData({ ...formData, majorId: cip4 });
                    setMajorQuery(title);
                }}
            />
        </div>
    );
}
