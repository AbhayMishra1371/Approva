import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const Pricing = () => {
  return (
    <section id="pricing" className="py-40 bg-black border-t border-[#FD366E]/10">
      <div className="max-w-7xl mx-auto px-4 text-center mb-32">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Choose Your <span className="text-[#FD366E]">Glow.</span></h2>
        <p className="text-zinc-500 text-xl font-bold max-w-2xl mx-auto italic">Powering teams of all sizes with pure black performance.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-stretch max-w-5xl mx-auto">
              {/* Core */}
              <div className="pink-shine p-12 rounded-[3.5rem] flex flex-col bg-black/40 hover:bg-[#FD366E]/5 transition-all">
                  <div className="mb-10">
                      <h3 className="text-2xl font-black text-white mb-2 italic">Essential</h3>
                      <p className="text-zinc-500 font-bold opacity-60">For lone builders</p>
                  </div>
                  <div className="mb-12">
                      <span className="text-7xl font-black text-white">$0</span>
                      <span className="text-zinc-700 font-black ml-2 uppercase tracking-widest text-sm">Forever</span>
                  </div>
                  <ul className="space-y-6 mb-16 flex-grow">
                      {[ '3 Active Projects', 'Unlimited Reviewers', 'Community Support' ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-zinc-500 font-bold">
                              <CheckCircle2 className="w-5 h-5 text-[#FD366E] opacity-50" />
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-6 rounded-3xl border border-white/5 text-zinc-400 font-black text-lg hover:text-white hover:bg-white/5 transition-all">
                      Get Started
                  </button>
              </div>

              {/* Startup */}
              <div className="relative p-12 rounded-[3.5rem] flex flex-col bg-black border-2 border-[#FD366E] shadow-[0_0_40px_rgba(253,54,110,0.2)] group overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#FD366E] text-white px-8 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(253,54,110,0.5)]">
                      Premium Glow
                  </div>
                  <div className="mb-10">
                      <h3 className="text-2xl font-black text-white mb-2 italic">Production</h3>
                      <p className="text-[#FD366E] font-black uppercase tracking-tighter text-xs">For high-velocity teams</p>
                  </div>
                  <div className="mb-12">
                      <span className="text-7xl font-black text-white">$49</span>
                      <span className="text-zinc-600 font-bold ml-2">/mo</span>
                  </div>
                  <ul className="space-y-6 mb-16 flex-grow">
                      {[ 'Unlimited Projects', 'Custom Storage', 'Priority Engineering', 'API Access' ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-white font-black group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] transition-all">
                              <CheckCircle2 className="w-5 h-5 text-[#FD366E] shadow-[0_0_10px_rgba(253,54,110,0.5)]" />
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-6 rounded-3xl bg-[#FD366E] text-white font-black text-lg hover:bg-[#ff4d7e] transition-all shadow-[0_20px_50px_rgba(253,54,110,0.4)] group-hover:-translate-y-1">
                      Choose Production
                  </button>
              </div>
          </div>
      </div>
    </section>
  );
};
