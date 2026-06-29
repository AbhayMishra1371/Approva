import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Create user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log("OAuth Callback - User:", user); // Quick debug as suggested
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
          email: user.email,
          username: user.email?.split("@")[0],
          avatar_url: user.user_metadata?.avatar_url || ""
        })

        if (upsertError) {
          console.error("Profile Upsert Error in Callback:", upsertError);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto");

      if (forwardedHost) {
        const protocol = forwardedProto ?? "http";
        return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
