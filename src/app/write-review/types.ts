import type { z } from 'zod';
import type { reviewFormSchema } from '@/lib/validation';

export type ReviewFormData = z.input<typeof reviewFormSchema>;
export type ReviewRatings = ReviewFormData['ratings'];

export interface InstitutionSearchResult {
    unitid: string;
    name: string;
    state: string | null;
    city: string | null;
}

export interface MajorSearchResult {
    cip4: string;
    title: string;
    category: string | null;
    matchType?: 'DIRECT' | 'ALIAS' | 'PATHWAY' | 'RELATED';
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}
