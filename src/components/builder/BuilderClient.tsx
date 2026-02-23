'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { AIProject, AIFeature } from '@/lib/types';
import { PREBUILT_FEATURES } from '@/lib/types';

const CATEGORIES = ['Gym', 'Zumba', 'Yoga', 'Dance', 'CrossFit', 'Pilates', 'Martial Arts', 'Swimming', 'Other'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BuilderClient({ user, project: initialProject }: { user: any; project: AIProject }) {
    const supabase = createClient();
    const router = useRouter();
    const [step, setStep] = useState(initialProject.current_step || 1);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activating, setActivating] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Step 1 fields
    const [aiName, setAiName] = useState(initialProject.ai_name || 'Untitled AI');
    const [bizName, setBizName] = useState(initialProject.business_name || '');
    const [bizLocation, setBizLocation] = useState(initialProject.business_location || '');
    const [bizCategory, setBizCategory] = useState(initialProject.business_category || '');
    const [bizDescription, setBizDescription] = useState(initialProject.business_description || '');

    // Step 2
    const [telegramToken, setTelegramToken] = useState(initialProject.telegram_token || '');
    const [tokenError, setTokenError] = useState('');

    // Step 3
    const [features, setFeatures] = useState<AIFeature[]>(() => {
        const enabled = initialProject.enabled_features || [];
        return PREBUILT_FEATURES.map(f => ({
            ...f,
            enabled: enabled.includes(f.id),
        }));
    });

    // Drag state
    const [draggedFeature, setDraggedFeature] = useState<string | null>(null);

    const bg = isDarkMode ? 'bg-[#050505] text-[#F5F2EB]' : 'bg-[#F5F2EB] text-[#050505]';
    const muted = isDarkMode ? 'text-white/40' : 'text-black/40';

    const autoSave = useCallback(async (overrides: Partial<AIProject> = {}) => {
        setSaving(true);
        setSaved(false);
        const payload: Record<string, unknown> = {
            ai_name: aiName,
            business_name: bizName,
            business_location: bizLocation,
            business_category: bizCategory,
            business_description: bizDescription,
            telegram_token: telegramToken,
            enabled_features: features.filter(f => f.enabled).map(f => f.id),
            current_step: step,
            ...overrides,
        };
        await supabase.from('ai_projects').update(payload).eq('id', initialProject.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiName, bizName, bizLocation, bizCategory, bizDescription, telegramToken, features, step, initialProject.id]);

    const debouncedSave = useCallback(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => autoSave(), 1000);
    }, [autoSave]);

    // Auto-save whenever fields change
    useEffect(() => {
        debouncedSave();
        return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
    }, [aiName, bizName, bizLocation, bizCategory, bizDescription, telegramToken, features, debouncedSave]);

    const validateToken = (token: string) => {
        // Telegram bot token format: <digits>:<alphanumeric>
        const regex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
        return regex.test(token);
    };

    const goNext = async () => {
        if (step === 2 && telegramToken && !validateToken(telegramToken)) {
            setTokenError('Invalid token format. Expected: 123456789:ABCdef...');
            return;
        }
        setTokenError('');
        const next = Math.min(step + 1, 3);
        setStep(next);
        await autoSave({ current_step: next });
    };

    const goBack = () => {
        const prev = Math.max(step - 1, 1);
        setStep(prev);
    };

    const handleActivate = async () => {
        if (telegramToken && !validateToken(telegramToken)) {
            setTokenError('Please fix your Telegram token before activating.');
            setStep(2);
            return;
        }
        if (!telegramToken) {
            setTokenError('Please add your Telegram bot token first.');
            setStep(2);
            return;
        }
        setActivating(true);

        // First save all current data
        await supabase.from('ai_projects').update({
            ai_name: aiName,
            business_name: bizName,
            business_location: bizLocation,
            business_category: bizCategory,
            business_description: bizDescription,
            telegram_token: telegramToken,
            enabled_features: features.filter(f => f.enabled).map(f => f.id),
            current_step: 3,
        }).eq('id', initialProject.id);

        // Call activation API to register Telegram webhook
        try {
            const res = await fetch(`/api/activate/${initialProject.id}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                alert(`Activation failed: ${data.error || 'Unknown error'}${data.details ? '\n' + data.details : ''}`);
                setActivating(false);
                return;
            }
        } catch {
            alert('Network error during activation. Please try again.');
            setActivating(false);
            return;
        }

        setActivating(false);
        router.push('/dashboard');
    };

    const handleDragStart = (featureId: string) => setDraggedFeature(featureId);
    const handleDragEnd = () => setDraggedFeature(null);
    const handleDropToActive = () => {
        if (!draggedFeature) return;
        setFeatures(prev => prev.map(f => f.id === draggedFeature ? { ...f, enabled: true } : f));
        setDraggedFeature(null);
    };
    const toggleFeature = (id: string) => {
        setFeatures(prev => prev.map(f => f.id === id && !f.disabled ? { ...f, enabled: !f.enabled } : f));
    };

    const activeFeatures = features.filter(f => f.enabled);
    const availableFeatures = features.filter(f => !f.enabled);

    const steps = [
        { n: 1, label: 'Business' },
        { n: 2, label: 'Telegram' },
        { n: 3, label: 'Features' },
    ];

    const inputClass = `w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all outline-none ${isDarkMode ? 'bg-white/[0.04] border border-white/[0.08] text-white focus:border-white/20 focus:bg-white/[0.06] placeholder:text-white/20' : 'bg-white border border-black/[0.06] text-black focus:border-[#0D4F31]/30 focus:bg-white placeholder:text-black/25'}`;

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${bg} font-sans`}>
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className={`absolute top-[-20%] left-[-15%] w-[70vw] h-[70vh] rounded-full blur-[140px] animate-blob ${isDarkMode ? 'bg-[#0D4F31]/25' : 'bg-[#0D4F31]/8'}`} />
                <div className={`absolute bottom-[-25%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] animate-blob animation-delay-2000 ${isDarkMode ? 'bg-[#0D4F31]/15' : 'bg-[#FCDDEC]/25'}`} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Nav */}
                <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                    <button onClick={() => router.push('/dashboard')} className={`flex items-center gap-2 text-sm font-medium transition-colors ${muted} hover:${isDarkMode ? 'text-white' : 'text-black'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${saving ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : saved ? (isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]') : muted}`}>
                            {saving ? 'Saving...' : saved ? '✓ Saved' : ''}
                        </span>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </nav>

                <main className="flex-grow px-6 md:px-10 lg:px-20 pt-4 pb-20 max-w-4xl mx-auto w-full">
                    {/* AI Name */}
                    <input
                        type="text"
                        value={aiName}
                        onChange={e => setAiName(e.target.value)}
                        className={`bg-transparent border-none outline-none text-3xl md:text-4xl font-[900] tracking-tight mb-8 w-full ${isDarkMode ? 'placeholder:text-white/15' : 'placeholder:text-black/15'}`}
                        placeholder="Name your AI..."
                    />

                    {/* Stepper */}
                    <div className="flex items-center gap-1 mb-10">
                        {steps.map((s, i) => (
                            <div key={s.n} className="flex items-center">
                                <button
                                    onClick={() => { setStep(s.n); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${step === s.n
                                        ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-[#0D4F31]/10 text-[#0D4F31]')
                                        : (step > s.n
                                            ? (isDarkMode ? 'text-[#86efac]/60' : 'text-[#0D4F31]/50')
                                            : muted)
                                        }`}
                                >
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${step === s.n
                                        ? (isDarkMode ? 'bg-white text-black' : 'bg-[#0D4F31] text-white')
                                        : step > s.n
                                            ? (isDarkMode ? 'bg-[#86efac]/20 text-[#86efac]' : 'bg-[#0D4F31]/15 text-[#0D4F31]')
                                            : (isDarkMode ? 'bg-white/5 text-white/30' : 'bg-black/5 text-black/30')
                                        }`}>
                                        {step > s.n ? '✓' : s.n}
                                    </span>
                                    <span className="hidden sm:inline">{s.label}</span>
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`w-8 h-px mx-1 ${step > s.n ? (isDarkMode ? 'bg-[#86efac]/30' : 'bg-[#0D4F31]/20') : (isDarkMode ? 'bg-white/5' : 'bg-black/5')}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className={`rounded-2xl border p-6 md:p-8 backdrop-blur-xl ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/60 border-black/[0.04]'}`}>

                        {/* Step 1: Business Setup */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className={`text-lg font-bold mb-1`}>Business Setup</h2>
                                    <p className={`text-sm ${muted}`}>Tell us about the business this AI will serve.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2 mb-2 p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
                                        <div>
                                            <p className={`font-bold text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Google Business Automation (Pro)</p>
                                            <p className={`text-xs mt-1 ${muted}`}>Connect your Google Business Profile to let AI auto-reply to reviews and post updates.</p>
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/api/auth/google?projectId=${initialProject.id}`}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border shrink-0 ${initialProject.google_access_token ? (isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-600/10 border-green-600/20 text-green-700') : (isDarkMode ? 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-black/5 border-black/10 hover:bg-black/10')}`}>
                                            {initialProject.google_access_token ? '✓ Connected' : 'Connect Google'}
                                        </button>
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Business Name</label>
                                        <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} className={inputClass} placeholder="FitGym Pro" />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Location</label>
                                        <input type="text" value={bizLocation} onChange={e => setBizLocation(e.target.value)} className={inputClass} placeholder="Mumbai, India" />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Category</label>
                                        <select value={bizCategory} onChange={e => setBizCategory(e.target.value)} className={inputClass}>
                                            <option value="">Select category...</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Short Description</label>
                                        <textarea rows={3} value={bizDescription} onChange={e => setBizDescription(e.target.value)} className={`${inputClass} resize-none`} placeholder="A brief description of the business..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Telegram Bot */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Telegram Bot Connection</h2>
                                    <p className={`text-sm ${muted}`}>Connect a Telegram bot to power your AI agent.</p>
                                </div>

                                {/* Instructions */}
                                <div className={`rounded-xl p-5 text-sm space-y-3 ${isDarkMode ? 'bg-[#86efac]/5 border border-[#86efac]/10' : 'bg-[#0D4F31]/5 border border-[#0D4F31]/10'}`}>
                                    <p className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>How to create your bot</p>
                                    <ol className={`list-decimal list-inside space-y-1.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                        <li>Open Telegram and search for <strong>@BotFather</strong></li>
                                        <li>Send <code className={`px-1.5 py-0.5 rounded text-xs ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>/newbot</code> and follow the prompts</li>
                                        <li>Choose a name and username for your bot</li>
                                        <li>Copy the <strong>API token</strong> BotFather gives you</li>
                                        <li>Paste it below</li>
                                    </ol>
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Bot Token</label>
                                    <input
                                        type="text"
                                        value={telegramToken}
                                        onChange={e => { setTelegramToken(e.target.value); setTokenError(''); }}
                                        className={`${inputClass} font-mono`}
                                        placeholder="123456789:ABCdefGHI..."
                                    />
                                    {tokenError && <p className="mt-2 text-xs text-red-400 font-medium">{tokenError}</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Feature Builder */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Feature Builder</h2>
                                    <p className={`text-sm ${muted}`}>Drag features to activate them, or click to toggle.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {/* Available */}
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${muted}`}>Available Features</p>
                                        <div className="space-y-2.5">
                                            {availableFeatures.map(f => (
                                                <div
                                                    key={f.id}
                                                    draggable={!f.disabled}
                                                    onDragStart={() => !f.disabled && handleDragStart(f.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => !f.disabled && toggleFeature(f.id)}
                                                    className={`rounded-xl p-4 border transition-all select-none ${f.disabled
                                                        ? `opacity-40 cursor-not-allowed ${isDarkMode ? 'bg-white/[0.01] border-white/5' : 'bg-black/[0.01] border-black/5'}`
                                                        : `cursor-grab active:cursor-grabbing ${isDarkMode ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/15' : 'bg-white border-black/[0.04] hover:border-black/10'}`
                                                        } ${draggedFeature === f.id ? 'opacity-40 scale-95' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{f.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{f.name}</p>
                                                            <p className={`text-[11px] mt-0.5 ${muted}`}>{f.comingSoon ? 'Coming soon' : f.description}</p>
                                                        </div>
                                                        {!f.disabled && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={muted}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {availableFeatures.length === 0 && (
                                                <p className={`text-sm text-center py-6 ${muted}`}>All features activated! 🎉</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active */}
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>Active Configuration</p>
                                        <div
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={handleDropToActive}
                                            className={`min-h-[200px] rounded-xl border-2 border-dashed p-3 transition-colors space-y-2.5 ${isDarkMode ? 'border-[#86efac]/20 bg-[#86efac]/[0.02]' : 'border-[#0D4F31]/15 bg-[#0D4F31]/[0.02]'} ${draggedFeature ? (isDarkMode ? 'border-[#86efac]/40 bg-[#86efac]/[0.05]' : 'border-[#0D4F31]/30 bg-[#0D4F31]/[0.04]') : ''}`}
                                        >
                                            {activeFeatures.length === 0 && (
                                                <p className={`text-sm text-center py-10 ${muted}`}>Drag features here or click to enable</p>
                                            )}
                                            {activeFeatures.map(f => (
                                                <div
                                                    key={f.id}
                                                    className={`rounded-xl p-4 border transition-all ${isDarkMode ? 'bg-[#86efac]/5 border-[#86efac]/15' : 'bg-[#0D4F31]/5 border-[#0D4F31]/10'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">{f.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate">{f.name}</p>
                                                            <p className={`text-[11px] mt-0.5 ${muted}`}>{f.description}</p>
                                                        </div>
                                                        <button onClick={() => toggleFeature(f.id)} className="text-red-400/60 hover:text-red-400 transition-colors p-1">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8">
                        {step > 1 ? (
                            <button onClick={goBack} className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border ${isDarkMode ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-[#0D4F31]/15 text-[#0D4F31]/60 hover:bg-[#0D4F31]/5 hover:text-[#0D4F31]'}`}>
                                Back
                            </button>
                        ) : <div />}
                        {step < 3 ? (
                            <button onClick={goNext} className={`px-7 py-3 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_25px_rgba(255,255,255,0.07)]' : 'bg-[#050505] text-white hover:bg-gray-800 shadow-[0_0_25px_rgba(0,0,0,0.12)]'}`}>
                                Continue
                            </button>
                        ) : (
                            <button onClick={handleActivate} disabled={activating} className={`px-7 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${isDarkMode ? 'bg-[#86efac] text-black hover:bg-[#6ee7a0] shadow-[0_0_30px_rgba(134,239,172,0.15)]' : 'bg-[#0D4F31] text-white hover:bg-[#0a3c25] shadow-[0_0_30px_rgba(13,79,49,0.2)]'}`}>
                                {activating ? 'Activating...' : '🚀 Activate AI'}
                            </button>
                        )}
                    </div>
                </main>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.08); }
                    66% { transform: translate(-20px, 20px) scale(0.92); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                .animate-blob { animation: blob 22s infinite alternate ease-in-out; }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}
