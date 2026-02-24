'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { AIProject } from '@/lib/types';

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
    const [expandedConvo, setExpandedConvo] = useState<string | null>(null);

    const email = user.email || '';

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-[#F5F1E8] text-[#050505] font-sans flex text-sm selection:bg-[#0D4F31]/20">

            {/* ── Left Sidebar ── */}
            <aside className="w-[260px] bg-white border-r border-black/5 flex flex-col h-screen shrink-0 relative z-20">
                {/* Profile Header */}
                <div className="p-6">
                    <div className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/dashboard')}>
                        <div className="w-10 h-10 bg-[#0D4F31] rounded-lg flex items-center justify-center shadow-md shrink-0">
                            <Image src="/logo.png" alt="Fitexa" width={24} height={24} className="rounded-sm filter brightness-0 invert" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[15px] font-bold text-[#050505] truncate leading-tight">Fitexa Workspace</h2>
                            <p className="text-[11px] text-black/50 truncate">{email}</p>
                        </div>
                    </div>
                </div>

                {/* Primary Nav */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <div className="px-3 pb-2 pt-4">
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Main</p>
                    </div>
                    {[
                        { name: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', active: false },
                        { name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', active: false },
                        { name: 'Customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', badge: conversations.length.toString(), active: false },
                        { name: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', active: true },
                        { name: 'Partners', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', badge: 'New', active: false },
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => item.name === 'Home' ? router.push('/dashboard') : null}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${item.active ? 'bg-[#0D4F31]/5 text-[#0D4F31] shadow-[0_1px_3px_rgba(13,79,49,0.05)] ring-1 ring-[#0D4F31]/10' : 'text-black/60 hover:text-black hover:bg-black/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <svg className={`w-4 h-4 ${item.active ? 'text-[#0D4F31]' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                <span className="font-semibold">{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.badge === 'New' ? 'bg-[#e6f7ec] text-[#0D4F31] ring-1 ring-[#0D4F31]/20' : 'bg-black/5 text-black/60'}`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom Nav */}
                <div className="p-4 border-t border-black/5 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-black/60 hover:text-black hover:bg-black/5 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">Settings</span>
                    </button>
                    <form action="/auth/sign-out" method="post" className="w-full">
                        <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 text-red-600/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-semibold">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Main Dashboard Content ── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F5F1E8]">

                {/* Header Navbar */}
                <header className="h-[72px] flex items-center justify-between px-8 border-b border-black/5 shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-[800] text-[#050505] tracking-tight">{project.ai_name}</h1>
                        <span className="text-[10px] bg-[#F5F1E8] border border-black/5 text-black/60 font-bold px-2.5 py-1.5 rounded-[8px] flex items-center gap-1.5 uppercase tracking-widest">
                            <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'active' ? 'bg-[#0D4F31]' : 'bg-amber-500'}`} />
                            {project.status === 'active' ? 'Online' : 'Draft'}
                        </span>
                    </div>

                    <button
                        onClick={() => router.push(`/builder/${project.id}`)}
                        className="h-10 px-5 rounded-[12px] bg-[#0D4F31] text-white text-[13px] font-bold flex items-center gap-2 hover:bg-[#0a3d26] transition-all shadow-[0_4px_12px_rgba(13,79,49,0.15)] hover:shadow-[0_6px_16px_rgba(13,79,49,0.2)]"
                    >
                        <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configure Agent
                    </button>
                </header>

                {/* Main Scrollable Layout */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {/* Top Stats Filters Mock Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-1 bg-white p-1 rounded-[12px] border border-black/5 inline-flex shadow-sm">
                            <button className="px-5 py-2 text-[13px] font-bold text-[#0D4F31] bg-[#e6f7ec] shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-[8px] border border-[#0D4F31]/10">Sessions</button>
                            <button className="px-5 py-2 text-[13px] font-semibold text-black/50 hover:text-black hover:bg-black/[0.02] transition-colors rounded-[8px]">Settings</button>
                        </div>
                        <div className="relative w-72">
                            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full h-11 bg-white border border-black/10 rounded-[12px] pl-10 pr-4 text-[13px] text-black font-medium placeholder-black/30 focus:outline-none focus:border-[#0D4F31]/30 focus:ring-4 focus:ring-[#0D4F31]/5 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Data List (Rows) */}
                    <div className="bg-white border border-black/5 rounded-[24px] overflow-hidden mb-6 shadow-sm">

                        <div className="px-6 py-4 border-b border-black/5 bg-[#faf9f6]">
                            <h2 className="text-[11px] font-[800] uppercase tracking-widest text-black/40">Communications Log</h2>
                        </div>

                        {conversations.length === 0 ? (
                            <div className="py-32 text-center">
                                <div className="w-20 h-20 mx-auto bg-[#F5F1E8] rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner text-black/20">
                                    💬
                                </div>
                                <p className="text-xl font-[800] text-[#050505] mb-2 tracking-tight">No chats yet</p>
                                <p className="text-black/50 text-[14px] font-medium max-w-sm mx-auto leading-relaxed">Incoming customer messages will automatically populate here in real-time.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-black/5">
                                {conversations.map((convo) => {
                                    const msgs = convo.messages || [];
                                    const isExpanded = expandedConvo === convo.id;
                                    const lastMsg = msgs[msgs.length - 1];

                                    return (
                                        <div key={convo.id} className="group transition-all">
                                            {/* Minimal Sleek Row */}
                                            <button
                                                onClick={() => setExpandedConvo(isExpanded ? null : convo.id)}
                                                className={`w-full flex items-center justify-between px-6 py-5 transition-colors ${isExpanded ? 'bg-black/[0.02]' : 'hover:bg-black/[0.01]'}`}
                                            >
                                                <div className="flex items-center gap-5 min-w-0">
                                                    <div className="w-12 h-12 rounded-full bg-[#f0f9f4] border border-[#0D4F31]/10 text-xl flex items-center justify-center shadow-inner shrink-0">
                                                        👤
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[15px] font-[800] text-black truncate tracking-tight">Session #{convo.chat_id}</span>
                                                            {isExpanded && (
                                                                <span className="bg-[#0D4F31]/10 text-[#0D4F31] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest">Viewing</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[12px] font-medium text-black/50">
                                                            <span>{project.telegram_bot_username ? `@${project.telegram_bot_username}` : 'Platform'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-black/20 mx-1" />
                                                            <span>{formatDate(convo.updated_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 shrink-0">
                                                    <p className="text-[14px] font-medium text-black/50 hidden md:block max-w-[280px] truncate">
                                                        {lastMsg ? lastMsg.content : 'Started chat...'}
                                                    </p>
                                                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F5F1E8] border border-black/5 rounded-[10px]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#0D4F31]" />
                                                        <span className="text-[12px] font-[800] text-[#050505] tracking-wide">{msgs.length} msgs</span>
                                                    </div>

                                                    {/* Arrow toggle */}
                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isExpanded ? 'border-black/10 bg-black/5 text-black' : 'border-transparent text-black/30 group-hover:bg-black/5 group-hover:text-black/60'}`}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded Detailed View */}
                                            {isExpanded && (
                                                <div className="border-t border-black/5 bg-[#F5F1E8]/50 shadow-inner">
                                                    <div className="px-6 py-6 max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4">
                                                        {msgs.map((msg, i) => (
                                                            <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end flex-row-reverse'}`}>
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'mr-3 bg-white border border-black/5 text-black/50 shadow-sm text-xs font-bold' : 'ml-3 bg-[#0D4F31] text-white shadow-md text-xs font-bold'}`}>
                                                                    {msg.role === 'user' ? 'U' : 'AI'}
                                                                </div>
                                                                <div className={`px-5 py-3.5 rounded-[16px] text-[14px] leading-relaxed break-words shadow-sm font-medium ${msg.role === 'user'
                                                                        ? 'bg-white text-black border border-black/5 rounded-tl-sm'
                                                                        : 'bg-[#0D4F31] text-white rounded-tr-sm shadow-[0_4px_12px_rgba(13,79,49,0.15)]'
                                                                    }`}>
                                                                    {msg.content}
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
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}
