'use client';

import { sanitizeExceptionProperties, sanitizeProductEvent, type ProductProperties } from './product-analytics-policy';
import { clearAnonymousSessionId, getOrCreateAnonymousSessionId } from './anonymous-analytics-session';

const consentKey = 'rmd-analytics-consent-v1';
const seen = new Set<string>();
let sdkPromise: Promise<typeof import('posthog-js').default | null> | null = null;

export function hasAnalyticsConsent(): boolean {
    try { return window.localStorage.getItem(consentKey) === 'granted'; }
    catch { return false; }
}

export function readAnalyticsChoice(): 'granted' | 'denied' | null {
    try {
        const value = window.localStorage.getItem(consentKey);
        return value === 'granted' || value === 'denied' ? value : null;
    } catch { return null; }
}

export function saveAnalyticsChoice(choice: 'granted' | 'denied'): boolean {
    try {
        window.localStorage.setItem(consentKey, choice);
        if (choice === 'denied') {
            try { clearAnonymousSessionId(window.sessionStorage); } catch { /* Choice still blocks capture. */ }
        }
        return true;
    }
    catch { return false; }
}

export function isProductAnalyticsConfigured(): boolean {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    return process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED === '1' &&
        Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY) && (host === 'https://us.i.posthog.com' || host === 'https://eu.i.posthog.com');
}

async function getSdk() {
    if (!isProductAnalyticsConfigured() || !hasAnalyticsConsent()) return null;
    const anonymousId = getOrCreateAnonymousSessionId(window.sessionStorage, () => window.crypto.randomUUID());
    if (!anonymousId) return null;
    if (!sdkPromise) sdkPromise = import('posthog-js').then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false,
            capture_exceptions: false,
            disable_session_recording: true,
            disable_surveys: true,
            advanced_disable_flags: true,
            disable_persistence: true,
            person_profiles: 'never',
            bootstrap: { distinctID: anonymousId, isIdentifiedID: false },
            before_send: payload => {
                if (!payload) return null;
                // PostHog needs its anonymous distinct ID and publishable project
                // token to ingest the event. Drop all other SDK-added properties.
                const distinctId = payload.properties?.distinct_id;
                const token = payload.properties?.token;
                if (token && token !== process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
                const safe = payload.event === '$exception'
                    ? sanitizeExceptionProperties(payload.properties ?? {})
                    : sanitizeProductEvent(payload.event, payload.properties ?? {})?.properties;
                if (!safe) return null;
                return { uuid: payload.uuid, event: payload.event, timestamp: payload.timestamp,
                    properties: { ...safe,
                        ...(typeof distinctId === 'string' ? { distinct_id: distinctId } : {}),
                        ...(typeof token === 'string' ? { token } : {}) } };
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
        const posthog = await getSdk();
        if (!posthog || !hasAnalyticsConsent()) return false;
        posthog.capture(safe.event, safe.properties);
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
        const posthog = await getSdk();
        if (!posthog || !hasAnalyticsConsent()) { seen.delete(dedupeKey); return false; }
        posthog.capture('product_error', safe.properties);
        // Only a synthetic, allowlisted type and category enter the SDK. The
        // before_send hook removes its generated stack before transmission.
        posthog.captureException(new Error(stage + ':' + category), safe.properties);
        return true;
    } catch { seen.delete(dedupeKey); return false; }
}
