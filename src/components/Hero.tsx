'use client';

import React from 'react';
import { createClient } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

export default function Hero() {
    const supabase = createClient();

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
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0D4F31]/5 blur-[80px]"
                />
                <motion.div
                    animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-300/10 blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[30%] left-[60%] w-[300px] h-[300px] rounded-full bg-amber-200/5 blur-[60px]"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center">

                {/* Pill Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm mb-8 text-sm font-medium text-black/70"
                >
                    <span className="text-[#0D4F31]">✦</span> Edit your agent in 5 minutes
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-6xl lg:text-[64px] font-[800] tracking-tight leading-[1.05] mb-6 text-[#050505]"
                >
                    Build, configure, and deploy <br className="hidden md:block" />
                    AI agents for your <span className="text-[#0D4F31] italic font-serif relative">
                        local business
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="absolute -bottom-2 left-0 w-full h-[3px] bg-[#0D4F31]/20 rounded-full"
                        />
                    </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-6 text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    Automate replies, leads, SEO, and messaging across platforms &mdash; without hiring a team.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <button
                        onClick={handleLogin}
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#0D4F31] hover:bg-[#0a3d26] text-white rounded-full font-semibold text-base transition-all duration-300 shadow-[0_8px_24px_rgba(13,79,49,0.25)] hover:shadow-[0_12px_32px_rgba(13,79,49,0.35)] hover:-translate-y-0.5"
                    >
                        Join now ↗
                    </button>
                    <button
                        onClick={handleLogin}
                        className="w-full sm:w-auto px-8 py-3.5 bg-transparent text-[#050505] rounded-full font-semibold text-base transition-all duration-300 hover:bg-black/5"
                    >
                        See how it works
                    </button>
                </motion.div>

                {/* 2-Column Visual Graphic (Mockup) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-20 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1.2fr] gap-6 items-center"
                >
                    {/* Left: Business Mockup */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-black/5 aspect-[4/5] flex flex-col items-center justify-center relative overflow-hidden group"
                    >
                        <div className="w-24 h-24 bg-[#F5F1E8] rounded-full mb-5 flex items-center justify-center relative shadow-inner">
                            {/* Abstract Storefront SVG instead of emoji */}
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 9.40002L4.03264 5.26947C4.16781 4.72882 4.65436 4.3418 5.21044 4.3418H18.7896C19.3456 4.3418 19.8322 4.72882 19.9674 5.26947L21 9.40002" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 9.40002H21" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 9.40002V18.1581C3 19.2627 3.89543 20.1581 5 20.1581H19C20.1046 20.1581 21 19.2627 21 18.1581V9.40002" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 20.1581V13.8418C12 13.0687 11.3731 12.4418 10.6 12.4418H8.4C7.6268 12.4418 7 13.0687 7 13.8418V20.1581" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 9.40002C3 10.5046 3.89543 11.4 5 11.4C6.10457 11.4 7 10.5046 7 9.40002C7 10.5046 7.89543 11.4 9 11.4C10.1046 11.4 11 10.5046 11 9.40002C11 10.5046 11.8954 11.4 13 11.4C14.1046 11.4 15 10.5046 15 9.40002C15 10.5046 15.8954 11.4 17 11.4C18.1046 11.4 19 10.5046 19 9.40002C19 10.5046 19.8954 11.4 21 11.4" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Your Business</h3>
                        <p className="text-sm text-black/50 text-center px-4">Receive messages, booking requests, and FAQs</p>
                    </motion.div>

                    {/* Middle: Arrow */}
                    <div className="hidden md:flex justify-center text-[#0D4F31]">
                        <motion.svg
                            animate={{ x: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </motion.svg>
                    </div>

                    {/* Right: AI Output Mockup */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-[#050505] rounded-2xl p-6 shadow-2xl border border-white/10 aspect-[4/5] flex flex-col items-start justify-center relative overflow-hidden text-left text-white"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#0D4F31] to-[#083520] rounded-full flex items-center justify-center text-xl shadow-lg border border-white/10">
                                {/* Abstract AI Avatar SVG */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="7" width="18" height="14" rx="4" stroke="white" strokeWidth="2" />
                                    <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="9" cy="13" r="1.5" fill="white" />
                                    <circle cx="15" cy="13" r="1.5" fill="white" />
                                    <path d="M10 17H14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm">AI Agent</p>
                                <motion.p
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xs text-[#86efac]/80"
                                >
                                    Replying instantly...
                                </motion.p>
                            </div>
                        </div>
                        <div className="space-y-4 w-full">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 1 }}
                                className="w-11/12 bg-white/10 rounded-xl rounded-tr-none ml-auto p-4 text-xs font-medium flex items-center shadow-inner"
                            >
                                Do you have appointments open today?
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.5, delay: 2.2 }}
                                className="w-11/12 bg-gradient-to-r from-[#0D4F31] to-[#0a3d26] rounded-xl rounded-tl-none p-4 text-xs font-medium flex items-center border border-[#86efac]/20 leading-relaxed shadow-[0_4px_12px_rgba(13,79,49,0.5)]"
                            >
                                Yes! I can book you in for 3:00 PM. Would you like me to confirm?
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
}
