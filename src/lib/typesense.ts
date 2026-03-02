import Typesense from 'typesense';

const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST!;
const port = parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? '443');
const protocol = (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https') as 'https' | 'http';
const searchKey = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY!;
const adminKey = process.env.TYPESENSE_ADMIN_KEY;

if (!host || !searchKey) {
    throw new Error(
        'Missing Typesense env vars. Set NEXT_PUBLIC_TYPESENSE_HOST and NEXT_PUBLIC_TYPESENSE_SEARCH_KEY.'
    );
}

/** Search-only client — safe to use in browser and server components */
export const searchClient = new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey: searchKey,
    connectionTimeoutSeconds: 5,
});

/**
 * Admin client — only available server-side (TYPESENSE_ADMIN_KEY is not exposed to the browser).
 * Use this in scripts and server actions only.
 */
export function getAdminClient() {
    if (!adminKey) {
        throw new Error('Missing TYPESENSE_ADMIN_KEY. This must only be called server-side.');
    }
    return new Typesense.Client({
        nodes: [{ host, port, protocol }],
        apiKey: adminKey,
        connectionTimeoutSeconds: 10,
    });
}

export const COLLECTION_MAJORS = 'majors';
export const COLLECTION_INSTITUTIONS = 'institutions';
