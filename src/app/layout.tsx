import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque, Courier_Prime } from "next/font/google";
import "./globals.css";
import { getDbUser } from "@/lib/user";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import UserDropdown from "@/components/UserDropdown";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const funky = Bricolage_Grotesque({ subsets: ["latin"], variable: '--font-funky' });
const mono = Courier_Prime({ weight: "400", subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
    title: "RateMyDegree | College Major Reviews & Student Insights",
    description: "Honest college major reviews from students and alumni. Real experiences, career outcomes, and college major reviews to help you choose the right program.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let dbUser = null;
    if (user) {
        dbUser = await getDbUser(user.id);
    }

    return (
        <html lang="en" className={`${inter.variable} ${funky.variable} ${mono.variable}`}>
            <body className="font-sans selection:bg-earth-sage/30">
                <GoogleAnalytics GA_MEASUREMENT_ID="G-N6LJN2TRCF" />
                <div className="min-h-screen flex flex-col">
                    <header className="border-b-2 border-earth-sage bg-[#fffefb] sticky top-0 z-50">
                        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                            <a href="/" className="flex items-center gap-3 group">
                                <div className="w-12 h-12 relative transition-transform group-hover:scale-105">
                                    <Image
                                        src="/logo.svg"
                                        alt="RateMyDegrees Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-2xl font-sans tracking-tight text-foreground group-hover:text-earth-terracotta transition-colors">
                                    <span className="font-bold">Rate</span>mydegrees<span className="text-[#ff4f4f]">.</span>
                                </span>
                            </a>
                            <nav className="hidden md:flex items-center space-x-10">
                                <a href="/majors" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Programs</a>
                                <a href="/institutions" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Institutions</a>
                                <a href="/write-review" className="text-sm font-bold hover:text-earth-terracotta transition-colors">Write a Review</a>

                                {dbUser && (dbUser.role === 'ADMIN' || dbUser.role === 'MODERATOR') && (
                                    <a href="/admin/moderation" className="px-4 py-1.5 bg-earth-mustard/10 border border-earth-mustard text-[10px] font-bold rounded-full text-earth-mustard">DASHBOARD</a>
                                )}

                                {user ? (
                                    <UserDropdown user={user} />
                                ) : (
                                    <a href="/login" className="coffee-btn py-2.5 text-sm">
                                        Sign In
                                    </a>
                                )}
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <footer className="bg-[#433422] text-earth-parchment py-16 mt-12">
                        <div className="container mx-auto px-6 text-center">
                            <div className="w-16 h-16 bg-earth-mustard wavy-border mx-auto mb-10 flex items-center justify-center text-earth-burgundy scale-110">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>
                            <p className="font-funky text-4xl mb-6 italic tracking-tight text-white">Real Student Voices. Real Insights.</p>
                            <div className="h-px bg-earth-parchment/10 max-w-xs mx-auto mb-10" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">&copy; {new Date().getFullYear()} RateMyDegree. All rights reserved.</p>
                            <div className="mt-12 flex justify-center gap-12">
                                <a href="/terms" className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Terms of Service</a>
                                <a href="/privacy" className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Privacy Policy</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
