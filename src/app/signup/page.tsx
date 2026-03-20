"use client";

import { createBrowserClient } from "@/lib/appwrite/client";
import { OAuthProvider } from "appwrite";
import { Chrome, ArrowLeft, UserPlus, Mail, ShieldCheck, Sparkles } from "lucide-react";

import Image from "next/image";

import Link from "next/link";
import { useState } from "react";
import { signUp, login, getJwt } from "@/lib/auth/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function SignupForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const prefilledEmail = searchParams.get("email") || "";

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { account } = createBrowserClient();
        const user = await account.get();
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

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading("email");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      let result = await signUp(email, password, name);

      // If user already exists, try to log them in directly
      if (result?.error && result.error.message.includes("already exists")) {
        // Log the user in
        const loginResult = await login(email, password);
        if (loginResult.error) {
          throw loginResult.error;
        }
        result = { user: loginResult.user, error: null }; // Mock a successful signup result
      } else if (result?.error) {
        throw result.error;
      }

      if (result?.user) {
        // We must log in to establish the session after signing up (unless we just did above, but `login` safely handles existing sessions or creates an email/password session)
        await login(email, password);

        if (token) {
          // Store token in localStorage in case component unmounts or to be picked up by layout
          localStorage.setItem("pendingInviteToken", token);

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
            // ... (keeping mismatch logic)
            localStorage.removeItem("pendingInviteToken");
            router.push(`/invitations/accept?token=${token}`);
            return;
          }
        }
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Email Signup Error:", error?.message || error);
      // Optional: you could add `toast.error(error?.message || "An error occurred during signup")` here if you have `toast` imported
    } finally {
      setIsLoading(null);
    }
  };

  const handleOAuthSignup = async (provider: "google") => {

    setIsLoading(provider);
    try {
      const { account } = createBrowserClient();
      const oauthProvider = provider === "google" ? OAuthProvider.Google : OAuthProvider.Github;

      // Currently, Appwrite OAuth lacks a native 'state' param for passing arbitrary data like inviteId
      // Store it in localStorage to retrieve it in standard DashboardLayout or a dedicated callback page
      if (token) {
        localStorage.setItem("pendingInviteToken", token);
      }

      const successUrl = token
        ? `${window.location.origin}/invitations/accept?token=${token}`
        : `${window.location.origin}/dashboard`;

      account.createOAuth2Session(
        oauthProvider,
        successUrl,
        `${window.location.origin}/signup`
      );
    } catch (error: any) {
      console.error("Signup error:", error?.message || error);
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

        {/* Signup Card */}
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


              <h1 className="text-2xl font-bold mb-2 tracking-tight">Create Account</h1>
              <p className="text-slate-400 font-medium text-xs">Join the next generation of asset approval</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleOAuthSignup("google")}
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
                Sign up with Google
              </button>

            </div>


            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Secure Workspace</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <form className="space-y-3" onSubmit={handleEmailSignup}>
              <div className="relative group">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full rounded-xl py-3 pl-12 pr-4 transition-all font-medium text-xs placeholder:text-slate-600 neon-input"
                  required
                />
              </div>
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
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  name="password"
                  placeholder="Master password"
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
                    Create Workspace
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
              Already have an account? <Link href={`/login${token ? `?token=${token}&email=${encodeURIComponent(prefilledEmail)}` : ''}`} className="text-primary hover:text-white transition-colors font-bold">Sign In</Link> <br />
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0b0c10] flex items-center justify-center text-white">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

