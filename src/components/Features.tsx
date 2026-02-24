import React from 'react';

const features = [
    {
        title: 'Universal Local Business Support',
        description: 'Works for restaurants, clinics, salons, dentists, bakeries, real estate, repair shops, and more.',
        icon: '🏪'
    },
    {
        title: 'Drag-and-Drop AI Builder',
        description: 'Configure your AI agent\'s capabilities in minutes without writing a single line of code.',
        icon: '⚡'
    },
    {
        title: 'Seamless Integrations',
        description: 'Connect instantly with Telegram, WhatsApp, and Google Business Profile.',
        icon: '🔗'
    },
    {
        title: 'Conversation Analytics',
        description: 'Track leads, measure engagement, and monitor exactly how your agent is performing.',
        icon: '📊'
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#F5F1E8] text-[#050505] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">

                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 leading-tight">
                        Everything your business needs to scale.
                    </h2>
                    <p className="text-lg text-black/60 font-medium leading-relaxed">
                        Powerful AI automation built specifically for local businesses, managed effortlessly.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-[20px] p-8 border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#f0f9f4] flex items-center justify-center text-2xl mb-6">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-black/60 font-medium leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
