'use client';

import { sanitizeExceptionProperties, sanitizeProductEvent, type ProductProperties } from './product-analytics-policy';
import { clearAnonymousSessionId, getOrCreateAnonymousSessionId } from './anonymous-analytics-session';

export const analyticsConsentKey = 'rmd-analytics-consent-v1';
let suspendedForPage = false;
const seen = new Set<string>();
let sdkPromise: Promise<typeof import('posthog-js').default | null> | null = null;

export function hasAnalyticsConsent(): boolean {
    if (suspendedForPage) return false;
    try { return window.localStorage.getItem(analyticsConsentKey) === 'granted'; }
    catch { return false; }
}

export function readAnalyticsChoice(): 'granted' | 'denied' | null {
    try {
        const value = window.localStorage.getItem(analyticsConsentKey);
        return value === 'granted' || value === 'denied' ? value : null;
    } catch { return null; }
}

// Stop transmission immediately, even if storage is blocked or a SDK import is pending.
// Successful withdrawal also reloads the page to unload the SDKs entirely.
export function suspendAnalyticsForPage(): void {
    suspendedForPage = true;
    (window as unknown as Record<string, unknown>)['ga-disable-G-N6LJN2TRCF'] = true;
    try { clearAnonymousSessionId(window.sessionStorage); } catch { /* Capture is still blocked. */ }
}

export function saveAnalyticsChoice(choice: 'granted' | 'denied'): boolean {
    if (choice === 'denied') suspendAnalyticsForPage();
    try {
        window.localStorage.setItem(analyticsConsentKey, choice);
        if (window.localStorage.getItem(analyticsConsentKey) !== choice) {
            suspendAnalyticsForPage();
            return false;
        }
        if (choice === 'granted') {
            suspendedForPage = false;
            (window as unknown as Record<string, unknown>)['ga-disable-G-N6LJN2TRCF'] = false;
        }
        return true;
    } catch {
        suspendAnalyticsForPage();
        return false;
    }
}

export function isProductAnalyticsConfigured(): boolean {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    return process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED === '1' &&
        Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) && (host === 'https://us.i.posthog.com' || host === 'https://eu.i.posthog.com');
}

export async function initializeProductAnalytics() {
    if (!isProductAnalyticsConfigured() || !hasAnalyticsConsent()) return null;
    let anonymousId: string | null;
    try { anonymousId = getOrCreateAnonymousSessionId(window.sessionStorage, () => window.crypto.randomUUID()); }
    catch { return null; }
    if (!anonymousId) return null;
    if (!sdkPromise) sdkPromise = import('posthog-js').then(({ default: posthog }) => {
        if (!hasAnalyticsConsent()) { sdkPromise = null; return null; }
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false,
            // Capture uncaught browser failures, but not noisy console output.
            capture_exceptions: {
                capture_unhandled_errors: true,
                capture_unhandled_rejections: true,
                capture_console_errors: false,
            },
            disable_session_recording: true,
            disable_surveys: true,
            advanced_disable_flags: true,
            disable_persistence: true,
            person_profiles: 'never',
            bootstrap: { distinctID: anonymousId, isIdentifiedID: false },
            before_send: payload => {
                if (!payload || !hasAnalyticsConsent()) return null;
                // PostHog needs its anonymous distinct ID and publishable project
                // token to ingest the event. Drop all other SDK-added properties.
                const token = payload.properties?.token;
                // Keep only the SDK's UUIDv7 session ID for Web Analytics session counts.
                const sessionId = payload.properties?.$session_id;
                const safeSessionId = typeof sessionId === 'string' &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
                    ? sessionId : undefined;
                if (token && token !== process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
                const safe = payload.event === '$exception'
                    ? sanitizeExceptionProperties(payload.properties ?? {})
                    : sanitizeProductEvent(payload.event, payload.properties ?? {})?.properties;
                if (!safe) return null;
                return { uuid: payload.uuid, event: payload.event, timestamp: payload.timestamp,
                    properties: { ...safe, $process_person_profile: false,
                        distinct_id: anonymousId,
                        ...(typeof token === 'string' ? { token } : {}),
                        ...(safeSessionId ? { $session_id: safeSessionId } : {}) } };
            },
        });
        return posthog;
    }).catch(() => { sdkPromise = null; return null; });
    return sdkPromise;
}

export async function trackProductEvent(event: string, properties: ProductProperties = {}): Promise<boolean> {
    const safe = sanitizeProductEvent(event, properties);
    if (!safe || !isProductAnalyticsConfigured() || !hasAnalyticsConsent()) return false;
    try {
        const posthog = await initializeProductAnalytics();
        if (!posthog || !hasAnalyticsConsent()) return false;
        posthog.capture(safe.event, safe.properties);
        if (safe.event === 'page_viewed') {
            // Preserve existing custom funnels while supplying PostHog Web Analytics.
            const pageview = sanitizeProductEvent('$pageview', safe.properties);
            if (pageview) posthog.capture(pageview.event, pageview.properties);
        }
        return true;
    } catch { return false; }
}

export async function trackProductEventOnce(dedupeKey: string, event: string, properties: ProductProperties = {}): Promise<boolean> {
    if (seen.has(dedupeKey) || !isProductAnalyticsConfigured() || !hasAnalyticsConsent()) return false;
    seen.add(dedupeKey);
    const sent = await trackProductEvent(event, properties);
    if (!sent) seen.delete(dedupeKey);
    return sent;
}

export async function trackProductErrorOnce(dedupeKey: string, stage: string, category: string): Promise<boolean> {
    const safe = sanitizeProductEvent('product_error', { stage, category });
    if (!safe || seen.has(dedupeKey) || !isProductAnalyticsConfigured() || !hasAnalyticsConsent()) return false;
    seen.add(dedupeKey);
    try {
        const posthog = await initializeProductAnalytics();
        if (!posthog || !hasAnalyticsConsent()) { seen.delete(dedupeKey); return false; }
        posthog.capture('product_error', safe.properties);
        // Only a synthetic, allowlisted type and category enter the SDK. The
        // before_send hook removes its generated stack before transmission.
        posthog.captureException(new Error(stage + ':' + category), safe.properties);
        return true;
    } catch { seen.delete(dedupeKey); return false; }
}
