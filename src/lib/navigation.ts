/** Only application-local paths may be used after authentication. */
export function safeDestination(value: unknown, fallback = '/'): string {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
    try {
        const decoded = decodeURIComponent(value);
        if (/[\\\u0000-\u0020]/.test(decoded) || decoded.startsWith('//')) return fallback;
        const url = new URL(value, 'https://local.invalid');
        if (url.origin !== 'https://local.invalid') return fallback;
        return `${url.pathname}${url.search}${url.hash}`;
    } catch { return fallback; }
}

export function parsePage(value: unknown): number {
    const page = Number(value);
    return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 10000) : 1;
}

export function searchText(value: unknown): string {
    return typeof value === 'string' ? value.trim().slice(0, 200) : '';
}
