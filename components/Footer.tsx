import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="pt-40 pb-20 bg-black border-t border-[#FD366E]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-20 mb-32">
              <div className="col-span-2">
                  <div className="flex items-center gap-3 mb-10 group cursor-pointer">
                      <div className="w-12 h-12 bg-[#FD366E] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(253,54,110,0.5)] group-hover:rotate-12 transition-all">
                          <div className="w-6 h-6 bg-white rounded-full opacity-90" />
                      </div>
                      <span className="font-black text-3xl tracking-tighter text-white">CAAW</span>
                  </div>
                  <p className="text-zinc-500 text-lg leading-relaxed mb-12 max-w-sm font-bold italic">
                    The highest standard for modern creative ops. Engineered to shine in the dark.
                  </p>
                  <div className="flex gap-6">
                      <a href="#" className="w-12 h-12 rounded-2xl pink-shine bg-black flex items-center justify-center text-zinc-500 hover:text-[#FD366E] transition-all hover:scale-110">
                          <Twitter className="w-5 h-5" />
                      </a>
                      <a href="#" className="w-12 h-12 rounded-2xl pink-shine bg-black flex items-center justify-center text-zinc-500 hover:text-[#FD366E] transition-all hover:scale-110">
                          <Linkedin className="w-5 h-5" />
                      </a>
                      <a href="#" className="w-12 h-12 rounded-2xl pink-shine bg-black flex items-center justify-center text-zinc-500 hover:text-[#FD366E] transition-all hover:scale-110">
                          <Github className="w-5 h-5" />
                      </a>
                  </div>
              </div>

              <div>
                  <h4 className="font-black mb-10 text-xs uppercase tracking-[0.3em] text-[#FD366E] drop-shadow-[0_0_5px_rgba(253,54,110,0.3)]">Product</h4>
                  <ul className="space-y-6">
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Workspace</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Infrastructure</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Performance</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Changelog</a></li>
                  </ul>
              </div>

              <div>
                  <h4 className="font-black mb-10 text-xs uppercase tracking-[0.3em] text-[#FD366E] drop-shadow-[0_0_5px_rgba(253,54,110,0.3)]">Company</h4>
                  <ul className="space-y-6">
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Manifesto</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Careers</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Press Kit</a></li>
                      <li><a href="#" className="text-zinc-500 hover:text-white text-base font-bold transition-colors">Privacy</a></li>
                  </ul>
              </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-zinc-700 text-sm font-black tracking-widest uppercase">© 2024 CAAW SYSTEMS — SHINING IN THE DARK</p>
              <div className="flex gap-10">
                  <a href="#" className="text-zinc-700 hover:text-[#FD366E] text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Legal</a>
                  <a href="#" className="text-zinc-700 hover:text-[#FD366E] text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Terms</a>
                  <a href="#" className="text-zinc-700 hover:text-[#FD366E] text-[10px] font-black uppercase tracking-[0.2em] transition-colors">Status</a>
              </div>
          </div>
      </div>
    </footer>
  );
};
