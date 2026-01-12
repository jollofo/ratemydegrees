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
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">Anonymous Peer</span>
                        {review.graduationStatus && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-tighter border border-gray-100">
                                {review.graduationStatus}
                            </span>
                        )}
                        <span className="text-gray-300">&bull;</span>
                        <span className="text-sm text-gray-500">{review.graduationYearRange}</span>
                    </div>
                    {review.major && review.institution && (
                        <div className="text-xs font-semibold text-primary-600 mb-2">
                            {review.major.name} @ {review.institution.name}
                        </div>
                    )}
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={star <= (r.satisfaction || 0) ? "#EAB308" : "none"} stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        ))}
                    </div>
                </div>
                <div className="text-sm text-gray-400 font-medium">
                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </div>
            </div>

            <div className="space-y-6">
                {responses.fit && (
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Who is this major a good fit for?</h4>
                        <p className="text-gray-700 leading-relaxed">{responses.fit}</p>
                    </div>
                )}
                {responses.challenge && (
                    <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Biggest Challenge</h4>
                        <p className="text-gray-700 leading-relaxed">{responses.challenge}</p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t flex items-center gap-4">
                <button
                    onClick={handleVote}
                    disabled={hasVoted}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium ${hasVoted ? 'text-primary-600 bg-primary-50 border-primary-100' : 'text-gray-600'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                    Helpful ({votes})
                </button>
                <button
                    onClick={handleReport}
                    disabled={isReporting}
                    className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                    {isReporting ? 'Reporting...' : 'Report'}
                </button>
            </div>
        </div>
    )
}
