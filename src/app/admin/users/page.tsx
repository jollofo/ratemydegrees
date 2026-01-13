'use server';

import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect('/login');

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { reviews: true }
            }
        }
    });

    return (
        <div className="space-y-16">
            <div className="flex items-center justify-between border-b-2 border-earth-sage/20 pb-10">
                <h2 className="text-6xl font-funky text-foreground tracking-tight italic">User Management</h2>
            </div>

            <div className="coffee-card !p-0 bg-white overflow-hidden border-earth-sage/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-earth-parchment/60">
                                <th className="px-10 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">User Identity</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Role / Clearance</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Reviews Submitted</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-earth-sage uppercase tracking-[0.2em] border-b-2 border-earth-sage/10 italic">Account Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-earth-sage/5">
                            {users.map((u: any) => (
                                <tr key={u.id} className="hover:bg-earth-parchment/40 transition-colors group">
                                    <td className="px-10 py-10">
                                        <p className="font-funky text-2xl text-foreground italic tracking-tight group-hover:text-earth-terracotta transition-colors">{u.email?.split('@')[0]}</p>
                                        <p className="text-[10px] text-earth-sage/50 font-bold uppercase tracking-widest mt-2">{u.id.substring(0, 16)}...</p>
                                    </td>
                                    <td className="px-10 py-10">
                                        <span className={`px-5 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-sm italic ${u.role === 'ADMIN' ? 'bg-earth-burgundy text-white' :
                                            u.role === 'MODERATOR' ? 'bg-earth-mustard text-foreground' :
                                                'bg-earth-sage/10 text-earth-sage border border-earth-sage/20'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-10 py-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-earth-terracotta rounded-full animate-pulse" />
                                            <span className="font-bold text-xs text-foreground uppercase tracking-widest">{u._count.reviews} Reviews</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-10">
                                        {u.banned ? (
                                            <span className="bg-earth-burgundy/10 text-earth-burgundy px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest italic border border-earth-burgundy/20">Banned</span>
                                        ) : (
                                            <span className="bg-earth-sage/10 text-earth-sage px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest italic border border-earth-sage/20">Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
