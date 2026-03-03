import React from 'react';
import { MessageSquare, Layout, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Features = () => {
  const features = [
    { Icon: MessageSquare, label: "Live Reviews", color: "text-primary", desc: "Instant sync for your global creative team." },
    { Icon: Activity, label: "Version Control", color: "text-accent-purple", desc: "Track every iteration of your assets securely." },
    { Icon: Layout, label: "Asset Grid", color: "text-accent-blue", desc: "Beautiful galleries for all your project files." },
    { Icon: ShieldCheck, label: "Enterprise Security", color: "text-emerald-400", desc: "Bank-grade encryption for your creative IP." }
  ];

  return (
    <section id="features" className="py-32 bg-transparent bg-grid-pattern relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute bottom-0 left-0 -z-10 bg-primary/5 blur-[120px] w-96 h-96 rounded-full -translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 order-2 lg:order-1">
                  {features.map((item, i) => (
                      <div key={i} className="glass p-8 rounded-3xl hover:bg-white/5 transition-all group border-white/5 hover:border-white/10">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 group-hover:border-primary/20 transition-all shadow-lg">
                              <item.Icon className={`w-6 h-6 ${item.color}`} />
                          </div>
                          <h4 className="text-lg font-bold text-white mb-2">{item.label}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                  ))}
              </div>

              <div className="order-1 lg:order-2 text-left">
                  <p className="text-primary font-bold uppercase tracking-widest text-[10px] mb-4 text-left">Performance First</p>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                      Built for <span className="text-gradient">High-Stakes</span> <br />
                      Asset Approval.
                  </h2>
                  <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                      Control the chaos. Our Neo-Tech interface gives your team the visual clarity needed for rapid sign-offs.
                  </p>
                  <ul className="space-y-4">
                      {['Frame-Accurate Video Feedback', 'Global Asset Search', 'Custom Approval Workflows'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 group">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:glow-violet transition-all">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </div>
    </section>
  );
};
