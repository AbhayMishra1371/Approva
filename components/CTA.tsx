import Link from 'next/link';

export const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-black bg-dot-pattern border-y border-[#FD366E]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black pink-shine rounded-[4rem] py-32 px-10 text-center relative overflow-hidden shadow-[0_0_100px_rgba(253,54,110,0.15)]">
              {/* Decoration glows */}
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FD366E]/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#8129D9]/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
              
              <h2 className="text-5xl md:text-8xl font-black text-white mb-10 relative z-10 tracking-tighter leading-none italic">
                  Join the <br /> <span className="text-[#FD366E] drop-shadow-[0_0_30px_rgba(253,54,110,0.4)]">Evolution.</span>
              </h2>
              <p className="text-zinc-500 text-xl mb-16 max-w-2xl mx-auto relative z-10 font-bold">
                  Scale your creative production to infinity and beyond. Pure black background, glowing results.
              </p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center relative z-10">
                  <Link href="/login" className="bg-[#FD366E] text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(253,54,110,0.4)]">
                      Launch Workspace
                  </Link>
                  <button className="bg-white/5 text-white border border-[#FD366E]/30 px-12 py-6 rounded-[2rem] font-black text-xl hover:bg-white/10 transition-all backdrop-blur-md">
                      Request Access
                  </button>
              </div>
          </div>
      </div>
    </section>
  );
};
