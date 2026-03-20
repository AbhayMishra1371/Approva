import React from 'react';
import { Zap, MessageSquare, ShieldAlert } from 'lucide-react';

export const Problem = () => {
  const problems = [
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: "Approval Bottlenecks",
      desc: 'Asset sign-offs take days, not minutes. We automated the friction away.',
      color: "from-primary to-secondary"
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-white" />,
      title: "Context Loss",
      desc: 'Feedback scattered across Slack and Email. Keep every comment in one thread.',
      color: "from-accent-purple to-secondary"
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-white" />,
      title: "Version Chaos",
      desc: "Losing track of final_v2_final.psd? Our versioning system keeps it clean.",
      color: "from-primary to-accent-blue"
    }
  ];

  return (
    <section className="py-32 relative bg-transparent bg-grid-pattern overflow-hidden" id="process">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -z-10 bg-primary/5 blur-[120px] w-full h-full rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-24 text-center max-w-2xl mx-auto">
          <p className="text-primary font-bold uppercase tracking-widest text-[10px] mb-4">The Workflow Gap</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Stop the <span className="text-gradient">Approval Fatigue</span></h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Legacy tools weren't built for modern asset workflows. We redesigned everything to keep your team in flow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((item, i) => (
            <div key={i} className="group glass p-8 rounded-3xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${item.color} blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity`} />

              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-8 shadow-xl border border-white/5`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
