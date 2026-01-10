import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "RateMyDegree | Find the Best College Major for You",
    description: "Anonymous reviews and ratings of U.S. college majors by students and alumni.",
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

    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen flex flex-col">
                    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                            <a href="/" className="text-2xl font-bold text-primary-600 tracking-tight">
                                RateMyDegree
                            </a>
                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="/majors" className="text-sm font-medium hover:text-primary-600 transition-colors">Browse Majors</a>
                                <a href="/write-review" className="text-sm font-medium hover:text-primary-600 transition-colors">Write a Review</a>

                                {user ? (
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 font-medium">
                                            {user.email?.split('@')[0]}
                                        </span>
                                        <form action={signOut}>
                                            <button className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors">
                                                Sign Out
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <a href="/login" className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-700 transition-all shadow-sm">
                                        Sign In
                                    </a>
                                )}
                            </nav>
                        </div>
                    </header>
                    <main className="flex-grow">
                        {children}
                    </main>
                    <footer className="border-t py-12 bg-gray-50">
                        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                            <p>&copy; {new Date().getFullYear()} RateMyDegree. All rights reserved.</p>
                            <div className="mt-4 space-x-4">
                                <a href="/terms" className="hover:text-gray-900">Terms</a>
                                <a href="/privacy" className="hover:text-gray-900">Privacy</a>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
