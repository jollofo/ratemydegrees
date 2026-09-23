import type { Prisma } from '@prisma/client';
import { ratingCategories } from './rating-rubric';

export function jsonRecord(value: string): Record<string, unknown> {
    try {
        const parsed: unknown = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch { return {}; }
}

export function summarizeRatings(groups: { ratings: string; _count: { _all: number } }[]) {
    return ratingCategories.map(category => {
        let sum = 0, count = 0;
        for (const group of groups) {
            const value = jsonRecord(group.ratings)[category.key];
            if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
                sum += value * group._count._all; count += group._count._all;
            }
        }
        return { label: category.label, count, score: count >= 5 ? Number((sum / count).toFixed(1)) : null };
    });
}

/** Public queries never fetch author identities or moderation metadata. */
export function publicReviewSelect(viewerId?: string) {
    return {
        id: true, graduationStatus: true, createdAt: true, ratings: true, writtenResponses: true,
        major: { select: { title: true } }, institution: { select: { name: true } },
        _count: { select: { votes: { where: { value: 1 } } } },
        votes: { where: { userId: viewerId ?? '', value: 1 }, select: { value: true } },
    } satisfies Prisma.ReviewSelect;
}

type ReviewRow = Prisma.ReviewGetPayload<{ select: ReturnType<typeof publicReviewSelect> }>;
export interface PublicReview {
    id: string;
    graduationStatus: string;
    createdAt: string;
    rating: number | null;
    responses: { label: string; text: string }[];
    major: string;
    institution: string;
    votes: number;
    hasVoted: boolean;
}

/** Explicit boundary, rather than spreading a database object into client props. */
export function toPublicReview(review: ReviewRow): PublicReview {
    const rawRating = jsonRecord(review.ratings).satisfaction;
    const written = jsonRecord(review.writtenResponses);
    return {
        id: review.id, graduationStatus: review.graduationStatus, createdAt: review.createdAt.toISOString(),
        rating: typeof rawRating === 'number' && rawRating >= 1 && rawRating <= 5 ? rawRating : null,
        responses: [ ['fit', 'Program experience'], ['challenge', 'Biggest challenge'], ['misconception', 'What surprised me'], ['differently', 'What I would do differently'] ]
            .flatMap(([key, label]) => typeof written[key] === 'string' && written[key] ? [{ label, text: written[key] as string }] : []),
        major: review.major.title, institution: review.institution.name,
        votes: review._count.votes, hasVoted: review.votes.length > 0,
    };
}
