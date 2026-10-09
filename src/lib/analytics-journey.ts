import type { ProductProperties } from './product-analytics-policy';

/** Path templates are fixed labels; raw paths, query strings and referrers never leave the browser. */
export function classifyJourneyPath(pathname: string): { route: string; detail?: ProductProperties } | null {
    const fixed: Record<string, string> = {
        '/': 'home', '/majors': 'degrees', '/institutions': 'schools', '/write-review': 'write_review',
        '/login': 'sign_in', '/my-reviews': 'my_reviews', '/guidelines': 'guidelines', '/terms': 'terms', '/privacy': 'privacy',
    };
    if (fixed[pathname]) return { route: fixed[pathname] };
    let match = /^\/majors\/(\d{2}\.\d{2,4})\/(\d{3,10})\/?$/.exec(pathname);
    if (match) return { route: 'program_detail', detail: { detail_type: 'program', major_id: match[1], institution_id: match[2] } };
    match = /^\/majors\/(\d{2}\.\d{2,4})\/(statistics|opportunities)\/?$/.exec(pathname);
    if (match) return { route: match[2] === 'statistics' ? 'degree_statistics' : 'degree_opportunities' };
    match = /^\/majors\/(\d{2}\.\d{2,4})\/?$/.exec(pathname);
    if (match) return { route: 'degree_detail', detail: { detail_type: 'degree', major_id: match[1] } };
    match = /^\/institutions\/(\d{3,10})\/?$/.exec(pathname);
    if (match) return { route: 'school_detail', detail: { detail_type: 'school', institution_id: match[1] } };
    if (/^\/my-reviews\/[^/]+\/edit\/?$/.test(pathname)) return { route: 'my_reviews' };
    return null;
}
