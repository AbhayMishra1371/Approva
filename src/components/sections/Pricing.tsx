import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export const Pricing = () => {
  return (
    <section id="pricing" className="py-32 bg-transparent bg-grid-pattern border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -z-10 bg-primary/5 blur-[150px] w-full h-full rounded-full -translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 text-center mb-24">
        <p className="text-primary font-bold uppercase tracking-widest text-[10px] mb-4">Pricing Plans</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Predictable <span className="text-gradient">Scaling</span></h2>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">High-performance asset approval, priced for teams that ship.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
              {/* Starter */}
              <div className="glass p-10 rounded-3xl flex flex-col hover:border-white/10 transition-all">
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Essential</h3>
                      <p className="text-slate-500 text-sm font-medium">For independent creators</p>
                  </div>
                  <div className="mb-10">
                      <span className="text-6xl font-bold text-white tracking-tight">$0</span>
                      <span className="text-slate-600 font-semibold ml-2 uppercase tracking-widest text-xs">Free</span>
                  </div>
                  <ul className="space-y-5 mb-12 flex-grow">
                      {[ '5 Active Workflows', '10GB Asset Storage', 'Unlimited Reviewers', 'Standard Support' ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-400 font-medium text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary/60" />
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-4 rounded-full border border-white/5 text-slate-400 font-bold text-sm hover:text-white hover:bg-white/5 transition-all">
                      Get Started
                  </button>
              </div>

              {/* Pro */}
              <div className="relative p-10 rounded-3xl flex flex-col bg-surface border border-primary/40 shadow-2xl shadow-primary/20 group overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-secondary text-white px-6 py-1.5 rounded-bl-2xl font-bold text-[10px] uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 inline-block mr-1 mb-0.5" />
                      Most Popular
                  </div>
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Team Pro</h3>
                      <p className="text-primary/80 text-sm font-bold uppercase tracking-tight text-xs">For high-velocity agencies</p>
                  </div>
                  <div className="mb-10">
                      <span className="text-6xl font-bold text-white tracking-tight">$49</span>
                      <span className="text-slate-500 font-semibold ml-2 text-sm">/mo</span>
                  </div>
                  <ul className="space-y-5 mb-12 flex-grow">
                      {[ 'Unlimited Workflows', '500GB Asset Storage', 'Custom Branding', 'Priority Sign-offs', 'API Access' ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-white font-semibold text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                              {item}
                          </li>
                      ))}
                  </ul>
                  <button className="w-full py-4 rounded-full btn-primary text-white font-bold text-sm transition-all hover:scale-[1.02]">
                      Start Team Trial
                  </button>
              </div>
          </div>
      </div>
    </section>
  );
};
