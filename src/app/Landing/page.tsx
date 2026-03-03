
"use client";

import React from 'react';
import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { TrustedBy } from '@/components/sections/TrustedBy';
import { Problem } from '@/components/sections/Problem';
import { Process } from '@/components/sections/Process';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { CTA } from '@/components/sections/CTA';
import { Footer } from '@/components/sections/Footer';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent font-sans text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Problem />
      <Process />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
