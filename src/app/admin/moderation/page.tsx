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
        <div className="space-y-16">
            <div className="flex items-center justify-between border-b-2 border-earth-sage/20 pb-10">
                <div>
                    <h2 className="text-6xl font-funky text-foreground tracking-tight italic">Moderation Gathering</h2>
                    <p className="text-earth-sage font-bold text-xs uppercase tracking-[0.2em] mt-4 italic">
                        {queue.length} reflections awaiting the community veil
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="coffee-card bg-[#fffefb]/50">
                    <p className="text-[10px] font-bold text-earth-sage uppercase tracking-widest mb-3 italic">Total Flow</p>
                    <p className="text-5xl font-funky text-foreground tracking-tighter italic">{stats.pending}</p>
                    <div className="mt-4 text-[10px] font-bold text-earth-sage uppercase tracking-widest opacity-40">AWAITING GESTALT</div>
                </div>
                <div className="coffee-card bg-earth-terracotta/5 border-earth-terracotta/20">
                    <p className="text-[10px] font-bold text-earth-terracotta uppercase tracking-widest mb-3 italic">High Friction (Flagged)</p>
                    <p className="text-5xl font-funky text-earth-terracotta tracking-tighter italic">{stats.flagged}</p>
                    <div className="mt-4 text-[10px] font-bold text-earth-terracotta uppercase tracking-widest opacity-40">REVISION REQUIRED</div>
                </div>
                <div className="coffee-card bg-earth-mustard/5 border-earth-mustard/20">
                    <p className="text-[10px] font-bold text-earth-mustard uppercase tracking-widest mb-3 italic">External Echoes (Reports)</p>
                    <p className="text-5xl font-funky text-earth-mustard tracking-tighter italic">{stats.reports}</p>
                    <div className="mt-4 text-[10px] font-bold text-earth-mustard uppercase tracking-widest opacity-40">COMMUNITY ALERTS</div>
                </div>
            </div>

            <div className="coffee-card !p-0 bg-white overflow-hidden border-earth-sage/10">
                <div className="flex bg-earth-parchment p-1.5 gap-1">
                    {['PENDING', 'APPROVED', 'REMOVED', 'SHADOW_HIDDEN'].map((s) => (
                        <a
                            key={s}
                            href={`?status=${s}`}
                            className={`flex-1 text-center py-4 text-[10px] font-bold uppercase tracking-widest transition-all rounded-2xl ${status === s
                                ? 'bg-earth-terracotta text-white shadow-sm'
                                : 'text-foreground opacity-40 hover:opacity-100 hover:bg-white/50'
                                }`}
                        >
                            {s.replace('_', ' ')}
                        </a>
                    ))}
                </div>

                <div className="p-10">
                    <ModerationTable initialQueue={queue} />
                </div>
            </div>
        </div>
    );
}
