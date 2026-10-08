'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface LoginFormProps {
    signInAction: () => void;
    nextUrl: string;
}

export default function LoginForm({ signInAction, nextUrl }: LoginFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    async function requestCode(event: React.FormEvent) {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            await createClient().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
            setSent(true);
            setMessage('If this address can receive sign-in email, a code will arrive shortly. Check your inbox and spam folder.');
        } catch {
            setSent(true);
            setMessage('If this address can receive sign-in email, a code will arrive shortly. Check your inbox and spam folder.');
        } finally { setBusy(false); }
    }

    async function verifyCode(event: React.FormEvent) {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        try {
            const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
            if (error) throw error;
            router.push(nextUrl);
            router.refresh();
        } catch {
            setMessage('Could not complete sign-in. Check the code or request a new one.');
            setBusy(false);
        }
    }

    return (
        <div className="space-y-6">
        <form action={signInAction}>
            <button className="w-full flex items-center justify-center gap-4 bg-white border-2 border-black px-6 py-5 text-lg font-bold shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                <span className="font-black uppercase tracking-widest text-sm text-black">Continue with Google</span>
            </button>
        </form>
        <p className="text-center text-sm">or continue with email</p>
        <form onSubmit={requestCode} className="space-y-3">
            <label htmlFor="sign-in-email" className="block font-bold">Email address</label>
            <input id="sign-in-email" className="coffee-input" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setSent(false); setCode(''); }} />
            <button type="submit" disabled={busy} className="coffee-btn w-full">Send sign-in code</button>
        </form>
        {sent && <form onSubmit={verifyCode} className="space-y-3">
            <label htmlFor="sign-in-code" className="block font-bold">Email code</label>
            <input id="sign-in-code" className="coffee-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={event => setCode(event.target.value)} />
            <button type="submit" disabled={busy} className="coffee-btn w-full">Verify code</button>
        </form>}
        <p role="status" className="text-sm">{message}</p>
        </div>
    );
}
