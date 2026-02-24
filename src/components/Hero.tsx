'use client';

import React from 'react';
import { createClient } from '@/lib/supabaseClient';

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
            {/* Soft Radial Glow */}
            <div className="hero-glow animate-pulse-subtle" />

            {/* Content Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center animate-fade-in-up">

                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 shadow-sm mb-8 text-sm font-medium text-black/70">
                    <span className="text-[#0D4F31]">✦</span> Edit your agent in 5 minutes
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-[64px] font-[800] tracking-tight leading-[1.05] mb-6 text-[#050505]">
                    Build, configure, and deploy <br className="hidden md:block" />
                    AI agents for your <span className="text-[#0D4F31] italic font-serif">local business</span>
                </h1>

                {/* Subtext */}
                <p className="mt-6 text-lg md:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed mb-10">
                    Automate replies, leads, SEO, and messaging across platforms &mdash; without hiring a team.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                </div>

                {/* 2-Column Visual Graphic (Mockup) */}
                <div className="mt-20 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1.2fr] gap-6 items-center">
                    {/* Left: Business Mockup */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 aspect-[4/5] flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="w-20 h-20 bg-[#F5F1E8] rounded-full mb-4 flex items-center justify-center">
                            <span className="text-3xl text-[#0D4F31]">🏪</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Your Business</h3>
                        <p className="text-sm text-black/50 text-center px-4">Receive messages, booking requests, and FAQs</p>
                    </div>

                    {/* Middle: Arrow */}
                    <div className="hidden md:flex justify-center text-[#0D4F31]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                        </svg>
                    </div>

                    {/* Right: AI Output Mockup */}
                    <div className="bg-[#050505] rounded-2xl p-6 shadow-xl border border-white/10 aspect-[4/5] flex flex-col items-start justify-center relative overflow-hidden text-left text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#0D4F31] rounded-full flex items-center justify-center text-xl">🤖</div>
                            <div>
                                <p className="font-bold text-sm">AI Agent</p>
                                <p className="text-xs text-white/50">Replying instantly...</p>
                            </div>
                        </div>
                        <div className="space-y-3 w-full">
                            <div className="w-11/12 h-10 bg-white/10 rounded-lg rounded-tr-none ml-auto p-3 text-xs flex items-center">
                                Do you have appointments open today?
                            </div>
                            <div className="w-10/12 h-12 bg-[#0D4F31]/80 rounded-lg rounded-tl-none p-3 text-xs flex items-center border border-[#86efac]/20 line-clamp-2 leading-relaxed">
                                Yes! I can book you in for 3:00 PM. Would you like me to confirm?
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
