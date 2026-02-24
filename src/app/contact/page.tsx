'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function ContactPage() {
    return (
        <>
            <Navigation />
            <main className="min-h-screen bg-[#faf9f6] text-[#050505] pt-32 pb-24 flex items-center justify-center">

                {/* Ambient Background Blur */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#0D4F31]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="max-w-2xl w-full mx-auto px-6 z-10 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                            Let's Talk
                        </h1>
                        <p className="text-xl text-black/60 font-medium">
                            Have a question or need priority support? Drop us a line.
                        </p>
                    </motion.div>

                    <div className="grid gap-4">
                        {/* Email */}
                        <motion.a
                            href="#"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-black/5 hover:border-emerald-200 hover:shadow-[0_10px_40px_rgba(13,79,49,0.08)] transition-all group"
                        >
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                <span className="text-2xl">📧</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold">Email Us</h3>
                                <p className="text-black/50">support@fitexa.in</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                        </motion.a>

                        {/* Instagram */}
                        <motion.a
                            href="#"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-black/5 hover:border-pink-200 hover:shadow-[0_10px_40px_rgba(236,72,153,0.08)] transition-all group"
                        >
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-pink-50 transition-colors">
                                <span className="text-2xl">📸</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold">Instagram</h3>
                                <p className="text-black/50">@fitexa_ai</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                        </motion.a>

                        {/* Discord */}
                        <motion.a
                            href="#"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-black/5 hover:border-indigo-200 hover:shadow-[0_10px_40px_rgba(99,102,241,0.08)] transition-all group"
                        >
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                <span className="text-2xl">👾</span>
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold">Discord Community</h3>
                                <p className="text-black/50">Join the builder chat</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </div>
                        </motion.a>
                    </div>

                </div>
            </main>
            <Footer />
        </>
    );
}
