'use client';
import { useState } from 'react';
import MajorResolverModal from './MajorResolverModal';
import Pagination from './Pagination';
import SearchAutocomplete from './SearchAutocomplete';

interface Major { id: string; name: string; reviewCount: number; catalogListed: boolean; }
export default function ProgramIndex({ majors, unitid, totalPages, currentPage, query }: { majors: Major[]; unitid: string; totalPages: number; currentPage: number; query: string }) {
    const [open, setOpen] = useState(false);
    const path = '/institutions/' + unitid;
    return <section>
        <h2 className="text-3xl font-bold mb-4">Degree reviews</h2>
        <p className="mb-5">Search by your degree’s name, including alternate names. Matches from this school’s catalog or student reviews appear first.</p>
        <form method="GET" action={path} className="flex flex-col sm:flex-row gap-3 mb-4">
            <label htmlFor="degree-query" className="sr-only">Degree name</label>
            <SearchAutocomplete id="degree-query" kind="degrees" scope={unitid} defaultValue={query} placeholder="Find a degree" />
            <button type="submit" className="coffee-btn">Search</button>
        </form>
        <button onClick={() => setOpen(true)} className="underline py-3 mb-5">Find a degree by another name</button>
        {query && <a href={path} className="underline ml-5">Clear search</a>}
        {!majors.length && <p className="coffee-card">No matching degrees on this page. Our catalog may use a different name or be missing your program. Try a broader degree name, or continue below to write a review.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{majors.map(major => <a key={major.id} href={major.catalogListed ? '/majors/' + major.id + '/' + unitid : '/write-review?' + new URLSearchParams({ majorId: major.id, institutionId: unitid })} className="coffee-card">
            <h3 className="font-bold text-xl mb-5">{major.name.replace(/[.\s]+$/, '')}</h3>
            {major.catalogListed ? <p>{major.reviewCount} student {major.reviewCount === 1 ? 'review' : 'reviews'}</p> : <p className="text-sm">Not yet linked in our school catalog. If you studied this degree here, you can still share your experience.</p>}<p className="mt-3 underline">{major.catalogListed ? 'Read reviews' : 'Review this degree at your school'} →</p>
        </a>)}</div>
        <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={page => path + '?' + new URLSearchParams({ page: String(page), ...(query ? { q: query } : {}) }).toString()} />
        <p className="mt-6">Can’t find your program? <a href={'/write-review?institutionId=' + unitid} className="underline font-semibold">Write a review with your school already selected</a>. You can search the full degree list there.</p>
        <MajorResolverModal isOpen={open} onClose={() => setOpen(false)} institutionId={unitid} />
    </section>;
}
