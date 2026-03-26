// Client-side utilities for redirect-after-login flow

const REDIRECT_KEY = 'redirectAfterLogin';

/**
 * Save the current URL to sessionStorage before redirecting to login.
 * Call this before redirecting an unauthenticated user to the login page.
 */
export function saveRedirectUrl(url?: string): void {
    if (typeof window === 'undefined') return;
    const redirectUrl = url || window.location.href;
    sessionStorage.setItem(REDIRECT_KEY, redirectUrl);
}

/**
 * Get and clear the saved redirect URL from sessionStorage.
 * Call this after successful login to get the destination and clean up.
 */
export function getRedirectUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const url = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    return url;
}

/**
 * Clear any saved redirect URL without returning it.
 */
export function clearRedirectUrl(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(REDIRECT_KEY);
}
