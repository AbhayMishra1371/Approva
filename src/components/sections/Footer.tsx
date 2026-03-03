import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="pt-24 pb-12 bg-transparent bg-grid-pattern border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
              <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-8 group cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:rotate-12 transition-all">
                          <div className="w-5 h-5 border-2 border-white/80 rounded-sm rotate-45" />
                      </div>
                      <span className="font-bold text-2xl tracking-tight text-white">Approva<span className="text-primary">.</span></span>
                  </div>
                  <p className="text-slate-500 text-base leading-relaxed mb-10 max-w-sm font-medium">
                    The premium standard for modern asset workflows. Built for teams that demand performance and visual clarity.
                  </p>
                  <div className="flex justify-center md:justify-start gap-4">
                      <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-110">
                          <Twitter className="w-4 h-4" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-110">
                          <Linkedin className="w-4 h-4" />
                      </a>
                      <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-110">
                          <Github className="w-4 h-4" />
                      </a>
                  </div>
              </div>

              <div>
                  <h4 className="font-bold mb-8 text-xs uppercase tracking-widest text-primary">Product</h4>
                  <ul className="space-y-4">
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Workflows</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Asset Management</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Collaborators</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Changelog</a></li>
                  </ul>
              </div>

              <div>
                  <h4 className="font-bold mb-8 text-xs uppercase tracking-widest text-primary">Company</h4>
                  <ul className="space-y-4">
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">About Us</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Careers</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Security</a></li>
                      <li><a href="#" className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Privacy</a></li>
                  </ul>
              </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-600 text-xs font-semibold tracking-wide">© 2024 APPROVA TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
              <div className="flex gap-8">
                  <a href="#" className="text-slate-600 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">Legal</a>
                  <a href="#" className="text-slate-600 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">Terms</a>
                  <a href="#" className="text-slate-600 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">Security</a>
              </div>
          </div>
      </div>
    </footer>
  );
};
