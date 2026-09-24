import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getDbUser } from "@/lib/user";
import { createClient } from "@/utils/supabase/server";

import Image from "next/image";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import SiteNavigation from "@/components/SiteNavigation";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
    title: "RateMyDegrees | Student degree reviews",
    description: "Honest college major reviews from students and alumni. Firsthand experiences of studying a degree.",
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
        <html lang="en" className={inter.variable}>
            <head>
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9801764855577031" crossOrigin="anonymous" />
            </head>
            <body className="font-sans selection:bg-earth-sage/30">
                {process.env.RMD_LOCAL_CHECK !== '1' && <GoogleAnalytics GA_MEASUREMENT_ID="G-N6LJN2TRCF" />}
                <a href="#main-content" className="sr-only focus:not-sr-only focus:p-4">Skip to content</a>
                <div className="min-h-screen flex flex-col">
                    <header className="border-b-2 border-earth-sage bg-[#fffefb] sticky top-0 z-50">
                        <div className="container mx-auto px-6 h-20 relative flex items-center justify-between">
                            <a href="/" className="flex items-center gap-3 group">
                                <div className="w-12 h-12 relative transition-transform group-hover:scale-105">
                                    <Image
                                        src="/logo.svg"
                                        alt="RateMyDegrees Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-xl sm:text-2xl font-sans tracking-tight text-foreground group-hover:text-earth-terracotta transition-colors">
                                    <span className="font-bold">Rate</span>mydegrees<span className="text-[#ff4f4f]">.</span>
                                </span>
                            </a>
                            <SiteNavigation signedIn={Boolean(user)} admin={Boolean(dbUser && ["ADMIN", "MODERATOR"].includes(dbUser.role))} />
                        </div>
                    </header>
                    <main id="main-content" className="flex-grow">
                        {children}
                    </main>
                    <footer className="bg-[#433422] text-earth-parchment py-16 mt-12">
                        <div className="container mx-auto px-6 text-center">
                            <div className="w-16 h-16 bg-earth-mustard wavy-border mx-auto mb-10 flex items-center justify-center text-earth-burgundy scale-110">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>
                            <p className="font-funky text-4xl mb-6 italic tracking-tight text-white">Real Student Voices. Real Insights.</p>
                            <div className="h-px bg-earth-parchment/10 max-w-xs mx-auto mb-10" />
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">&copy; {new Date().getFullYear()} RateMyDegrees. All rights reserved.</p>
                            <div className="mt-12 flex flex-wrap justify-center gap-8">
                                <a href="/guidelines" className="text-sm underline">How reviews work</a>
                                <a href="/terms" className="text-sm opacity-80 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Terms of Service</a>
                                <a href="/privacy" className="text-sm opacity-80 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Privacy Policy</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
