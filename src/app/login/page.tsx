"use client";

import { createClient } from "@/lib/supabase/client";
import { Chrome, ArrowLeft, Lock, Mail, Sparkles } from "lucide-react";

import Image from "next/image";


import Link from "next/link";
import { useState } from "react";
import { login, getJwt } from "@/lib/auth/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const prefilledEmail = searchParams.get("email") || "";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
        }
      } catch (err) {
        // Not logged in, stay on this page
      }
    };
    if (!token) {
      checkSession();
    }
  }, [router, token]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading("email");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      setErrorMessage(null);
      const result = await login(email, password);

      if (result?.error) {
        if (result.error.message?.includes("Invalid credentials")) {
          setErrorMessage("Invalid credentials. If you haven't registered an account yet, please sign up.");
        } else {
          setErrorMessage(result.error.message || "An error occurred during login.");
        }
        return;
      }

      // login returns data which contains { user, session } if successful, but checking if error is handled.
      if (result?.user) {
        if (token) {
          // Accept the invite using the new session before redirecting
          const jwt = await getJwt();
          const res = await fetch("/api/invites/accept", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(jwt && { "Authorization": `Bearer ${jwt}` })
            },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.removeItem("pendingInviteToken");
            router.push(`/dashboard/projects/${data.project_id}`);
            return;
          } else if (res.status === 403) {
            router.push(`/invitations/accept?token=${token}`);
            return;
          }
        }
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Email Login Error:", error?.message || error);
      setErrorMessage(error?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleOAuthLogin = async (provider: "google") => {

    setIsLoading(provider);
    try {
      const supabase = createClient();
      
      if (token) {
        localStorage.setItem("pendingInviteToken", token);
      }

      const successUrl = token
        ? `/invitations/accept?token=${token}`
        : `/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === "google" ? "google" : "github",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(successUrl)}`,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error("Login error:", error?.message || error);
      setIsLoading(null);
    }
  };

  return (
    <div className="h-screen bg-transparent text-white flex items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -z-10 bg-primary/20 blur-[150px] w-[500px] h-[500px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 bg-secondary/10 blur-[150px] w-[500px] h-[500px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md z-10 flex flex-col">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold tracking-tight">Return to Dashboard</span>
        </Link>

        {/* Login Card */}
        <div className="glass p-6 md:p-8 rounded-[2rem] relative overflow-hidden border-white/5 shadow-2xl">
          <div className="relative z-10">
            <div className="mb-6 text-center">
              <Image 
                src="/approva-logo 2.png" 
                alt="Approva Logo" 
                width={64} 
                height={64} 
                className="mx-auto mb-4 object-contain" 
              />


              <h1 className="text-2xl font-bold mb-2 tracking-tight">Welcome back</h1>
              <p className="text-slate-400 font-medium text-xs">Sign in to your creative workspace</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleOAuthLogin("google")}
                disabled={!!isLoading}
                className="w-full bg-white text-zinc-900 hover:bg-zinc-50 px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border border-white/20"
              >
                {isLoading === "google" ? (
                  <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.86-2.59 3.29-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </button>
            </div>



            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Security Verified</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl mb-4 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 mt-0.5 shrink-0" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorMessage}
              </div>
            )}

            <form className="space-y-3" onSubmit={handleEmailLogin}>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  name="email"
                  defaultValue={prefilledEmail}
                  placeholder="name@agency.com"
                  className="w-full rounded-xl py-3 pl-12 pr-4 transition-all font-medium text-xs placeholder:text-slate-600 neon-input"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  className="w-full rounded-xl py-3 pl-12 pr-4 transition-all font-medium text-xs placeholder:text-slate-600 neon-input"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!!isLoading}
                className="btn-primary w-full text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === "email" ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
              New to Approva? <Link href="/signup" className="text-primary hover:text-white transition-colors font-bold">Create Account</Link> <br />
              <span className="opacity-60">By continuing, you agree to our Terms of Service</span>
            </div>
          </div>

          {/* Decorative Accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent blur-3xl -mr-12 -mt-12 opacity-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl -ml-12 -mb-12 opacity-40 pointer-events-none" />
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 font-bold text-lg tracking-tight text-white group cursor-default">
            <Image 
              src="/approva-logo.svg" 
              alt="Approva Logo" 
              width={24} 
              height={24} 
              className="object-contain" 
            />
            <span className="text-sm">Approva<span className="text-primary italic">.</span></span>
          </div>
        </div>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0b0c10] flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

