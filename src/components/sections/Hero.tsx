import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Layers, MessageSquare, Sparkles } from 'lucide-react';
import BounceCards from '../ui/BounceCards';

export const Hero = () => {
  const images = [
    "https://picsum.photos/400/400?grayscale",
    "https://picsum.photos/500/500?grayscale",
    "https://picsum.photos/600/600?grayscale",
    "https://picsum.photos/700/700?grayscale",
    "https://picsum.photos/300/300?grayscale"
  ];

  const transformStyles = [
    "rotate(5deg) translate(-150px)",
    "rotate(0deg) translate(-70px)",
    "rotate(-5deg)",
    "rotate(5deg) translate(70px)",
    "rotate(-5deg) translate(150px)"
  ];
  return (
    <section className="relative pt-32 pb-20 md:pt-56 md:pb-40 overflow-hidden bg-transparent bg-grid-pattern">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -z-10 bg-primary/20 blur-[150px] w-[600px] h-[600px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 bg-secondary/10 blur-[150px] w-[600px] h-[600px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="max-w-3xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-accent-purple text-xs font-semibold tracking-wide mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Asset Workflows</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 md:mb-8 text-white">
              Ship Content <br />
              <span className="text-gradient">Faster & Smarter</span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg font-medium">
              The premium approval platform for high-performance teams. Deep black foundation, violet glows, and seamless asset collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full">
              <Link href="/login" className="btn-primary text-white px-8 py-4 rounded-full font-bold text-base flex items-center justify-center gap-2 group w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="glass hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 w-full sm:w-auto">
                <Play className="w-4 h-4 fill-white shrink-0" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <BounceCards
            className="custom-bounceCards"
            images={images}
            containerWidth={500}
            containerHeight={250}
            animationDelay={1}
            animationStagger={0.08}
            easeType="elastic.out(1, 0.5)"
            transformStyles={transformStyles}
            enableHover={false}
          />
        </div>
      </div>
    </section>
  );
};
