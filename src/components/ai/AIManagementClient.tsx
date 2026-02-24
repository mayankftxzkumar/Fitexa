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

    const fullName = user.user_metadata?.full_name || 'User';
    const email = user.email || '';

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const totalMessages = conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0);

    return (
        <div className="min-h-screen bg-[#111111] text-[#E0E0E0] font-sans flex text-sm selection:bg-indigo-500/30">

            {/* ── Left Sidebar ── */}
            <aside className="w-[260px] bg-[#18181A] border-r border-white/5 flex flex-col h-screen shrink-0 relative z-20">
                {/* Profile Header */}
                <div className="p-6">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 shrink-0">
                            F
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-[15px] font-bold text-white truncate leading-tight">Fitexa Workspace</h2>
                            <p className="text-[11px] text-white/40 truncate">{email}</p>
                        </div>
                    </div>
                </div>

                {/* Primary Nav */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    <div className="px-3 pb-2 pt-4">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Main</p>
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
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${item.active ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <svg className={`w-4 h-4 ${item.active ? 'text-indigo-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.badge === 'New' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-white/10 text-white/70'}`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom Nav */}
                <div className="p-4 border-t border-white/5 space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                    </button>
                    <form action="/auth/sign-out" method="post" className="w-full">
                        <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <svg className="w-4 h-4 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Main Dashboard Content ── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#111111]">

                {/* Header Navbar */}
                <header className="h-[72px] flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#111111]">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-white tracking-tight">{project.ai_name}</h1>
                        <span className="text-[10px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-[6px] flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                            {project.status === 'active' ? 'Online' : 'Draft'}
                        </span>
                    </div>

                    <button
                        onClick={() => router.push(`/builder/${project.id}`)}
                        className="h-9 px-4 rounded-lg bg-white/10 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-white/15 transition-colors border border-white/10"
                    >
                        <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                        <div className="flex gap-1 bg-white/5 p-1 rounded-[10px] border border-white/5 inline-flex">
                            <button className="px-5 py-1.5 text-[13px] font-medium text-white bg-white/10 shadow-sm rounded-md border border-white/10">Sessions</button>
                            <button className="px-5 py-1.5 text-[13px] font-medium text-white/40 hover:text-white transition-colors rounded-md">Settings</button>
                        </div>
                        <div className="relative w-64">
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search conversations"
                                className="w-full h-9 bg-[#18181A] border border-white/10 rounded-lg pl-9 pr-3 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans"
                            />
                        </div>
                    </div>

                    {/* Data List (Rows) */}
                    <div className="bg-[#18181A] border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-xl">
                        {conversations.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-white/20">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-white font-medium mb-1">No chats yet</p>
                                <p className="text-white/40 text-[13px] max-w-sm mx-auto">Sessions will automatically populate here exactly mapping to the live interactions.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {conversations.map((convo) => {
                                    const msgs = convo.messages || [];
                                    const isExpanded = expandedConvo === convo.id;
                                    const lastMsg = msgs[msgs.length - 1];

                                    return (
                                        <div key={convo.id} className="group">
                                            {/* Minimal Sleek Row */}
                                            <button
                                                onClick={() => setExpandedConvo(isExpanded ? null : convo.id)}
                                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-black shadow-inner shrink-0 text-[18px]">
                                                        t.
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[14px] font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">Session: {convo.chat_id}</span>
                                                            <svg className="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[12px] text-white/40">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                            <span>{project.telegram_bot_username ? `@${project.telegram_bot_username}` : 'Platform'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-white/20 mx-1" />
                                                            <span>{formatDate(convo.updated_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 shrink-0">
                                                    <p className="text-[13px] text-white/40 hidden md:block max-w-[240px] truncate group-hover:text-white/60 transition-colors">
                                                        {lastMsg ? lastMsg.content : 'No content'}
                                                    </p>
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-[8px]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        <span className="text-[12px] font-bold text-emerald-400 tracking-wide">{msgs.length} msgs</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded Detailed View */}
                                            {isExpanded && (
                                                <div className="border-t border-white/5 bg-[#111111]/30">
                                                    <div className="px-6 py-4 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                                        {msgs.map((msg, i) => (
                                                            <div key={i} className={`flex max-w-[80%] ${msg.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end flex-row-reverse'}`}>
                                                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'mr-3 bg-white/5 text-white/40' : 'ml-3 bg-indigo-500/20 text-indigo-400'}`}>
                                                                    {msg.role === 'user' ? 'U' : 'A'}
                                                                </div>
                                                                <div className={`px-4 py-2.5 rounded-xl text-[13px] leading-relaxed break-words shadow-sm ${msg.role === 'user'
                                                                        ? 'bg-white/5 text-white/80 border border-white/10 rounded-tl-sm'
                                                                        : 'bg-indigo-500 text-white rounded-tr-sm'
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

                    {/* Dashboard Charts Bottom Area (Mock mapping) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Area Chart UI Mock (Replicating exact look) */}
                        <div className="lg:col-span-2 bg-[#18181A] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[280px]">
                            {/* Chart Header */}
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-white/60 text-[13px] font-medium tracking-wide">Total Interactions</h3>
                                    <span className="text-white font-bold text-xl">{totalMessages}</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border border-white/5">
                                    {['1d', '1w', '1m', '6m', '1y'].map(d => (
                                        <button key={d} className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded ${d === '1w' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}>{d}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Mock SVG Line Chart */}
                            <div className="relative w-full h-full flex-1 min-h-[140px] z-10">
                                <svg preserveAspectRatio="none" viewBox="0 0 100 100" className="absolute inset-0 w-full h-full stroke-indigo-500" fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,80 Q10,75 20,40 T40,60 T60,20 T80,50 T100,30 V100 H0 Z" fill="url(#chartGradient)" stroke="none" />
                                    <path d="M0,80 Q10,75 20,40 T40,60 T60,20 T80,50 T100,30" className="vector-path" />

                                    {/* Focus Dot */}
                                    <circle cx="60" cy="20" r="3" fill="#18181A" stroke="#6366f1" strokeWidth="2" />
                                </svg>

                                {/* X-Axis Labels */}
                                <div className="absolute -bottom-2 inset-x-0 flex justify-between px-2 text-[10px] text-white/20 font-bold uppercase">
                                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart UI Mock */}
                        <div className="lg:col-span-1 bg-[#18181A] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5">
                                <div className="flex gap-4">
                                    <button className="text-[13px] font-semibold text-white">Metrics</button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                {/* Bar 1 */}
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                                    </div>
                                    <div className="flex-1 bg-white/5 h-6 rounded-r-full overflow-hidden flex shadow-inner">
                                        <div className="h-full bg-indigo-400 w-[85%] rounded-r-full flex items-center pl-3">
                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Target</span>
                                        </div>
                                    </div>
                                    <span className="text-white/80 font-bold text-[13px] w-8 text-right">85</span>
                                </div>

                                {/* Bar 2 */}
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                                    </div>
                                    <div className="flex-1 bg-white/5 h-6 rounded-r-full overflow-hidden flex shadow-inner">
                                        <div className="h-full bg-indigo-500/80 w-[60%] rounded-r-full flex items-center pl-3">
                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase truncate max-w-full">Engagement</span>
                                        </div>
                                    </div>
                                    <span className="text-white/80 font-bold text-[13px] w-8 text-right">60</span>
                                </div>

                                {/* Bar 3 */}
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                                    </div>
                                    <div className="flex-1 bg-white/5 h-6 rounded-r-full overflow-hidden flex shadow-inner">
                                        <div className="h-full bg-indigo-500/50 w-[35%] rounded-r-full flex items-center pl-3">
                                            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Lost</span>
                                        </div>
                                    </div>
                                    <span className="text-white/80 font-bold text-[13px] w-8 text-right">35</span>
                                </div>
                            </div>
                        </div>
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
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                .vector-path {
                    stroke-dasharray: 200;
                    stroke-dashoffset: 200;
                    animation: drawPath 3s ease-out forwards;
                }
                @keyframes drawPath {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
}
