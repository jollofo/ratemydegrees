'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { voteReview, reportReview } from '@/lib/actions';
import type { PublicReview } from '@/lib/reviews';

export default function ReviewItem({ review, signedIn }: { review: PublicReview; signedIn: boolean }) {
    const [votes, setVotes] = useState(review.votes);
    const [hasVoted, setHasVoted] = useState(review.hasVoted);
    const [busy, setBusy] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const pathname = usePathname();
    const params = useSearchParams();
    const login = '/login?next=' + encodeURIComponent(pathname + (params.size ? '?' + params.toString() : ''));
    useEffect(() => { setVotes(review.votes); setHasVoted(review.hasVoted); }, [review.votes, review.hasVoted]);

    async function handleVote() {
        setBusy(true); setMessage('');
        try {
            const result = await voteReview(review.id, 1);
            setVotes(result.votes); setHasVoted(true);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save your vote. Please try again.'); }
        finally { setBusy(false); }
    }
    async function handleReport(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setMessage('');
        try {
            await reportReview(review.id, reason);
            setReporting(false); setReason('');
            setMessage('Report received. A moderator will review it using the same rules for all schools.');
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send report. Please try again.'); }
        finally { setBusy(false); }
    }

    return (
        <article className="coffee-card bg-white mb-6 !p-6">
            <header className="flex flex-wrap justify-between gap-3 mb-5">
                <div>
                    <p className="font-bold text-lg">Anonymous student</p>
                    <p className="text-sm text-foreground/80">{review.graduationStatus === 'graduated' ? 'Graduate' : review.graduationStatus === 'current' ? 'Current student' : 'Changed programs'}</p>
                </div>
                <time dateTime={review.createdAt} className="text-sm text-foreground/70">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>
            </header>
            <p className="text-sm mb-3">{review.major} at {review.institution}</p>
            {review.rating !== null && <p className="font-bold mb-5">Overall satisfaction: {review.rating} / 5</p>}
            <div className="space-y-5">
                {review.responses.map(response => <section key={response.label}>
                    <h3 className="font-bold text-sm mb-2">{response.label}</h3>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{response.text}</p>
                </section>)}
            </div>
            <div className="mt-6 pt-4 border-t border-foreground/15 flex flex-wrap items-center gap-4">
                {signedIn ? <>
                    <button onClick={handleVote} disabled={busy || hasVoted} className="rounded-xl border border-foreground/30 px-4 py-3 disabled:opacity-60" aria-pressed={hasVoted}>Helpful ({votes})</button>
                    <button onClick={() => setReporting(value => !value)} disabled={busy} className="underline px-2 py-3" aria-expanded={reporting}>Report review</button>
                </> : <a href={login} className="underline py-2">Sign in to mark helpful ({votes}) or report</a>}
            </div>
            {reporting && <form onSubmit={handleReport} className="mt-4 space-y-3">
                <label htmlFor={'report-' + review.id} className="block font-bold">Why are you reporting this review?</label>
                <p className="text-sm">Report privacy concerns, abuse, spam, or content unrelated to the degree. Disagreement alone is not a reason for removal.</p>
                <textarea id={'report-' + review.id} value={reason} onChange={event => setReason(event.target.value)} minLength={5} maxLength={500} required className="coffee-input" />
                <button disabled={busy} className="coffee-btn">Send report</button>
            </form>}
            <p role="status" className="mt-3 text-sm">{message}</p>
        </article>
    );
}
