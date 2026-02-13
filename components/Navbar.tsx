import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#FD366E]/20 shadow-[0_4px_30px_rgba(253,54,110,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-[#FD366E] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(253,54,110,0.4)]">
              <div className="w-5 h-5 bg-white rounded-full opacity-90" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">Approva</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-zinc-400 hover:text-[#FD366E] transition-colors text-sm font-bold tracking-wide">Features</a>
            <a href="#process" className="text-zinc-400 hover:text-[#FD366E] transition-colors text-sm font-bold tracking-wide">Process</a>
            <a href="#pricing" className="text-zinc-400 hover:text-[#FD366E] transition-colors text-sm font-bold tracking-wide">Pricing</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden sm:block text-zinc-400 hover:text-white text-sm font-bold transition-colors">Sign In</Link>
            <button className="bg-[#FD366E] hover:bg-[#ff4d7e] text-white px-6 py-2.5 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(253,54,110,0.3)]">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
