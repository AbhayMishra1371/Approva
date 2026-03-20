"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    ArrowRight, 
    Play, 
    Sparkles, 
    MousePointer2, 
    MessageSquare, 
    CheckCircle, 
    Layers, 
    Activity, 
    Users, 
    Upload, 
    ChevronRight,
    Search,
    Download,
    Plus,
    X,
    Info,
    Check
} from 'lucide-react';
import MagicRings from '../MagicRings';
import '../MagicRings.css';


// --- Sub-components for better organization within the single file ---

const Nav = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0b0c10]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Check className="text-white w-5 h-5 font-bold" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Approva</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                <Link href="#features" className="hover:text-purple-400 transition-colors">Features</Link>
                <Link href="#demo" className="hover:text-purple-400 transition-colors">Product</Link>
                <Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Sign In</Link>
                <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-purple-500/20">
                    Get Started
                </Link>
            </div>
        </div>
    </nav>
);

const HeroMockUI = () => {
    return (
        <div className="relative w-full max-w-4xl mx-auto mt-16 rounded-2xl border border-white/10 bg-[#12131a] shadow-2xl overflow-hidden aspect-[16/10]">
            {/* Window Header */}
            <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <div className="mx-auto bg-white/5 rounded px-3 py-1 text-[10px] text-slate-500 font-mono">
                    approva.io/v1/asset-review
                </div>
            </div>

            {/* Application Content */}
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center text-purple-400"><Layers size={18} /></div>
                    <div className="w-8 h-8 rounded-lg text-slate-600"><Users size={18} /></div>
                    <div className="w-8 h-8 rounded-lg text-slate-600"><Activity size={18} /></div>
                </div>

                {/* Main View */}
                <div className="flex-1 flex flex-col bg-black/40">
                    <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-white/5">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Brand_Identity_Final.mp4</span>
                        <div className="flex gap-2">
                            <div className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-400 font-bold">V.04</div>
                            <div className="px-2 py-1 rounded bg-purple-500/20 text-[10px] text-purple-400 font-bold border border-purple-500/30">PENDING</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center p-8">
                        {/* Asset Preview (Video/Image Mock) */}
                        <div className="w-full h-full bg-[#1a1b23] rounded-xl border border-white/5 relative overflow-hidden group">
                           {/* Animated Video Mockup */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent flex items-center justify-center">
                                <Play size={48} className="text-white/20" />
                            </div>

                            {/* Animated Elements */}
                            
                            {/* 1. Annotation Box 1 */}
                            <motion.div 
                                key="ann-1"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, duration: 0.4 }}
                                className="absolute top-[30%] left-[40%] w-32 h-20 border-2 border-purple-500 rounded-lg bg-purple-500/10 flex items-start justify-end p-1 shadow-lg shadow-purple-500/20"
                            >
                                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white">1</div>
                            </motion.div>

                            {/* 2. Annotation Box 2 */}
                            <motion.div 
                                key="ann-2"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.5, duration: 0.4 }}
                                className="absolute bottom-[25%] right-[20%] w-16 h-16 border-2 border-cyan-500 rounded-lg bg-cyan-500/10 flex items-start justify-end p-1 shadow-lg shadow-cyan-500/20"
                            >
                                <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-white">2</div>
                            </motion.div>

                            {/* 3. Comment Bubble */}
                            <motion.div 
                                key="comment-bubble"
                                initial={{ opacity: 0, y: 10, x: 20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                transition={{ delay: 2.5, duration: 0.4 }}
                                className="absolute bottom-10 left-10 max-w-[200px] bg-white rounded-2xl rounded-bl-none p-3 shadow-2xl"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[8px] font-bold text-purple-600">JD</div>
                                    <span className="text-[10px] font-bold text-slate-900">John Doe</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-tight">Could we adjust the logo saturation? It feels a bit dull here.</p>
                            </motion.div>

                            {/* 4. Approval Badge */}
                            <motion.div 
                                key="approval-badge"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 4, type: 'spring', damping: 12 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                            >
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 flex items-center justify-center">
                                    <CheckCircle className="text-emerald-500 w-12 h-12" />
                                </div>
                                <span className="mt-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl shadow-emerald-500/40 border border-white/20">ASSET APPROVED</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Comments) */}
                <div className="w-72 border-l border-white/5 bg-white/5 p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Annotations</span>
                        <ChevronRight size={14} className="text-slate-500" />
                    </div>
                    {/* Fake Comments List */}
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="flex gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700" />
                                    <div className="w-24 h-2 bg-slate-700 rounded mt-2" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="w-full h-1.5 bg-slate-800 rounded" />
                                    <div className="w-3/4 h-1.5 bg-slate-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DemoStep = ({ step, active, onClick }: { step: any, active: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex-1 group cursor-pointer p-6 rounded-2xl transition-all duration-300 relative ${active ? 'bg-purple-600/10 border border-purple-500/20' : 'hover:bg-white/5 border border-transparent'}`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${active ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-white/5 text-slate-500 group-hover:text-white'}`}>
            <step.icon size={24} />
        </div>
        <h3 className={`font-bold mb-2 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{step.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
        
        {active && (
            <motion.div 
                layoutId="activeStep"
                className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full"
            />
        )}
    </div>
);

export default function ModernLanding() {
    const [activeDemoStep, setActiveDemoStep] = useState(0);

    const demoSteps = [
        { title: "1. Upload", icon: Upload, description: "Drop images, videos, or PDFs. Automatic versioning handles the rest.", visual: "/demo/upload.png" },
        { title: "2. Annotate", icon: MousePointer2, description: "Click and drag to pinpoint exactly where changes are needed.", visual: "/demo/annotate.png" },
        { title: "3. Comment", icon: MessageSquare, description: "Threaded discussions kept contextual to the visual element.", visual: "/demo/comment.png" },
        { title: "4. Approve", icon: CheckCircle, description: "One-click approval or clear 'Changes Requested' status.", visual: "/demo/approve.png" }
    ];

    // Cycle through demo steps
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveDemoStep((prev) => (prev + 1) % demoSteps.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#0b0c10] text-slate-300 selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden">
            <Nav />

            {/* --- Hero Section --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <MagicRings 
                        ringCount={15} 
                        speed={1.2} 
                        opacity={1} 
                        attenuation={3} 
                        lineThickness={3.5}
                        followMouse={true}
                        color="#a855f7"
                        colorTwo="#ffffff"
                        baseRadius={0.45}
                        radiusStep={0.15}
                    />

                </div>
                <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-purple-600/20 to-transparent -z-10 blur-[120px]" />
                <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />


                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-10"
                    >
                        <Sparkles size={14} />
                        Next-Gen Review Workflow
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1] mb-8"
                    >
                        Review & Approve <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Creative Work Faster</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-12"
                    >
                        Stop chasing feedback in emails and chat. Approva handles annotations, 
                        versions, and approvals in one sleek workspace designed for high-performance teams.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                    >
                        <Link href="/signup" className="group bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-slate-100 transition-all shadow-xl shadow-white/5">
                            Start Reviewing
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#demo" className="px-8 py-4 rounded-full font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all">
                            See Demo
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <HeroMockUI />
                    </motion.div>
                </div>
            </section>

            {/* --- Product Demo Steps --- */}
            <section id="demo" className="py-24 md:py-40 bg-[#0d0e14]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">How it works</h2>
                        <p className="text-slate-400 text-lg">Four steps to absolute clarity in your creative pipeline.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                        {/* Interactive Steps */}
                        <div className="w-full lg:w-1/3 grid grid-cols-1 gap-4">
                            {demoSteps.map((step, idx) => (
                                <DemoStep 
                                    key={idx} 
                                    step={step} 
                                    active={activeDemoStep === idx} 
                                    onClick={() => setActiveDemoStep(idx)} 
                                />
                            ))}
                        </div>

                        {/* Visual for current step */}
                        <div className="w-full lg:w-2/3">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeDemoStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#12131a] aspect-video flex items-center justify-center p-12 shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                                    
                                    {/* Abstract Visual Representation of each step */}
                                    {activeDemoStep === 0 && (
                                        <div className="relative group text-center">
                                            <div className="w-32 h-32 rounded-3xl bg-purple-600/20 flex items-center justify-center mx-auto mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-500">
                                                <Upload size={48} />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="w-48 h-2 bg-white/10 rounded-full mx-auto" />
                                                <div className="w-32 h-2 bg-white/5 rounded-full mx-auto" />
                                            </div>
                                            <motion.div 
                                                animate={{ y: [0, -10, 0] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="absolute -top-4 -right-4 bg-purple-500 p-2 rounded-lg shadow-xl shadow-purple-500/40"
                                            >
                                                <Plus size={16} className="text-white" />
                                            </motion.div>
                                        </div>
                                    )}

                                    {activeDemoStep === 1 && (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <div className="w-64 h-40 bg-purple-500/10 border-2 border-purple-500/40 rounded-2xl relative shadow-2xl">
                                                <motion.div 
                                                    animate={{ x: [0, 40, -20, 0], y: [0, 20, 50, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4 }}
                                                    className="absolute top-1/2 left-1/2 text-purple-400"
                                                >
                                                    <MousePointer2 size={32} />
                                                </motion.div>
                                                <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">1</div>
                                            </div>
                                        </div>
                                    )}

                                    {activeDemoStep === 2 && (
                                        <div className="flex flex-col gap-4 w-full max-w-sm">
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white p-4 rounded-2xl rounded-bl-none shadow-xl flex gap-3 items-start"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-2 w-20 bg-slate-100 rounded" />
                                                    <div className="h-2 w-full bg-slate-200 rounded" />
                                                </div>
                                            </motion.div>
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-purple-600 p-4 rounded-2xl rounded-br-none shadow-xl flex gap-3 items-start self-end ml-12"
                                            >
                                                <div className="space-y-2 flex-1 items-end">
                                                    <div className="h-2 w-20 bg-purple-400 rounded ml-auto" />
                                                    <div className="h-2 w-full bg-purple-500 rounded" />
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-purple-400 shrink-0" />
                                            </motion.div>
                                        </div>
                                    )}

                                    {activeDemoStep === 3 && (
                                        <div className="flex flex-col items-center gap-6">
                                            <motion.div 
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', damping: 10 }}
                                                className="w-32 h-32 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-500"
                                            >
                                                <CheckCircle size={64} />
                                            </motion.div>
                                            <motion.span 
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold tracking-widest uppercase text-xs shadow-xl shadow-emerald-500/40"
                                            >
                                                Accepted
                                            </motion.span>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features Grid --- */}
            <section id="features" className="py-24 md:py-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mb-20">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">Built for modern creative teams</h2>
                        <p className="text-slate-400 text-lg">Every feature is designed to eliminate ambiguity and keep production moving.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { 
                                title: "Visual Annotations", 
                                icon: MousePointer2, 
                                desc: "Comment directly on creative files. Pins stay matched to frame and coordinate.",
                                color: "border-purple-500/20 hover:border-purple-500/50"
                            },
                            { 
                                title: "Real-time Sync", 
                                icon: Activity, 
                                desc: "Collaborators see updates instantly. No page refreshes, no disconnects.",
                                color: "border-blue-500/20 hover:border-blue-500/50"
                            },
                            { 
                                title: "Smart Versioning", 
                                icon: Layers, 
                                desc: "Compare versions side-by-side. History is preserved and searchable.",
                                color: "border-amber-500/20 hover:border-amber-500/50"
                            },
                            { 
                                title: "Activity Logs", 
                                icon: CheckCircle, 
                                desc: "Full audit trail for every status change, comment, and document upload.",
                                color: "border-emerald-500/20 hover:border-emerald-500/50"
                            }
                        ].map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                className={`p-8 rounded-3xl bg-[#12131a] border transition-all duration-300 group ${feature.color}`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-8 group-hover:bg-white/10 transition-colors">
                                    <feature.icon size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6 group-hover:text-slate-400 transition-colors">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Collaboration Section --- */}
            <section className="py-24 md:py-40 bg-black/40 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-purple-900/10 blur-[150px] -z-10" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                        <div className="flex-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                                <Users size={12} /> Team Collaboration
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">Where teams align. <br /><span className="text-slate-500">Fast.</span></h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Get your developers, designers, and project managers on the same page. 
                                No more "it should be blue" - now it's "it should be #3b82f6 at this coordinate".
                            </p>
                            
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ y: -5, zIndex: 10 }}
                                        className="w-12 h-12 rounded-full border-2 border-[#12131a] bg-slate-800 flex items-center justify-center font-bold text-white text-sm"
                                    >
                                        {String.fromCharCode(64 + i)}
                                    </motion.div>
                                ))}
                                <div className="w-12 h-12 rounded-full border-2 border-[#12131a] bg-purple-600 flex items-center justify-center font-bold text-white text-sm">
                                    +8
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full bg-[#12131a] rounded-3xl border border-white/10 p-8 relative overflow-hidden h-[400px]">
                            <div className="absolute top-0 right-0 p-4">
                                <Activity className="text-slate-700" />
                            </div>
                            
                            <div className="space-y-6">
                                <motion.div 
                                    initial={{ x: 50, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-500 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-24 bg-white/20 rounded" />
                                        <div className="h-2 w-full bg-white/10 rounded" />
                                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ x: 50, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-4 ml-8"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-24 bg-white/20 rounded" />
                                        <div className="h-2 w-full bg-white/10 rounded" />
                                    </div>
                                </motion.div>

                                <motion.div 
                                    initial={{ x: 50, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    className="bg-purple-600/10 p-4 rounded-2xl border border-purple-500/20 flex gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white tracking-widest text-[10px]">JD</div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-2 w-24 bg-purple-400 rounded" />
                                        <div className="h-2 w-full bg-purple-500/40 rounded" />
                                    </div>
                                    <CheckCircle size={16} className="text-emerald-500 self-center" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA Section --- */}
            <section className="py-24 md:py-48 px-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
                
                <div className="max-w-4xl mx-auto text-center px-8 py-20 bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                    
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to ship <br /> better content?</h2>
                    <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
                        Join hundreds of teams using Approva to cut feedback cycles by 60%.
                        Get started with your first project in minutes.
                    </p>
                    
                    <motion.div
                        animate={{ 
                            boxShadow: ["0 0 0px rgba(139, 92, 246, 0.4)", "0 0 40px rgba(139, 92, 246, 0.6)", "0 0 0px rgba(139, 92, 246, 0.4)"] 
                        }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="inline-block rounded-full p-px bg-gradient-to-r from-purple-500 to-indigo-500"
                    >
                        <Link href="/signup" className="flex items-center gap-3 bg-[#0b0c10] text-white px-10 py-5 rounded-full font-black text-xl hover:bg-transparent transition-all group">
                            Get Started Free
                            <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                        </Link>
                    </motion.div>
                    
                    <div className="mt-12 flex items-center justify-center gap-6 text-slate-500 text-xs font-bold tracking-widest uppercase">
                        <span>No credit card required</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span>Cancel anytime</span>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2 grayscale brightness-200 opacity-50">
                            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-black">
                                <Check size={14} className="font-bold" />
                            </div>
                            <span className="font-bold text-lg tracking-tighter text-white">Approva</span>
                        </div>
                        
                        <div className="flex items-center gap-8 text-sm font-medium text-slate-600">
                            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                            <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
                        </div>
                        
                        <div className="text-slate-600 text-sm">
                            © {new Date().getFullYear()} Approva Inc. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
