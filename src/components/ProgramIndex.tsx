'use client';
import { useState } from 'react';
import MajorResolverModal from './MajorResolverModal';
import Pagination from './Pagination';

interface Major { id: string; name: string; reviewCount: number; }
export default function ProgramIndex({ majors, unitid, totalPages, currentPage, query }: { majors: Major[]; unitid: string; totalPages: number; currentPage: number; query: string }) {
    const [open, setOpen] = useState(false);
    const path = '/institutions/' + unitid;
    return <section>
        <h2 className="text-3xl font-bold mb-4">Degree reviews</h2>
        <p className="mb-5">Degrees are listed alphabetically. Counts refer to reviews at this school.</p>
        <form method="GET" action={path} className="flex flex-col sm:flex-row gap-3 mb-4">
            <label htmlFor="degree-query" className="sr-only">Degree name</label>
            <input id="degree-query" name="q" type="search" defaultValue={query} maxLength={200} placeholder="Find a degree" className="coffee-input min-w-0" />
            <button type="submit" className="coffee-btn">Search</button>
        </form>
        <button onClick={() => setOpen(true)} className="underline py-3 mb-5">Find a degree by another name</button>
        {query && <a href={path} className="underline ml-5">Clear search</a>}
        {!majors.length && <p className="coffee-card">No matching degrees on this page. Try another name or clear your search.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{majors.map(major => <a key={major.id} href={'/majors/' + major.id + '/' + unitid} className="coffee-card">
            <h3 className="font-bold text-xl mb-5">{major.name.replace(/[.\s]+$/, '')}</h3>
            <p>{major.reviewCount} student {major.reviewCount === 1 ? 'review' : 'reviews'}</p><p className="mt-3 underline">Read reviews →</p>
        </a>)}</div>
        <Pagination currentPage={currentPage} totalPages={totalPages} buildHref={page => path + '?' + new URLSearchParams({ page: String(page), ...(query ? { q: query } : {}) }).toString()} />
        <MajorResolverModal isOpen={open} onClose={() => setOpen(false)} institutionId={unitid} />
    </section>;
}
