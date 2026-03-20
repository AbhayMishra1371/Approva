import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Orb from '../Orb';


export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-transparent">
      {/* Orb Background */}
      <div className="absolute inset-0 -z-10 w-full h-full">
        <Orb
          hue={270}
          hoverIntensity={0.5}
          rotateOnHover={true}
          backgroundColor="#030303"
        />
      </div>



      {/* Grid Overlay for subtle texture */}
      <div className="absolute inset-0 -z-20 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Background Glows (Subtle secondary layers) */}
      <div className="absolute top-0 right-0 -z-10 bg-primary/10 blur-[150px] w-[500px] h-[500px] rounded-full translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 -z-10 bg-secondary/5 blur-[150px] w-[500px] h-[500px] rounded-full -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-accent-purple text-xs font-semibold tracking-wide mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Asset Workflows</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8 text-white">
            Ship Content <br />
            <span className="text-gradient">Faster & Smarter</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl font-medium">
            The premium approval platform for high-performance teams. Deep black foundation, violet glows, and seamless asset collaboration.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full justify-center">
            <Link href="/login" className="btn-primary text-white px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 group w-full sm:w-auto">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>

          <div className="mt-20 flex flex-wrap justify-center gap-8 opacity-50 grayscale transition-all hover:grayscale-0">
            {/* Dynamic trust badges or subtle decoration could go here */}
          </div>
        </div>
      </div>
    </section>
  );
};
