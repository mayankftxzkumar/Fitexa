'use client';

import Link from 'next/link';
import Image from 'next/image';
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
        <nav className="fixed top-0 w-full z-50 bg-[#F5F1E8]/80 backdrop-blur-xl border-b border-black/5">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
                <div className="flex justify-between items-center h-20">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3 text-2xl font-[800] text-[#050505] tracking-tight">
                            <Image src="/logo.png" alt="Fitexa Logo" width={32} height={32} className="rounded-md" unoptimized />
                            Fitexa
                        </Link>
                    </div>

                    {/* Right: Links & CTA */}
                    <div className="hidden md:flex space-x-10 items-center">
                        <Link href="#features" className="text-black/60 hover:text-black transition-colors font-medium text-sm">
                            Features
                        </Link>
                        <Link href="#process" className="text-black/60 hover:text-black transition-colors font-medium text-sm">
                            Process
                        </Link>
                        <Link href="#testimonials" className="text-black/60 hover:text-black transition-colors font-medium text-sm">
                            Testimonials
                        </Link>
                        <button
                            onClick={handleLogin}
                            className="bg-[#0D4F31] hover:bg-[#0a3d26] text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_4px_14px_rgba(13,79,49,0.2)] hover:shadow-[0_6px_20px_rgba(13,79,49,0.3)] hover:-translate-y-0.5"
                        >
                            Get Started ↗
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
