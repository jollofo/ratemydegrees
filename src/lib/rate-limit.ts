/**
 * In-memory sliding-window rate limiter.
 *
 * Works per-identifier (IP, user-id, etc.) with configurable
 * limits and window durations.  Suitable for Next.js deployments
 * where a single long-lived server process handles requests.
 *
 * For multi-instance / serverless deployments swap the store for
 * Redis (e.g. @upstash/ratelimit).
 */

interface Window {
    count: number;
    reset: number; // epoch ms when the window expires
}

const store = new Map<string, Window>();

/** Periodically purge expired windows to prevent unbounded growth. */
function pruneExpired() {
    const now = Date.now();
    for (const [key, win] of Array.from(store.entries())) {
        if (win.reset <= now) store.delete(key);
    }
}

// Prune every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(pruneExpired, 5 * 60 * 1_000).unref?.();
}

export interface RateLimitConfig {
    /** Max requests allowed within `windowMs`. */
    limit: number;
    /** Length of the window in milliseconds. */
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    /** Remaining allowed requests in this window. */
    remaining: number;
    /** Epoch ms at which the window resets. */
    reset: number;
    /** Current request count. */
    current: number;
}

/**
 * Check (and increment) the rate limit for a given identifier.
 *
 * @param id       Unique key — e.g. `"submit_review:127.0.0.1"` or `"user:abc-123"`.
 * @param config   Limit configuration.
 */
export function rateLimit(id: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    let win = store.get(id);

    if (!win || win.reset <= now) {
        win = { count: 1, reset: now + config.windowMs };
        store.set(id, win);
    } else {
        win.count += 1;
    }

    const success = win.count <= config.limit;
    const remaining = Math.max(0, config.limit - win.count);

    return { success, remaining, reset: win.reset, current: win.count };
}

// ─── Pre-configured limiters ──────────────────────────────────────────────────

/** Review submission: max 3 per hour per user. */
export const submitReviewLimiter: RateLimitConfig = {
    limit: 3,
    windowMs: 60 * 60 * 1_000,
};

/** Major / institution search: max 60 per minute per IP (generous for autocomplete). */
export const searchLimiter: RateLimitConfig = {
    limit: 60,
    windowMs: 60 * 1_000,
};

/** Major resolve API: max 30 per minute per IP. */
export const resolveLimiter: RateLimitConfig = {
    limit: 30,
    windowMs: 60 * 1_000,
};

/** Report a review: max 10 per hour per user. */
export const reportLimiter: RateLimitConfig = {
    limit: 10,
    windowMs: 60 * 60 * 1_000,
};

/** Vote on a review: max 30 per minute per user. */
export const voteLimiter: RateLimitConfig = {
    limit: 30,
    windowMs: 60 * 1_000,
};
