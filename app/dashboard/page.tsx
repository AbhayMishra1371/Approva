
"use client";

import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Upload, 
  MessageSquare, 
  CheckSquare, 
  Shield, 
  Zap, 
  History, 
  Users,
  Twitter,
  Linkedin,
  Github,
  MoveRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rotate-45" />
              </div>
              <span className="font-bold text-xl tracking-tight">CAAW</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">Features</a>
              <a href="#process" className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">Process</a>
              <a href="#pricing" className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium">Pricing</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button className="hidden sm:block text-slate-600 hover:text-slate-900 text-sm font-medium">Login</button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-200">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 bg-gradient-to-b from-indigo-50 to-transparent w-full h-[800px] rounded-bl-[100px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
                <span>Now in public beta</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
                Stop Chasing <br />
                Feedback. <span className="text-indigo-600">Start <br /> Shipping Creative.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg">
                Centralize your creative asset approval and feedback workflow in one place. 
                No more messy email threads, vague comments, or lost revisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <Play className="w-5 h-5 fill-slate-900" />
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Hero Mockup */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Project approved
                  </div>
                </div>
                <div className="p-8 aspect-video bg-indigo-50/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-indigo-200">
                        <Users className="w-8 h-8" />
                    </div>
                </div>
                {/* Visual accents */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full" />
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full" />
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-10 -right-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">New Comment</p>
                        <p className="text-[10px] text-slate-500">"Make the logo pop more!"</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">Trusted by creative teams at</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 overflow-hidden">
            {['GLOBAL AGENCY', 'UTIBER', 'PARADOX', 'MULTINANCE', 'CREATIVFLOW'].map((logo, i) => (
              <div key={i} className="px-6 py-2 bg-slate-100/50 rounded-md border border-slate-100 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-default">
                <span className="text-sm font-black italic tracking-tighter text-slate-500">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">The Challenge</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Chaos of Email Threads</h2>
            <p className="text-slate-600 max-w-2xl text-lg">
              Stop digging through endless threads and attachments. Creative workflows 
              shouldn't feel like a detective mission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <History className="w-6 h-6 text-red-500" />,
                title: "Lost Attachments",
                desc: '"Which one was it? Final2_vfinal_02.png?" Never search through your inbox for hours again.',
                color: "bg-red-50"
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-amber-500" />,
                title: "Vague Feedback",
                desc: '"Make it pop!" What does that even mean? Get precise feedback directly on the specific pixels.',
                color: "bg-amber-50"
              },
              {
                icon: <Shield className="w-6 h-6 text-indigo-500" />,
                title: "Version Confusion",
                desc: "Everyone stay disciplined in looking at the same version. No more feedback on outdated drafts.",
                color: "bg-indigo-50"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-32">
        <div className="max-w-7xl mx-auto px-4 text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">A Streamlined Process</h2>
          <p className="text-slate-500 text-lg">How brief to approval in three simple steps.</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Connecting lines */}
            <div className="absolute top-12 left-0 w-full h-0.5 border-t-2 border-dashed border-indigo-100 -z-10 hidden md:block" />
            
            <div className="grid md:grid-cols-3 gap-12 text-center">
                {[
                    { num: "1", title: "Upload & Share", desc: "Drag and drop images, videos, or PDFs. Get a secure link for your client or team." },
                    { num: "2", title: "Annotate Live", desc: "Collaborators click anywhere to leave precise, time-stamped feedback directly on the asset." },
                    { num: "3", title: "Approve & Ship", desc: "One-click sign-off. Track versions and export feedback reports for your records." }
                ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center group">
                        <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-200">
                            {step.num}
                        </div>
                        <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-32 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { Icon: MessageSquare, label: "Fast and Clear Feedback", color: "text-blue-500" },
                        { Icon: History, label: "Track All Demo Review", color: "text-indigo-500" },
                        { Icon: Zap, label: "Smart Workflows", color: "text-blue-700" },
                        { Icon: Shield, label: "Enterprise Security", color: "text-indigo-700" }
                    ].map((item, i) => (
                        <div key={i} className={`bg-white p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all ${i === 1 || i === 3 ? "mt-6" : ""}`}>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shadow-inner">
                                <item.Icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 leading-tight uppercase tracking-tight">{item.label}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                        Powerful tools designed for the modern creative.
                    </h2>
                    <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                        We've built everything you need to manage complex projects without the bloat. 
                        Focus on the art, we handle the admin.
                    </p>
                    <ul className="space-y-4 mb-10">
                        {['Unlimited Guests for Review', 'Real-time Collaboration Sync', 'Custom Branding & Watermarked'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <span className="font-semibold text-slate-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 text-lg">Start free and scale with your team's needs.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
                {/* Starter */}
                <div className="bg-white p-10 rounded-3xl border border-slate-100 flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-2">Starter</h3>
                        <p className="text-slate-500 text-sm">Perfect for freelancers</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-5xl font-bold">$0</span>
                        <span className="text-slate-400">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        {[ '3 Active projects', '5GB Storage', 'Unlimited Guests' ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full py-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
                        Get Started
                    </button>
                </div>

                {/* Pro */}
                <div className="bg-white p-10 rounded-3xl border-2 border-indigo-600 relative shadow-2xl shadow-indigo-100 flex flex-col">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Most Popular
                    </div>
                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-2">Pro</h3>
                        <p className="text-slate-500 text-sm">For growing agencies</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-5xl font-bold">$29</span>
                        <span className="text-slate-400">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        {[ 'Unlimited projects', '100GB Storage', 'Custom Branding', 'Password Protected Links' ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm font-semibold">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">
                        Start Free Trial
                    </button>
                </div>

                {/* Studio */}
                <div className="bg-white p-10 rounded-3xl border border-slate-100 flex flex-col">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold mb-2">Studio</h3>
                        <p className="text-slate-500 text-sm">Advanced collaboration</p>
                    </div>
                    <div className="mb-8">
                        <span className="text-5xl font-bold">$79</span>
                        <span className="text-slate-400">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-grow">
                        {[ 'Everything in Pro', '1TB Storage', 'SSO & Advanced Security' ].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <button className="w-full py-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-600 rounded-[40px] py-20 px-10 text-center relative overflow-hidden shadow-3xl shadow-indigo-300">
                {/* Decoration blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800/50 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />
                
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 relative z-10">
                    Ready to ship better creative?
                </h2>
                <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                    Join 5,000+ creative professionals who use CAAW to streamline their approval process.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors">
                        Get Started for Free
                    </button>
                    <button className="bg-indigo-700/50 backdrop-blur-sm text-white border border-indigo-400/30 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors">
                        Request a Demo
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-32 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rotate-45" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">CAAW</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        The modern standard for creative collaboration. Built for designers, by designers.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                            <Twitter className="w-4 h-4" />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                            <Linkedin className="w-4 h-4" />
                        </a>
                        <a href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                            <Github className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-900">Product</h4>
                    <ul className="space-y-4">
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Features</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Integrations</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Changelog</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Pricing</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-900">Company</h4>
                    <ul className="space-y-4">
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">About Us</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Careers</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Blog</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Privacy</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-slate-900">Support</h4>
                    <ul className="space-y-4">
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Help Center</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">API Docs</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Guides</a></li>
                        <li><a href="#" className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">Contact</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 flex flex-col md:row-reverse md:flex-row justify-between items-center gap-6">
                <p className="text-slate-400 text-xs">© 2024 CAAW Inc. All rights reserved.</p>
                <div className="flex gap-8">
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs transition-colors">Terms of Service</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs transition-colors">Privacy Policy</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs transition-colors">Cookie Policy</a>
                </div>
            </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
