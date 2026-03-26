'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectUrl } from '@/lib/redirect';

interface PostLoginRedirectProps {
    fallbackPath: string;
}

/**
 * Component that handles post-login redirect using sessionStorage.
 * Should be placed on pages that are the destination after OAuth callback.
 */
export default function PostLoginRedirect({ fallbackPath }: PostLoginRedirectProps) {
    const router = useRouter();

    useEffect(() => {
        const redirectUrl = getRedirectUrl();
        if (redirectUrl) {
            // Navigate to the stored redirect URL
            router.push(redirectUrl);
        }
    }, [router]);

    return null;
}

/**
 * Hook to handle post-login redirect. Call this in pages that might be
 * the destination after login (like the homepage or dashboard).
 */
export function usePostLoginRedirect(fallbackPath: string = '/') {
    const router = useRouter();

    useEffect(() => {
        const redirectUrl = getRedirectUrl();
        if (redirectUrl) {
            router.push(redirectUrl);
        }
    }, [router, fallbackPath]);
}
