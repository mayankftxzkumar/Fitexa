'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AIProject, AIFeature } from '@/lib/types';
import { PREBUILT_FEATURES } from '@/lib/types';
import Image from 'next/image';

const CATEGORIES = ['Restaurant', 'Clinic', 'Salon', 'Dentist', 'Gym', 'Real Estate', 'Bakery', 'Coaching Center', 'Repair Shop', 'Other'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BuilderClient({ user, project: initialProject }: { user: any; project: AIProject }) {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(Math.min(initialProject.current_step || 1, 3));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activating, setActivating] = useState(false);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);
    const hasMounted = useRef(false);

    // Google connection state
    const [googleConnected, setGoogleConnected] = useState(!!initialProject.google_connected);

    // Step 1: Business Info (auto-filled from Google or manual)
    const [aiName, setAiName] = useState(initialProject.ai_name || 'Untitled AI');
    const [bizName, setBizName] = useState(initialProject.business_name || '');
    const [bizLocation, setBizLocation] = useState(initialProject.business_location || '');
    const [bizCategory, setBizCategory] = useState(initialProject.business_category || '');
    const [bizDescription, setBizDescription] = useState(initialProject.business_description || '');

    // Step 3: Telegram
    const [telegramToken, setTelegramToken] = useState(initialProject.telegram_token || '');
    const [tokenError, setTokenError] = useState('');
    const [validatingToken, setValidatingToken] = useState(false);
    const [botUsername, setBotUsername] = useState(initialProject.telegram_bot_username || '');

    // Step 2: Features
    const [features, setFeatures] = useState<AIFeature[]>(() => {
        const enabled = initialProject.enabled_features || [];
        return PREBUILT_FEATURES.map(f => ({
            ...f,
            enabled: enabled.includes(f.id),
        }));
    });

    // Drag state
    const [draggedFeature, setDraggedFeature] = useState<string | null>(null);

    // Check if user just returned from Google OAuth — reload project data
    useEffect(() => {
        if (searchParams.get('google') === 'connected') {
            setGoogleConnected(true);
            // Refetch project to get auto-filled business data
            (async () => {
                const { data } = await supabase
                    .from('ai_projects')
                    .select('*')
                    .eq('id', initialProject.id)
                    .single();
                if (data) {
                    if (data.business_name) setBizName(data.business_name);
                    if (data.business_location) setBizLocation(data.business_location);
                    if (data.business_category) setBizCategory(data.business_category);
                    if (data.business_description) setBizDescription(data.business_description);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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
            telegram_bot_username: botUsername,
            enabled_features: features.filter(f => f.enabled).map(f => f.id),
            current_step: step,
            ...overrides,
        };
        await supabase.from('ai_projects').update(payload).eq('id', initialProject.id);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiName, bizName, bizLocation, bizCategory, bizDescription, telegramToken, botUsername, features, step, initialProject.id]);

    const debouncedSave = useCallback(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => autoSave(), 1000);
    }, [autoSave]);

    useEffect(() => {
        // Skip autoSave on initial mount to prevent overwriting DB values with empty state
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        debouncedSave();
        return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
    }, [aiName, bizName, bizLocation, bizCategory, bizDescription, telegramToken, features, debouncedSave]);

    const validateTelegramToken = async (): Promise<boolean> => {
        if (!telegramToken) {
            setTokenError('Please enter your Telegram bot token.');
            return false;
        }
        setValidatingToken(true);
        setTokenError('');
        try {
            const res = await fetch('/api/telegram/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: telegramToken }),
            });
            const data = await res.json();
            if (data.valid) {
                setBotUsername(data.bot_username);
                setTokenError('');
                setValidatingToken(false);

                // Immediately persist token to DB on successful validation
                await supabase
                    .from('ai_projects')
                    .update({
                        telegram_token: telegramToken,
                        telegram_bot_username: data.bot_username,
                    })
                    .eq('id', initialProject.id);
                console.log('[BuilderClient] Token saved to DB after validation');

                return true;
            } else {
                setTokenError(data.error || 'Invalid bot token.');
                setValidatingToken(false);
                return false;
            }
        } catch {
            setTokenError('Failed to validate token. Check your connection.');
            setValidatingToken(false);
            return false;
        }
    };

    const goNext = async () => {
        if (step === 3) {
            // Validate Telegram token before proceeding
            const valid = await validateTelegramToken();
            if (!valid) return;
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
        if (!telegramToken) {
            setTokenError('Please add your Telegram bot token first.');
            setStep(3);
            return;
        }
        // Validate via API
        const valid = await validateTelegramToken();
        if (!valid) {
            setStep(3);
            return;
        }

        setActivating(true);

        // Send all data to the activation API — server saves via admin client
        try {
            const res = await fetch(`/api/activate/${initialProject.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_token: telegramToken,
                    telegram_bot_username: botUsername,
                    ai_name: aiName,
                    business_name: bizName,
                    business_location: bizLocation,
                    business_category: bizCategory,
                    business_description: bizDescription,
                    enabled_features: features.filter(f => f.enabled).map(f => f.id),
                }),
            });
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
        router.push(`/ai/${initialProject.id}`);
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
        { n: 1, label: 'Google & Business' },
        { n: 2, label: 'Features' },
        { n: 3, label: 'Telegram' },
    ];

    const inputClass = "w-full px-4 py-3.5 rounded-[12px] text-sm font-medium transition-all outline-none bg-black/[0.02] border border-black/5 text-black focus:border-[#0D4F31]/30 focus:bg-white focus:shadow-[0_0_0_4px_rgba(13,79,49,0.05)] placeholder:text-black/30";

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F5F1E8] text-[#050505] font-sans">
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Nav — Logo icon only */}
                <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Fitexa" width={36} height={36} className="rounded-lg" unoptimized />
                    </button>
                    <div className="flex items-center gap-3 bg-black/[0.03] px-4 py-2 rounded-full border border-black/5">
                        <div className={`w-2 h-2 rounded-full ${saving ? 'bg-yellow-500 animate-pulse' : saved ? 'bg-[#0D4F31]' : 'bg-black/20'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                            {saving ? 'Saving...' : saved ? 'Saved' : 'Draft'}
                        </span>
                    </div>
                </nav>

                <main className="flex-grow px-6 md:px-10 lg:px-20 pt-8 pb-24 max-w-4xl mx-auto w-full flex flex-col items-center">
                    <div className="w-full max-w-2xl text-center mb-10">
                        {/* AI Name Editor */}
                        <input
                            type="text"
                            value={aiName}
                            onChange={e => setAiName(e.target.value)}
                            className="bg-transparent border-none outline-none text-4xl md:text-5xl font-[900] tracking-tight mb-2 w-full text-center placeholder:text-black/20 text-[#050505]"
                            placeholder="Name your agent..."
                        />
                        <p className="text-sm font-medium text-black/50">Setup your agent in minutes.</p>
                    </div>

                    {/* Minimal Stepper */}
                    <div className="flex items-center justify-center gap-2 mb-10 w-full overflow-hidden max-w-3xl border border-black/5 bg-white rounded-full p-2 shadow-sm">
                        {steps.map((s, i) => (
                            <div key={s.n} className="flex items-center min-w-0" style={{ flex: step === s.n ? 1.5 : 1 }}>
                                <button
                                    onClick={() => setStep(s.n)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all select-none w-full border border-transparent
                                        ${step === s.n
                                            ? 'bg-black/[0.03] border-black/10 text-black shadow-inner'
                                            : step > s.n
                                                ? 'bg-transparent text-black/50 hover:bg-black/5'
                                                : 'bg-transparent text-black/40 hover:bg-black/5'
                                        }`}
                                >
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all
                                        ${step === s.n
                                            ? 'bg-[#0D4F31] text-white shadow-md'
                                            : step > s.n
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-black/5 text-black/40'
                                        }`}>
                                        {step > s.n ? '✓' : s.n}
                                    </span>
                                    <span className={`hidden sm:inline whitespace-nowrap truncate ${step === s.n ? 'opacity-100' : 'opacity-70'}`}>{s.label}</span>
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`h-px w-3 sm:w-6 mx-1 shrink-0 ${step > s.n ? 'bg-green-200' : 'bg-black/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content Group */}
                    <div className="bg-white rounded-[24px] border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 md:p-10 relative overflow-hidden w-full max-w-4xl">

                        {/* Step 1: Google Connect + Business Info */}
                        {step === 1 && (
                            <div className="space-y-10 animate-fade-in-up">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Connect Google Business</h2>
                                    <p className="text-sm text-black/60 font-medium max-w-xl">Link your business profile to auto-fill details and activate smart review features.</p>
                                </div>
                                <div className={`rounded-[20px] p-6 border transition-all ${googleConnected ? 'border-green-600/20 bg-green-50' : 'border-[#0D4F31]/10 bg-[#0D4F31]/[0.02]'}`}>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${googleConnected ? 'bg-green-100' : 'bg-white shadow-sm border border-black/5'}`}>
                                            {googleConnected ? '✅' : '🏪'}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold text-base ${googleConnected ? 'text-green-800' : 'text-black'}`}>
                                                {googleConnected ? 'Google Profile Linked' : 'Google Business Profile'}
                                            </p>
                                            <p className={`text-sm mt-1 ${googleConnected ? 'text-green-700' : 'text-black/60'}`}>
                                                {googleConnected ? 'Your profile is securely connected.' : 'Connect to instantly import your public details.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.location.href = `/api/auth/google?projectId=${initialProject.id}`}
                                            className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold transition-all border shrink-0 uppercase tracking-widest
                                                ${googleConnected
                                                    ? 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200'
                                                    : 'bg-[#0D4F31] border-[#0D4F31] hover:bg-[#0a3c25] text-white shadow-md'}`}
                                        >
                                            {googleConnected ? 'Reconnect Google' : 'Connect Google'}
                                        </button>
                                    </div>
                                </div>

                                <hr className="border-black/5" />

                                <div>
                                    <h3 className="text-xl font-bold mb-2">Business Details</h3>
                                    <p className="text-sm text-black/60 font-medium mb-6">
                                        {googleConnected
                                            ? 'Auto-filled from Google. Feel free to tweak how the AI describes you.'
                                            : 'Tell the AI about your business so it knows how to respond.'}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-black/50 ml-1">Business Name</label>
                                            <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} className={inputClass} placeholder="Acme Cafe" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-black/50 ml-1">Location</label>
                                            <input type="text" value={bizLocation} onChange={e => setBizLocation(e.target.value)} className={inputClass} placeholder="Mumbai, India" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-black/50 ml-1">Category</label>
                                            <select value={bizCategory} onChange={e => setBizCategory(e.target.value)} className={`${inputClass} appearance-none cursor-pointer bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;utf8,<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>')]`}>
                                                <option value="">Select category...</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-black/50 ml-1">Short Description (Agent Persona)</label>
                                            <textarea rows={4} value={bizDescription} onChange={e => setBizDescription(e.target.value)} className={`${inputClass} resize-none`} placeholder="A cozy local cafe serving artisanal coffee and fresh baked pastries daily..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Feature Builder */}
                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Feature Configuration</h2>
                                    <p className="text-sm text-black/60 font-medium">Activate features by dragging them to the active zone, or tap to toggle.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Available */}
                                    <div className="bg-[#F5F1E8]/50 p-5 rounded-[20px] border border-black/5">
                                        <div className="flex items-center gap-2 mb-4 pl-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-black/30" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-black/50">Available Plugins</p>
                                        </div>
                                        <div className="space-y-3">
                                            {availableFeatures.map(f => (
                                                <div
                                                    key={f.id}
                                                    draggable={!f.disabled}
                                                    onDragStart={() => !f.disabled && handleDragStart(f.id)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => !f.disabled && toggleFeature(f.id)}
                                                    className={`rounded-[16px] p-4 border transition-all select-none ${f.disabled
                                                        ? 'opacity-50 cursor-not-allowed bg-black/[0.02] border-black/5'
                                                        : 'cursor-grab active:cursor-grabbing bg-white border-black/5 shadow-sm hover:shadow-md hover:border-black/10'
                                                        } ${draggedFeature === f.id ? 'opacity-40 scale-[0.98]' : ''}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-[#f0f9f4] flex items-center justify-center text-xl shrink-0">
                                                            {f.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate text-black">{f.name}</p>
                                                            <p className="text-xs mt-0.5 text-black/50 font-medium leading-snug">{f.comingSoon ? 'Coming soon' : f.description}</p>
                                                        </div>
                                                        {!f.disabled && (
                                                            <div className="text-black/20 group-hover:text-black/50 transition-colors">
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {availableFeatures.length === 0 && (
                                                <div className="py-10 text-center">
                                                    <span className="text-3xl mb-2 block">✨</span>
                                                    <p className="text-sm font-bold text-black/50">All power-ups active!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-4 pl-1">
                                            <div className="w-2 h-2 rounded-full bg-[#0D4F31] animate-[pulse_2s_ease-in-out_infinite]" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#0D4F31]">Active Intelligence</p>
                                        </div>
                                        <div
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={handleDropToActive}
                                            className={`flex-1 min-h-[300px] rounded-[20px] border-2 border-dashed p-4 transition-all duration-300 space-y-3
                                                ${draggedFeature ? 'border-[#0D4F31]/30 bg-[#f0f9f4] scale-[1.02]' : 'border-[#0D4F31]/15 bg-white'}`}
                                        >
                                            {activeFeatures.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-40">
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-black"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                                    <p className="text-sm font-bold">Drop features here</p>
                                                    <p className="text-xs mt-1">Target zone for activating agent skills</p>
                                                </div>
                                            )}
                                            {activeFeatures.map(f => (
                                                <div
                                                    key={f.id}
                                                    className="rounded-[16px] p-4 bg-white border border-[#0D4F31]/20 shadow-[0_4px_12px_rgba(13,79,49,0.06)] relative group"
                                                >
                                                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#0D4F31] rounded-l-[16px]"></div>
                                                    <div className="flex items-center gap-4 pl-2">
                                                        <div className="w-10 h-10 rounded-full bg-[#f0f9f4] flex items-center justify-center text-xl shrink-0">
                                                            {f.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold truncate text-black">{f.name}</p>
                                                            <p className="text-xs mt-0.5 text-black/50 font-medium leading-snug">{f.description}</p>
                                                        </div>
                                                        <button onClick={() => toggleFeature(f.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 hover:scale-105 shrink-0">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Telegram Bot Connection */}
                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div>
                                    <h2 className="text-xl font-bold mb-2">Deploy via Telegram</h2>
                                    <p className="text-sm text-black/60 font-medium max-w-xl">Link a Telegram Bot to give your AI an interface to start chatting with your customers.</p>
                                </div>

                                {/* Connected status */}
                                {(botUsername || initialProject?.telegram_bot_username || initialProject?.telegram_token) && (
                                    <div className="rounded-[16px] p-6 border border-[#0D4F31]/20 bg-[#f0f9f4]">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl bg-white shadow-sm border border-[#0D4F31]/10 shrink-0">
                                                🤖
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-base text-[#0D4F31]">
                                                    Bot Verified & Ready
                                                </p>
                                                <p className="text-sm mt-1 text-[#0D4F31]/80 font-medium">
                                                    {(botUsername || initialProject?.telegram_bot_username)
                                                        ? <>Your audience can interact at <a href={`https://t.me/${botUsername || initialProject?.telegram_bot_username}`} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-[#0D4F31]">@{botUsername || initialProject?.telegram_bot_username}</a></>
                                                        : 'Bot token is saved. Click Activate to go live.'}
                                                </p>
                                            </div>
                                            <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-white text-[#0D4F31] shadow-sm shrink-0 border border-[#0D4F31]/10 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#0D4F31] animate-[pulse_2s_ease-in-out_infinite]" />
                                                Live Status
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 bg-[#F5F1E8]/30 rounded-[20px] p-6 border border-black/5">
                                    {/* Instructions Block */}
                                    <div className="md:col-span-3">
                                        <p className="font-bold text-xs uppercase tracking-widest text-black/50 mb-5 ml-1">📱 3-Step Setup Guide</p>
                                        <div className="space-y-5 text-black/70 text-sm font-medium">
                                            <div className="flex items-start gap-4">
                                                <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white shadow-sm border border-black/5 text-[#0D4F31]">1</span>
                                                <p className="mt-1.5 leading-relaxed">Open <strong>Telegram</strong> on your device and search for <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-bold text-[#0D4F31] hover:underline">@BotFather</a></p>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white shadow-sm border border-black/5 text-[#0D4F31]">2</span>
                                                <p className="mt-1.5 leading-relaxed">Send <code className="px-1.5 py-0.5 rounded bg-white border border-black/10 font-mono text-xs">/newbot</code>, give it a name, and choose a username ending in <code className="font-mono text-xs">bot</code>.</p>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-white shadow-sm border border-black/5 text-[#0D4F31]">3</span>
                                                <p className="mt-1.5 leading-relaxed">Copy the <strong>HTTP API Token</strong> provided by BotFather.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Block */}
                                    <div className="md:col-span-2 flex flex-col justify-center">
                                        <div className="bg-white p-5 rounded-[16px] border border-black/5 shadow-sm">
                                            <label className="block text-[11px] font-bold uppercase tracking-widest mb-3 text-black/50">HTTP API Token</label>
                                            <input
                                                type="text"
                                                value={telegramToken}
                                                onChange={e => { setTelegramToken(e.target.value); setTokenError(''); setBotUsername(''); }}
                                                className={`${inputClass} font-mono text-xs`}
                                                placeholder="123456:ABC-DEF1234ghIkl-zyx..."
                                            />
                                            {tokenError && <p className="mt-3 text-xs text-red-500 font-bold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{tokenError}</p>}

                                            {validatingToken && (
                                                <div className="mt-3 flex items-center gap-3 text-xs font-bold text-[#0D4F31] uppercase tracking-wider bg-[#0D4F31]/5 px-4 py-3 rounded-xl border border-[#0D4F31]/10">
                                                    <svg className="animate-spin h-4 w-4 text-[#0D4F31]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Verifying Token...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Navigation */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between mt-10 w-full max-w-4xl gap-4">
                        <div className="w-full sm:w-auto">
                            {step > 1 && (
                                <button onClick={goBack} className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold bg-white text-black border border-black/10 hover:bg-black/5 transition-all shadow-sm">
                                    ← Go Back
                                </button>
                            )}
                        </div>

                        <div className="w-full sm:w-auto">
                            {step < 3 ? (
                                <button onClick={goNext} className="w-full sm:w-auto px-10 py-3.5 rounded-full text-sm font-bold bg-[#050505] text-white hover:bg-black/80 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5">
                                    Continue →
                                </button>
                            ) : (
                                <button onClick={handleActivate} disabled={activating || validatingToken} className="w-full sm:w-auto px-10 py-3.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0D4F31] text-white hover:bg-[#0a3c25] shadow-[0_8px_24px_rgba(13,79,49,0.25)] hover:shadow-[0_12px_32px_rgba(13,79,49,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                    {activating ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Activating AI...
                                        </>
                                    ) : '🚀 Activate & Deploy Agent'}
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
