'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitReview } from './actions';
import ReviewSearchField from '@/components/ReviewSearchField';
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
    const [majorQuery, setMajorQuery] = useState((preSelectedMajor?.title ?? majors.find(major => major.cip4 === initialData?.majorId)?.title ?? '').replace(/[.\s]+$/, ''));
    const [schoolQuery, setSchoolQuery] = useState(preSelectedInstitution?.name ?? institutions.find(school => school.unitid === initialData?.institutionId)?.name ?? '');
    const [hasDraft, setHasDraft] = useState(false);
    useEffect(() => { try { setHasDraft(Boolean(sessionStorage.getItem(draftKey))); } catch { /* Draft storage is optional. */ } }, []);
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
                    <ReviewSearchField id="school-search" kind="school" value={schoolQuery} selectedId={data.institutionId} error={errors.institutionId}
                        onChange={value => { setSchoolQuery(value); setData(current => ({ ...current, institutionId: '' })); }}
                        onSelect={option => { setSchoolQuery(option.label); setData(current => ({ ...current, institutionId: option.id })); setErrors(current => ({ ...current, institutionId: '' })); }} />
                    <ReviewSearchField id="major-search" kind="degree" value={majorQuery} selectedId={data.majorId} error={errors.majorId}
                        onChange={value => { setMajorQuery(value); setData(current => ({ ...current, majorId: '' })); }}
                        onSelect={option => { setMajorQuery(option.label); setData(current => ({ ...current, majorId: option.id })); setErrors(current => ({ ...current, majorId: '' })); }} />
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
