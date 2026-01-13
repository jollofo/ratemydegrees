'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const reports = await prisma.report.findMany({
        where: { status: 'OPEN' },
        include: {
            review: {
                include: {
                    major: true,
                    institution: true
                }
            },
            user: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-16">
            <div className="flex items-center justify-between border-b-2 border-earth-sage/20 pb-10">
                <h2 className="text-6xl font-funky text-foreground tracking-tight italic">Flagged Conversations</h2>
            </div>

            <div className="space-y-10">
                {reports.length === 0 ? (
                    <div className="py-32 text-center coffee-card border-dashed bg-earth-parchment/30 text-earth-sage font-funky italic text-2xl">
                        The air is clear. No discord found in the gathering.
                    </div>
                ) : (
                    reports.map((report: any) => (
                        <div key={report.id} className="coffee-card bg-white flex flex-col md:flex-row gap-16 items-start">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-4 mb-10">
                                    <span className="bg-earth-mustard/20 text-earth-mustard border border-earth-mustard/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full italic">
                                        Alert: {report.reason}
                                    </span>
                                    <span className="text-earth-sage font-bold uppercase tracking-widest text-[10px] italic">
                                        Surfaced: {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="p-10 bg-earth-parchment/30 rounded-[2.5rem] border border-earth-sage/10 mb-10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-earth-burgundy text-white px-5 py-2 text-[8px] font-bold uppercase tracking-widest">Target Reflection</div>
                                    <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mb-6 italic">The Fragmented Truth:</p>
                                    <p className="text-xl font-medium text-foreground italic leading-relaxed mb-10">&ldquo;{JSON.parse(report.review.writtenResponses).fit}&rdquo;</p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-foreground bg-white/60 backdrop-blur-sm border border-earth-sage/10 px-5 py-3 rounded-full w-fit">
                                        <span className="italic">{report.review.major.title}</span>
                                        <span className="text-earth-terracotta opacity-50">@</span>
                                        <span className="italic">{report.review.institution.name}</span>
                                    </div>
                                </div>
                                {report.details && (
                                    <div className="p-8 bg-earth-sage/5 border border-earth-sage/10 rounded-3xl">
                                        <span className="text-[10px] font-bold text-earth-sage uppercase tracking-widest block mb-3 italic">Reporter&apos;s Observation:</span>
                                        <p className="text-sm font-medium text-foreground leading-relaxed italic">{report.details}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-4 w-full md:w-80 shrink-0">
                                <a
                                    href={`/admin/moderation?reviewId=${report.reviewId}`}
                                    className="coffee-btn bg-earth-burgundy text-white px-8 py-5 text-center text-xs shadow-[6px_6px_0px_#433422]"
                                >
                                    ACT ON TRUTH &rarr;
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
