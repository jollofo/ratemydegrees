'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Suggestion = { id: string; label: string; detail: string; href: string };

export default function SearchAutocomplete({ id, kind, scope, degree, name = 'q', defaultValue = '', placeholder, className = 'coffee-input min-w-0', maxLength = 200, minLength, required, ariaLabel, onQueryChange }: {
    id: string; kind: 'degrees' | 'schools' | 'graduate-schools'; scope?: string; degree?: 'all' | 'masters' | 'doctorate'; name?: string; defaultValue?: string;
    placeholder: string; className?: string; maxLength?: number; minLength?: number; required?: boolean; ariaLabel?: string; onQueryChange?: (query: string) => void;
}) {
    const listId = useId();
    const wrapper = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(defaultValue);
    const [focused, setFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [active, setActive] = useState(-1);
    const [status, setStatus] = useState('');

    useEffect(() => { setQuery(defaultValue); }, [defaultValue]);

    useEffect(() => {
        const trimmed = query.trim();
        if (!focused || trimmed.length < 2) { setSuggestions([]); setStatus(''); return; }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ kind, q: trimmed });
                if (scope) params.set('scope', scope);
                if (degree && degree !== 'all') params.set('degree', degree);
                const response = await fetch(`/api/suggestions?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error('Suggestions unavailable');
                const data = await response.json() as { suggestions: Suggestion[] };
                setSuggestions(data.suggestions);
                setActive(-1);
                setStatus(data.suggestions.length ? '' : 'No suggestions found. You can still search.');
            } catch {
                if (!controller.signal.aborted) { setSuggestions([]); setStatus('Suggestions are unavailable. You can still search.'); }
            }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, kind, scope, degree, focused]);

    function choose(suggestion: Suggestion) {
        if (suggestion.href) {
            window.location.assign(suggestion.href);
        } else {
            setQuery(suggestion.label);
            if (input.current) input.current.value = suggestion.label;
            setSuggestions([]);
            setFocused(false);
            input.current?.form?.requestSubmit();
        }
    }

    return <div ref={wrapper} className="relative min-w-0 flex-1" onBlur={event => {
        if (!wrapper.current?.contains(event.relatedTarget as Node)) { setFocused(false); setActive(-1); }
    }}>
        <input ref={input} id={id} name={name} type="search" value={query} onChange={event => { setQuery(event.target.value); onQueryChange?.(event.target.value); setSuggestions([]); setStatus(''); setActive(-1); setFocused(true); }}
            onFocus={() => setFocused(true)} onKeyDown={event => {
                if (event.key === 'Escape') { setFocused(false); setActive(-1); }
                if (!suggestions.length || !focused) return;
                if (event.key === 'ArrowDown') { event.preventDefault(); setActive(index => (index + 1) % suggestions.length); }
                if (event.key === 'ArrowUp') { event.preventDefault(); setActive(index => index <= 0 ? suggestions.length - 1 : index - 1); }
                if (event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(suggestions[active]); }
            }} maxLength={maxLength} minLength={minLength} required={required} placeholder={placeholder} className={className} aria-label={ariaLabel}
            role="combobox" aria-autocomplete="list" aria-expanded={focused && suggestions.length > 0} aria-controls={focused && suggestions.length > 0 ? listId : undefined}
            aria-activedescendant={active >= 0 && focused ? `${listId}-${active}` : undefined} />
        {focused && suggestions.length > 0 && <div id={listId} role="listbox" className="absolute z-30 top-full left-0 right-0 mt-2 max-h-72 overflow-auto rounded-2xl border-2 border-foreground bg-[#fffefb] shadow-[4px_4px_0px_#8b9467]">
            {suggestions.map((suggestion, index) => <button key={suggestion.id} id={`${listId}-${index}`} type="button" role="option" aria-selected={index === active}
                onMouseDown={event => event.preventDefault()} onClick={() => choose(suggestion)}
                className={`block w-full text-left px-4 py-3 border-b last:border-b-0 border-foreground/10 hover:bg-earth-sage/15 ${index === active ? 'bg-earth-sage/15' : ''}`}>
                <span className="block font-semibold">{suggestion.label}</span>{suggestion.detail && <span className="block text-sm text-foreground/70">{suggestion.detail}</span>}
            </button>)}
        </div>}
        <span role="status" className="sr-only">{focused ? status : ''}</span>
    </div>;
}
