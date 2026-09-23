'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOwnReview } from '@/app/my-reviews/actions';

export default function DeleteReviewButton({ id }: { id: string }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function remove() {
        setBusy(true);
        try { await deleteOwnReview(id); router.refresh(); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not delete your review.'); setBusy(false); }
    }
    return <div>
        {!confirming ? <button className="underline py-2" onClick={() => setConfirming(true)}>Delete review</button> : <div className="space-y-2">
            <p className="text-sm">Remove this review from public view? An internal record is retained for moderation.</p>
            <button disabled={busy} onClick={remove} className="underline py-2 mr-4">{busy ? 'Removing…' : 'Delete my review'}</button>
            <button disabled={busy} onClick={() => setConfirming(false)} className="underline py-2">Cancel</button>
        </div>}
        {error && <p role="alert">{error}</p>}
    </div>;
}
