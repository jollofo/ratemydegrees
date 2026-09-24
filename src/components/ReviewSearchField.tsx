'use client';

import { useEffect, useState } from 'react';
import { searchInstitutions, searchMajors } from '@/app/actions/search';

type Option = { id: string; label: string; detail?: string };

export default function ReviewSearchField({ id, kind, value, selectedId, onChange, onSelect, error }: {
    id: string; kind: 'school' | 'degree'; value: string; selectedId: string;
    onChange: (value: string) => void; onSelect: (option: Option) => void; error?: string;
}) {
    const [focused, setFocused] = useState(false);
    const [options, setOptions] = useState<Option[]>([]);
    const [active, setActive] = useState(-1);
    const [message, setMessage] = useState('');
    useEffect(() => {
        setOptions([]); setActive(-1); setMessage('');
        if (!focused || selectedId || value.trim().length < 2) return;
        let current = true;
        const timer = setTimeout(async () => {
            try {
                const result = kind === 'school' ? await searchInstitutions(value, { hitsPerPage: 6 }) : await searchMajors(value, { hitsPerPage: 6 });
                if (!current) return;
                const matches = result.hits.map(row => 'unitid' in row
                    ? { id: row.unitid, label: row.name, detail: [row.city, row.state].filter(Boolean).join(', ') }
                    : { id: row.cip4, label: row.title.replace(/[.\s]+$/, '') });
                setOptions(matches);
                setMessage(result.unavailable ? 'Search is temporarily unavailable. Please try again.' : matches.length ? '' : `No matching ${kind === 'school' ? 'schools' : 'degrees'}. Try another name.`);
            } catch { if (current) setMessage('Search is temporarily unavailable. Please try again.'); }
        }, 250);
        return () => { current = false; clearTimeout(timer); };
    }, [value, kind, focused, selectedId]);

    const expanded = focused && !selectedId && options.length > 0;
    function choose(option: Option) {
        onSelect(option); setOptions([]); setActive(-1); setFocused(false); setMessage('');
    }
    return <div className="relative" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false);
    }}>
        <label htmlFor={id} className="block font-bold mb-2">Find your {kind}</label>
        <input id={id} type="search" role="combobox" autoComplete="off" value={value}
            placeholder={`Type a ${kind} name`} className="coffee-input" maxLength={200}
            onChange={event => { setOptions([]); setActive(-1); setFocused(true); onChange(event.target.value); }}
            onFocus={() => setFocused(true)} onKeyDown={event => {
                if (event.key === 'Escape') { event.preventDefault(); setFocused(false); }
                if (!expanded) return;
                if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => (index + 1) % options.length); }
                if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => index <= 0 ? options.length - 1 : index - 1); }
                if (event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(options[active]); }
            }} aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? id + '-options' : undefined}
            aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
            aria-invalid={Boolean(error)} aria-describedby={error ? id + '-error' : undefined} />
        {expanded && <div id={id + '-options'} role="listbox" aria-label={`${kind} matches`} className="absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-auto rounded-2xl border-2 border-foreground bg-[#fffefb] shadow-lg">
            {options.map((option, index) => <button id={`${id}-option-${index}`} key={option.id} type="button" role="option" tabIndex={-1} aria-selected={active === index}
                onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}
                className={`block w-full text-left px-4 py-3 border-b last:border-b-0 border-foreground/10 hover:bg-earth-sage/15 ${active === index ? 'bg-earth-sage/15' : ''}`}>
                <span className="block font-semibold">{option.label}</span>{option.detail && <span className="block text-sm">{option.detail}</span>}
            </button>)}
        </div>}
        {error && <p id={id + '-error'} role="alert" className="text-red-800 text-sm mt-2">{error}</p>}
        <p role="status" className="text-sm mt-2">{message}</p>
    </div>;
}
