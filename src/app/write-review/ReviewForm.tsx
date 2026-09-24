'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview } from './actions';
import { searchMajors, searchInstitutions } from '@/app/actions/search';
import { reviewFormSchema } from '@/lib/validation';
import { ratingCategories } from '@/lib/rating-rubric';
import type { ReviewFormData, InstitutionSearchResult, MajorSearchResult } from './types';

const draftKey = 'rmd-review-draft-v1';
const emptyForm: ReviewFormData = {
    majorId: '', institutionId: '', status: 'current', graduationYear: '',
    ratings: { satisfaction: 0 }, fit: '', challenge: '', misconception: '', differently: '',
    outcomeStatus: '', jobTitle: '', industry: '', gradSchool: '', timeToOutcome: '',
};

export default function WriteReviewForm({ majors, institutions, preSelectedMajor, preSelectedInstitution, initialData, reviewId }: {
    majors: MajorSearchResult[]; institutions: InstitutionSearchResult[];
    preSelectedMajor?: MajorSearchResult; preSelectedInstitution?: InstitutionSearchResult;
    initialData?: ReviewFormData; reviewId?: string;
}) {
    const router = useRouter();
    const [data, setData] = useState<ReviewFormData>(initialData ?? { ...emptyForm, majorId: preSelectedMajor?.cip4 ?? '', institutionId: preSelectedInstitution?.unitid ?? '' });
    const [step, setStep] = useState(1);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [majorQuery, setMajorQuery] = useState('');
    const [schoolQuery, setSchoolQuery] = useState('');
    const [majorSuggestionsOpen, setMajorSuggestionsOpen] = useState(false);
    const [schoolSuggestionsOpen, setSchoolSuggestionsOpen] = useState(false);
    const [majorResults, setMajorResults] = useState(majors);
    const [schoolResults, setSchoolResults] = useState(institutions);
    const [selectedMajor, setSelectedMajor] = useState(preSelectedMajor);
    const [selectedSchool, setSelectedSchool] = useState(preSelectedInstitution);
    const [searchMessage, setSearchMessage] = useState('');
    const [hasDraft, setHasDraft] = useState(false);
    useEffect(() => { try { setHasDraft(Boolean(sessionStorage.getItem(draftKey))); } catch { /* Draft storage is optional. */ } }, []);
    useEffect(() => {
        let active = true;
        if (majorQuery.trim().length < 2) { setMajorResults(majors); return; }
        const timer = setTimeout(async () => {
            try {
                const result = await searchMajors(majorQuery, { hitsPerPage: 20 });
                if (!active) return;
                setMajorResults(result.hits);
                setSearchMessage(result.unavailable ? 'Degree search is temporarily unavailable. Please retry.' : result.hits.length ? '' : 'No matching degrees. Try another name.');
            } catch { if (active) setSearchMessage('Degree search is unavailable. Please retry.'); }
        }, 250);
        return () => { active = false; clearTimeout(timer); };
    }, [majorQuery, majors]);
    useEffect(() => {
        let active = true;
        if (schoolQuery.trim().length < 2) { setSchoolResults(institutions); return; }
        const timer = setTimeout(async () => {
            try {
                const result = await searchInstitutions(schoolQuery, { hitsPerPage: 20 });
                if (!active) return;
                setSchoolResults(result.hits);
                setSearchMessage(result.unavailable ? 'School search is temporarily unavailable. Please retry.' : result.hits.length ? '' : 'No matching schools. Try another name.');
            } catch { if (active) setSearchMessage('School search is unavailable. Please retry.'); }
        }, 250);
        return () => { active = false; clearTimeout(timer); };
    }, [schoolQuery, institutions]);

    function validate(upTo: number) {
        const parsed = reviewFormSchema.safeParse(data);
        const next: Record<string, string> = {};
        if (!parsed.success) for (const issue of parsed.error.issues) {
            const field = String(issue.path[0]);
            const fieldStep = field === 'ratings' ? 2 : ['fit', 'challenge', 'misconception', 'differently'].includes(field) ? 3 : 1;
            if (fieldStep <= upTo) next[issue.path.join('.')] = issue.message;
        }
        setErrors(next);
        if (Object.keys(next).length) setMessage('Please check the highlighted fields.');
        else setMessage('');
        return !Object.keys(next).length;
    }
    function saveDraft() {
        try { sessionStorage.setItem(draftKey, JSON.stringify(data)); setHasDraft(true); setMessage('Draft saved in this browser tab. It is not submitted.'); }
        catch { setMessage('This browser could not save the draft. Keep this tab open.'); }
    }
    function restoreDraft() {
        try {
            const raw: unknown = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
            // Drafts may be incomplete; only accept known primitive fields and rating keys.
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error();
            const draft = raw as Record<string, unknown>;
            const restored = { ...emptyForm, ratings: { satisfaction: 0 } } as ReviewFormData;
            for (const key of Object.keys(emptyForm)) {
                if (key !== 'ratings' && typeof draft[key] === 'string') Object.assign(restored, { [key]: (draft[key] as string).slice(0, 5000) });
            }
            if (draft.ratings && typeof draft.ratings === 'object') for (const category of ratingCategories) {
                const value = (draft.ratings as Record<string, unknown>)[category.key];
                if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5) restored.ratings[category.key] = value;
            }
            setData({ ...restored, majorId: data.majorId, institutionId: data.institutionId });
            setStep(1); setMessage('Draft text restored. Check the selected school and degree before submitting.');
        } catch { setMessage('The saved draft could not be restored.'); }
    }
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (busy) return;
        if (step < 3) { if (validate(step)) setStep(step + 1); return; }
        if (!validate(3)) { setStep(1); return; }
        setBusy(true);
        try {
            const result = await submitReview(data, reviewId);
            try { sessionStorage.removeItem(draftKey); } catch { /* Submission succeeds without browser storage. */ }
            router.push('/my-reviews?submitted=' + result.status.toLowerCase());
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not submit. Please try again.');
            setBusy(false);
        }
    }
    const majorOptions = Array.from(new Map([...majorResults, ...(selectedMajor ? [selectedMajor] : [])].map(item => [item.cip4, item])).values());
    const schoolOptions = Array.from(new Map([...schoolResults, ...(selectedSchool ? [selectedSchool] : [])].map(item => [item.unitid, item])).values());
    const error = (key: string) => errors[key] ? <p id={'error-' + key} role="alert" className="text-red-800 text-sm mt-2">{errors[key]}</p> : null;

    return <form onSubmit={submit} noValidate className="space-y-6">
        <p className="text-sm">Your account details are not shown with your review. Do not include names, contact details, or other identifying information in your text. <a href="/guidelines" className="underline">Review guidelines</a></p>
        <ol aria-label="Review steps" className="flex flex-wrap gap-4">
            {['Your degree', 'Your ratings', 'Your experience'].map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={step === index + 1 ? 'font-bold' : 'text-foreground/70'}>{index + 1}. {label}</li>)}
        </ol>
        <fieldset disabled={busy} className="coffee-card space-y-6 min-w-0">
            <legend className="sr-only">Degree review</legend>
            {step === 1 && <>
                <h2 className="text-2xl font-bold">Your degree</h2>
                {reviewId ? <p>{preSelectedMajor?.title} at {preSelectedInstitution?.name}</p> : <>
                    <div>
                        <label htmlFor="school-search" className="block font-bold mb-2">Find your school</label>
                        <input id="school-search" type="search" role="combobox" aria-autocomplete="list" value={schoolQuery} onChange={event => { setSchoolQuery(event.target.value); setSchoolResults([]); setSchoolSuggestionsOpen(true); }} onFocus={() => setSchoolSuggestionsOpen(true)} placeholder="Type a school name" className="coffee-input" maxLength={200} aria-controls={schoolSuggestionsOpen && schoolQuery.trim().length >= 2 && schoolResults.length > 0 ? 'school-suggestions' : undefined} aria-expanded={schoolSuggestionsOpen && schoolQuery.trim().length >= 2 && schoolResults.length > 0} />
                        {schoolSuggestionsOpen && schoolQuery.trim().length >= 2 && schoolResults.length > 0 && <div id="school-suggestions" role="listbox" className="mt-2 max-h-60 overflow-auto rounded-2xl border-2 border-foreground bg-[#fffefb]">
                            {schoolResults.slice(0, 6).map(school => <button key={school.unitid} type="button" role="option" aria-selected={data.institutionId === school.unitid} onClick={() => { setData({ ...data, institutionId: school.unitid }); setSelectedSchool(school); setSchoolQuery(school.name); setSchoolSuggestionsOpen(false); }} className="block w-full text-left px-4 py-3 border-b last:border-b-0 border-foreground/10 hover:bg-earth-sage/15"><span className="font-semibold">{school.name}</span><span className="block text-sm text-foreground/70">{[school.city, school.state].filter(Boolean).join(', ')}</span></button>)}
                        </div>}
                        <label htmlFor="institutionId" className="block text-sm mt-3 mb-2">Select your school from the results</label>
                        <select id="institutionId" value={data.institutionId} onChange={event => { setData({ ...data, institutionId: event.target.value }); setSelectedSchool(schoolOptions.find(school => school.unitid === event.target.value)); setSchoolSuggestionsOpen(false); }} className="coffee-input" aria-invalid={Boolean(errors.institutionId)} aria-describedby={errors.institutionId ? 'error-institutionId' : undefined}>
                            <option value="">Select a school</option>
                            {schoolOptions.map(school => <option key={school.unitid} value={school.unitid}>{school.name} — {school.state}</option>)}
                        </select>{error('institutionId')}
                    </div>
                    <div>
                        <label htmlFor="major-search" className="block font-bold mb-2">Find your degree</label>
                        <input id="major-search" type="search" role="combobox" aria-autocomplete="list" value={majorQuery} onChange={event => { setMajorQuery(event.target.value); setMajorResults([]); setMajorSuggestionsOpen(true); }} onFocus={() => setMajorSuggestionsOpen(true)} placeholder="Type a degree name" className="coffee-input" maxLength={200} aria-controls={majorSuggestionsOpen && majorQuery.trim().length >= 2 && majorResults.length > 0 ? 'major-suggestions' : undefined} aria-expanded={majorSuggestionsOpen && majorQuery.trim().length >= 2 && majorResults.length > 0} />
                        {majorSuggestionsOpen && majorQuery.trim().length >= 2 && majorResults.length > 0 && <div id="major-suggestions" role="listbox" className="mt-2 max-h-60 overflow-auto rounded-2xl border-2 border-foreground bg-[#fffefb]">
                            {majorResults.slice(0, 6).map(major => <button key={major.cip4} type="button" role="option" aria-selected={data.majorId === major.cip4} onClick={() => { setData({ ...data, majorId: major.cip4 }); setSelectedMajor(major); setMajorQuery(major.title); setMajorSuggestionsOpen(false); }} className="block w-full text-left px-4 py-3 border-b last:border-b-0 border-foreground/10 hover:bg-earth-sage/15 font-semibold">{major.title.replace(/[.\s]+$/, '')}</button>)}
                        </div>}
                        <label htmlFor="majorId" className="block text-sm mt-3 mb-2">Select your degree from the results</label>
                        <select id="majorId" value={data.majorId} onChange={event => { setData({ ...data, majorId: event.target.value }); setSelectedMajor(majorOptions.find(major => major.cip4 === event.target.value)); setMajorSuggestionsOpen(false); }} className="coffee-input" aria-invalid={Boolean(errors.majorId)} aria-describedby={errors.majorId ? 'error-majorId' : undefined}>
                            <option value="">Select a degree</option>
                            {majorOptions.map(major => <option key={major.cip4} value={major.cip4}>{major.title}</option>)}
                        </select>{error('majorId')}
                    </div>
                    <p role="status" className="text-sm">{searchMessage}</p>
                </>}
                <div><label htmlFor="student-status" className="block font-bold mb-2">Student status</label>
                    <select id="student-status" className="coffee-input" value={data.status} onChange={event => setData({ ...data, status: event.target.value as ReviewFormData['status'] })}>
                        <option value="current">Current student</option><option value="graduated">Graduate</option><option value="switched">Changed programs</option>
                    </select>{error('status')}
                </div>
                <div><label htmlFor="graduation-year" className="block font-bold mb-2">Study year or range (optional)</label>
                    <input id="graduation-year" value={data.graduationYear ?? ''} onChange={event => setData({ ...data, graduationYear: event.target.value })} placeholder="2024 or 2016–2024" className="coffee-input" maxLength={20} aria-invalid={Boolean(errors.graduationYear)} />{error('graduationYear')}
                </div>
            </>}
            {step === 2 && <>
                <h2 className="text-2xl font-bold">Your ratings</h2>
                <p>Only overall satisfaction is required. Leave a category as not applicable if you cannot rate it from personal experience.</p>
                {ratingCategories.map(category => <div key={category.key}>
                    <label htmlFor={'rating-' + category.key} className="block font-bold mb-2">{category.label}{category.key === 'satisfaction' ? ' (required)' : ''}</label>
                    <p className="text-sm mb-2" id={'hint-' + category.key}>{category.subtitle}</p>
                    <select id={'rating-' + category.key} value={data.ratings[category.key] ?? 0} onChange={event => setData({ ...data, ratings: { ...data.ratings, [category.key]: Number(event.target.value) } })} className="coffee-input" aria-describedby={'hint-' + category.key} aria-invalid={Boolean(errors['ratings.' + category.key])}>
                        <option value={0}>{category.key === 'satisfaction' ? 'Select your rating' : 'Not applicable / no experience'}</option>
                        {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} — {category.scoreDescriptions[value]}</option>)}
                    </select>{error('ratings.' + category.key)}
                </div>)}
            </>}
            {step === 3 && <>
                <h2 className="text-2xl font-bold">Your experience</h2>
                <p>Describe your own experience, including what worked and what did not. All schools and viewpoints follow the same rules.</p>
                {([{ key: 'fit', label: 'What was studying this degree like?', required: true }, { key: 'challenge', label: 'What was the biggest challenge?', required: true }, { key: 'misconception', label: 'What surprised you?', required: false }, { key: 'differently', label: 'What would you do differently?', required: false }] as const).map(field => <div key={field.key}>
                    <label htmlFor={field.key} className="block font-bold mb-2">{field.label} ({field.required ? 'required' : 'optional'})</label>
                    <textarea id={field.key} value={data[field.key]} onChange={event => setData({ ...data, [field.key]: event.target.value })} className="coffee-input" rows={5} maxLength={5000} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? 'error-' + field.key : undefined} />
                    {error(field.key)}
                </div>)}
            </>}
        </fieldset>
        <p role="status" className="text-sm whitespace-pre-wrap">{message}</p>
        <div className="flex flex-wrap justify-between gap-3">
            {step > 1 && <button type="button" disabled={busy} onClick={() => { setStep(step - 1); setErrors({}); }} className="px-4 py-3 underline">Previous</button>}
            <button type="submit" disabled={busy} className="coffee-btn">{busy ? 'Saving…' : step < 3 ? 'Next step' : reviewId ? 'Save changes' : 'Submit review'}</button>
        </div>
        {!reviewId && <div className="text-sm border-t pt-5 space-y-3">
            <p>Optional: save a draft in this browser tab. It may contain personal writing; use this on a device you trust.</p>
            <div className="flex flex-wrap gap-4"><button type="button" onClick={saveDraft} className="underline">Save draft</button>
                {hasDraft && <><button type="button" onClick={restoreDraft} className="underline">Restore draft text</button><button type="button" className="underline" onClick={() => { try { sessionStorage.removeItem(draftKey); setHasDraft(false); setMessage('Draft cleared.'); } catch { setMessage('Could not clear draft.'); } }}>Clear draft</button></>}
            </div>
        </div>}
        <a href="/my-reviews" className="inline-block underline">My reviews</a>
    </form>;
}
