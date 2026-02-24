'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function Hero() {
    const supabase = createClient();
    const [typing, setTyping] = useState(false);
    const [messageVisible, setMessageVisible] = useState(false);

    useEffect(() => {
        // Complex animation sequence loop for the AI chat
        const sequence = () => {
            setTyping(false);
            setMessageVisible(false);

            setTimeout(() => {
                setTyping(true);
            }, 1000); // 1s after reset, start typing

            setTimeout(() => {
                setTyping(false);
                setMessageVisible(true);
            }, 3000); // 2s of typing, then show message

            setTimeout(() => {
                // reset loop
            }, 7000); // message stays for 4s, then loop triggers again
        };

        sequence();
        const interval = setInterval(sequence, 7000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-[#F5F1E8]">
            {/* Advanced Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay z-0"></div>

                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#0D4F31]/10 to-transparent blur-[80px]"
                />

                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-pink-300/10 via-amber-100/10 to-transparent blur-[100px]"
                />

                {/* Micro-particles floating in background */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, i % 2 === 0 ? 50 : -50, 0],
                            opacity: [0, 0.5, 0]
                        }}
                        transition={{
                            duration: 10 + i * 2,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "easeInOut"
                        }}
                        className={`absolute w-1 h-1 bg-[#0D4F31] rounded-full blur-[1px]`}
                        style={{
                            top: `${20 + i * 15}%`,
                            left: `${10 + i * 20}%`
                        }}
                    />
                ))}
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 text-center">

                {/* Pill Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_8px_16px_rgba(0,0,0,0.03)] mb-8 text-sm font-semibold text-black/80 ring-1 ring-black/5"
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D4F31] opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0D4F31]"></span>
                    </span>
                    Edit your agent in 5 minutes
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-7xl lg:text-[76px] font-[800] tracking-[-0.03em] leading-[1.05] mb-6 text-[#050505]"
                >
                    Build, configure, and deploy <br className="hidden lg:block" />
                    AI agents for your <span className="relative inline-block">
                        <span className="text-[#0D4F31] italic font-serif z-10 relative pr-2">local business</span>
                        <motion.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                            className="absolute bottom-1 lg:bottom-2 left-0 w-full h-[8px] lg:h-[12px] bg-[#0D4F31]/15 rounded-full -z-0 origin-left"
                        />
                    </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed mb-10 font-medium"
                >
                    Automate replies, leads, SEO, and messaging across platforms &mdash; without hiring a team.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <button
                        onClick={handleLogin}
                        className="group relative w-full sm:w-auto px-8 py-4 bg-[#0D4F31] overflow-hidden text-white rounded-full font-semibold text-base transition-all duration-300 shadow-[0_8px_30px_rgba(13,79,49,0.3)] hover:shadow-[0_12px_40px_rgba(13,79,49,0.4)] hover:-translate-y-1"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Join now <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>↗</motion.span>
                        </span>
                        <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-black/10 transition-all duration-300 group-hover:scale-100 group-hover:bg-black/20 z-0"></div>
                    </button>
                    <button
                        onClick={handleLogin}
                        className="w-full sm:w-auto px-8 py-4 bg-transparent text-[#050505] rounded-full font-semibold text-base transition-all duration-300 hover:bg-black/5 ring-1 ring-black/5 hover:ring-black/10"
                    >
                        See how it works
                    </button>
                </motion.div>

                {/* Advanced 3-Column Motion Graphic Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-24 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_100px_1fr] gap-4 md:gap-8 items-center relative perspective-[1000px]"
                >
                    {/* Left: Enhanced Business Dashboard Mockup */}
                    <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/60 aspect-square md:aspect-[4/5] flex flex-col items-center justify-center relative z-10 transform-gpu group"
                    >
                        {/* Interactive floating pills */}
                        <motion.div
                            animate={{ y: [0, -5, 0], x: [0, 3, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-4 -right-4 bg-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 z-20"
                        >
                            <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span></span>
                            New Lead
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 5, 0], x: [0, -3, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-4 -left-4 bg-white border border-black/5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 z-20"
                        >
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px]">⭐</div>
                            5.0 Review
                        </motion.div>

                        <div className="w-24 h-24 bg-gradient-to-br from-[#F5F1E8] to-[#E8E2D2] rounded-3xl mb-6 flex items-center justify-center relative shadow-inner border border-white">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D4F31]">
                                <path d="M3 9.40002L4.03264 5.26947C4.16781 4.72882 4.65436 4.3418 5.21044 4.3418H18.7896C19.3456 4.3418 19.8322 4.72882 19.9674 5.26947L21 9.40002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 9.40002H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 9.40002V18.1581C3 19.2627 3.89543 20.1581 5 20.1581H19C20.1046 20.1581 21 19.2627 21 18.1581V9.40002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 20.1581V13.8418C12 13.0687 11.3731 12.4418 10.6 12.4418H8.4C7.6268 12.4418 7 13.0687 7 13.8418V20.1581" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="font-extrabold text-xl mb-3 text-gray-900 tracking-tight">Your Business</h3>

                        {/* Skeleton layout showing data */}
                        <div className="w-full space-y-3 px-4 mt-2">
                            <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden relative">
                                <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></motion.div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full w-5/6 mx-auto"></div>
                            <div className="h-2 bg-gray-100 rounded-full w-4/6 mx-auto"></div>
                        </div>
                    </motion.div>

                    {/* Middle: Advanced Glowing Connection Pipe */}
                    <div className="hidden md:flex flex-col justify-center items-center relative w-full h-full z-0">
                        <div className="w-full h-[2px] border-t-2 border-dashed border-[#0D4F31]/30 absolute top-1/2 -translate-y-1/2"></div>
                        {/* Energy pulse */}
                        <div className="absolute w-full top-1/2 -translate-y-1/2 overflow-hidden h-6 flex items-center">
                            <motion.div
                                animate={{ x: ["-200%", "400%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                                className="w-20 h-1.5 bg-gradient-to-r from-transparent via-[#0D4F31] to-transparent rounded-full opacity-80 blur-[1px]"
                            />
                        </div>
                        {/* Rotating Data Node */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 bg-white rounded-full border-[3px] border-[#F5F1E8] flex items-center justify-center z-10 shadow-[0_0_20px_rgba(13,79,49,0.15)] ring-1 ring-[#0D4F31]/10 bg-gradient-to-tr from-white to-[#f0f9f4]"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D4F31" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                        </motion.div>
                    </div>

                    {/* Right: Premium AI Agent Chat UI */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} // Offset from left box
                        className="bg-[#050505]/95 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/10 aspect-square md:aspect-[4/5] flex flex-col items-start justify-center relative overflow-hidden text-left text-white z-10"
                    >
                        {/* Inner ambient glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0D4F31]/20 rounded-full blur-[60px] pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-8 w-full border-b border-white/10 pb-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#126f45] to-[#083520] rounded-2xl flex items-center justify-center text-xl shadow-lg border border-white/10 transform rotate-3">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="7" width="18" height="14" rx="4" stroke="white" strokeWidth="2.5" />
                                        <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                        <circle cx="9" cy="13" r="2" fill="white" />
                                        <circle cx="15" cy="13" r="2" fill="white" />
                                        <path d="M10 17H14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#050505]"></div>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-base tracking-tight mb-0.5">Fitexa AI Agent</h4>
                                <p className="text-xs text-[#86efac] font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Online • Replying
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 w-full relative z-10 flex-1 flex flex-col justify-end">
                            {/* Customer Message */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-[90%] bg-white/10 hover:bg-white/15 transition-colors backdrop-blur-md rounded-2xl rounded-tr-sm ml-auto p-4 text-sm font-medium flex items-center shadow-sm border border-white/5"
                            >
                                Do you have appointments open today?
                            </motion.div>

                            <div className="h-[76px] relative w-full">
                                <AnimatePresence mode="wait">
                                    {typing ? (
                                        <motion.div
                                            key="typing"
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            className="absolute bottom-0 left-0 w-16 bg-[#0D4F31]/30 backdrop-blur-md rounded-2xl rounded-tl-sm p-4 h-12 flex gap-1.5 items-center justify-center border border-[#86efac]/20"
                                        >
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                                        </motion.div>
                                    ) : messageVisible ? (
                                        <motion.div
                                            key="message"
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute bottom-0 left-0 w-[95%] bg-gradient-to-r from-[#0D4F31] to-[#0a3d26] rounded-2xl rounded-tl-sm p-4 text-sm font-medium flex items-center border border-[#86efac]/30 leading-relaxed shadow-[0_8px_20px_rgba(13,79,49,0.5)]"
                                        >
                                            Yes! I can book you in for 3:00 PM. Would you like me to confirm?
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
}
