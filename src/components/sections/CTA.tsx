import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const CTA = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-transparent bg-grid-pattern">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="glass rounded-[3rem] py-24 px-8 md:px-16 text-center relative overflow-hidden border-white/5">
                    {/* Decoration glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />

                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-8 relative z-10 tracking-tight leading-tight">
                        Ready to optimize your <br className="hidden sm:block" /> <span className="text-gradient">creative operations?</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto relative z-10 font-medium">
                        Join hundreds of high-performance teams scaling their asset approval workflows with Approva.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center relative z-10">
                        <Link href="/login" className="btn-primary text-white px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 group">
                            Get Started Free
                            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                        <button className="glass hover:bg-white/5 text-white border border-white/10 px-10 py-5 rounded-full font-bold text-lg transition-all backdrop-blur-xl">
                            Talk to Sales
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};
