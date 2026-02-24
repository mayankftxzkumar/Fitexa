'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
                            Terms of Service
                        </h1>
                        <p className="text-black/50 font-sans text-sm mb-16 border-b border-black/10 pb-8">
                            Effective Date: October 1, 2026
                        </p>

                        <article className="prose prose-lg prose-headings:font-sans prose-headings:font-bold prose-p:text-black/80 prose-a:text-[#0D4F31]">
                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Fitexa platform, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions outlined here, you may not use our AI automation services.
                            </p>

                            <h2>2. Description of Service</h2>
                            <p>
                                Fitexa provides an AI-driven automation platform designed for local businesses. This includes chatbots integrating with Telegram and Google Business Profile to orchestrate booking requests and manage FAQs. Wait times and service availability may vary depending on the underlying API models.
                            </p>

                            <h2>3. User Responsibilities</h2>
                            <p>
                                You are solely responsible for all activity that occurs under your account. You must explicitly configure the AI bounds of knowledge to ensure it accurately details your business's proprietary information. Misuse of the platform to generate spam or unsolicited mass messaging is strictly prohibited and will result in immediate termination.
                            </p>

                            <h2>4. Termination</h2>
                            <p>
                                We may terminate or suspend your access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason.
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
