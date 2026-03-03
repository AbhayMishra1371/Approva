import React from 'react';

export const TrustedBy = () => {
  const logos = ['TECHFLOW', 'NEXA', 'PRISM OS', 'VELOCITY', 'LUMINA'];
  
  return (
    <section className="py-20 bg-transparent bg-grid-pattern border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-12">Trusted by world-class creative teams</p>
        <div className="flex flex-wrap justify-center gap-10 md:gap-20">
          {logos.map((logo, i) => (
            <div key={i} className="group cursor-default">
              <span className="text-xl font-bold tracking-tighter text-slate-600 group-hover:text-primary transition-all duration-300 opacity-50 group-hover:opacity-100">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
