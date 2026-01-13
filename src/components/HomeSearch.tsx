'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/majors?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
            <input
                type="text"
                placeholder="Search programs (e.g. Anthropology, Music, Coding...)"
                className="coffee-input text-lg py-6 pr-20 shadow-[6px_6px_0px_#c36b4e] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-earth-sage text-white rounded-2xl flex items-center justify-center hover:bg-earth-sage/90 shadow-[3px_3px_0px_#433422] transition-all active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
        </form>
    );
}
