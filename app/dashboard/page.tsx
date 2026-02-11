
"use client";

import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { TrustedBy } from '@/components/TrustedBy';
import { Problem } from '@/components/Problem';
import { Process } from '@/components/Process';
import { Features } from '@/components/Features';
import { Pricing } from '@/components/Pricing';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black font-sans text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Problem />
      <Process />
      <Features />
      <Pricing />
      <CTA />
      <Footer />

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
