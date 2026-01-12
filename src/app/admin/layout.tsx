import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login?returnTo=/admin');
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'MODERATOR')) {
        redirect('/');
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white p-8 flex flex-col">
                <div className="mb-12">
                    <Link href="/" className="text-xl font-black tracking-tighter hover:text-primary-400 transition-colors">
                        RateMyDegree <span className="text-primary-500">Admin</span>
                    </Link>
                </div>

                <nav className="space-y-2 flex-1">
                    <Link href="/admin/moderation" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-gray-300 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 8v8" /></svg>
                        Moderation Queue
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-gray-300 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                        User Reports
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-bold text-gray-300 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        User Management
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-xs uppercase">
                            {dbUser.role[0]}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white truncate w-32">{dbUser.email}</p>
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">{dbUser.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                    <h1 className="font-black text-gray-900 uppercase tracking-widest text-xs">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">Live Connection</span>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
