'use client';
import { useState } from 'react';
import MajorResolverModal from './MajorResolverModal';
import Pagination from './Pagination';
import SearchAutocomplete from './SearchAutocomplete';
import { TrackedSearchForm, SearchResultsTelemetry } from './JourneySearch';
import { trackProductEvent } from '@/lib/product-analytics';

interface Major { id: string; name: string; reviewCount: number; catalogListed: boolean; }
export default function ProgramIndex({ majors, unitid, totalHits, totalPages, currentPage, query }: { majors: Major[]; unitid: string; totalHits: number; totalPages: number; currentPage: number; query: string }) {
    const [open, setOpen] = useState(false);
    const path = '/institutions/' + unitid;
    return <section>
        {query && <SearchResultsTelemetry searchType="degrees_within_school" count={totalHits} />}
        <h2 className="text-3xl font-bold mb-4">Degree reviews</h2>
        <p className="mb-5">Search by your degree’s name, including alternate names.</p>
        <TrackedSearchForm action={path} searchType="degrees_within_school" className="flex flex-col sm:flex-row gap-3 mb-4">
            <label htmlFor="degree-query" className="sr-only">Degree name</label>
            <SearchAutocomplete id="degree-query" kind="degrees" scope={unitid} defaultValue={query} placeholder="Find a degree" />
            <button type="submit" className="coffee-btn">Search</button>
        </TrackedSearchForm>
        <button onClick={() => setOpen(true)} className="underline py-3 mb-5">Find a degree by another name</button>
        {query && <a href={path} className="underline ml-5">Clear search</a>}
        {!majors.length && <p className="coffee-card">No matching degrees found. Try another degree name or continue below to write a review.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{majors.map(major => <a key={major.id} href={major.catalogListed ? '/majors/' + major.id + '/' + unitid : '/write-review?' + new URLSearchParams({ majorId: major.id, institutionId: unitid })} onClick={() => { if (!major.catalogListed) void trackProductEvent('review_cta_clicked', { source: 'school_detail', major_id: major.id, institution_id: unitid }); }} className="coffee-card">
            <h3 className="font-bold text-xl mb-5">{major.name.replace(/[.\s]+$/, '')}</h3>
            <p>{major.reviewCount} student {major.reviewCount === 1 ? 'review' : 'reviews'}</p><p className="mt-3 underline">{major.catalogListed ? 'Read reviews' : 'Review this degree at your school'} →</p>
        </a>)}</div>
        <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={page => path + '?' + new URLSearchParams({ page: String(page), ...(query ? { q: query } : {}) }).toString()} />
        <p className="mt-6">Can&apos;t find your program? <a href={'/write-review?institutionId=' + unitid} onClick={() => { void trackProductEvent('review_cta_clicked', { source: 'school_detail', institution_id: unitid }); }} className="underline font-semibold">Write a review with your school already selected</a>. You can search the full degree list there.</p>
        <MajorResolverModal isOpen={open} onClose={() => setOpen(false)} institutionId={unitid} />
    </section>;
}
