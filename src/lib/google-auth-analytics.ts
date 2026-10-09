const key = 'rmd-google-sign-in-pending-v1';

export function markGoogleSignInPending(): void {
    try { sessionStorage.setItem(key, String(Date.now())); } catch { /* Sign-in does not depend on analytics. */ }
}

export function clearGoogleSignInPending(): void {
    try { sessionStorage.removeItem(key); } catch { /* Sign-in does not depend on analytics. */ }
}

export function consumeRecentGoogleSignIn(): number | null {
    try {
        const pending = Number(sessionStorage.getItem(key));
        sessionStorage.removeItem(key);
        return pending > 0 && Date.now() - pending < 10 * 60 * 1000 ? pending : null;
    } catch { return null; }
}
