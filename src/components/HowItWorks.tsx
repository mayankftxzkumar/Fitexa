'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const steps = [
    {
        number: '01',
        title: 'Connect Your Channels',
        description: 'Securely link your Google Business Profile, WhatsApp, and Telegram in seconds. Fitexa integrates seamlessly into the tools your customers already use.',
        visual: (
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D4F31]">
                <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.9213 3.60155 15.7018 4.62263 17.1855L3.5 20.5L6.81454 19.3774C8.29822 20.3984 10.0787 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M15 12C15 13.6569 13.6569 15 12 15M9 12C9 10.3431 10.3431 9 12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        )
    },
    {
        number: '02',
        title: 'Train Your AI instantly',
        description: 'Upload your business details, FAQs, menus, or services. The AI learns everything about your local business context natively.',
        visual: (
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D4F31]">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 18H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        number: '03',
        title: 'Put Customer Support on Autopilot',
        description: 'Watch your AI handle messages, answer questions, and secure table bookings instantly, 24/7.',
        visual: (
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D4F31]">
                <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        )
    }
];

export default function HowItWorks() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const translateY = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="py-32 bg-white text-[#050505] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-24"
                >
                    <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 leading-tight">
                        How <span className="text-[#0D4F31] italic font-serif">Fitexa</span> works for you
                    </h2>
                    <p className="text-lg text-black/60 font-medium leading-relaxed">
                        Three simple steps to fully automate your local business messaging and scheduling.
                    </p>
                </motion.div>

                <div className="space-y-24 md:space-y-12 relative">
                    {/* The Connecting Line Background (hidden on mobile) */}
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-black/5 -translate-x-1/2" />

                    {steps.map((step, index) => {
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-20%" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={`flex flex-col md:flex-row items-center gap-10 md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                            >
                                {/* Content Side */}
                                <div className={`flex-1 w-full ${isEven ? 'md:pr-20 md:text-right' : 'md:pl-20 md:text-left'} text-center`}>
                                    <h3 className="text-5xl font-black text-black/5 mb-4">{step.number}</h3>
                                    <h4 className="text-2xl font-bold mb-4">{step.title}</h4>
                                    <p className="text-lg text-black/60 leading-relaxed max-w-sm mx-auto md:mx-0 ${isEven ? 'md:ml-auto' : ''}">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Center Custom SVG Visual */}
                                <div className="hidden md:flex flex-shrink-0 w-24 h-24 rounded-3xl bg-[#F5F1E8] shadow-inner items-center justify-center relative z-10 border border-black/5">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                                    >
                                        <div className="w-12 h-12 text-[#0D4F31]">
                                            {/* Scaled down SVG icon rendering within the circle base on step visual */}
                                            {React.cloneElement(step.visual as any, { width: 48, height: 48 })}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Mobile Visual */}
                                <div className="md:hidden flex-1 w-full flex justify-center py-8">
                                    <div className="w-32 h-32 rounded-3xl bg-[#F5F1E8] flex items-center justify-center p-6 shadow-inner border border-black/5">
                                        <motion.div
                                            initial={{ scale: 0.8 }}
                                            whileInView={{ scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ type: "spring" }}
                                        >
                                            {React.cloneElement(step.visual as any, { width: 64, height: 64 })}
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Empty Side for alignment */}
                                <div className="hidden md:block flex-1 w-full" />
                            </motion.div>
                        );
                    })}

                    {/* Fun Scroll Graphic indicator */}
                    <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-24 md:translate-y-12">
                        <motion.div
                            style={{ y: translateY, opacity }}
                            className="w-1 h-24 bg-gradient-to-b from-[#0D4F31]/0 via-[#0D4F31]/30 to-[#0D4F31] rounded-full"
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}
