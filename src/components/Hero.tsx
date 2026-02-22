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
        <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden bg-fitexa-black">

            {/* Background Layering System */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Primary Layered Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-fitexa-green-900 via-fitexa-black to-fitexa-green-800" />

                {/* Radial Depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(15,61,46,0.25)_0%,transparent_60%)]" />

                {/* Animated Blurred Shapes */}
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-fitexa-green-700/20 rounded-full blur-[120px] animate-bg-shift" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-fitexa-green-800/20 rounded-full blur-[100px] animate-bg-shift opacity-50" />

                {/* Subtle Pink Highlight Glow - extremely subtle */}
                <div className="absolute top-1/4 right-0 w-[30vw] h-[30vw] bg-fitexa-pink/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Grain Texture Overlay */}
                <div className="absolute inset-0 bg-noise opacity-[0.03] z-[1]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center animate-fade-in-up">

                {/* Radial Glow behind headline */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] headline-glow z-0" />

                <div className="relative z-10">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-[900] tracking-[-0.04em] leading-[0.95] mb-10 font-sans mx-auto max-w-5xl premium-text-gradient drop-shadow-2xl">
                        Where Fitness Businesses Grow with AI
                    </h1>

                    <p className="mt-8 text-xl md:text-2xl text-fitexa-beige/60 max-w-3xl mx-auto font-medium leading-relaxed mb-14 tracking-tight">
                        Fitexa.in is your AI-powered front desk and growth engine. Automate leads, bookings, follow-ups, reviews, and visibility &mdash; all controlled from WhatsApp.
                    </p>

                    <div className="mt-12 flex flex-col sm:flex-row gap-8 justify-center items-center">
                        <button
                            onClick={handleLogin}
                            className="group relative w-full sm:w-auto px-10 py-5 bg-fitexa-black text-fitexa-beige rounded-full font-bold text-lg transition-all duration-500 hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-fitexa-beige/10 overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                            <span className="relative z-10">Start Building Your AI</span>
                        </button>

                        <button
                            onClick={handleLogin}
                            className="group w-full sm:w-auto px-10 py-5 bg-white/5 backdrop-blur-md text-fitexa-beige rounded-full font-bold text-lg border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                        >
                            See How It Works
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative minimalist shapes */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fitexa-green/20 to-transparent" />
        </section>
    );
}
