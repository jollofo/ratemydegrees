import { z } from 'zod';

// ─── Primitives ────────────────────────────────────────────────────────────────

/** CIP4 code — four-digit dot-separated or plain numeric string, e.g. "11.01", "11" */
export const cip4Schema = z
    .string()
    .min(2)
    .max(10)
    .regex(/^\d{2}(\.\d{2,4})?$/, 'Invalid CIP4 code');

/** UNITID — typically a 6-digit numeric string */
export const unitidSchema = z
    .string()
    .min(3)
    .max(10)
    .regex(/^\d+$/, 'Invalid institution ID');

/** Short free-text search query */
export const searchQuerySchema = z
    .string()
    .trim()
    .min(1, 'Query cannot be empty')
    .max(200, 'Query is too long');

// ─── Review Form ───────────────────────────────────────────────────────────────

const ratingValue = z.number().int().min(1).max(5);

export const reviewRatingsSchema = z.object({
    rigor: ratingValue,
    career: ratingValue,
    difficulty: ratingValue,
    flexibility: ratingValue,
    satisfaction: ratingValue,
    value: ratingValue,
    // New categories — optional so existing reviews aren't rejected
    networking: ratingValue.optional(),
    research: ratingValue.optional(),
    internships: ratingValue.optional(),
});

const writtenField = z
    .string()
    .trim()
    .max(5000, 'Response must be under 5,000 characters');

export const reviewFormSchema = z.object({
    majorId: cip4Schema,
    institutionId: unitidSchema,

    status: z.enum(['graduated', 'current', 'switched'], {
        message: 'Invalid graduation status',
    }),

    graduationYear: z
        .string()
        .trim()
        .max(20)
        .regex(/^[\d\s\-–—]+$/, 'Invalid graduation year format')
        .optional()
        .or(z.literal('')),

    ratings: reviewRatingsSchema,

    fit: writtenField,
    challenge: writtenField,
    misconception: writtenField,
    differently: writtenField,

    // Outcome fields — all optional
    outcomeStatus: z
        .enum(['employed_full', 'employed_part', 'grad_school', 'professional_school', 'founder', 'seeking', ''])
        .optional(),
    jobTitle: z.string().trim().max(200).optional().or(z.literal('')),
    industry: z
        .enum(['tech', 'finance', 'health', 'education', 'manufacturing', 'arts', 'other', ''])
        .optional(),
    gradSchool: z.string().trim().max(300).optional().or(z.literal('')),
    timeToOutcome: z
        .enum(['0-3_mo', '3-6_mo', '6-12_mo', '12_mo_plus', ''])
        .optional(),
});

export type ValidatedReviewForm = z.infer<typeof reviewFormSchema>;

// ─── Report ─────────────────────────────────────────────────────────────────

export const reportSchema = z.object({
    reviewId: z.string().uuid('Invalid review ID'),
    reason: z
        .string()
        .trim()
        .min(5, 'Please provide a reason (min 5 characters)')
        .max(500, 'Reason is too long (max 500 characters)'),
});

// ─── Vote ────────────────────────────────────────────────────────────────────

export const voteSchema = z.object({
    reviewId: z.string().uuid('Invalid review ID'),
    value: z
        .number()
        .int()
        .refine((v) => v === 1 || v === -1, { message: 'Vote must be +1 or -1' }),
});

// ─── Major Resolve ───────────────────────────────────────────────────────────

export const resolveQuerySchema = z.object({
    query: z
        .string()
        .trim()
        .min(2, 'Query must be at least 2 characters')
        .max(200, 'Query is too long'),
});

// ─── Moderation Action ────────────────────────────────────────────────────────

export const moderationActionSchema = z.object({
    reviewId: z.string().uuid('Invalid review ID'),
    action: z.enum(['APPROVE', 'REMOVE', 'SHADOW_HIDE', 'REJECT']),
    notes: z.string().trim().max(1000).optional(),
});
