import { NextResponse } from 'next/server';
import { searchClient, COLLECTION_MAJORS } from '@/lib/typesense';

export const dynamic = 'force-dynamic';

/** Public, secret-free check of the same search path used by the app. */
export async function GET() {
    const endpoint = {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? null,
        port: process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? '443',
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https',
    };
    const configured = Boolean(
        process.env.NEXT_PUBLIC_TYPESENSE_HOST && process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
    );

    if (!configured) {
        return NextResponse.json({ configured, healthy: false, endpoint, reason: 'missing_configuration' });
    }

    try {
        const response = await searchClient.multiSearch.perform({
            searches: [{
                collection: COLLECTION_MAJORS,
                q: 'biomedical engineering',
                query_by: 'title,aliases,category,description,commonJobs',
                per_page: 1,
            }],
        });
        const result = response.results[0];
        return NextResponse.json({
            configured,
            endpoint,
            healthy: !result.error && (result.found ?? 0) > 0,
            reason: result.error ? 'search_error' : undefined,
        });
    } catch (error) {
        const status = (error as { httpStatus?: number }).httpStatus;
        const name = (error as { name?: string }).name;
        const code = (error as { code?: string; cause?: { code?: string } }).code
            ?? (error as { cause?: { code?: string } }).cause?.code;
        return NextResponse.json({
            configured,
            endpoint,
            healthy: false,
            reason: status ? `http_${status}` : 'connection_error',
            errorName: name ?? null,
            errorCode: code ?? null,
        });
    }
}
