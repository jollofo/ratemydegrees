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
            <div className="py-20 text-center text-gray-400 font-medium">
                Queue is empty for this status.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Details</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Content Snippet</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Risk & Reasons</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {initialQueue.map((review) => {
                        const responses = JSON.parse(review.writtenResponses);
                        const flagReasons = review.flagReasons ? JSON.parse(review.flagReasons) : [];

                        return (
                            <tr key={review.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-6 py-6">
                                    <p className="font-bold text-gray-900 leading-tight mb-1">{review.major.title}</p>
                                    <p className="text-xs text-gray-400 font-medium">{review.institution.name}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">{review.graduationStatus}</span>
                                        <span className="text-[10px] text-gray-300 font-bold uppercase">{review.graduationYearRange}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6 max-w-md">
                                    <div className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                        <span className="font-bold text-gray-900 block mb-1">Fit Query:</span>
                                        {responses.fit || 'No text provided'}
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="flex flex-wrap gap-1.5">
                                        {review.riskScore > 0 && (
                                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black border border-red-100">
                                                RISK: {review.riskScore}
                                            </span>
                                        )}
                                        {review._count.reports > 0 && (
                                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-black border border-yellow-100">
                                                REPORTS: {review._count.reports}
                                            </span>
                                        )}
                                        {flagReasons.map((reason: string, i: number) => (
                                            <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleAction(review.id, 'APPROVE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(review.id, 'REMOVE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                                        >
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => handleAction(review.id, 'SHADOW_HIDE')}
                                            disabled={actioningId === review.id}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                                        >
                                            Shadow
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
