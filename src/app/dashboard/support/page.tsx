"use client";

import React, { useState } from 'react';
import {
    Search,
    HelpCircle,
    BookOpen,
    Upload,
    CheckCircle2,
    AlertCircle,
    Mail,
    Bug,
    ChevronRight,
    Clock,
    FileText,
    Shield,
    RefreshCcw,
    Layers
} from 'lucide-react';

export default function SupportPage() {
    const faqs = [
        {
            question: "How do I upload assets?",
            answer: "Navigate to your project dashboard, click 'Upload Asset' (or the + icon), select your files, and add optional metadata like tags or descriptions."
        },
        {
            question: "What file formats are supported?",
            answer: "We support common design and media formats including PNG, JPG, SVG, FIG (Figma), PDF, and MP4. Max file size is currently 500MB."
        },
        {
            question: "Why is my asset stuck in 'Pending'?",
            answer: "Pending status means an admin or owner hasn't reviewed it yet. You can nudge them by mentioning them in the asset's comment section."
        },
        {
            question: "How does approval/rejection work?",
            answer: "Stakeholders can mark assets as 'Approved' or 'Needs Changes'. You'll receive a notification immediately upon their decision."
        },
        {
            question: "Can I edit an uploaded asset?",
            answer: "You can update metadata (name, tags) at any time. To change the file itself, use the 'Upload New Version' button to keep the history intact."
        }
    ];

    const troubleshooting = [
        {
            issue: "Upload failed?",
            fix: "Check your internet connection and ensure the file is under 500MB and in a supported format."
        },
        {
            issue: "Not receiving notifications?",
            fix: "Check your spam folder and ensure 'Notifications' are enabled in your Profile Settings."
        },
        {
            issue: "Page not loading?",
            fix: "Try refreshing the page or clearing your browser cache. If it persists, check our status page."
        }
    ];

    const steps = [
        { title: "Create your account", desc: "Sign up and set up your personal profile." },
        { title: "Upload your first asset", desc: "Drag and drop any design file into a project." },
        { title: "Add metadata / tags", desc: "Help your team find assets faster with clear labels." },
        { title: "Submit for approval", desc: "Notify stakeholders that your work is ready for review." },
        { title: "Track status", desc: "Monitor comments and approval status in real-time." }
    ];

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <header className="text-center space-y-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">How can we help?</h1>
                    <p className="text-slate-400 max-w-lg mx-auto">Find answers to common questions, troubleshooting tips, and guides to get you started.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Getting Started Guide */}
                <section className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <BookOpen className="w-6 h-6 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Getting Started</h2>
                    </div>

                    <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -z-10"></div>
                        <div className="space-y-8 relative">
                            {steps.map((step, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-[#1e1f2b] border border-[#2a2b36] flex items-center justify-center text-xs font-bold text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg">
                                            {i + 1}
                                        </div>
                                        {i !== steps.length - 1 && <div className="w-0.5 h-full bg-[#1f202b] my-1"></div>}
                                    </div>
                                    <div className="pb-2">
                                        <h3 className="text-sm font-bold text-white leading-none mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{step.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQs & Troubleshooting */}
                <section className="lg:col-span-2 space-y-8">
                    {/* FAQs */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <HelpCircle className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Actionable FAQs</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-[#12131a] border border-[#1f202b] rounded-xl p-5 hover:border-indigo-500/20 hover:bg-[#12131a]/80 transition-all group">
                                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 group-hover:text-indigo-400 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-indigo-500/50 group-hover:translate-x-1 transition-transform" />
                                        {faq.question}
                                    </h3>
                                    <p className="text-xs text-slate-400 leading-relaxed pl-6">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Troubleshooting */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Troubleshooting</h2>
                        </div>

                        <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#1e1f2b]/50 border-b border-[#1f202b]">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Real Problem</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Fix</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1f202b]">
                                    {troubleshooting.map((item, i) => (
                                        <tr key={i} className="hover:bg-[#1e1f2b]/30 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-200">{item.issue}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <RefreshCcw className="w-3.5 h-3.5 text-rose-500" />
                                                    {item.fix}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Actions: Contact & Policies */}
            <footer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-[#1f202b]">
                {/* Contact Card */}
                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl -z-10 group-hover:blur-2xl transition-all"></div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-purple-400" />
                            <h3 className="font-bold text-white">Contact Support</h3>
                        </div>
                        <p className="text-xs text-slate-400">Still need help? Our team typically responds within 24 hours.</p>
                        <a href="mailto:support@approva.com" className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors">
                            anshabhay.mishra1371@gmail.com
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Bug Report Card */}
                <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl p-6 group">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Bug className="w-5 h-5 text-amber-400" />
                            <h3 className="font-bold text-white">Report a Bug</h3>
                        </div>
                        <p className="text-xs text-slate-400">Found a glitch? Help us improve by reporting unexpected behavior.</p>
                        <button className="px-4 py-2 bg-[#1e1f2b] text-white text-xs font-bold rounded-lg border border-[#2a2b36] hover:bg-[#2a2b36] transition-all">
                            Submit Bug Report
                        </button>
                    </div>
                </div>

                {/* Policies Card */}
                <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-bold text-white">Policies</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            <a href="#" className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#1e1f2b] transition-all">
                                <span className="text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Privacy Policy
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-all" />
                            </a>
                            <a href="#" className="flex items-center justify-between group p-2 rounded-lg hover:bg-[#1e1f2b] transition-all">
                                <span className="text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Terms of Service
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-all" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
