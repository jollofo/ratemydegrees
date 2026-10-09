'use client';

import { useEffect } from 'react';
import { trackProductEvent } from '@/lib/product-analytics';

type SearchType = 'degrees' | 'schools' | 'schools_within_degree' | 'degrees_within_school';

export function TrackedSearchForm({ action, searchType, children, className }: { action?: string; searchType: SearchType; children: React.ReactNode; className?: string }) {
    return <form action={action} method="GET" className={className} onSubmit={() => { void trackProductEvent('search_submitted', { search_type: searchType }); }}>{children}</form>;
}

export function SearchResultsTelemetry({ searchType, count, unavailable = false }: { searchType: SearchType; count: number; unavailable?: boolean }) {
    useEffect(() => {
        void trackProductEvent('search_results', { search_type: searchType, result_count: Math.min(Math.max(count, 0), 100000), result_state: unavailable ? 'unavailable' : count === 0 ? 'no_results' : 'results' });
    }, [searchType, count, unavailable]);
    return null;
}
