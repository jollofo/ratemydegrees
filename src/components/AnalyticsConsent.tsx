'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import GoogleAnalytics from './GoogleAnalytics';
import PostHogInitializer from './PostHogInitializer';
import { analyticsConsentKey, hasAnalyticsConsent, readAnalyticsChoice, saveAnalyticsChoice, suspendAnalyticsForPage, trackProductEvent, trackProductEventOnce } from '@/lib/product-analytics';
import { consumeRecentGoogleSignIn } from '@/lib/google-auth-analytics';
import { classifyJourneyPath } from '@/lib/analytics-journey';

const dismissalKey = 'rmd-analytics-banner-dismissed-v1';
let dismissedForPage = false;
function wasDismissed() {
    try { return dismissedForPage || window.sessionStorage.getItem(dismissalKey) === '1'; }
    catch { return dismissedForPage; }
}

export default function AnalyticsConsent({ signedIn, available }: { signedIn: boolean; available: boolean }) {
    const pathname = usePathname();
    const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
    const [ready, setReady] = useState(false);
    const [open, setOpen] = useState(false);
    const [storageFailed, setStorageFailed] = useState(false);
    const [dismissalFailed, setDismissalFailed] = useState(false);
    const preferences = useRef<HTMLButtonElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const panel = useRef<HTMLElement>(null);
    const openedFromFooter = useRef(false);
    const analyticsLoaded = useRef(false);
    const enabled = ready && choice === 'granted' && available && !storageFailed;

    useEffect(() => {
        function syncChoice() {
            const stored = readAnalyticsChoice();
            // A failed local withdrawal remains off for this page, even if a queued
            // event still sees an old grant. Only a successful local Allow resumes it.
            setChoice(stored === 'granted' && !hasAnalyticsConsent() ? null : stored);
            setReady(true);
            setOpen(stored === null && !wasDismissed());
            if (stored !== 'granted' && analyticsLoaded.current) {
                suspendAnalyticsForPage();
                window.location.reload(); // Unload an already mounted SDK after withdrawal in another tab.
            }
        }
        syncChoice();
        function onStorage(event: StorageEvent) {
            // Re-read current storage: queued events can contain an obsolete value.
            if (event.key === analyticsConsentKey || event.key === null) syncChoice();
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        if (enabled) analyticsLoaded.current = true;
        if (!signedIn || !enabled) return;
        const pending = consumeRecentGoogleSignIn();
        if (pending) void trackProductEventOnce('sign_in_completed:google:' + pending, 'sign_in_completed', { method: 'google' });
    }, [signedIn, enabled]);
    useEffect(() => {
        if (!enabled) return;
        const page = classifyJourneyPath(pathname);
        if (!page) return;
        void trackProductEvent('page_viewed', { route: page.route });
        if (page.detail) void trackProductEvent('detail_viewed', page.detail);
    }, [pathname, enabled]);
    useEffect(() => {
        if (open && openedFromFooter.current) heading.current?.focus();
    }, [open]);

    function close() {
        dismissedForPage = true;
        try { window.sessionStorage.setItem(dismissalKey, '1'); }
        catch { setDismissalFailed(true); }
        setOpen(false);
        if (openedFromFooter.current || panel.current?.contains(document.activeElement)) {
            preferences.current?.focus({ preventScroll: true });
        }
        openedFromFooter.current = false;
    }
    function choose(value: 'granted' | 'denied') {
        if (!saveAnalyticsChoice(value)) {
            setStorageFailed(true);
            setChoice(null);
            return;
        }
        setStorageFailed(false);
        setChoice(value);
        close();
        if (value === 'denied' && analyticsLoaded.current) {
            window.location.reload(); // Unloads all previously enabled analytics scripts.
        }
    }
    const buttonStyle = 'min-h-[44px] rounded-lg border border-slate-500 bg-white px-4 py-2 font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';
    const storageMessage = 'Your choice could not be saved. Optional analytics are off for this page. A previous saved choice may return after reloading; please retry when browser storage is available.';
    return <>
        {enabled && <PostHogInitializer />}
        {enabled && <GoogleAnalytics GA_MEASUREMENT_ID="G-N6LJN2TRCF" />}
        <div className="mt-8 text-sm">
            <p className="mb-3">Optional product analytics: {storageFailed ? 'off for this page' : choice === 'granted' ? available ? 'on' : 'off in this environment' : choice === 'denied' ? 'off' : 'off until you choose'}.</p>
            <button ref={preferences} type="button" className="min-h-[44px] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-expanded={open} aria-controls="analytics-preferences" onClick={() => { openedFromFooter.current = true; setOpen(true); heading.current?.focus(); }}>Analytics preferences</button>
            {!open && storageFailed && <p role="alert" className="mt-2">{storageMessage}</p>}
            {!open && dismissalFailed && <p role="status" className="mt-2">This browser could not remember the dismissal. The banner may appear again on your next page load.</p>}
        </div>
        {/* Reserve scroll space so the fixed panel cannot cover the final form controls. */}
        {ready && open && <div aria-hidden="true" className="h-[60vh] max-h-[28rem]" />}
        {ready && open && <section ref={panel} id="analytics-preferences" role="region" aria-labelledby="analytics-preferences-title" aria-describedby="analytics-preferences-description"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto overscroll-contain border-t border-slate-300 bg-white text-left text-slate-900 shadow-lg"
            style={{ maxHeight: 'min(60dvh, 28rem)', padding: '1rem max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))' }}
            onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }}>
            <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:max-w-xl">
                    <h2 ref={heading} tabIndex={-1} id="analytics-preferences-title" className="text-lg font-semibold focus-visible:outline focus-visible:outline-2">Optional analytics</h2>
                    <p id="analytics-preferences-description" className="mt-1 text-sm leading-relaxed">Help us measure visits and how features are used with Google Analytics and PostHog. We don&apos;t send your email or review text to PostHog. It&apos;s optional, and you can change your choice in the footer. <a href="/privacy" className="underline">Privacy policy</a></p>
                    {(choice === 'granted' || analyticsLoaded.current) && <p className="mt-2 text-sm">Declining reloads this page to unload analytics. Save any unfinished work first.</p>}
                    {storageFailed && <p role="alert" className="mt-2 text-sm">{storageMessage}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" className={buttonStyle} aria-pressed={choice === 'granted'} onClick={() => choose('granted')}>Allow analytics</button>
                        <button type="button" className={buttonStyle} aria-pressed={choice === 'denied'} onClick={() => choose('denied')}>Decline</button>
                    </div>
                    <button type="button" className="min-h-[44px] rounded-lg px-4 py-2 text-sm underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={close}>{choice === 'granted' ? 'Close preferences' : 'Dismiss for now (keep analytics off)'}</button>
                </div>
            </div>
        </section>}
    </>;
}
