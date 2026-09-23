import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Shield, UserCheck, Lock } from 'lucide-react'
import { Metadata } from 'next'
import LoginForm from '@/components/LoginForm'
import { getLoginRedirectUrl } from '@/lib/auth-redirect'

export const metadata: Metadata = {
    title: 'Sign In | RateMyDegree',
    alternates: {
        canonical: 'https://ratemydegrees.com/login',
    },
}

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message?: string; next?: string; returnTo?: string }
}) {
    const nextUrl = getLoginRedirectUrl(searchParams)

    const signInWithGoogle = async () => {
        'use server'
        const supabase = createClient()

        const headersList = headers()
        const host = headersList.get('host')
        const protocol = headersList.get('x-forwarded-proto') || 'http'
        const origin = `${protocol}://${host}`

        console.log('Redirecting to origin:', origin)

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
            },
        })

        if (error) {
            console.error('OAuth error:', error)
            return redirect('/login?message=Could not authenticate user')
        }

        return redirect(data.url)
    }

    return (
        <div className="flex-1 flex flex-col w-full px-6 sm:max-w-5xl justify-center gap-2 mx-auto py-20">
            {searchParams.message && <p role="alert" className="p-4 border rounded-xl">Sign-in could not be completed. Please try again.</p>}
            <div className="neo-box p-8 md:p-12 bg-white grid md:grid-cols-2 gap-12 items-center">
                {/* Left Side: Context */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-6xl font-funky font-black text-black uppercase italic tracking-tighter leading-none mb-4">
                            Sign In
                        </h1>
                        <p className="text-lg font-bold text-earth-sage uppercase tracking-widest italic">
                            To Start Reviewing
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4 items-start group">
                            <div className="w-12 h-12 rounded-xl bg-earth-sage/10 text-earth-sage flex items-center justify-center shrink-0 group-hover:bg-earth-sage group-hover:text-white transition-colors">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Anonymous public reviews</h3>
                                <p className="text-sm font-medium text-black/60 leading-relaxed">
                                    Your account details are not displayed with your review. Avoid including identifying details in your own writing.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="w-12 h-12 rounded-xl bg-earth-terracotta/10 text-earth-terracotta flex items-center justify-center shrink-0 group-hover:bg-earth-terracotta group-hover:text-white transition-colors">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Manage Your Content</h3>
                                <p className="text-sm font-medium text-black/60 leading-relaxed">
                                    Sign in to edit or delete your reviews later. You stay in control of your contributions.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="w-12 h-12 rounded-xl bg-earth-mustard/10 text-earth-mustard flex items-center justify-center shrink-0 group-hover:bg-earth-mustard group-hover:text-white transition-colors">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Spam Prevention</h3>
                                <p className="text-sm font-medium text-black/60 leading-relaxed">
                                    Sign-in helps limit spam. It does not verify attendance or the accuracy of a review.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full max-w-sm mx-auto bg-earth-parchment/30 p-8 rounded-3xl border-2 border-dashed border-black/10">
                    <LoginForm  signInAction={signInWithGoogle} />

                    {searchParams?.message && (
                        <div className="mt-8 p-4 bg-red-100 border-2 border-black text-black text-center text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {searchParams.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
