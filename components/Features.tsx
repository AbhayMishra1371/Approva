import React from 'react';
import { MessageSquare, History, Zap, Shield, CheckCircle2 } from 'lucide-react';

export const Features = () => {
  const features = [
    { Icon: MessageSquare, label: "Live Reviews", color: "text-[#FD366E]", desc: "Instant sync for your global team." },
    { Icon: History, label: "Versioning", color: "text-[#8129D9]", desc: "Immutable history of every change." },
    { Icon: Zap, label: "Speed Ops", color: "text-amber-500", desc: "Built on high-performance infrastructure." },
    { Icon: Shield, label: "Hardened", color: "text-emerald-500", desc: "Encryption that never sleeps." }
  ];

  return (
    <section id="features" className="py-40 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {features.map((item, i) => (
                      <div key={i} className="pink-shine p-8 rounded-[2rem] bg-black/50 hover:bg-[#FD366E]/5 transition-all group">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-[#FD366E]/10 group-hover:scale-110 group-hover:border-[#FD366E]/30 transition-all shadow-[0_0_15px_rgba(253,54,110,0.05)]">
                              <item.Icon className={`w-7 h-7 ${item.color}`} />
                          </div>
                          <h4 className="text-lg font-black text-white mb-2">{item.label}</h4>
                          <p className="text-sm text-zinc-500 leading-relaxed font-bold">{item.desc}</p>
                      </div>
                  ))}
              </div>

              <div>
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-[0.9] tracking-tighter">
                      The <span className="text-[#FD366E] drop-shadow-[0_0_20px_rgba(253,54,110,0.2)]">Shining</span> <br />
                      Stack of <br />
                      Developers.
                  </h2>
                  <p className="text-zinc-400 text-xl mb-12 leading-relaxed font-bold">
                      We didn't just build a tool. We built an experience that prioritizes your speed and vision above all else.
                  </p>
                  <ul className="space-y-6">
                      {['Unlimited Guests', 'Automated Handoffs', 'Custom Branding'].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 group">
                              <div className="w-6 h-6 rounded-full bg-[#FD366E]/10 flex items-center justify-center text-[#FD366E] border border-[#FD366E]/20 group-hover:shadow-[0_0_10px_rgba(253,54,110,0.3)] transition-all">
                                  <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-zinc-300 group-hover:text-white transition-colors">{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </div>
    </section>
  );
};
