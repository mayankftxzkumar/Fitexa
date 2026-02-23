'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { AIProject } from '@/lib/types';
import { PREBUILT_FEATURES } from '@/lib/types';

interface Conversation {
    id: string;
    project_id: string;
    chat_id: number;
    messages: Array<{ role: string; content: string }>;
    created_at: string;
    updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AIManagementClient({ user, project, conversations }: { user: any; project: AIProject; conversations: Conversation[] }) {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [expandedConvo, setExpandedConvo] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fullName = user.user_metadata?.full_name || 'User';
    const avatarUrl = user.user_metadata?.avatar_url || null;
    const email = user.email || '';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const bg = isDarkMode ? 'bg-[#050505] text-[#F5F2EB]' : 'bg-[#F5F2EB] text-[#050505]';
    const muted = isDarkMode ? 'text-white/40' : 'text-black/40';
    const cardBg = isDarkMode
        ? 'bg-white/[0.03] border-white/[0.06]'
        : 'bg-white/60 border-black/[0.04]';

    const enabledFeatures = PREBUILT_FEATURES.filter(f => (project.enabled_features || []).includes(f.id));

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const totalMessages = conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0);

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${bg} font-sans`}>
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-20%] left-[-15%] w-[70vw] h-[70vh] rounded-full blur-[140px] animate-blob ${isDarkMode ? 'bg-[#0D4F31]/25' : 'bg-[#0D4F31]/8'}`} />
                <div className={`absolute bottom-[-25%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] animate-blob animation-delay-2000 ${isDarkMode ? 'bg-[#0D4F31]/15' : 'bg-[#FCDDEC]/25'}`} />
                <div className={`absolute top-[30%] right-[20%] w-[40vw] h-[40vh] rounded-full blur-[100px] animate-blob animation-delay-4000 ${isDarkMode ? 'bg-[#FCDDEC]/[0.03]' : 'bg-[#0D4F31]/5'}`} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Nav — Logo icon + avatar */}
                <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Fitexa" width={36} height={36} className="rounded-lg" unoptimized />
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="focus:outline-none group">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarUrl} alt="" className={`w-9 h-9 rounded-full object-cover border-2 transition-all ${isDarkMode ? 'border-white/10 group-hover:border-white/25' : 'border-black/5 group-hover:border-black/15'}`} />
                                ) : (
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                                        {fullName.charAt(0)}
                                    </div>
                                )}
                            </button>
                            {isDropdownOpen && (
                                <div className={`absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden border shadow-2xl z-50 animate-dd ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-black/5'}`}>
                                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                        <p className="font-bold text-sm truncate">{fullName}</p>
                                        <p className={`text-[11px] truncate mt-0.5 ${muted}`}>{email}</p>
                                    </div>
                                    <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                        <form action="/auth/sign-out" method="post">
                                            <button className={`w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 transition-colors ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>Logout</button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-grow px-6 md:px-10 lg:px-16 xl:px-24 pt-8 pb-20 max-w-screen-xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-[900] tracking-tight">{project.ai_name}</h1>
                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${project.status === 'active'
                                    ? (isDarkMode ? 'bg-[#86efac]/15 text-[#86efac]' : 'bg-[#0D4F31]/10 text-[#0D4F31]')
                                    : (isDarkMode ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40')}`}>
                                    {project.status === 'active' ? '● Active' : 'Draft'}
                                </span>
                            </div>
                            <p className={`text-sm ${muted}`}>Created {formatDate(project.created_at)}</p>
                        </div>
                        <button
                            onClick={() => router.push(`/builder/${project.id}`)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${isDarkMode ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-[#0D4F31]/15 text-[#0D4F31]/60 hover:bg-[#0D4F31]/5 hover:text-[#0D4F31]'}`}
                        >
                            Edit Configuration
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className={`rounded-2xl border p-5 ${cardBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Features</p>
                            <p className="text-2xl font-[900]">{enabledFeatures.length}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${cardBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Conversations</p>
                            <p className="text-2xl font-[900]">{conversations.length}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${cardBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Messages</p>
                            <p className="text-2xl font-[900]">{totalMessages}</p>
                        </div>
                        <div className={`rounded-2xl border p-5 ${cardBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Status</p>
                            <p className={`text-2xl font-[900] ${project.status === 'active' ? (isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]') : ''}`}>
                                {project.status === 'active' ? 'Live' : 'Draft'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Business Summary */}
                            <div className={`rounded-2xl border p-6 ${cardBg}`}>
                                <h2 className={`text-xs font-[800] uppercase tracking-widest mb-5 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>Business Summary</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Name</p>
                                        <p className="text-sm font-bold mt-1">{project.business_name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Location</p>
                                        <p className="text-sm font-medium mt-1">{project.business_location || '—'}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Category</p>
                                        <p className="text-sm font-medium mt-1">{project.business_category || '—'}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Description</p>
                                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{project.business_description || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Telegram Bot Info */}
                            <div className={`rounded-2xl border p-6 ${cardBg}`}>
                                <h2 className={`text-xs font-[800] uppercase tracking-widest mb-5 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>Telegram Bot</h2>
                                {project.telegram_bot_username ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-500/10'}`}>🤖</div>
                                            <div>
                                                <a
                                                    href={`https://t.me/${project.telegram_bot_username}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`text-sm font-bold hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                                >
                                                    @{project.telegram_bot_username}
                                                </a>
                                                <p className={`text-[11px] ${muted}`}>Connected & receiving messages</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-sm ${muted}`}>No bot connected</p>
                                )}
                            </div>

                            {/* Enabled Features */}
                            <div className={`rounded-2xl border p-6 ${cardBg}`}>
                                <h2 className={`text-xs font-[800] uppercase tracking-widest mb-5 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>
                                    Enabled Features
                                </h2>
                                {enabledFeatures.length === 0 ? (
                                    <p className={`text-sm ${muted}`}>No features enabled</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {enabledFeatures.map(f => (
                                            <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                                                <span className="text-lg">{f.icon}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate">{f.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column — Activity Log */}
                        <div className="lg:col-span-2">
                            <div className={`rounded-2xl border p-6 ${cardBg}`}>
                                <h2 className={`text-xs font-[800] uppercase tracking-widest mb-5 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>
                                    Conversation Activity
                                </h2>

                                {conversations.length === 0 ? (
                                    <div className={`text-center py-16 ${muted}`}>
                                        <p className="text-4xl mb-4">💬</p>
                                        <p className="font-bold mb-1">No conversations yet</p>
                                        <p className="text-sm">Messages will appear here once users start chatting with your bot.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {conversations.map(convo => {
                                            const msgs = convo.messages || [];
                                            const lastMsg = msgs[msgs.length - 1];
                                            const isExpanded = expandedConvo === convo.id;

                                            return (
                                                <div key={convo.id} className={`rounded-xl border transition-all ${isDarkMode ? 'border-white/[0.06] hover:border-white/[0.12]' : 'border-black/[0.04] hover:border-black/[0.1]'}`}>
                                                    <button
                                                        onClick={() => setExpandedConvo(isExpanded ? null : convo.id)}
                                                        className="w-full text-left p-4 flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isDarkMode ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}>
                                                                💬
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-bold">Chat #{convo.chat_id}</p>
                                                                {lastMsg && (
                                                                    <p className={`text-[11px] truncate ${muted}`}>
                                                                        {lastMsg.role === 'user' ? '👤 ' : '🤖 '}{lastMsg.content.substring(0, 80)}{lastMsg.content.length > 80 ? '...' : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                                            <span className={`text-[10px] font-medium ${muted}`}>{msgs.length} msgs</span>
                                                            <span className={`text-[10px] ${muted}`}>{formatDate(convo.updated_at)}</span>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${muted}`}>
                                                                <polyline points="6 9 12 15 18 9" />
                                                            </svg>
                                                        </div>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className={`px-4 pb-4 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                                            <div className="space-y-2 pt-3 max-h-80 overflow-y-auto">
                                                                {msgs.map((msg, i) => (
                                                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                                                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm ${msg.role === 'user'
                                                                            ? (isDarkMode ? 'bg-white/5 text-white/80' : 'bg-black/5 text-black/80')
                                                                            : (isDarkMode ? 'bg-[#0D4F31]/30 text-[#86efac]' : 'bg-[#0D4F31]/10 text-[#0D4F31]')
                                                                            }`}>
                                                                            <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${muted}`}>
                                                                                {msg.role === 'user' ? '👤 User' : '🤖 AI'}
                                                                            </p>
                                                                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
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
                .animation-delay-4000 { animation-delay: 4s; }
                @keyframes dd {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-dd { animation: dd 0.15s ease-out forwards; }
            `}</style>
        </div>
    );
}
