"use client";

import { supabase } from "@/lib/supabase/client";
import { Github, Chrome, ArrowLeft, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden bg-dot-pattern">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -z-10 bg-[#FD366E]/10 blur-[150px] w-[500px] h-[500px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 bg-[#8129D9]/10 blur-[150px] w-[500px] h-[500px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md z-10">
        {/* Back to Home */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Back to home</span>
        </Link>

        {/* Login Card */}
        <div className="glass pink-shine p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-[#FD366E]/10 flex items-center justify-center rounded-2xl mx-auto mb-6 border border-[#FD366E]/20">
                <Lock className="w-8 h-8 text-[#FD366E]" />
              </div>
              <h1 className="text-4xl font-black mb-3">Welcome Back</h1>
              <p className="text-zinc-400 font-medium">Choose your preferred sign in method</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleOAuthLogin("google")}
                disabled={!!isLoading}
                className="w-full bg-white text-black hover:bg-zinc-200 px-6 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === "google" ? (
                  <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Chrome className="w-6 h-6" />
                )}
                Continue with Google
              </button>

              <button
                onClick={() => handleOAuthLogin("github")}
                disabled={!!isLoading}
                className="w-full bg-[#24292F] hover:bg-[#24292F]/80 text-white px-6 py-4 rounded-2xl font-black text-lg transition-all border border-white/10 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading === "github" ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Github className="w-6 h-6" />
                )}
                Continue with GitHub
              </button>
            </div>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest text-[10px]">Security Verified</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#FD366E] transition-colors" />
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#FD366E]/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium placeholder:text-zinc-600 focus:bg-white/10"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#FD366E] transition-colors" />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#FD366E]/50 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium placeholder:text-zinc-600 focus:bg-white/10"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#FD366E]/10 hover:bg-[#FD366E] text-[#FD366E] hover:text-white border border-[#FD366E]/20 px-6 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 mt-6 shadow-[0_0_20px_rgba(253,54,110,0.1)] hover:shadow-[0_0_30px_rgba(253,54,110,0.3)] hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 text-center text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
              By continuing, you agree to our <br />
              <Link href="#" className="text-white hover:text-[#FD366E] transition-colors">Terms</Link> & <Link href="#" className="text-white hover:text-[#FD366E] transition-colors">Privacy</Link>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FD366E]/20 to-transparent blur-2xl -mr-10 -mt-10 opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#8129D9]/20 to-transparent blur-2xl -ml-10 -mb-10 opacity-50" />
        </div>

        {/* Branding Footer */}
        <div className="mt-12 text-center">
             <div className="inline-flex items-center gap-2 font-black text-2xl tracking-tighter opacity-20 hover:opacity-100 transition-opacity cursor-default group">
                <div className="w-2 h-2 rounded-full bg-[#FD366E] group-hover:animate-ping" />
                <span className="text-white">SHINE</span>
                <span className="text-[#FD366E]">OS</span>
             </div>
        </div>
      </div>
    </div>
  );
}
