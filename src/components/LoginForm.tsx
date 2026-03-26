'use client';

import { useEffect } from 'react';
import { saveRedirectUrl } from '@/lib/redirect';

interface LoginFormProps {
    nextUrl?: string;
    signInAction: () => void;
}

export default function LoginForm({ nextUrl, signInAction }: LoginFormProps) {
    // Store the redirect URL in sessionStorage when the page loads
    useEffect(() => {
        if (nextUrl) {
            // Construct the full URL from the path
            const fullUrl = window.location.origin + nextUrl;
            saveRedirectUrl(fullUrl);
        }
    }, [nextUrl]);

    return (
        <form action={signInAction}>
            <button className="w-full flex items-center justify-center gap-4 bg-white border-2 border-black px-6 py-5 text-lg font-bold shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                <span className="font-black uppercase tracking-widest text-sm text-black">Continue with Google</span>
            </button>
        </form>
    );
}
