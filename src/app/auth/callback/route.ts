import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // The `/auth/callback` route is required for the server-side auth flow implemented
    // by the SSR package. It exchanges an auth code for the user's session.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') || '/'

    if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const protocol = request.headers.get('x-forwarded-proto') || 'http'
            const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
            const origin = `${protocol}://${host}`

            // Redirect to the redirect handler page which will check sessionStorage
            // and perform the final navigation
            return NextResponse.redirect(`${origin}/auth/redirect?next=${encodeURIComponent(next)}`)
        } else {
            console.error('Auth Logic Error:', error);
        }
    }

    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const errorOrigin = `${protocol}://${host}`

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${errorOrigin}/auth/auth-code-error`)
}
