'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';

export default function HowItWorks() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end end"]
    });

    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    // Blur up reveal variant for text
    const blurReveal: Variants = {
        hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <section ref={containerRef} className="py-32 bg-[#faf9f6] text-[#050505] relative overflow-hidden">
            {/* Ambient Background Blur */}
            <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-[#0D4F31]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-[-10%] w-[600px] h-[600px] bg-emerald-200/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-32">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                    >
                        <motion.h2
                            variants={blurReveal}
                            className="text-5xl md:text-6xl font-[800] tracking-tight mb-6 leading-[1.1]"
                        >
                            The easiest way to put your <br />
                            <span className="relative inline-block mt-2">
                                <span className="relative z-10 text-white bg-clip-text text-transparent bg-gradient-to-r from-[#0D4F31] to-emerald-600">business on autopilot</span>
                                <span className="absolute bottom-1 left-0 w-full h-3 bg-emerald-200/40 -z-10 rounded-full"></span>
                            </span>
                        </motion.h2>
                        <motion.p
                            variants={blurReveal}
                            className="text-xl text-black/60 font-medium leading-relaxed max-w-2xl mx-auto"
                        >
                            No complex workflows. No coding. Just connect your accounts, train your agent, and watch it handle your customers seamlessly.
                        </motion.p>
                    </motion.div>
                </div>

                {/* Steps Container */}
                <div className="relative">
                    {/* The premium glowing track line */}
                    <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-[2px] bg-black/5 -translate-x-1/2 rounded-full overflow-hidden">
                        <motion.div
                            style={{ height: lineHeight }}
                            className="w-full bg-gradient-to-b from-[#0D4F31] via-emerald-400 to-[#0D4F31] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        />
                    </div>

                    {/* STEP 1 */}
                    <div className="relative flex flex-col md:flex-row items-center gap-12 md:gap-0 mb-32">
                        {/* Text */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-20%" }}
                            variants={blurReveal}
                            className="flex-1 w-full md:pr-24 md:text-right relative"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:left-auto md:-right-12 md:top-[-40px] text-[180px] font-black text-black/[0.03] -z-10 pointer-events-none select-none tracking-tighter">01</div>
                            <h4 className="text-3xl font-extrabold mb-4 tracking-tight">Connect Channels</h4>
                            <p className="text-lg text-black/60 leading-relaxed max-w-sm md:ml-auto">
                                Securely link Google Business Profile, WhatsApp, and Telegram. Fitexa natively integrates into the platforms your customers already use.
                            </p>
                        </motion.div>

                        {/* Node */}
                        <div className="hidden md:flex w-16 h-16 rounded-full bg-white border border-black/10 shadow-xl items-center justify-center relative z-20">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true, margin: "-20%" }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="w-6 h-6 rounded-full bg-[#0D4F31] shadow-[0_0_20px_rgba(13,79,49,0.4)]"
                            />
                        </div>

                        {/* Visual Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex-1 w-full md:pl-24"
                        >
                            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/80 relative overflow-hidden group hover:shadow-[0_30px_60px_rgba(13,79,49,0.08)] transition-all duration-500">
                                {/* Abstract Connect Animation */}
                                <div className="h-48 relative flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-32 h-32 border border-dashed border-emerald-200 rounded-full" />
                                    </div>
                                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }} className="w-16 h-16 bg-gradient-to-br from-[#0D4F31] to-emerald-700 rounded-2xl shadow-lg flex items-center justify-center z-10 rotate-12">
                                        <span className="text-white font-bold text-xl font-serif italic">F</span>
                                    </motion.div>

                                    {/* Floating connection nodes */}
                                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0 }} className="absolute top-4 left-6 w-12 h-12 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-blue-500 rounded-full" /> {/* Meta/WhatsApp vaguely */}
                                    </motion.div>
                                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute bottom-4 right-6 w-12 h-12 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-sky-400 rounded-full" /> {/* Telegram vaguely */}
                                    </motion.div>
                                    <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 2 }} className="absolute top-1/2 -right-2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-red-400 rounded-full" /> {/* Google vaguely */}
                                    </motion.div>

                                    {/* Connection lines (Animated SVG) */}
                                    <svg className="absolute inset-0 w-full h-full z-0" style={{ pointerEvents: 'none' }}>
                                        <motion.path d="M 60 40 L 120 90" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity }} />
                                        <motion.path d="M 220 160 L 160 110" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }} />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* STEP 2 */}
                    <div className="relative flex flex-col md:flex-row-reverse items-center gap-12 md:gap-0 mb-32">
                        {/* Text */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-20%" }}
                            variants={blurReveal}
                            className="flex-1 w-full md:pl-24 text-left relative"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:left-[-40px] md:top-[-40px] text-[180px] font-black text-black/[0.03] -z-10 pointer-events-none select-none tracking-tighter">02</div>
                            <h4 className="text-3xl font-extrabold mb-4 tracking-tight">Train instantly</h4>
                            <p className="text-lg text-black/60 leading-relaxed max-w-sm">
                                Upload your menus, FAQs, or service details. The AI ingests the context immediately and learns how to represent your business perfectly.
                            </p>
                        </motion.div>

                        {/* Node */}
                        <div className="hidden md:flex w-16 h-16 rounded-full bg-white border border-black/10 shadow-xl items-center justify-center relative z-20">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true, margin: "-20%" }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="w-6 h-6 rounded-full bg-[#0D4F31] shadow-[0_0_20px_rgba(13,79,49,0.4)]"
                            />
                        </div>

                        {/* Visual Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex-1 w-full md:pr-24"
                        >
                            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-white/80 relative overflow-hidden group hover:shadow-[0_30px_60px_rgba(13,79,49,0.08)] transition-all duration-500">
                                {/* Data Processing Animation */}
                                <div className="h-48 relative flex flex-col items-center justify-center w-full gap-6">
                                    <div className="w-full h-16 bg-gray-50 border border-gray-100 rounded-xl relative overflow-hidden flex items-center px-4 shadow-sm">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">📄</div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
                                            <div className="h-2 bg-gray-200 rounded-full w-1/2"></div>
                                        </div>
                                        {/* Scanning laser */}
                                        <motion.div
                                            animate={{ x: ["-100%", "400%"] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-[2px]"
                                        />
                                    </div>

                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-emerald-500">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                    </motion.div>

                                    <div className="w-full h-12 bg-[#050505] rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                        />
                                        <span className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            Knowledge Base Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* STEP 3 */}
                    <div className="relative flex flex-col md:flex-row items-center gap-12 md:gap-0 pb-10">
                        {/* Text */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-20%" }}
                            variants={blurReveal}
                            className="flex-1 w-full md:pr-24 md:text-right relative"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:left-auto md:-right-12 md:top-[-40px] text-[180px] font-black text-black/[0.03] -z-10 pointer-events-none select-none tracking-tighter">03</div>
                            <h4 className="text-3xl font-extrabold mb-4 tracking-tight">On Autopilot</h4>
                            <p className="text-lg text-black/60 leading-relaxed max-w-sm md:ml-auto">
                                Go to sleep. Your AI agent handles late-night booking requests, fields complex CRM questions, and captures leads 24/7.
                            </p>
                        </motion.div>

                        {/* Node */}
                        <div className="hidden md:flex w-16 h-16 rounded-full bg-white border border-black/10 shadow-xl items-center justify-center relative z-20">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true, margin: "-20%" }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="w-6 h-6 rounded-full bg-[#0D4F31] shadow-[0_0_20px_rgba(13,79,49,0.4)] flex items-center justify-center"
                            >
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                            </motion.div>
                        </div>

                        {/* Visual Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex-1 w-full md:pl-24"
                        >
                            <div className="bg-[#050505] backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/10 relative overflow-hidden group">
                                {/* Ambient Dark Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px]"></div>

                                {/* Autopilot Chat Animation */}
                                <div className="h-48 relative flex flex-col justify-end w-full space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-white/10 text-white text-xs p-3 rounded-2xl rounded-bl-sm max-w-[80%] border border-white/5"
                                    >
                                        Are you open right now? Need a trim.
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.5, type: "spring" }}
                                        className="bg-gradient-to-r from-[#0D4F31] to-emerald-700 text-white text-xs p-3 rounded-2xl rounded-br-sm max-w-[85%] ml-auto border border-emerald-400/20 shadow-lg relative"
                                    >
                                        <div className="absolute -top-2 -left-2 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-[#050505]">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        We're closed right now, but I have a slot tomorrow at 10:00 AM. Shall I book it for you?
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 2.5, type: "spring", bounce: 0.6 }}
                                        className="absolute top-4 right-4 bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5"
                                    >
                                        <span className="text-amber-500 text-sm">💰</span> Appt Booked
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
