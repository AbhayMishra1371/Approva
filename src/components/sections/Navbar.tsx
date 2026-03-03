import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
              <div className="w-5 h-5 border-2 border-white/80 rounded-sm rotate-45" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Approva<span className="text-primary italic">.</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide">Features</a>
            <a href="#process" className="text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide">Workflows</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide">Company</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block text-slate-400 hover:text-white text-sm font-semibold transition-colors">Sign In</Link>
              <button className="btn-primary text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95">
                Start Building
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

