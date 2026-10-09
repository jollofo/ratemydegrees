export type ProductEvent = 'review_started' | 'review_draft_restored' | 'review_submitted' | 'sign_in_started' | 'sign_in_completed' | 'product_error' |
    'page_viewed' | 'detail_viewed' | 'search_submitted' | 'search_results' | 'review_cta_clicked' | 'share_action_success' | 'navigation_clicked';
export type ProductProperties = Record<string, unknown>;

const routeTemplates = new Set(['home', 'degrees', 'schools', 'degree_detail', 'school_detail', 'program_detail', 'degree_statistics', 'degree_opportunities', 'write_review', 'sign_in', 'my_reviews', 'guidelines', 'terms', 'privacy']);
const searchTypes = new Set(['degrees', 'schools', 'schools_within_degree', 'degrees_within_school']);
const ctaSources = new Set(['home', 'degree_detail', 'school_detail', 'program_detail', 'navigation']);
const navigationDestinations = new Set(['degrees', 'schools', 'write_review', 'my_reviews', 'sign_in']);
function addValidIds(properties: Record<string, string | number>, input: ProductProperties) {
    if (typeof input.major_id === 'string' && /^\d{2}\.\d{2,4}$/.test(input.major_id)) properties.major_id = input.major_id;
    if (typeof input.institution_id === 'string' && /^\d{3,10}$/.test(input.institution_id)) properties.institution_id = input.institution_id;
}

/** Every event is rebuilt from this allowlist. Never pass form or auth payloads to analytics. */
export function sanitizeProductEvent(event: string, input: ProductProperties = {}): { event: ProductEvent; properties: Record<string, string | number> } | null {
    const properties: Record<string, string | number> = {};
    if (event === 'review_started' || event === 'review_draft_restored' || event === 'review_submitted') {
        addValidIds(properties, input);
        if (event === 'review_submitted') {
            if (input.status !== 'approved' && input.status !== 'pending') return null;
            properties.status = input.status;
        }
        return { event, properties };
    }
    if (event === 'page_viewed') {
        if (!routeTemplates.has(String(input.route))) return null;
        properties.route = String(input.route);
        return { event, properties };
    }
    if (event === 'detail_viewed') {
        if (!['degree', 'school', 'program'].includes(String(input.detail_type))) return null;
        addValidIds(properties, input);
        if ((input.detail_type === 'degree' || input.detail_type === 'program') && !properties.major_id) return null;
        if ((input.detail_type === 'school' || input.detail_type === 'program') && !properties.institution_id) return null;
        properties.detail_type = String(input.detail_type);
        return { event, properties };
    }
    if (event === 'search_submitted') {
        if (!searchTypes.has(String(input.search_type))) return null;
        properties.search_type = String(input.search_type);
        return { event, properties };
    }
    if (event === 'search_results') {
        if (!searchTypes.has(String(input.search_type)) || !['results', 'no_results', 'unavailable'].includes(String(input.result_state)) ||
            !Number.isSafeInteger(input.result_count) || Number(input.result_count) < 0 || Number(input.result_count) > 100000) return null;
        properties.search_type = String(input.search_type);
        properties.result_state = String(input.result_state);
        properties.result_count = Number(input.result_count);
        return { event, properties };
    }
    if (event === 'review_cta_clicked') {
        if (!ctaSources.has(String(input.source))) return null;
        properties.source = String(input.source);
        addValidIds(properties, input);
        return { event, properties };
    }
    if (event === 'share_action_success') {
        if (input.mode !== 'shared' && input.mode !== 'copied') return null;
        properties.mode = input.mode;
        return { event, properties };
    }
    if (event === 'navigation_clicked') {
        if (!navigationDestinations.has(String(input.destination))) return null;
        properties.destination = String(input.destination);
        return { event, properties };
    }
    if (event === 'sign_in_started' || event === 'sign_in_completed') {
        if (input.method !== 'google' && input.method !== 'email') return null;
        properties.method = input.method;
        return { event, properties };
    }
    if (event === 'product_error') {
        if (!['review_submit', 'auth_send', 'auth_verify', 'google_oauth'].includes(String(input.stage))) return null;
        if (!['auth', 'validation', 'duplicate', 'rate_limit', 'provider', 'network', 'unknown'].includes(String(input.category))) return null;
        properties.stage = String(input.stage);
        properties.category = String(input.category);
        return { event, properties };
    }
    return null;
}

export function reviewErrorCategory(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/sign.?in|signed in|unauthoriz|session/i.test(message)) return 'auth';
    if (/already have a review|duplicate/i.test(message)) return 'duplicate';
    if (/too many|rate limit/i.test(message)) return 'rate_limit';
    if (/invalid|select|highlighted/i.test(message)) return 'validation';
    return 'unknown';
}

/** A PostHog Error Tracking issue without the source exception's message or stack. */
export function sanitizeExceptionProperties(input: ProductProperties): Record<string, unknown> | null {
    const safe = sanitizeProductEvent('product_error', input);
    if (!safe) return null;
    return {
        stage: safe.properties.stage,
        category: safe.properties.category,
        $exception_level: 'error',
        $exception_list: [{
            type: 'RateMyDegreesProductError',
            value: safe.properties.stage + ':' + safe.properties.category,
            mechanism: { type: 'generic', handled: true },
        }],
    };
}
