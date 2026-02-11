import React from 'react';

export const Process = () => {
  const steps = [
    { num: "01", title: "Initialize", desc: "Connect your workspace and watch it glow with zero configuration." },
    { num: "02", title: "Review", desc: "Real-time sync and precise feedback on every frame." },
    { num: "03", title: "Deploy", desc: "Automated delivery to production with a single click." }
  ];

  return (
    <section id="process" className="py-40 bg-black border-y border-[#FD366E]/5">
      <div className="max-w-7xl mx-auto px-4 text-center mb-32">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Engineered to <span className="text-[#FD366E]">Shine.</span></h2>
        <p className="text-zinc-500 text-xl font-bold max-w-2xl mx-auto italic">From code to production in a flash.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-3 gap-16">
              {steps.map((step, i) => (
                  <div key={i} className="flex flex-col group relative p-8 pink-shine rounded-[2rem] bg-black/40">
                      <div className="text-8xl font-black text-white/5 absolute -top-12 -left-4 pointer-events-none group-hover:text-[#FD366E]/10 transition-colors duration-500 italic">
                          {step.num}
                      </div>
                      <div className="w-1.5 h-12 bg-zinc-900 rounded-full mb-8 overflow-hidden group-hover:bg-[#FD366E]/20 transition-colors border border-white/5">
                          <div className="w-full h-0 group-hover:h-full bg-[#FD366E] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(253,54,110,0.5)]" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-6 tracking-tight group-hover:text-[#FD366E] transition-colors">{step.title}</h3>
                      <p className="text-zinc-500 text-base leading-relaxed font-bold">{step.desc}</p>
                  </div>
              ))}
          </div>
      </div>
    </section>
  );
};
