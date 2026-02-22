import React from 'react';

const features = [
    {
        title: 'AI Front Desk',
        description: 'Instant lead replies, trial booking, automated follow-ups.',
    },
    {
        title: 'WhatsApp Control',
        description: 'Run your studio AI directly from WhatsApp commands.',
    },
    {
        title: 'Smart Growth Engine',
        description: 'Google review automation, SEO content generation, local visibility optimization.',
    },
    {
        title: 'Member Retention',
        description: 'Automated renewal reminders and engagement campaigns.',
    }
];

export default function Features() {
    return (
        <section id="features" className="py-32 bg-fitexa-beige text-fitexa-black relative overflow-hidden">

            {/* Background elements for depth */}
            <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-fitexa-green/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-fitexa-pink/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 relative z-10">

                <div className="text-center max-w-4xl mx-auto mb-20 animate-fade-in-up">
                    <h2 className="text-5xl md:text-6xl font-[900] text-fitexa-green tracking-tighter font-sans mb-8 leading-[1.1]">
                        Everything your studio needs to scale.
                    </h2>
                    <p className="text-xl text-fitexa-black/60 font-medium max-w-2xl mx-auto leading-relaxed">
                        Powerful AI automation built specifically for fitness businesses, all managed effortlessly.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-[#FCFBF8] rounded-3xl p-10 border border-fitexa-black/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                        >
                            {/* Inner subtle noise/grain */}
                            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

                            {/* Hover glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-fitexa-green/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                            <h3 className="text-2xl font-[800] text-fitexa-green mb-5 font-sans tracking-tight group-hover:text-fitexa-black transition-colors duration-500 relative z-10">
                                {feature.title}
                            </h3>

                            <p className="text-fitexa-black/70 font-medium leading-relaxed relative z-10 text-[1.05rem]">
                                {feature.description}
                            </p>

                            {/* Bottom accent line */}
                            <div className="absolute bottom-0 left-10 right-10 h-[2px] bg-fitexa-green/0 group-hover:bg-fitexa-green/20 transition-all duration-500" />
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
