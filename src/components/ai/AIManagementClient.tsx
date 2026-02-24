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

    const enabledFeatures = PREBUILT_FEATURES.filter(f => (project.enabled_features || []).includes(f.id));

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const totalMessages = conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0);

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F5F1E8] text-[#050505] font-sans">
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Nav — Logo icon + avatar */}
                <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 transition-transform hover:scale-105">
                        <Image src="/logo.png" alt="Fitexa" width={36} height={36} className="rounded-lg shadow-sm" unoptimized />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="focus:outline-none group">
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 transition-all border-black/5 group-hover:border-black/15 shadow-sm" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-black/5 text-black border border-black/10">
                                        {fullName.charAt(0)}
                                    </div>
                                )}
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-lg z-50 animate-dd bg-white border border-black/5">
                                    <div className="px-4 py-3 border-b border-black/5 bg-black/[0.02]">
                                        <p className="font-bold text-sm truncate">{fullName}</p>
                                        <p className="text-xs text-black/50 truncate mt-0.5">{email}</p>
                                    </div>
                                    <div className="py-2">
                                        <button className="w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5">Settings</button>
                                    </div>
                                    <div className="border-t border-black/5">
                                        <form action="/auth/sign-out" method="post">
                                            <button className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50">Logout</button>
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
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-[900] tracking-tight">{project.ai_name}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${project.status === 'active'
                                    ? 'bg-[#e6f7ec] text-[#0D4F31] border border-[#0D4F31]/10'
                                    : 'bg-black/5 text-black/50 border border-black/5'}`}>
                                    {project.status === 'active' ? '● Live' : 'Draft'}
                                </span>
                            </div>
                            <p className="text-sm text-black/50 font-medium">Deployed since {formatDate(project.created_at)}</p>
                        </div>
                        <button
                            onClick={() => router.push(`/builder/${project.id}`)}
                            className="px-6 py-3 rounded-full text-sm font-bold transition-all border border-black/10 text-black hover:bg-black/5 hover:border-black/20 shadow-sm whitespace-nowrap"
                        >
                            Configure Agent
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-black/40">Active Skills</p>
                            <p className="text-4xl font-[900] text-[#050505]">{enabledFeatures.length}</p>
                        </div>
                        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-black/40">Total Chats</p>
                            <p className="text-4xl font-[900] text-[#050505]">{conversations.length}</p>
                        </div>
                        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-black/40">Messages Processed</p>
                            <p className="text-4xl font-[900] text-[#0D4F31]">{totalMessages}</p>
                        </div>
                        <div className={`bg-white rounded-[24px] border border-black/5 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden`}>
                            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-black/40 relative z-10">Status</p>
                            <p className={`text-4xl font-[900] relative z-10 ${project.status === 'active' ? 'text-[#0D4F31]' : 'text-black/30'}`}>
                                {project.status === 'active' ? 'Online' : 'Offline'}
                            </p>
                            {project.status === 'active' && (
                                <div className="absolute right-[-10%] bottom-[-20%] w-32 h-32 bg-[#0D4F31]/5 rounded-full blur-2xl" />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Telegram Bot Info */}
                            <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm">
                                <h2 className="text-xs font-[800] uppercase tracking-widest mb-6 text-black/50">Deployment Target</h2>
                                {project.telegram_bot_username ? (
                                    <div className="flex items-center gap-4 bg-[#f0f9f4] p-4 rounded-[16px] border border-[#0D4F31]/10">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border border-black/5 shrink-0">🤖</div>
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={`https://t.me/${project.telegram_bot_username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-[#0D4F31] hover:underline block truncate"
                                            >
                                                @{project.telegram_bot_username}
                                            </a>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0D4F31] animate-pulse" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D4F31]/60">Connected</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-black/5 border border-black/10 border-dashed rounded-[16px] p-6 text-center">
                                        <p className="text-sm text-black/50 font-medium">No bot connected</p>
                                    </div>
                                )}
                            </div>

                            {/* Business Summary */}
                            <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xs font-[800] uppercase tracking-widest text-black/50">Agent Persona</h2>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Business Name</p>
                                        <p className="text-sm font-bold text-black">{project.business_name || '—'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Category</p>
                                            <p className="text-sm font-medium text-black">{project.business_category || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Location</p>
                                            <p className="text-sm font-medium text-black">{project.business_location || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-[16px] bg-[#F5F1E8]/50 border border-black/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Instructions Context</p>
                                        <p className="text-xs font-medium text-black/70 leading-relaxed italic">&quot;{project.business_description || 'No specific instructions provided.'}&quot;</p>
                                    </div>
                                </div>
                            </div>

                            {/* Enabled Features */}
                            <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm">
                                <h2 className="text-xs font-[800] uppercase tracking-widest mb-5 text-black/50">
                                    Active Skills
                                </h2>
                                {enabledFeatures.length === 0 ? (
                                    <p className="text-sm text-black/40 font-medium pb-2">No skills enabled</p>
                                ) : (
                                    <div className="space-y-3">
                                        {enabledFeatures.map((f, i) => (
                                            <div key={f.id} className="flex items-center gap-4 py-2 border-b border-black/5 last:border-0">
                                                <div className="w-8 h-8 rounded-full bg-[#F5F1E8] flex items-center justify-center text-sm shadow-inner shrink-0">{f.icon}</div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-black">{f.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column — Activity Log */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-sm min-h-full">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
                                    <h2 className="text-xs font-[800] uppercase tracking-widest text-black/50">
                                        Live Activity Log
                                    </h2>
                                    <span className="text-[10px] font-bold bg-[#F5F1E8] text-black/60 px-3 py-1 rounded-full">{conversations.length} Sessions</span>
                                </div>

                                {conversations.length === 0 ? (
                                    <div className="text-center py-24 px-6 opacity-60">
                                        <div className="w-20 h-20 mx-auto bg-[#F5F1E8] rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                                            💬
                                        </div>
                                        <p className="font-bold text-lg mb-2 text-black">Awaiting Incoming Messages</p>
                                        <p className="text-sm text-black/60 max-w-sm mx-auto">Conversations will appear here in real-time once users start chatting with your bot.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {conversations.map(convo => {
                                            const msgs = convo.messages || [];
                                            const lastMsg = msgs[msgs.length - 1];
                                            const isExpanded = expandedConvo === convo.id;

                                            return (
                                                <div key={convo.id} className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-black/10 shadow-md ring-4 ring-black/[0.02]' : 'border-black/5 hover:border-black/10 hover:shadow-sm'}`}>
                                                    <button
                                                        onClick={() => setExpandedConvo(isExpanded ? null : convo.id)}
                                                        className={`w-full text-left p-5 flex items-center justify-between transition-colors ${isExpanded ? 'bg-black/[0.02]' : 'bg-transparent'}`}
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm bg-blue-50 text-blue-600 border border-blue-100 shrink-0 shadow-sm">
                                                                👤
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-baseline gap-2 mb-1">
                                                                    <p className="text-sm font-bold text-black">Session #{convo.chat_id}</p>
                                                                    <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">{formatDate(convo.updated_at)}</span>
                                                                </div>
                                                                {lastMsg && (
                                                                    <p className="text-xs text-black/50 truncate font-medium">
                                                                        {lastMsg.role === 'user' ? 'Client: ' : 'Agent: '}{lastMsg.content}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 shrink-0 ml-4">
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/5 rounded-full">
                                                                <span className="text-[10px] font-bold text-black/60">{msgs.length}</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-widest text-black/40">Msgs</span>
                                                            </div>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-black/5 text-black' : 'bg-transparent text-black/30'}`}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                    <polyline points="6 9 12 15 18 9" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <div className={`transition-all duration-300 grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                        <div className="overflow-hidden">
                                                            <div className="p-6 bg-[#F5F1E8]/30 max-h-[400px] overflow-y-auto border-t border-black/5 flex flex-col gap-4">
                                                                {msgs.map((msg, i) => (
                                                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in-up`} style={{ animationDelay: `${i * 50}ms` }}>
                                                                        <div className="flex flex-col gap-1 max-w-[85%]">
                                                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1 ${msg.role === 'user' ? 'text-black/40' : 'text-[#0D4F31]/60 text-right'}`}>
                                                                                {msg.role === 'user' ? 'Client' : 'AI Agent'}
                                                                            </span>
                                                                            <div className={`px-4 py-3 rounded-[16px] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                                                ? 'bg-white border text-black border-black/5 rounded-tl-sm'
                                                                                : 'bg-[#0D4F31] text-white rounded-tr-sm shadow-[0_4px_12px_rgba(13,79,49,0.15)]'
                                                                                }`}>
                                                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="h-2" /> {/* Bottom padding */}
                                                            </div>
                                                        </div>
                                                    </div>
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
                @keyframes dd {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-dd { animation: dd 0.15s ease-out forwards; }
                
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
}
