'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
    const opacity = useTransform(scrollYProgress, [0, 1], [0.3, 1]);

    return (
        <footer ref={containerRef} className="relative bg-[#050505] text-[#F5F1E8] pt-32 pb-12 overflow-hidden border-t border-white/5">
            {/* Massive Ambient Glow */}
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-600/20 rounded-[100%] blur-[120px] pointer-events-none" />

            <motion.div style={{ y, opacity }} className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">

                {/* Top Section: CTA & Links */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">

                    {/* Brand Col */}
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-4 text-3xl font-bold tracking-tight text-white mb-6 hover:opacity-80 transition-opacity">
                            <Image src="/logo.png" alt="Fitexa Logo" width={40} height={40} className="rounded-xl" unoptimized />
                            Fitexa
                        </Link>
                        <p className="text-white/60 text-lg max-w-sm leading-relaxed mb-8">
                            Premium AI automation built specifically for local businesses. Scale your operations without adding headcount.
                        </p>
                        <div className="flex gap-4">
                            <a href="mailto:support@fitexa.in" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400 text-white/60 transition-all">
                                📧
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pink-500/20 hover:border-pink-500/50 hover:text-pink-400 text-white/60 transition-all">
                                📸
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-400 text-white/60 transition-all">
                                👾
                            </a>
                        </div>
                    </div>

                    {/* Links Cols */}
                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-4">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-semibold tracking-wider text-sm uppercase mb-2">Product</h4>
                            <Link href="/#features" className="text-white/50 hover:text-white transition-colors">Features</Link>
                            <Link href="/#process" className="text-white/50 hover:text-white transition-colors">How it Works</Link>
                            <Link href="#" className="text-white/50 hover:text-white transition-colors">Pricing (Soon)</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-semibold tracking-wider text-sm uppercase mb-2">Company</h4>
                            <Link href="/contact" className="text-white/50 hover:text-white transition-colors">Contact Us</Link>
                            <a href="#" className="text-white/50 hover:text-white transition-colors">Career</a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-semibold tracking-wider text-sm uppercase mb-2">Legal</h4>
                            <Link href="/terms" className="text-white/50 hover:text-white transition-colors">Terms of Service</Link>
                            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
                    <p>&copy; {new Date().getFullYear()} Fitexa. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>All systems operational</span>
                    </div>
                </div>

            </motion.div>

            {/* Giant Watermark Typography at very bottom */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none overflow-hidden">
                <span className="text-[18vw] font-black leading-none text-white/[0.02] tracking-tighter whitespace-nowrap">
                    FITEXA
                </span>
            </div>
        </footer>
    );
}
