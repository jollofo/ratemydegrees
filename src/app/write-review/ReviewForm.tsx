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
            <div className="mb-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900 leading-tight">Your Identity is Protected</p>
                    <p className="text-xs text-blue-700 mt-0.5">Reviews are published anonymously. We only use your account to prevent spam.</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-12 flex items-center justify-center gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= i ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {i}
                        </div>
                        {i < 3 && (
                            <div className={`w-12 h-1 ${step > i ? 'bg-primary-600' : 'bg-gray-100'} ml-4 transition-all`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-100/50">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b pb-4">
                            <h2 className="text-2xl font-black text-gray-900">1. Context</h2>
                            <p className="text-gray-500 text-sm">Tell us where and what you studied.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative" ref={instSearchRef}>
                                <label className="block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">College/University</span>
                                    <input
                                        type="text"
                                        placeholder="Search for your institution..."
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-gray-50 font-medium"
                                        value={instQuery}
                                        onChange={(e) => {
                                            setInstQuery(e.target.value);
                                            setShowInstResults(true);
                                        }}
                                        onFocus={() => setShowInstResults(true)}
                                    />
                                    {formData.institutionId && (
                                        <div className="mt-2 text-xs font-bold text-primary-600 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            Selected: {instResults.find(i => i.unitid === formData.institutionId)?.name || 'Custom Institution'}
                                        </div>
                                    )}
                                </label>

                                {showInstResults && (instResults.length > 0 || isSearchingInst) && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                        {isSearchingInst ? (
                                            <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
                                        ) : (
                                            instResults.map(inst => (
                                                <button
                                                    key={inst.unitid}
                                                    type="button"
                                                    className="w-full text-left px-5 py-3 hover:bg-primary-50 transition-colors text-sm font-medium border-b border-gray-50 last:border-0"
                                                    onClick={() => {
                                                        setFormData({ ...formData, institutionId: inst.unitid });
                                                        setInstQuery(inst.name);
                                                        setShowInstResults(false);
                                                    }}
                                                >
                                                    <div className="font-bold text-gray-900">{inst.name}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase">{inst.state}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={majorSearchRef}>
                                <label className="block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Program / Major</span>
                                    <input
                                        type="text"
                                        placeholder="Search for your major..."
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-gray-50 font-medium"
                                        value={majorQuery}
                                        onChange={(e) => {
                                            setMajorQuery(e.target.value);
                                            setShowMajorResults(true);
                                        }}
                                        onFocus={() => setShowMajorResults(true)}
                                    />
                                    {formData.majorId && (
                                        <div className="mt-2 text-xs font-bold text-primary-600 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            Selected: {majorResults.find(m => m.cip4 === formData.majorId)?.title || 'Custom Major'}
                                        </div>
                                    )}
                                </label>

                                {showMajorResults && (majorResults.length > 0 || isSearchingMajor) && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                        {isSearchingMajor ? (
                                            <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
                                        ) : (
                                            majorResults.map(m => (
                                                <button
                                                    key={m.cip4}
                                                    type="button"
                                                    className="w-full text-left px-5 py-3 hover:bg-primary-50 transition-colors text-sm font-medium border-b border-gray-50 last:border-0"
                                                    onClick={() => {
                                                        setFormData({ ...formData, majorId: m.cip4 });
                                                        setMajorQuery(m.title);
                                                        setShowMajorResults(false);
                                                    }}
                                                >
                                                    <div className="font-bold text-gray-900">{m.title}</div>
                                                    <div className="text-[10px] text-gray-400 uppercase">{m.category}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label className="block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</span>
                                    <select
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all appearance-none bg-gray-50 font-medium"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="graduated">Graduated</option>
                                        <option value="current">Current Student</option>
                                        <option value="switched">Switched Out</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Years</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2018-2022"
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all bg-gray-50 font-medium"
                                        value={formData.graduationYear}
                                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b pb-4">
                            <h2 className="text-2xl font-black text-gray-900">2. Academic Experience</h2>
                            <p className="text-gray-500 text-sm italic font-medium">Rate the academic quality, not the campus amenities.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {ratingCategories.map((cat) => (
                                <div key={cat.key} className="space-y-3">
                                    <span className="text-sm font-bold text-gray-700">{cat.label}</span>
                                    <div className="flex justify-between bg-gray-50 p-1.5 rounded-2xl">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, ratings: { ...formData.ratings, [cat.key]: val } })}
                                                className={`flex-1 h-11 rounded-xl flex items-center justify-center font-black transition-all ${formData.ratings[cat.key as keyof typeof formData.ratings] === val
                                                    ? 'bg-white text-primary-600 shadow-sm'
                                                    : 'text-gray-400 hover:text-gray-600'
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b pb-4">
                            <h2 className="text-2xl font-black text-gray-900">3. Outcomes & Insights</h2>
                            <p className="text-gray-500 text-sm">Help others understand the real-world value.</p>
                        </div>

                        <div className="space-y-6">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 mb-2 block">Who is this program a good fit for?</span>
                                <textarea
                                    rows={3}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none bg-gray-50 font-medium"
                                    placeholder="e.g. Students who prefer heavy math over theory..."
                                    value={formData.fit}
                                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                                ></textarea>
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 mb-2 block">Biggest Challenge in this Program?</span>
                                <textarea
                                    rows={3}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none bg-gray-50 font-medium"
                                    placeholder="e.g. The lack of internship support, or the 3rd year capstone..."
                                    value={formData.challenge}
                                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                                ></textarea>
                            </label>
                            <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 text-sm text-gray-600 font-medium flex gap-4">
                                <div className="shrink-0 p-2 bg-white rounded-xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <p className="leading-relaxed">
                                    <strong className="text-gray-900 block mb-0.5">Community Guidelines:</strong>
                                    Keep your feedback focused on the academic curriculum, faculty quality, and department resources.
                                    Institutional topics (like dining or housing) are best shared on other platforms.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        Previous Step
                    </button>

                    <div className="flex gap-4">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-200"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-3 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Verifying...
                                    </>
                                ) : 'Publish Experience'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
