'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import GoogleAnalytics from './GoogleAnalytics';
import PostHogInitializer from './PostHogInitializer';
import { readAnalyticsChoice, saveAnalyticsChoice, trackProductEvent, trackProductEventOnce } from '@/lib/product-analytics';
import { consumeRecentGoogleSignIn } from '@/lib/google-auth-analytics';
import { classifyJourneyPath } from '@/lib/analytics-journey';

export default function AnalyticsConsent({ signedIn, available }: { signedIn: boolean; available: boolean }) {
    const pathname = usePathname();
    const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
    const [ready, setReady] = useState(false);
    const [storageFailed, setStorageFailed] = useState(false);

    useEffect(() => {
        setChoice(readAnalyticsChoice());
        setReady(true);
        if (!signedIn) return;
        const pending = consumeRecentGoogleSignIn();
        if (pending) void trackProductEventOnce('sign_in_completed:google:' + pending, 'sign_in_completed', { method: 'google' });
    }, [signedIn]);
    useEffect(() => {
        const page = classifyJourneyPath(pathname);
        if (!page) return;
        void trackProductEvent('page_viewed', { route: page.route });
        if (page.detail) void trackProductEvent('detail_viewed', page.detail);
    }, [pathname]);

    function choose(value: 'granted' | 'denied') {
        if (!saveAnalyticsChoice(value)) { setStorageFailed(true); return; }
        window.location.reload(); // Unloads previously enabled analytics when consent is withdrawn.
    }

    const enabled = ready && choice === 'granted' && available;
    return <>
        {enabled && <PostHogInitializer />}
        {enabled && <GoogleAnalytics GA_MEASUREMENT_ID="G-N6LJN2TRCF" />}
        <div className="mt-8 text-sm">
            <p className="mb-3">Optional product analytics: {choice === 'granted' ? available ? 'on' : 'off in this environment' : choice === 'denied' ? 'off' : 'off until you choose'}. You can change this choice here.</p>
            <div className="flex flex-wrap justify-center gap-4">
                <button type="button" className="underline" aria-pressed={choice === 'granted'} onClick={() => choose('granted')}>Allow analytics</button>
                <button type="button" className="underline" aria-pressed={choice === 'denied'} onClick={() => choose('denied')}>Decline analytics</button>
            </div>
            {storageFailed && <p role="alert" className="mt-2">This browser could not save your choice. Optional analytics remain off.</p>}
        </div>
    </>;
}
