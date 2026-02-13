import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Users, MessageSquare } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-56 md:pb-40 overflow-hidden bg-black bg-dot-pattern">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -z-10 bg-[#FD366E]/15 blur-[150px] w-full h-[700px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 bg-[#8129D9]/10 blur-[150px] w-full h-[700px] rounded-full -translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="max-w-3xl z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FD366E]/10 border border-[#FD366E]/20 text-[#FD366E] text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD366E] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FD366E]"></span>
                </span>
              <span>The New Standard</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-10 text-white">
              Shine On. <br />
              <span className="text-white opacity-40">Build</span> <br /> 
              <span className="text-[#FD366E] drop-shadow-[0_0_30px_rgba(253,54,110,0.3)]">Better.</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-lg font-bold">
              The only platform that prioritizes your speed. Pure black, pure performance, and glowing results.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/login" className="bg-[#FD366E] hover:bg-[#ff4d7e] text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-[0_20px_40px_rgba(253,54,110,0.2)] flex items-center justify-center gap-3 group hover:-translate-y-1">
                Start Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="bg-white/5 hover:bg-white/10 text-white border border-[#FD366E]/30 px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(253,54,110,0.1)]">
                <Play className="w-6 h-6 fill-[#FD366E] text-[#FD366E]" />
                Full Demo
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative z-10">
            <div className="relative pink-shine bg-black/50 backdrop-blur-xl rounded-[2.5rem] p-4 lg:p-8 transform lg:rotate-3 hover:rotate-0 transition-all duration-700 group">
                <div className="bg-black rounded-[1.8rem] overflow-hidden border border-[#FD366E]/20 aspect-[4/3] relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FD366E]/10 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
                    
                    {/* Mock Interface */}
                    <div className="p-10 flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 rounded-3xl bg-[#FD366E]/10 flex items-center justify-center mb-6 animate-bounce-slow shadow-[0_0_40px_rgba(253,54,110,0.1)]">
                            <Users className="w-12 h-12 text-[#FD366E]" />
                        </div>
                        <div className="h-1 w-32 bg-[#FD366E]/20 rounded-full mb-3 shadow-[0_0_10px_rgba(253,54,110,0.2)]" />
                        <div className="h-1 w-20 bg-white/5 rounded-full" />
                    </div>

                    {/* Window Controls */}
                    <div className="absolute top-6 left-6 flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-10 -right-10 pink-shine bg-black/80 backdrop-blur-xl p-5 rounded-3xl shadow-3xl animate-bounce-slow hidden md:block">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-xs font-black text-white">Status</p>
                          <p className="text-[10px] text-zinc-500">Live & Glowing</p>
                      </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-10 pink-shine bg-black/80 backdrop-blur-xl p-5 rounded-3xl shadow-3xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#FD366E]/10 flex items-center justify-center text-[#FD366E] border border-[#FD366E]/20">
                          <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-xs font-black text-white">Review</p>
                          <p className="text-[10px] text-zinc-500">"Build is perfect."</p>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
