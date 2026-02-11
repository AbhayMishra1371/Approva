import React from 'react';

export const TrustedBy = () => {
  const logos = ['GLOBAL AGENCY', 'UTIBER', 'PARADOX', 'MULTINANCE', 'CREATIVFLOW'];
  
  return (
    <section className="py-24 bg-black border-y border-[#FD366E]/10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-16 italic">Empowering the brightest teams</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-20">
          {logos.map((logo, i) => (
            <div key={i} className="group cursor-default">
              <span className="text-xl font-black italic tracking-tighter text-zinc-700 group-hover:text-[#FD366E] transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:drop-shadow-[0_0_10px_rgba(253,54,110,0.3)]">
                {logo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
