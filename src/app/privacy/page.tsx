'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-[#faf9f6] text-[#050505] pt-32 pb-24 selection:bg-emerald-200">

                {/* Header Premium Gradient */}
                <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-[#0D4F31]/10 to-transparent pointer-events-none -z-10" />

                <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16 mt-16 font-serif z-10 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <p className="text-emerald-700 font-sans font-semibold tracking-widest uppercase text-sm mb-4">Legal Directory</p>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-8 font-sans">
                            Privacy Policy
                        </h1>
                        <p className="text-black/50 font-sans text-sm mb-16 border-b border-black/10 pb-8">
                            Effective Date: October 1, 2026
                        </p>

                        <article className="prose prose-lg prose-headings:font-sans prose-headings:font-bold prose-p:text-black/80 prose-a:text-[#0D4F31]">
                            <h2>1. Information We Collect</h2>
                            <p>
                                When you register an account, we collect information including your name, email address, and platform integration keys (e.g. Telegram tokens). When utilizing our chatbots, we temporarily cache user intent data to resolve conversations.
                            </p>

                            <h2>2. How Your Data Is Secured</h2>
                            <p>
                                All sensitive information is handled using enterprise-grade encryption. API keys required to bridge automated dialogues are stored securely in Supabase utilizing Row Level Security protocols.
                            </p>

                            <h2>3. Third-Party Sharing</h2>
                            <p>
                                We do not distribute, sell, or monetize your contact or customer data. We may share necessary metadata with OpenAI to generate context-aware chat completions on behalf of your authorized AI agent.
                            </p>

                            <h2>4. Your Rights</h2>
                            <p>
                                Feel free to contact us at any point to request a complete deletion of your associated data records.
                            </p>

                            <p className="mt-16 text-black/40 italic font-sans text-sm">
                                These terms are placeholder for UI demonstration purposes and do not substitute legal counsel.
                            </p>
                        </article>

                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
