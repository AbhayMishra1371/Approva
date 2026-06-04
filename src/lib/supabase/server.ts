import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  let requestHeaders;
  try {
    requestHeaders = await headers();
  } catch (e) {
    // headers() might throw in some contexts (like static generation)
  }

  const authHeader = requestHeaders?.get('authorization');

  const options: any = {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach((c: any) =>
            cookieStore.set(c.name, c.value, c.options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  };

  if (authHeader && authHeader.startsWith('Bearer ')) {
    options.global = {
      headers: {
        Authorization: authHeader,
      },
    };
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}

export async function getLoggedInUser() {
  try {
    const supabase = await createClient();
    let supabaseUser = null;

    // 1. Try getting user from session cookies first
    try {
      const { data: { user } } = await supabase.auth.getUser();
      supabaseUser = user;
    } catch (e) {
      console.warn("Session cookies retrieval failed:", e);
    }
    
    // 2. Fallback: check Authorization Bearer header
    if (!supabaseUser) {
      try {
        const requestHeaders = await headers();
        const authHeader = requestHeaders.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const { data: { user: userFromToken }, error: tokenErr } = await supabase.auth.getUser(token);
          if (tokenErr) {
            console.warn("Token verification error:", tokenErr.message);
          } else {
            supabaseUser = userFromToken;
          }
        }
      } catch (headerErr) {
        console.warn("Bearer token retrieval failed:", headerErr);
      }
    }
    
    if (!supabaseUser) {
      return { user: null };
    }

    const user = {
      $id: supabaseUser.id,
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      prefs: supabaseUser.user_metadata?.prefs || {}
    };

    return { user };
  } catch (error) {
    console.warn("getLoggedInUser auth failed:", error instanceof Error ? error.message : error);
    return { user: null };
  }
}
