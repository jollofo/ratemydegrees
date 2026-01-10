'use client';

import { useState } from 'react';
import { submitReview } from './actions';

export default function WriteReviewForm({ majors }: { majors: any[] }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        majorId: '',
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

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const ratingCategories = [
        { key: 'rigor', label: 'Academic Rigor' },
        { key: 'career', label: 'Career Preparedness' },
        { key: 'difficulty', label: 'Difficulty vs Payoff' },
        { key: 'flexibility', label: 'Flexibility of coursework' },
        { key: 'satisfaction', label: 'Overall satisfaction' },
        { key: 'value', label: 'Value for time invested' },
    ];

    const handleSubmit = async () => {
        if (!formData.majorId) {
            alert('Please select a major');
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

            <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-100/50">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-gray-900">Step 1: The Basics</h2>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Your Major</span>
                                <select
                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none bg-white"
                                    value={formData.majorId}
                                    onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                                >
                                    <option value="">Select a major...</option>
                                    {majors.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Status</span>
                                    <select
                                        className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none bg-white"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="graduated">Graduated</option>
                                        <option value="current">Current Student</option>
                                        <option value="switched">Switched Out</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Graduation Year Range</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2018-2022"
                                        className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
                        <h2 className="text-xl font-bold text-gray-900">Step 2: Ratings</h2>
                        <div className="space-y-6">
                            {ratingCategories.map((cat) => (
                                <div key={cat.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <span className="font-medium text-gray-700">{cat.label}</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, ratings: { ...formData.ratings, [cat.key]: val } })}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${formData.ratings[cat.key as keyof typeof formData.ratings] === val
                                                        ? 'bg-primary-600 text-white scale-110 shadow-lg shadow-primary-200'
                                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
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
                        <h2 className="text-xl font-bold text-gray-900">Step 3: Lived Experience</h2>
                        <div className="space-y-6">
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 mb-2 block">Who is this major a good fit for?</span>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    placeholder="Describe the type of person who would succeed here..."
                                    value={formData.fit}
                                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                                ></textarea>
                            </label>
                            <label className="block">
                                <span className="text-sm font-bold text-gray-700 mb-2 block">What is the biggest challenge?</span>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                    placeholder="Coursework, job search, etc..."
                                    value={formData.challenge}
                                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                                ></textarea>
                            </label>
                            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800 flex gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                <p>Remember: Do not name specific professors or institutions. Focus on the major itself.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Previous
                    </button>

                    <div className="flex gap-4">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200 flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Submitting...
                                    </>
                                ) : 'Submit Review'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
