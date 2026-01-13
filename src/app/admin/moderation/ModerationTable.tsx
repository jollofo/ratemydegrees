'use client';

import { useState } from 'react';
import { moderateReview } from '../actions';
import { useRouter } from 'next/navigation';

export default function ModerationTable({ initialQueue }: { initialQueue: any[] }) {
    const router = useRouter();
    const [actioningId, setActioningId] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'APPROVE' | 'REMOVE' | 'SHADOW_HIDE' | 'REJECT') => {
        setActioningId(id);
        try {
            await moderateReview(id, action);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Action failed');
        } finally {
            setActioningId(null);
        }
    };

    if (initialQueue.length === 0) {
        return (
            <div className="py-32 text-center text-earth-sage font-funky italic text-2xl opacity-40">
                No reviews pending moderation.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                    <tr className="bg-earth-parchment/60">
                        <th className="px-8 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Program & Institution</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Review Snippet</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Flags & Reports</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-earth-sage/5">
                    {initialQueue.map((review) => {
                        const responses = JSON.parse(review.writtenResponses);
                        const flagReasons = review.flagReasons ? JSON.parse(review.flagReasons) : [];

                        return (
                            <tr key={review.id} className="hover:bg-earth-parchment/40 transition-colors group">
                                <td className="px-8 py-8">
                                    <p className="font-funky text-2xl text-foreground italic leading-tight mb-2 group-hover:text-earth-terracotta transition-colors">{review.major.title}</p>
                                    <p className="text-[10px] text-earth-sage font-bold uppercase tracking-widest leading-none">{review.institution.name}</p>
                                    <div className="mt-5 flex items-center gap-2">
                                        <span className="text-[10px] bg-earth-mustard text-foreground px-3 py-1 font-bold uppercase tracking-widest rounded-full italic">{review.graduationStatus}</span>
                                        <span className="text-[10px] text-earth-sage/60 font-bold uppercase tracking-widest italic">{review.graduationYearRange}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-8 max-w-md">
                                    <div className="text-sm text-foreground font-medium leading-relaxed italic line-clamp-3">
                                        <span className="text-earth-terracotta font-bold uppercase tracking-widest text-[10px] mr-2 not-italic">Fit:</span>
                                        &quot;{responses.fit || 'No text provided'}&quot;
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="flex flex-wrap gap-2">
                                        {review.riskScore > 0 && (
                                            <span className="bg-earth-burgundy text-white px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">
                                                RISK: {review.riskScore}
                                            </span>
                                        )}
                                        {review._count.reports > 0 && (
                                            <span className="bg-earth-mustard text-foreground px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm">
                                                REPORTS: {review._count.reports}
                                            </span>
                                        )}
                                        {flagReasons.map((reason: string, i: number) => (
                                            <span key={i} className="bg-white border border-earth-sage/20 text-earth-sage px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm italic">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => handleAction(review.id, 'APPROVE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-earth-sage text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md hover:bg-earth-sage/90 hover:-translate-y-0.5 transition-all"
                                        >
                                            APPROVE
                                        </button>
                                        <button
                                            onClick={() => handleAction(review.id, 'REMOVE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-earth-burgundy text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md hover:bg-earth-burgundy/90 hover:-translate-y-0.5 transition-all"
                                        >
                                            REMOVE
                                        </button>
                                        <button
                                            onClick={() => handleAction(review.id, 'SHADOW_HIDE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-[#433422] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md hover:bg-black hover:-translate-y-0.5 transition-all"
                                        >
                                            SHADOW
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
