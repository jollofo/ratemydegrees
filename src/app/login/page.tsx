import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string }
}) {
    const signInWithGoogle = async () => {
        'use server'
        const supabase = createClient()
        const origin = headers().get('origin')
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            return redirect('/login?message=Could not authenticate user')
        }

        return redirect(data.url)
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto py-32">
            <div className="neo-box p-12 bg-white">
                <h1 className="text-4xl font-black mb-6 text-black uppercase italic tracking-tighter">Sign In</h1>
                <p className="text-black font-bold mb-10 leading-relaxed italic">
                    Sign in to RateMyDegree to share your experience and help others navigate their academic journey.
                </p>

                <form action={signInWithGoogle}>
                    <button className="neo-btn w-full flex items-center justify-center gap-4 bg-white px-6 py-4 text-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                        <span className="font-black uppercase tracking-widest text-sm">Continue with Google</span>
                    </button>
                </form>

                {searchParams?.message && (
                    <div className="mt-8 p-4 bg-red-100 border-2 border-black text-black text-center text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {searchParams.message}
                    </div>
                )}
            </div>
        </div>
    );
}
