'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

const features = [
    {
        title: 'Universal Business Support',
        description: 'Works for restaurants, clinics, salons, dentists, bakeries, real estate, repair shops, and more.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9.40002L4.03264 5.26947C4.16781 4.72882 4.65436 4.3418 5.21044 4.3418H18.7896C19.3456 4.3418 19.8322 4.72882 19.9674 5.26947L21 9.40002" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9.40002H21" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9.40002V18.1581C3 19.2627 3.89543 20.1581 5 20.1581H19C20.1046 20.1581 21 19.2627 21 18.1581V9.40002" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 20.1581V13.8418C12 13.0687 11.3731 12.4418 10.6 12.4418H8.4C7.6268 12.4418 7 13.0687 7 13.8418V20.1581" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Drag-and-Drop AI Builder',
        description: 'Configure your AI agent\'s capabilities in minutes without writing a single line of code.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Seamless Integrations',
        description: 'Connect instantly with Telegram and Google Business Profile.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13A5 5 0 0 0 17 13L20 10A5 5 0 0 0 13 3L11.5 4.5" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11A5 5 0 0 0 7 11L4 14A5 5 0 0 0 11 21L12.5 19.5" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        title: 'Conversation Analytics',
        description: 'Track leads, measure engagement, and monitor exactly how your agent is performing.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 20V4" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 20V14" stroke="#0D4F31" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
];

export default function Features() {
    const containerVariants: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <section id="features" className="py-24 bg-[#F5F1E8] text-[#050505] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 leading-tight">
                        Everything your business needs to scale.
                    </h2>
                    <p className="text-lg text-black/60 font-medium leading-relaxed">
                        Powerful AI automation built specifically for local businesses, managed effortlessly.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="bg-white rounded-[20px] p-8 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 flex flex-col"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#f0f9f4] flex items-center justify-center mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-black/60 font-medium leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
}
