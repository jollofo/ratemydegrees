'use client';

import { useState, useEffect, useRef } from 'react';
import { submitReview, searchMajors } from './actions';
import { searchMajors as searchMajorsTypesense, searchInstitutions as searchInstitutionsTypesense } from '@/app/actions/search';
import { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';
import MajorResolverModal from '@/components/MajorResolverModal';

// ─── Validation Types ───────────────────────────────────────────────────────

interface ValidationErrors {
    majorId?: string;
    institutionId?: string;
    status?: string;
    graduationYear?: string;
    ratings?: Record<string, string>;
    fit?: string;
    challenge?: string;
    outcomeStatus?: string;
    jobTitle?: string;
    industry?: string;
    gradSchool?: string;
    timeToOutcome?: string;
}

interface FormSubmitError {
    message: string;
    field?: string;
}

interface RatingCategory {
    key: string;
    label: string;
    subtitle: string;
    icon: string;
    scoreDescriptions: Record<number, string>;
}

// ─── Validation Utilities ───────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 50;
const MAX_END_YEAR = CURRENT_YEAR + 6;

/** Sanitize text input by stripping HTML/script tags */
function sanitizeText(input: string): string {
    if (!input) return '';
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}

/** Parse graduation year string like "2020" or "2018—2022" or "2018-2022" */
function parseGraduationYear(yearStr: string): { startYear: number | null; endYear: number | null; duration: number | null } {
    if (!yearStr || !yearStr.trim()) {
        return { startYear: null, endYear: null, duration: null };
    }

    const cleaned = yearStr.trim();
    const dashMatch = cleaned.match(/^(\d{4})\s*[-–—]\s*(\d{4})$/);

    if (dashMatch) {
        const startYear = parseInt(dashMatch[1], 10);
        const endYear = parseInt(dashMatch[2], 10);
        return { startYear, endYear, duration: endYear - startYear };
    }

    const singleMatch = cleaned.match(/^(\d{4})$/);
    if (singleMatch) {
        const year = parseInt(singleMatch[1], 10);
        return { startYear: year, endYear: year, duration: 0 };
    }

    return { startYear: null, endYear: null, duration: null };
}

/** Validate graduation year based on user status */
function validateGraduationYear(yearStr: string, status: string): string | undefined {
    // Not required for current students
    if (status === 'current') {
        return undefined;
    }

    if (!yearStr || !yearStr.trim()) {
        return 'Please enter a graduation year or range (e.g., 2020 or 2018—2022)';
    }

    const { startYear, endYear, duration } = parseGraduationYear(yearStr);

    if (startYear === null || endYear === null) {
        return 'Invalid format. Use YYYY or YYYY—YYYY (e.g., 2020 or 2018—2022)';
    }

    // Start year must be within valid range
    if (startYear < MIN_YEAR || startYear > CURRENT_YEAR) {
        return `Start year must be between ${MIN_YEAR} and ${CURRENT_YEAR}`;
    }

    // End year must be >= start year
    if (endYear < startYear) {
        return 'End year must be equal to or after start year';
    }

    // End year must not exceed max future year
    if (endYear > MAX_END_YEAR) {
        return `End year cannot exceed ${MAX_END_YEAR}`;
    }

    // Duration must be 1-6 years (for ranges)
    if (duration !== null && duration > 0) {
        if (duration < 1) {
            return 'Study duration must be at least 1 year';
        }
        if (duration > 6) {
            return 'Study duration cannot exceed 6 years';
        }
    }

    return undefined;
}

/** Validate form data and return errors object */
function validateForm(data: ReviewFormData, step: number): { errors: ValidationErrors; isValid: boolean } {
    const errors: ValidationErrors = {};

    // Step 1 validations
    if (step >= 1) {
        if (!data.institutionId) {
            errors.institutionId = 'Please select an institution';
        }

        if (!data.majorId) {
            errors.majorId = 'Please select a major/degree program';
        }

        if (!data.status) {
            errors.status = 'Please select your education status';
        }

        const yearError = validateGraduationYear(data.graduationYear, data.status);
        if (yearError) {
            errors.graduationYear = yearError;
        }

        // Validate outcome fields if graduated
        if (data.status === 'graduated') {
            if (!data.outcomeStatus) {
                errors.outcomeStatus = 'Please select your current status';
            }

            // Job title required for employed/founder
            if (['employed_full', 'employed_part', 'founder'].includes(data.outcomeStatus) && !data.jobTitle?.trim()) {
                errors.jobTitle = 'Please enter your job title';
            }

            // Industry required for employed/founder
            if (['employed_full', 'employed_part', 'founder'].includes(data.outcomeStatus) && !data.industry) {
                errors.industry = 'Please select your industry';
            }

            // Grad school required for grad school options
            if (['grad_school', 'professional_school'].includes(data.outcomeStatus) && !data.gradSchool?.trim()) {
                errors.gradSchool = 'Please enter your program/degree';
            }

            // Time to outcome required
            if (!data.timeToOutcome) {
                errors.timeToOutcome = 'Please select time to first outcome';
            }
        }
    }

    // Step 2 validations (ratings)
    if (step >= 2) {
        const ratingErrors: Record<string, string> = {};
        const requiredRatings = ['rigor', 'flexibility', 'value', 'difficulty', 'career', 'satisfaction', 'networking', 'research', 'internships'];

        for (const key of requiredRatings) {
            const value = data.ratings[key as keyof typeof data.ratings];
            if (value === undefined || value === null || value < 1 || value > 5) {
                ratingErrors[key] = 'Please rate this category';
            }
        }

        if (Object.keys(ratingErrors).length > 0) {
            errors.ratings = ratingErrors;
        }
    }

    // Step 3 validations (written responses)
    if (step >= 3) {
        if (!data.fit || data.fit.trim().length < 10) {
            errors.fit = 'Please provide at least 10 characters describing who this program is for';
        }

        if (!data.challenge || data.challenge.trim().length < 10) {
            errors.challenge = 'Please provide at least 10 characters describing the most significant challenge';
        }
    }

    const isValid = Object.keys(errors).length === 0;
    return { errors, isValid };
}



export default function WriteReviewForm({
    majors: initialMajors,
    institutions: initialInstitutions,
    preSelectedMajor,
    preSelectedInstitution
}: {
    majors: MajorSearchResult[];
    institutions: InstitutionSearchResult[];
    preSelectedMajor?: MajorSearchResult;
    preSelectedInstitution?: InstitutionSearchResult;
}) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Institution search state
    const [instQuery, setInstQuery] = useState(preSelectedInstitution?.name ?? '');
    const [instResults, setInstResults] = useState<InstitutionSearchResult[]>(initialInstitutions);
    const [isSearchingInst, setIsSearchingInst] = useState(false);
    const [showInstResults, setShowInstResults] = useState(false);

    // Major search state
    const [majorQuery, setMajorQuery] = useState(preSelectedMajor?.title ?? '');
    const [majorResults, setMajorResults] = useState<MajorSearchResult[]>(initialMajors);
    const [isSearchingMajor, setIsSearchingMajor] = useState(false);
    const [showMajorResults, setShowMajorResults] = useState(false);
    const [isResolverOpen, setIsResolverOpen] = useState(false);

    const instSearchRef = useRef<HTMLDivElement>(null);
    const majorSearchRef = useRef<HTMLDivElement>(null);
    const instDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const majorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [formData, setFormData] = useState<ReviewFormData>({
        majorId: preSelectedMajor?.cip4 ?? '',
        institutionId: preSelectedInstitution?.unitid ?? '',
        status: 'graduated',
        graduationYear: '',
        ratings: { rigor: 3, career: 3, difficulty: 3, flexibility: 3, satisfaction: 3, value: 3, networking: 3, research: 3, internships: 3 },
        fit: '',
        challenge: '',
        misconception: '',
        differently: '',
        outcomeStatus: '',
        jobTitle: '',
        industry: '',
        gradSchool: '',
        timeToOutcome: ''
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitError, setSubmitError] = useState<FormSubmitError | null>(null);

    // Determine if fields should be read-only
    const isInstitutionReadOnly = !!preSelectedInstitution;
    const isMajorReadOnly = !!preSelectedMajor;

    // ─── Validation Handlers ────────────────────────────────────────────────────

    const validateField = (fieldName: string, value: unknown) => {
        const newFormData = { ...formData, [fieldName]: value };
        const { errors: newErrors } = validateForm(newFormData, step);
        setErrors(prev => ({ ...prev, [fieldName]: newErrors[fieldName as keyof ValidationErrors] }));
    };

    const validateStep = (stepNumber: number): boolean => {
        const { errors: stepErrors, isValid } = validateForm(formData, stepNumber);
        setErrors(stepErrors);

        // Mark all fields in current step as touched
        const stepFields = getStepFields(stepNumber);
        const newTouched: Record<string, boolean> = {};
        stepFields.forEach(field => {
            newTouched[field] = true;
        });
        setTouched(prev => ({ ...prev, ...newTouched }));

        return isValid;
    };

    const getStepFields = (stepNumber: number): string[] => {
        switch (stepNumber) {
            case 1:
                return ['institutionId', 'majorId', 'status', 'graduationYear', 'outcomeStatus', 'jobTitle', 'industry', 'gradSchool', 'timeToOutcome'];
            case 2:
                return ['rigor', 'flexibility', 'value', 'difficulty', 'career', 'satisfaction'];
            case 3:
                return ['fit', 'challenge'];
            default:
                return [];
        }
    };

    const shouldShowError = (fieldName: string): boolean => {
        return touched[fieldName] === true && !!errors[fieldName as keyof ValidationErrors];
    };

    const shouldShowRatingError = (ratingKey: string): boolean => {
        return touched[ratingKey] === true && !!(errors.ratings?.[ratingKey]);
    };

    const nextStep = () => {
        setSubmitError(null);
        if (validateStep(step)) {
            setStep(s => Math.min(s + 1, 3));
        }
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (instSearchRef.current && !instSearchRef.current.contains(e.target as Node)) {
                setShowInstResults(false);
            }
            if (majorSearchRef.current && !majorSearchRef.current.contains(e.target as Node)) {
                setShowMajorResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Institution search — Typesense client-side
    useEffect(() => {
        if (instDebounce.current) clearTimeout(instDebounce.current);

        if (!instQuery || instQuery.length < 2) {
            setInstResults(initialInstitutions);
            return;
        }

        instDebounce.current = setTimeout(async () => {
            setIsSearchingInst(true);
            try {
                const result = await searchInstitutionsTypesense(instQuery, { hitsPerPage: 10 });
                setInstResults((result.hits ?? []).map((h: any) => ({
                    unitid: h.unitid,
                    name: h.name,
                    city: h.city ?? null,
                    state: h.state ?? null,
                })));
            } catch (err) {
                console.error('Institution search error:', err);
            } finally {
                setIsSearchingInst(false);
            }
        }, 250);

        return () => { if (instDebounce.current) clearTimeout(instDebounce.current); };
    }, [instQuery, initialInstitutions]);

    // Major search — Typesense client-side, with resolver fallback
    useEffect(() => {
        if (majorDebounce.current) clearTimeout(majorDebounce.current);

        if (!majorQuery || majorQuery.length < 2) {
            setMajorResults(initialMajors);
            return;
        }

        majorDebounce.current = setTimeout(async () => {
            setIsSearchingMajor(true);
            try {
                const result = await searchMajorsTypesense(majorQuery, { hitsPerPage: 10 });

                if (result.hits && result.hits.length > 0) {
                    setMajorResults(result.hits.map((h: any) => ({
                        cip4: h.cip4,
                        title: h.title,
                        category: h.category ?? null,
                        matchType: 'DIRECT' as const,
                    })));
                } else {
                    // Typesense found nothing — fall back to the resolver (alias/pathway matching)
                    const resolved = await searchMajors(majorQuery, formData.institutionId || undefined);
                    setMajorResults(resolved);
                }
            } catch (err) {
                console.error('Major search error:', err);
            } finally {
                setIsSearchingMajor(false);
            }
        }, 250);

        return () => { if (majorDebounce.current) clearTimeout(majorDebounce.current); };
    }, [majorQuery, formData.institutionId, initialMajors]);

    // ─── Error Display Component ───────────────────────────────────────────────

    const ErrorMessage = ({ message }: { message?: string }) => {
        if (!message) return null;
        return (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 animate-in fade-in duration-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-medium">{message}</span>
            </div>
        );
    };

    // ─── Rating Category Definitions ─────────────────────────────────────────

    const SCORE_LABELS: Record<number, string> = {
        1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent'
    };

    const ratingCategories: RatingCategory[] = [
        {
            key: 'rigor',
            label: 'Academic Rigor',
            subtitle: 'Depth and intellectual challenge of coursework',
            icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            scoreDescriptions: {
                1: 'Superficial content with little intellectual challenge',
                2: 'Below average depth; mostly surface-level material',
                3: 'Moderate rigor with some challenging courses',
                4: 'Strong depth; demanding coursework and rigorous grading',
                5: 'Exceptional — graduate-level thinking expected throughout',
            },
        },
        {
            key: 'flexibility',
            label: 'Curriculum Relevance',
            subtitle: 'How well courses reflect current real-world needs',
            icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
            scoreDescriptions: {
                1: 'Outdated — content feels disconnected from the industry',
                2: 'Mostly outdated material with a few relevant topics',
                3: 'A mix of current and legacy content',
                4: 'Largely current; regularly updated to match industry trends',
                5: 'Cutting-edge — curriculum mirrors what employers want today',
            },
        },
        {
            key: 'value',
            label: 'Faculty Accessibility',
            subtitle: 'How approachable and supportive professors are',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            scoreDescriptions: {
                1: 'Professors rarely available; little to no student support',
                2: 'Hard to reach; office hours often cancelled',
                3: 'Reasonably accessible during scheduled times',
                4: 'Responsive and supportive; mentoring relationships common',
                5: 'Exceptional access — professors invest deeply in students',
            },
        },
        {
            key: 'difficulty',
            label: 'Workload vs. Payoff',
            subtitle: 'Whether the effort required was worth the reward',
            icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
            scoreDescriptions: {
                1: 'Heavy workload with little practical or career return',
                2: "Effort often felt wasted; outcomes didn’t justify the grind",
                3: 'Balanced overall; some courses felt worth it',
                4: 'Challenging but clearly valuable for career and skills',
                5: 'Every demanding moment paid off — well worth the effort',
            },
        },
        {
            key: 'career',
            label: 'Career Preparedness',
            subtitle: 'How ready the program leaves you for the job market',
            icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            scoreDescriptions: {
                1: 'No career resources; program ignores professional development',
                2: 'Minimal support; students largely on their own',
                3: 'Some career services and industry exposure',
                4: 'Strong career pipeline; recruiters actively recruit here',
                5: 'Graduates are highly sought-after; job offers before graduation common',
            },
        },
        {
            key: 'networking',
            label: 'Networking Opportunities',
            subtitle: 'Quality of alumni network, events, and peer connections',
            icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
            scoreDescriptions: {
                1: 'No networking culture; alumni are disconnected',
                2: 'Occasional events but little lasting connection',
                3: 'Decent alumni network; some useful industry contacts',
                4: 'Active community with frequent industry events and alumni engagement',
                5: 'Outstanding network — alumni are well-connected and actively helpful',
            },
        },
        {
            key: 'research',
            label: 'Research Access',
            subtitle: 'Opportunities to engage in research or independent study',
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
            scoreDescriptions: {
                1: 'Research not accessible to undergrads; zero lab or project opportunities',
                2: 'Very limited — research reserved for top students only',
                3: 'Some research options exist but require effort to find',
                4: 'Good access to labs, faculty projects, and independent study',
                5: 'Abundant — undergrads routinely co-author papers and lead projects',
            },
        },
        {
            key: 'internships',
            label: 'Internship Support',
            subtitle: "Program’s help securing internships and co-ops",
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            scoreDescriptions: {
                1: 'No institutional support; students find internships entirely alone',
                2: 'Token career fairs with little real employer interest',
                3: 'Moderate support — career office helps but selectivity varies',
                4: 'Strong partnerships with employers; many students land competitive internships',
                5: 'Excellent pipelines — top companies actively recruit and hire here',
            },
        },
        {
            key: 'satisfaction',
            label: 'Overall Satisfaction',
            subtitle: 'Would you choose this program again?',
            icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            scoreDescriptions: {
                1: 'Deeply regret the choice — would not recommend to anyone',
                2: 'More disappointments than highlights',
                3: 'Mixed feelings — had some good moments but many frustrations',
                4: 'Glad I chose it; would likely choose it again',
                5: "Couldn’t have made a better choice — would repeat in a heartbeat",
            },
        },
    ];

    const handleSubmit = async () => {
        setSubmitError(null);

        // Validate all steps before submission
        // Mark every field as touched so all errors become visible
        const allFields = ['institutionId', 'majorId', 'status', 'graduationYear', 'outcomeStatus', 'jobTitle', 'industry', 'gradSchool', 'timeToOutcome', 'fit', 'challenge', 'rigor', 'flexibility', 'value', 'difficulty', 'career', 'satisfaction', 'networking', 'research', 'internships'];
        const allTouched: Record<string, boolean> = {};
        allFields.forEach(field => { allTouched[field] = true; });
        setTouched(prev => ({ ...prev, ...allTouched }));

        for (let i = 1; i <= 3; i++) {
            const { isValid, errors: stepErrors } = validateForm(formData, i);
            if (!isValid) {
                setErrors(prev => ({ ...prev, ...stepErrors }));
                setStep(i);

                // Build a human-readable error message for the banner
                let firstErrorMsg = 'Please fix the highlighted fields before submitting.';
                const firstError = Object.values(stepErrors).find(e => e) as string | Record<string, string> | undefined;
                if (typeof firstError === 'string') {
                    firstErrorMsg = firstError;
                } else if (firstError && typeof firstError === 'object') {
                    const ratingError = Object.values(firstError).find(e => e) as string | undefined;
                    if (ratingError) firstErrorMsg = ratingError;
                }
                setSubmitError({ message: firstErrorMsg });
                return;
            }
        }

        // Sanitize text inputs before submission
        const sanitizedFormData: ReviewFormData = {
            ...formData,
            graduationYear: sanitizeText(formData.graduationYear),
            fit: sanitizeText(formData.fit),
            challenge: sanitizeText(formData.challenge),
            misconception: sanitizeText(formData.misconception),
            differently: sanitizeText(formData.differently),
            jobTitle: sanitizeText(formData.jobTitle),
            gradSchool: sanitizeText(formData.gradSchool),
        };

        setIsSubmitting(true);
        try {
            await submitReview(sanitizedFormData);
        } catch (error) {
            console.error(error);
            setSubmitError({ message: 'Something went wrong. Please try again.' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
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
                            {/* Institution Search - Read-only if pre-selected */}
                            {isInstitutionReadOnly ? (
                                <div>
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Institution / University</span>
                                    <div className="coffee-input !py-4 bg-earth-sage/5 border-earth-sage/30 text-foreground/80 cursor-default flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-earth-sage"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                                            <div>
                                                <div className="font-funky text-xl italic">{preSelectedInstitution?.name}</div>
                                                <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest opacity-60">{preSelectedInstitution?.city}, {preSelectedInstitution?.state}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest opacity-50 italic">Pre-filled</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative" ref={instSearchRef}>
                                    <label className="block">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Institution / University</span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search university..."
                                                className="coffee-input pr-12 !py-4 shadow-[3px_3px_0px_#8b9467] text-base"
                                                value={instQuery}
                                                onChange={(e) => { setInstQuery(e.target.value); setShowInstResults(true); }}
                                                onFocus={() => setShowInstResults(true)}
                                                autoComplete="off"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-earth-terracotta opacity-40">
                                                {isSearchingInst
                                                    ? <span className="w-5 h-5 border-2 border-earth-terracotta/40 border-t-earth-terracotta rounded-full animate-spin block" />
                                                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                }
                                            </div>
                                        </div>
                                        {formData.institutionId && (
                                            <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-earth-sage/10 border border-earth-sage/30 rounded-full text-xs font-bold text-earth-sage uppercase tracking-widest italic">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
                                                Selected: {instResults.find(i => i.unitid === formData.institutionId)?.name || instQuery}
                                            </div>
                                        )}
                                    </label>

                                    {showInstResults && instResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-6 bg-[#fffefb] border-2 border-foreground rounded-[2rem] shadow-[12px_12px_0px_rgba(67,52,34,0.1)] overflow-hidden">
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {instResults.map(inst => (
                                                    <button
                                                        key={inst.unitid}
                                                        type="button"
                                                        className="w-full text-left px-8 py-6 hover:bg-earth-parchment transition-colors border-b border-foreground/5 last:border-0 group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, institutionId: inst.unitid, majorId: '' });
                                                            setMajorQuery('');
                                                            setInstQuery(inst.name);
                                                            setShowInstResults(false);
                                                        }}
                                                    >
                                                        <div className="font-funky text-2xl text-foreground group-hover:text-earth-terracotta transition-colors italic leading-none">{inst.name}</div>
                                                        <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest mt-3 opacity-60">{inst.city}, {inst.state}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Major Search - Read-only if pre-selected */}
                            {isMajorReadOnly ? (
                                <div>
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Degree / Major</span>
                                    <div className="coffee-input !py-4 bg-earth-mustard/5 border-earth-mustard/30 text-foreground/80 cursor-default flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-earth-mustard"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2M6.5 2h13.5A2.5 2.5 0 0122.5 4.5v15a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                                            <div>
                                                <div className="font-funky text-xl italic">{preSelectedMajor?.title}</div>
                                                <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest opacity-60">{preSelectedMajor?.category}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-earth-mustard uppercase tracking-widest opacity-50 italic">Pre-filled</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative" ref={majorSearchRef}>
                                    <label className="block">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Degree / Major</span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search program..."
                                                className="coffee-input pr-12 !py-4 shadow-[3px_3px_0px_#d4a017] text-base"
                                                value={majorQuery}
                                                onChange={(e) => { setMajorQuery(e.target.value); setShowMajorResults(true); }}
                                                onFocus={() => setShowMajorResults(true)}
                                                autoComplete="off"
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-earth-mustard opacity-40">
                                                {isSearchingMajor
                                                    ? <span className="w-5 h-5 border-2 border-earth-mustard/40 border-t-earth-mustard rounded-full animate-spin block" />
                                                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2M6.5 2h13.5A2.5 2.5 0 0122.5 4.5v15a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                                                }
                                            </div>
                                        </div>
                                        {formData.majorId && (
                                            <div className="mt-6 inline-flex items-center gap-3 px-5 py-2.5 bg-earth-mustard/10 border border-earth-mustard/30 rounded-full text-xs font-bold text-earth-mustard uppercase tracking-widest italic">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M20 6L9 17l-5-5" /></svg>
                                                Selected: {majorResults.find(m => m.cip4 === formData.majorId)?.title || majorQuery}
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
                                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${m.matchType === 'ALIAS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
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
                                                        onClick={() => { setShowMajorResults(false); setIsResolverOpen(true); }}
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
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Education Status *</span>
                                    <div className="relative">
                                        <select
                                            className={`coffee-input !py-4 shadow-[3px_3px_0px_#433422] text-sm font-bold appearance-none cursor-pointer pr-10 ${shouldShowError('status') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            value={formData.status}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                setFormData({ ...formData, status: newStatus });
                                                validateField('status', newStatus);
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, status: true }))}
                                        >
                                            <option value="graduated">GRADUATED</option>
                                            <option value="current">CURRENT STUDENT</option>
                                            <option value="switched">SWITCHED MAJOR / DROPPED OUT</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground opacity-30">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                    <ErrorMessage message={shouldShowError('status') ? errors.status : undefined} />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Graduation Year / Range {formData.status !== 'current' ? '*' : '(optional)'}</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2020 or 2018—2024"
                                        className={`coffee-input !py-4 shadow-[3px_3px_0px_#433422] text-sm font-bold ${shouldShowError('graduationYear') ? 'border-red-500 focus:border-red-500' : ''}`}
                                        value={formData.graduationYear}
                                        onChange={(e) => {
                                            setFormData({ ...formData, graduationYear: e.target.value });
                                            validateField('graduationYear', e.target.value);
                                        }}
                                        onBlur={() => setTouched(prev => ({ ...prev, graduationYear: true }))}
                                    />
                                    <ErrorMessage message={shouldShowError('graduationYear') ? errors.graduationYear : undefined} />
                                    <div className="mt-2 text-xs text-earth-sage/70 italic">
                                        Range: {MIN_YEAR}–{CURRENT_YEAR} (single year or YYYY—YYYY format)
                                    </div>
                                </label>
                            </div>

                            {formData.status === 'graduated' && (
                                <div className="space-y-6 pt-6 border-t border-foreground/5 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="text-xl font-funky text-foreground italic leading-none">Post-Graduation Outcomes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Current Status *</span>
                                            <select
                                                className={`coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer ${shouldShowError('outcomeStatus') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                value={formData.outcomeStatus || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, outcomeStatus: e.target.value });
                                                    validateField('outcomeStatus', e.target.value);
                                                }}
                                                onBlur={() => setTouched(prev => ({ ...prev, outcomeStatus: true }))}
                                            >
                                                <option value="">Select Status...</option>
                                                <option value="employed_full">Employed Full-Time</option>
                                                <option value="employed_part">Employed Part-Time</option>
                                                <option value="grad_school">Graduate School</option>
                                                <option value="professional_school">Professional School (Med/Law/etc)</option>
                                                <option value="founder">Self-Employed / Founder</option>
                                                <option value="seeking">Still Seeking</option>
                                            </select>
                                            <ErrorMessage message={shouldShowError('outcomeStatus') ? errors.outcomeStatus : undefined} />
                                        </label>

                                        {['employed_full', 'employed_part', 'founder'].includes(formData.outcomeStatus) && (
                                            <>
                                                <label className="block">
                                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">First Role Title *</span>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Junior Analyst"
                                                        className={`coffee-input !py-4 text-sm font-bold ${shouldShowError('jobTitle') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                        value={formData.jobTitle || ''}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, jobTitle: e.target.value });
                                                            validateField('jobTitle', e.target.value);
                                                        }}
                                                        onBlur={() => setTouched(prev => ({ ...prev, jobTitle: true }))}
                                                    />
                                                    <ErrorMessage message={shouldShowError('jobTitle') ? errors.jobTitle : undefined} />
                                                </label>
                                                <label className="block">
                                                    <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Industry *</span>
                                                    <select
                                                        className={`coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer ${shouldShowError('industry') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                        value={formData.industry || ''}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, industry: e.target.value });
                                                            validateField('industry', e.target.value);
                                                        }}
                                                        onBlur={() => setTouched(prev => ({ ...prev, industry: true }))}
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
                                                    <ErrorMessage message={shouldShowError('industry') ? errors.industry : undefined} />
                                                </label>
                                            </>
                                        )}

                                        {['grad_school', 'professional_school'].includes(formData.outcomeStatus) && (
                                            <label className="block">
                                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Program / Degree *</span>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. MBA, PhD in Physics"
                                                    className={`coffee-input !py-4 text-sm font-bold ${shouldShowError('gradSchool') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                    value={formData.gradSchool || ''}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, gradSchool: e.target.value });
                                                        validateField('gradSchool', e.target.value);
                                                    }}
                                                    onBlur={() => setTouched(prev => ({ ...prev, gradSchool: true }))}
                                                />
                                                <ErrorMessage message={shouldShowError('gradSchool') ? errors.gradSchool : undefined} />
                                            </label>
                                        )}

                                        <label className="block">
                                            <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-2 italic">Time to First Outcome *</span>
                                            <select
                                                className={`coffee-input !py-4 text-sm font-bold appearance-none cursor-pointer ${shouldShowError('timeToOutcome') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                value={formData.timeToOutcome || ''}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, timeToOutcome: e.target.value });
                                                    validateField('timeToOutcome', e.target.value);
                                                }}
                                                onBlur={() => setTouched(prev => ({ ...prev, timeToOutcome: true }))}
                                            >
                                                <option value="">Select Duration...</option>
                                                <option value="0-3_mo">Less than 3 months</option>
                                                <option value="3-6_mo">3 - 6 months</option>
                                                <option value="6-12_mo">6 - 12 months</option>
                                                <option value="12_mo_plus">Over a year</option>
                                            </select>
                                            <ErrorMessage message={shouldShowError('timeToOutcome') ? errors.timeToOutcome : undefined} />
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
                            <p className="text-earth-sage text-[10px] font-bold uppercase tracking-[0.2em] italic">Select 1–5 stars for each category. Hover a star to preview its meaning.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ratingCategories.map((cat) => {
                                const currentVal = (formData.ratings[cat.key as keyof typeof formData.ratings] ?? 0) as number;
                                const hasError = shouldShowRatingError(cat.key);
                                return (
                                    <div
                                        key={cat.key}
                                        className={`relative rounded-3xl border-2 p-5 transition-all duration-200 ${
                                            hasError
                                                ? 'border-red-200 bg-red-50/40'
                                                : currentVal > 0
                                                    ? 'border-earth-terracotta/30 bg-earth-parchment/30'
                                                    : 'border-foreground/8 bg-white/60'
                                        }`}
                                    >
                                        {/* Header row */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                                                currentVal > 0 ? 'bg-earth-terracotta text-white' : 'bg-foreground/6 text-foreground/30'
                                            }`}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                                                    <path d={cat.icon} />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-xs font-bold uppercase tracking-widest leading-none mb-1 ${
                                                    hasError ? 'text-red-500' : 'text-foreground'
                                                }`}>
                                                    {cat.label} <span className="text-earth-terracotta">*</span>
                                                </div>
                                                <div className="text-[10px] text-foreground/45 italic leading-snug">{cat.subtitle}</div>
                                            </div>
                                            {/* Numeric score badge */}
                                            {currentVal > 0 && (
                                                <div className="shrink-0 text-right">
                                                    <span className="text-2xl font-funky text-earth-terracotta italic leading-none">{currentVal}</span>
                                                    <span className="text-xs text-foreground/30 font-bold">/5</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Star row */}
                                        <div className="flex gap-2 mb-3">
                                            {[1, 2, 3, 4, 5].map((val) => {
                                                const filled = val <= currentVal;
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        title={`${val} — ${SCORE_LABELS[val]}: ${cat.scoreDescriptions[val]}`}
                                                        onClick={() => {
                                                            setFormData({ ...formData, ratings: { ...formData.ratings, [cat.key]: val } });
                                                            setTouched(prev => ({ ...prev, [cat.key]: true }));
                                                        }}
                                                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all duration-150 group ${
                                                            filled
                                                                ? 'bg-earth-terracotta border-earth-terracotta text-white shadow-md'
                                                                : hasError
                                                                    ? 'bg-white border-red-100 text-red-200 hover:border-red-300 hover:text-red-300'
                                                                    : 'bg-white border-foreground/8 text-foreground/25 hover:border-earth-terracotta/40 hover:text-earth-terracotta/50'
                                                        }`}
                                                    >
                                                        {/* Star SVG */}
                                                        <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform group-hover:scale-110" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? '0' : '1.5'}>
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                        {/* Numeric label under star */}
                                                        <span className="text-[9px] font-bold leading-none">{val}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Score description chip */}
                                        <div className={`min-h-[2.25rem] px-3 py-2 rounded-xl text-[11px] italic leading-snug transition-all duration-200 ${
                                            currentVal > 0
                                                ? 'bg-earth-terracotta/8 text-foreground/70'
                                                : 'bg-foreground/4 text-foreground/30'
                                        }`}>
                                            {currentVal > 0
                                                ? <><span className="font-bold not-italic text-earth-terracotta">{SCORE_LABELS[currentVal]}:</span> {cat.scoreDescriptions[currentVal]}</>
                                                : 'Select a star to see what it means for this category'}
                                        </div>

                                        {/* Inline error */}
                                        {hasError && (
                                            <div className="mt-2 flex items-center gap-2 text-xs text-red-600 animate-in fade-in duration-200">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                                <span className="font-medium">{errors.ratings?.[cat.key]}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="border-b border-foreground/5 pb-6">
                            <h2 className="text-3xl font-funky text-foreground tracking-tight italic mb-2">3. Detailed Feedback</h2>
                            <p className="text-earth-sage text-[10px] font-bold uppercase tracking-[0.2em] italic">Help other students by providing more context.</p>
                        </div>

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
                                        &quot;The CS program was rigorous but rewarding. Workload was high (20+ hrs/week), but faculty were accessible. Career prep was excellent; I had a full-time offer before graduating. Tip: Start projects early!&quot;
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <label className="block">
                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Who is this program for? *</span>
                                <textarea
                                    rows={4}
                                    className={`coffee-input shadow-[4px_4px_0px_#8b9467] text-base font-medium italic resize-none min-h-[120px] bg-white/50 ${shouldShowError('fit') ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="Students who prefer hands-on learning over theory..."
                                    value={formData.fit}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fit: e.target.value });
                                        validateField('fit', e.target.value);
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, fit: true }))}
                                />
                                <ErrorMessage message={shouldShowError('fit') ? errors.fit : undefined} />
                            </label>
                            <label className="block">
                                <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-4 italic">Most Significant Challenge *</span>
                                <textarea
                                    rows={4}
                                    className={`coffee-input shadow-[4px_4px_0px_#c36b4e] text-base font-medium italic resize-none min-h-[120px] bg-white/50 ${shouldShowError('challenge') ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="e.g. Navigating workload during clinicals..."
                                    value={formData.challenge}
                                    onChange={(e) => {
                                        setFormData({ ...formData, challenge: e.target.value });
                                        validateField('challenge', e.target.value);
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, challenge: true }))}
                                />
                                <ErrorMessage message={shouldShowError('challenge') ? errors.challenge : undefined} />
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

                {/* Inline error banner */}
                {submitError && (
                    <div className="mt-8 flex items-start gap-3 px-6 py-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-red-700">Please fix the following before submitting:</p>
                            <p className="text-sm text-red-600 mt-0.5">{submitError.message}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSubmitError(null)}
                            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                            aria-label="Dismiss error"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="mt-6 flex justify-between items-center pt-8 border-t border-secondary-100">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={step === 1 || isSubmitting}
                        className={`text-xs font-bold uppercase tracking-[0.2em] italic transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-earth-sage hover:text-earth-terracotta'}`}
                    >
                        &larr; Previous Step
                    </button>

                    <div className="flex gap-6">
                        {step < 3 ? (
                            <button type="button" onClick={nextStep} className="coffee-btn shadow-[6px_6px_0px_#433422] px-12">
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
