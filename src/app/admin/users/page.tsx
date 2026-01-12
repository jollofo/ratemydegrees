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
        <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h2>

            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">User</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Activity</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-6 py-6">
                                    <p className="font-bold text-gray-900">{u.email}</p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-1">{u.id}</p>
                                </td>
                                <td className="px-6 py-6">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-primary-900 text-white' :
                                            u.role === 'MODERATOR' ? 'bg-primary-100 text-primary-700' :
                                                'bg-gray-100 text-gray-500'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-6 font-bold text-gray-600 text-sm">
                                    {u._count.reviews} Reviews
                                </td>
                                <td className="px-6 py-6">
                                    {u.banned ? (
                                        <span className="text-red-600 font-bold text-xs uppercase tracking-widest">Banned</span>
                                    ) : (
                                        <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Active</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
