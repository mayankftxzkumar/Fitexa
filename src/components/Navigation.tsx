'use client';

import Link from 'next/link';
import React from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function Navigation() {
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
        <nav className="fixed top-0 w-full z-50 bg-fitexa-beige/60 backdrop-blur-2xl border-b border-fitexa-green/5">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <div className="flex justify-between items-center h-24">
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-3xl font-[900] text-fitexa-green tracking-tighter">
                            Fitexa.in
                        </Link>
                    </div>
                    <div className="hidden md:flex space-x-12 items-center">
                        <Link href="/" className="text-fitexa-black/70 hover:text-fitexa-green transition-all duration-300 font-bold tracking-tight text-sm uppercase">
                            Home
                        </Link>
                        <Link href="#features" className="text-fitexa-black/70 hover:text-fitexa-green transition-all duration-300 font-bold tracking-tight text-sm uppercase">
                            Features
                        </Link>
                        <button
                            onClick={handleLogin}
                            className="bg-fitexa-black hover:bg-neutral-900 text-fitexa-beige px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-500 shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 border border-white/5 cursor-pointer"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom border glow */}
            <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-fitexa-green/10 to-transparent" />
        </nav>
    );
}
