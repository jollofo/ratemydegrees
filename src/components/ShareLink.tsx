'use client';

import { useRef, useState } from 'react';
import { shareLink, type ShareResult } from '@/lib/share-link';

const feedback: Record<ShareResult, string> = {
    shared: 'Share sheet opened.',
    copied: 'Link copied.',
    canceled: 'Sharing canceled.',
    unavailable: 'Copy is unavailable in this browser. You can copy the address from your address bar.',
    error: 'Could not share the link. Try copying it instead.',
};

export default function ShareLink({ url, title, label = 'Share degree page' }: { url: string; title: string; label?: string }) {
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const inProgress = useRef(false);

    async function act(copyOnly: boolean) {
        if (inProgress.current) return;
        inProgress.current = true;
        setBusy(true);
        setMessage('');
        try {
            setMessage(feedback[await shareLink(navigator, url, title, copyOnly)]);
        } finally {
            inProgress.current = false;
            setBusy(false);
        }
    }

    return <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className="underline py-2" disabled={busy} onClick={() => act(false)}>{label}</button>
        <button type="button" className="underline py-2" disabled={busy} onClick={() => act(true)}>Copy link</button>
        <span role="status" className="text-sm" aria-live="polite">{message}</span>
    </div>;
}
