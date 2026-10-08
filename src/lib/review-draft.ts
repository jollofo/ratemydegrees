import type { ReviewFormData } from '@/app/write-review/types';
import { ratingCategories } from './rating-rubric';

export const draftLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const prefix = 'rmd-review-draft-v2:';
export type DraftTarget = { majorId: string; institutionId: string };
export type SavedDraft = { data: ReviewFormData; majorQuery: string; schoolQuery: string; step: number };

export function draftKey(target: DraftTarget): string {
    return prefix + encodeURIComponent(target.majorId) + ':' + encodeURIComponent(target.institutionId);
}

export function readDraft(storage: Pick<Storage, 'getItem' | 'removeItem'>, target: DraftTarget, now = Date.now()): SavedDraft | null {
    const key = draftKey(target);
    const raw = storage.getItem(key);
    if (!raw) return null;
    try {
        const saved = JSON.parse(raw);
        if (saved.version !== 2 || !Number.isFinite(saved.savedAt) || saved.savedAt > now || now - saved.savedAt > draftLifetimeMs ||
            saved.target?.majorId !== target.majorId || saved.target?.institutionId !== target.institutionId || !saved.data || typeof saved.data !== 'object') throw Error('Invalid draft');
        const d = saved.data;
        const fields = ['majorId', 'institutionId', 'status', 'graduationYear', 'fit', 'challenge', 'misconception', 'differently', 'outcomeStatus', 'jobTitle', 'industry', 'gradSchool', 'timeToOutcome'];
        if (fields.some(field => typeof d[field] !== 'string' || d[field].length > 5000) || !d.ratings || typeof d.ratings !== 'object') throw Error('Invalid fields');
        if (!['current', 'graduated', 'switched'].includes(d.status)) throw Error('Invalid status');
        const allowed = new Set<string>(ratingCategories.map(category => category.key));
        if (Object.entries(d.ratings).some(([key, value]) => !allowed.has(key) || !Number.isInteger(value) || Number(value) < 0 || Number(value) > 5)) throw Error('Invalid ratings');
        if (typeof saved.majorQuery !== 'string' || saved.majorQuery.length > 200 || typeof saved.schoolQuery !== 'string' || saved.schoolQuery.length > 200) throw Error('Invalid labels');
        if (!Number.isInteger(saved.step) || saved.step < 1 || saved.step > 3) throw Error('Invalid step');
        return { data: d as ReviewFormData, majorQuery: saved.majorQuery, schoolQuery: saved.schoolQuery, step: saved.step };
    } catch {
        storage.removeItem(key);
        return null;
    }
}

export function writeDraft(storage: Pick<Storage, 'setItem'>, target: DraftTarget, draft: SavedDraft, now = Date.now()): void {
    storage.setItem(draftKey(target), JSON.stringify({ version: 2, savedAt: now, target, ...draft }));
}

export function discardDraft(storage: Pick<Storage, 'removeItem'>, target: DraftTarget): void {
    storage.removeItem(draftKey(target));
}
