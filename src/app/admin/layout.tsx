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
        <div className="flex min-h-screen bg-earth-parchment font-sans">
            {/* Admin Sidebar */}
            <aside className="w-80 bg-[#433422] text-earth-parchment p-12 flex flex-col border-r-2 border-earth-sage/20 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-earth-terracotta opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="mb-20 relative z-10">
                    <Link href="/" className="group flex items-center gap-3">
                        <div className="w-12 h-12 bg-earth-mustard wavy-border flex items-center justify-center text-earth-burgundy scale-90 group-hover:scale-100 transition-transform">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-funky tracking-tight leading-none text-white italic">RateMyDegree</span>
                            <span className="text-earth-mustard/60 text-[10px] font-bold tracking-[0.3em] mt-2 uppercase">GATHERING LEADER</span>
                        </div>
                    </Link>
                </div>

                <nav className="space-y-6 flex-1 relative z-10">
                    <Link href="/admin/moderation" className="flex items-center gap-5 px-6 py-4 rounded-2xl border-2 border-transparent hover:border-earth-terracotta/30 hover:bg-earth-terracotta/5 transition-all font-bold text-xs uppercase tracking-[0.2em] text-earth-parchment/40 hover:text-white group">
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 8v8" /></svg>
                        Wisdom Filter
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-5 px-6 py-4 rounded-2xl border-2 border-transparent hover:border-earth-terracotta/30 hover:bg-earth-terracotta/5 transition-all font-bold text-xs uppercase tracking-[0.2em] text-earth-parchment/40 hover:text-white group">
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                        Flagged Truths
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-5 px-6 py-4 rounded-2xl border-2 border-transparent hover:border-earth-terracotta/30 hover:bg-earth-terracotta/5 transition-all font-bold text-xs uppercase tracking-[0.2em] text-earth-parchment/40 hover:text-white group">
                        <svg className="w-5 h-5 transition-transform group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        The Seekers
                    </Link>
                </nav>

                <div className="mt-auto pt-8 border-t border-earth-parchment/10 relative z-10">
                    <div className="flex items-center gap-5 p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="w-12 h-12 bg-earth-sage rounded-2xl flex items-center justify-center font-funky text-lg text-white shadow-sm italic">
                            {dbUser.role[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-white truncate w-32 uppercase tracking-widest">{dbUser.email?.split('@')[0]}</p>
                            <p className="text-[10px] font-bold text-earth-terracotta uppercase tracking-[0.2em] mt-1 italic">{dbUser.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-earth-parchment">
                <header className="bg-white/80 backdrop-blur-md border-b-2 border-earth-sage/10 px-16 py-8 flex items-center justify-between sticky top-0 z-30">
                    <h1 className="font-bold text-earth-sage uppercase tracking-[0.25em] text-[10px] italic">Controller&apos;s Sanctorum // Oversight</h1>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-foreground bg-earth-mustard/20 px-4 py-2 rounded-full border border-earth-mustard/30 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-earth-mustard rounded-full animate-pulse" />
                            Gathering synchronized
                        </span>
                    </div>
                </header>
                <div className="p-16 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
