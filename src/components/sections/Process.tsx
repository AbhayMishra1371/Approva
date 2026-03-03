import React from 'react';

export const Process = () => {
  const steps = [
    { num: "01", title: "Smart Upload", desc: "Drag and drop any media asset. We handle the optimization and version control." },
    { num: "02", title: "Live Annotation", desc: "Add frame-accurate comments directly on assets. No more 'at 2:14' messages." },
    { num: "03", title: "One-Click Approval", desc: "Stakeholders sign off with a single click. Auto-notifies the entire team." }
  ];

  return (
    <section className="py-32 bg-transparent bg-grid-pattern border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 bg-secondary/5 blur-[120px] w-96 h-96 rounded-full translate-x-1/2 -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">The Modern <span className="text-gradient">Approval Stack</span></h2>
        <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">From upload to final sign-off in record time.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                  <div key={i} className="flex flex-col group relative p-8 glass rounded-3xl hover:border-primary/30 transition-all duration-300">
                      <div className="text-7xl font-bold text-white/5 absolute -top-8 -left-4 pointer-events-none group-hover:text-primary/10 transition-colors duration-500">
                          {step.num}
                      </div>
                      <div className="w-12 h-1 bg-surface-border rounded-full mb-8 overflow-hidden">
                          <div className="w-0 group-hover:w-full h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-medium">{step.desc}</p>
                  </div>
              ))}
          </div>
      </div>
    </section>
  );
};
