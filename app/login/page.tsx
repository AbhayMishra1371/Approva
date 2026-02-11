"use client";

import { supabase } from "@/lib/supabase/client";

export default function Login() {
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
      },
    });
  };

  return <button onClick={login}>Login with Google</button>;
}
