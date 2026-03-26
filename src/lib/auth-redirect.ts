// Server-side utilities for redirect-after-login flow

import { redirect } from 'next/navigation';

/**
 * Redirects to login page with the current path encoded for post-login redirect.
 * Call this in Server Components when authentication is required but not present.
 */
export function redirectToLogin(currentPath: string): never {
    // Encode the current path to pass it to the login page
    const encodedPath = encodeURIComponent(currentPath);
    redirect(`/login?next=${encodedPath}`);
}

/**
 * Gets the redirect URL from search params if present.
 * Call this in the login page to extract the intended destination.
 */
export function getLoginRedirectUrl(searchParams: { next?: string; returnTo?: string }): string | undefined {
    // Support both 'next' and 'returnTo' for backward compatibility
    const redirectPath = searchParams.next || searchParams.returnTo;
    if (!redirectPath) return undefined;

    // Validate the path to prevent open redirects
    try {
        const decoded = decodeURIComponent(redirectPath);
        // Ensure it's a relative path (starts with /)
        if (decoded.startsWith('/')) {
            return decoded;
        }
    } catch {
        // Invalid encoding, ignore
    }
    return undefined;
}
