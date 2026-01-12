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
        <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">User Reports</h2>

            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="py-20 text-center bg-white border border-gray-50 rounded-[40px] text-gray-400 font-medium font-bold">
                        No open reports. Great job!
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-yellow-100 shadow-sm">
                                        Reason: {report.reason}
                                    </span>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        Reported on {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl mb-4 border border-gray-100">
                                    <p className="text-sm font-bold text-gray-900 mb-2">Review Target:</p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{JSON.parse(report.review.writtenResponses).fit}</p>
                                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase">
                                        <span>{report.review.major.title}</span>
                                        <span>@</span>
                                        <span>{report.review.institution.name}</span>
                                    </div>
                                </div>
                                {report.details && (
                                    <p className="text-sm text-gray-600 bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                                        <span className="font-bold text-blue-900 block mb-1">Reporter Details:</span>
                                        {report.details}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <a
                                    href={`/admin/moderation?reviewId=${report.reviewId}`}
                                    className="px-6 py-3 bg-gray-900 text-white text-center rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                >
                                    Investigate Review
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
