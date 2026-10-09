const key = 'rmd-posthog-anonymous-session-v1';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A tab-scoped random ID, created only after product analytics consent. */
export function getOrCreateAnonymousSessionId(storage: Pick<Storage, 'getItem' | 'setItem'>, createId: () => string): string | null {
    try {
        const existing = storage.getItem(key);
        if (existing && uuid.test(existing)) return existing;
        const next = createId();
        if (!uuid.test(next)) return null;
        storage.setItem(key, next);
        return next;
    } catch { return null; }
}

export function clearAnonymousSessionId(storage: Pick<Storage, 'removeItem'>): void {
    try { storage.removeItem(key); } catch { /* Consent still blocks further capture. */ }
}
