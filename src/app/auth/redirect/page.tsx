'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRedirectUrl } from '@/lib/redirect';

export default function AuthRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams.get('next') || '/';

    useEffect(() => {
        // First check sessionStorage for a redirect URL
        const redirectUrl = getRedirectUrl();

        if (redirectUrl) {
            // Use the sessionStorage URL (this is what was saved before login)
            router.push(redirectUrl);
        } else {
            // Fall back to the next param
            router.push(nextParam);
        }
    }, [router, nextParam]);

    // Show a loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-earth-sage border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-bold text-earth-sage uppercase tracking-widest">Signing you in...</p>
            </div>
        </div>
    );
}
