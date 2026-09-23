'use client';

import { useEffect, useRef, useState } from 'react';
interface Result { cip4: string; title: string; label: string; }
export default function MajorResolverModal({ isOpen, onClose, institutionId }: { isOpen: boolean; onClose: () => void; institutionId?: string }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Result[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => {
        const element = dialog.current;
        if (isOpen && element && !element.open) element.showModal();
        if (!isOpen && element?.open) element.close();
    }, [isOpen]);
    async function search(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setMessage('');
        try {
            const response = await fetch('/api/resolve-major', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, institutionId }) });
            if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a moment before searching again.' : 'Search is unavailable. Please retry.');
            const data = await response.json();
            setResults(data.results ?? []);
            if (!data.results?.length) setMessage('No matches found. Try another degree name.');
        } catch (error) { setResults([]); setMessage(error instanceof Error ? error.message : 'Search is unavailable.'); }
        finally { setBusy(false); }
    }
    return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="resolver-title" className="rounded-2xl bg-background text-foreground p-6 w-[min(90vw,40rem)] max-h-[85vh] backdrop:bg-black/50">
        <div className="flex justify-between gap-4 items-start mb-5"><h2 id="resolver-title" className="text-2xl font-bold">Find your degree by name</h2><button onClick={onClose} className="underline py-2" aria-label="Close degree search">Close</button></div>
        <p className="mb-4">Try an abbreviation or another name for your degree. Matches identify catalog names, not recommended programs.</p>
        <form onSubmit={search} className="space-y-3">
            <label htmlFor="resolver-query" className="font-bold block">Degree name or abbreviation</label>
            <input id="resolver-query" value={query} onChange={event => setQuery(event.target.value)} minLength={2} maxLength={200} required className="coffee-input" />
            <button disabled={busy} className="coffee-btn">{busy ? 'Searching…' : 'Search'}</button>
        </form>
        <p role="status" className="my-4">{message}</p>
        <ul className="space-y-4">{results.map(result => <li key={result.cip4}><a className="block rounded-xl border border-foreground/30 p-4 underline" href={'/majors/' + result.cip4 + (institutionId ? '/' + institutionId : '')}>{result.title}</a></li>)}</ul>
    </dialog>;
}
