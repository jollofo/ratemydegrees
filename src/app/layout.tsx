import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Courier_Prime } from "next/font/google";
import "./globals.css";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const funky = Bricolage_Grotesque({ subsets: ["latin"], variable: '--font-funky' });
const mono = Courier_Prime({ weight: "400", subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
    title: "RateMyDegree | Student-Powered Degree Insights",
    description: "An eclectic collection of student and alumni reviews for U.S. college majors. Real voices, earthy truths.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const signOut = async () => {
        'use server'
        const supabase = createClient()
        await supabase.auth.signOut()
        return redirect('/')
    }

    let dbUser = null;
    if (user) {
        dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    }

    return (
        <html lang="en" className={`${inter.variable} ${funky.variable} ${mono.variable}`}>
            <body className="font-sans selection:bg-earth-sage/30">
                <div className="min-h-screen flex flex-col">
                    <header className="border-b-2 border-earth-sage bg-[#fffefb] sticky top-0 z-50">
                        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
                            <a href="/" className="text-3xl font-funky text-foreground tracking-tight hover:text-earth-terracotta transition-colors flex items-center gap-2">
                                <div className="w-10 h-10 bg-earth-terracotta wavy-border flex items-center justify-center text-white scale-90">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /><circle cx="12" cy="12" r="4" /></svg>
                                </div>
                                RateMyDegree
                            </a>
                            <nav className="hidden md:flex items-center space-x-10">
                                <a href="/majors" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Programs</a>
                                <a href="/institutions" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Universities</a>
                                <a href="/write-review" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Share Experience</a>

                                {dbUser && (dbUser.role === 'ADMIN' || dbUser.role === 'MODERATOR') && (
                                    <a href="/admin/moderation" className="px-4 py-1.5 bg-earth-mustard/10 border border-earth-mustard text-[10px] font-bold rounded-full text-earth-mustard">DASHBOARD</a>
                                )}

                                {user ? (
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center justify-center bg-[#fffefb] border-2 border-foreground rounded-full w-12 h-12 shadow-sm">
                                            {user.user_metadata?.avatar_url ? (
                                                <img
                                                    src={user.user_metadata.avatar_url}
                                                    alt="Profile"
                                                    className="w-10 h-10 rounded-full border border-foreground"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-earth-sage rounded-full border border-foreground flex items-center justify-center text-white font-funky text-lg">
                                                    {user.email?.[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <form action={signOut}>
                                            <button className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                                                Log Out
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <a href="/login" className="coffee-btn py-2.5 text-sm">
                                        Join Us
                                    </a>
                                )}
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <footer className="bg-[#433422] text-earth-parchment py-24 mt-20">
                        <div className="container mx-auto px-6 text-center">
                            <div className="w-16 h-16 bg-earth-mustard wavy-border mx-auto mb-10 flex items-center justify-center text-earth-burgundy scale-110">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>
                            <p className="font-funky text-4xl mb-6 italic tracking-tight text-white">Global Truths, Student Voices.</p>
                            <div className="h-px bg-earth-parchment/10 max-w-xs mx-auto mb-10" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">&copy; {new Date().getFullYear()} RateMyDegree. All paths lead home.</p>
                            <div className="mt-12 flex justify-center gap-12">
                                <a href="/terms" className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Terms of Gathering</a>
                                <a href="/privacy" className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Privacy Scroll</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
