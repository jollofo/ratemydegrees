import { getModerationQueue, getAdminStats } from '../actions';
import ModerationTable from './ModerationTable';

export default async function ModerationPage({
    searchParams
}: {
    searchParams: { status?: string }
}) {
    const status = searchParams.status || 'PENDING';
    const queue = await getModerationQueue(status);
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Moderation Queue</h2>
                    <p className="text-gray-500 font-medium mt-1">Found {queue.length} reviews requiring attention.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pending</p>
                    <p className="text-3xl font-black text-gray-900">{stats.pending}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">High Risk (Flagged)</p>
                    <p className="text-3xl font-black text-red-600">{stats.flagged}</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 shadow-sm">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">Open Reports</p>
                    <p className="text-3xl font-black text-yellow-700">{stats.reports}</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <div className="flex border-b border-gray-100">
                    {['PENDING', 'APPROVED', 'REMOVED', 'SHADOW_HIDDEN'].map((s) => (
                        <a
                            key={s}
                            href={`?status=${s}`}
                            className={`px-8 py-5 text-sm font-bold transition-all border-b-2 ${status === s
                                    ? 'text-primary-600 border-primary-600'
                                    : 'text-gray-400 border-transparent hover:text-gray-600'
                                }`}
                        >
                            {s}
                        </a>
                    ))}
                </div>

                <ModerationTable initialQueue={queue} />
            </div>
        </div>
    );
}
