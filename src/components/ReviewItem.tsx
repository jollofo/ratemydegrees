'use client'

import { useState } from 'react'
import { voteReview, reportReview } from '@/lib/actions'

export default function ReviewItem({ review, userId }: { review: any, userId?: string }) {
    const [votes, setVotes] = useState(review._count.votes)
    const [hasVoted, setHasVoted] = useState(false)
    const [isReporting, setIsReporting] = useState(false)

    const r = JSON.parse(review.ratings)
    const responses = JSON.parse(review.writtenResponses)

    const handleVote = async () => {
        if (!userId) {
            alert('You must be signed in to vote.')
            return
        }
        try {
            await voteReview(review.id, 1)
            setVotes((v: number) => v + 1)
            setHasVoted(true)
        } catch (e) {
            console.error(e)
        }
    }

    const handleReport = async () => {
        if (!userId) {
            alert('You must be signed in to report.')
            return
        }
        const reason = prompt('Reason for reporting:')
        if (!reason) return

        setIsReporting(true)
        try {
            await reportReview(review.id, reason)
            alert('Thank you. This review has been sent to our moderators.')
        } catch (e) {
            console.error(e)
        } finally {
            setIsReporting(false)
        }
    }

    return (
        <div className="coffee-card bg-white/40 mb-10 border-foreground/10">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <span className="font-funky text-foreground text-2xl italic">Anonymous Student</span>
                        {review.graduationStatus && (
                            <span className="px-3 py-1 bg-earth-mustard text-foreground text-[10px] font-bold uppercase tracking-widest rounded-full border border-foreground/10">
                                {review.graduationStatus}
                            </span>
                        )}
                    </div>
                    {review.major && review.institution && (
                        <div className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mb-6 italic">
                            {review.major.name} @ {review.institution.name}
                        </div>
                    )}
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={star <= (r.satisfaction || 0) ? "var(--earth-mustard)" : "none"} stroke="var(--earth-mustard)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
                    </div>
                </div>
                <div className="text-[10px] text-earth-sage font-bold uppercase tracking-widest bg-earth-parchment border border-foreground/5 px-4 py-2 rounded-full italic">
                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
            </div>

            <div className="space-y-10">
                {responses.fit && (
                    <div className="border-l-4 border-earth-sage pl-8">
                        <h4 className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mb-3 italic">Program Fit</h4>
                        <p className="text-foreground font-medium leading-[1.8] italic text-lg">{responses.fit}</p>
                    </div>
                )}
                {responses.challenge && (
                    <div className="border-l-4 border-earth-terracotta pl-8">
                        <h4 className="text-[10px] font-bold text-earth-terracotta uppercase tracking-widest mb-3 italic">Biggest Challenge</h4>
                        <p className="text-foreground font-medium leading-[1.8] italic text-lg">{responses.challenge}</p>
                    </div>
                )}
            </div>

            <div className="mt-12 pt-8 border-t border-foreground/5 flex items-center justify-between">
                <button
                    onClick={handleVote}
                    disabled={hasVoted}
                    className={`inline-flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${hasVoted
                        ? 'bg-earth-sage border-earth-sage text-white shadow-lg translate-y-[-2px]'
                        : 'bg-white border-foreground/10 text-foreground hover:bg-earth-parchment active:bg-earth-sage/10'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                    Helpful ({votes})
                </button>
                <button
                    onClick={handleReport}
                    disabled={isReporting}
                    className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 hover:text-earth-terracotta transition-colors disabled:opacity-50 italic"
                >
                    {isReporting ? 'Reporting...' : 'Report Review'}
                </button>
            </div>
        </div>
    );
}
