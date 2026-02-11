import React from 'react';
import { History, MessageSquare, Shield } from 'lucide-react';

export const Problem = () => {
  const problems = [
    {
      icon: <History className="w-8 h-8 text-white" />,
      title: "Broken Workflows",
      desc: 'Legacy tools are slow. We built a system that matches your creative energy.',
      color: "from-[#FD366E] to-[#ff4d7e]"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      title: "Feedback Static",
      desc: 'No more lost comments or buried emails. Direct, glowing feedback.',
      color: "from-[#8129D9] to-[#9d50e6]"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Security Ops",
      desc: "Hardened infrastructure for your most critical creative assets.",
      color: "from-zinc-600 to-zinc-500"
    }
  ];

  return (
    <section className="py-40 relative bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-32 text-center max-w-3xl mx-auto">
          <p className="text-[#FD366E] font-black uppercase tracking-[0.3em] text-xs mb-6 drop-shadow-[0_0_10px_rgba(253,54,110,0.3)]">The Friction Problem</p>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">Pure Black. <br /> <span className="text-[#FD366E]">Zero Noise.</span></h2>
          <p className="text-zinc-500 text-xl font-bold leading-relaxed">
            We removed everything that stands between you and your vision. 
            The result is a workflow that shines.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {problems.map((item, i) => (
            <div key={i} className="group relative pink-shine bg-black p-10 rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} blur-[60px] opacity-10 group-hover:opacity-40 transition-opacity`} />
              
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-10 shadow-[0_10px_30px_rgba(253,54,110,0.1)] group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(253,54,110,0.3)]`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-black text-white mb-6 tracking-tight group-hover:text-[#FD366E] transition-colors">{item.title}</h3>
              <p className="text-zinc-500 leading-relaxed font-bold">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
