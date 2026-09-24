'use client';

import { useState } from 'react';
import SearchAutocomplete from './SearchAutocomplete';

export default function HomeSearch() {
    const [mode, setMode] = useState('degrees');
    return <form method="GET" action={mode === 'degrees' ? '/majors' : '/institutions'} className="coffee-card text-left max-w-2xl mx-auto">
        <fieldset className="flex gap-6 mb-5">
            <legend className="font-bold mb-3">Find student reviews by</legend>
            <label className="flex items-center gap-2 py-2"><input type="radio" name="search-mode" checked={mode === 'degrees'} onChange={() => setMode('degrees')} /> Degree</label>
            <label className="flex items-center gap-2 py-2"><input type="radio" name="search-mode" checked={mode === 'schools'} onChange={() => setMode('schools')} /> School</label>
        </fieldset>
        <label htmlFor="home-query" className="block font-bold mb-2">{mode === 'degrees' ? 'Degree name' : 'School name'}</label>
        <div className="flex flex-col sm:flex-row gap-3">
            <SearchAutocomplete key={mode} id="home-query" kind={mode === 'degrees' ? 'degrees' : 'schools'} placeholder={mode === 'degrees' ? 'e.g. Psychology' : 'e.g. University of Florida'} />
            <button type="submit" className="coffee-btn shrink-0">Read reviews</button>
        </div>
        <p className="text-sm mt-4">Reading reviews is free and does not require an account.</p>
    </form>;
}
