'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { AIProject } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClient({ user }: { user: any }) {
    const supabase = createClient();
    const router = useRouter();
    const [projects, setProjects] = useState<AIProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

    useEffect(() => {
        fetchProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
        if (data) setProjects(data);
        setLoading(false);
    };

    const handleCreateProject = async () => {
        setCreating(true);
        const { data, error } = await supabase
            .from('ai_projects')
            .insert({ user_id: user.id, ai_name: 'Untitled AI' })
            .select()
            .single();
        setCreating(false);
        if (error) {
            console.error('Error creating project:', error);
            alert(`Oops! Project creation failed: ${error.message}\n\nPlease make sure you have run the custom SQL migration in your Supabase dashboard to create the ai_projects table.`);
            return;
        }
        if (data && !error) {
            router.push(`/builder/${data.id}`);
        }
    };

    const handleProjectClick = (project: AIProject) => {
        if (project.status === 'active') {
            router.push(`/ai/${project.id}`);
        } else {
            router.push(`/builder/${project.id}`);
        }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const bg = isDarkMode ? 'bg-[#050505] text-[#F5F2EB]' : 'bg-[#F5F2EB] text-[#050505]';
    const muted = isDarkMode ? 'text-white/40' : 'text-black/40';
    const cardBg = isDarkMode
        ? 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
        : 'bg-white/60 border-black/[0.04] hover:border-black/[0.1]';

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#050505]' : 'bg-[#F5F2EB]'}`}>
            <div className={`animate-spin rounded-full h-10 w-10 border-2 border-t-transparent ${isDarkMode ? 'border-white/20' : 'border-black/20'}`} />
        </div>
    );

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${bg} font-sans`}>
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-[-20%] left-[-15%] w-[70vw] h-[70vh] rounded-full blur-[140px] animate-blob ${isDarkMode ? 'bg-[#0D4F31]/25' : 'bg-[#0D4F31]/8'}`} />
                <div className={`absolute bottom-[-25%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] animate-blob animation-delay-2000 ${isDarkMode ? 'bg-[#0D4F31]/15' : 'bg-[#FCDDEC]/25'}`} />
                <div className={`absolute top-[30%] right-[20%] w-[40vw] h-[40vh] rounded-full blur-[100px] animate-blob animation-delay-4000 ${isDarkMode ? 'bg-[#FCDDEC]/[0.03]' : 'bg-[#0D4F31]/5'}`} />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Nav — Logo icon only + avatar */}
                <nav className="flex items-center justify-between px-6 md:px-10 py-5">
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Fitexa" width={36} height={36} className="rounded-lg" unoptimized />
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
                                <div className="py-1.5">
                                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full text-left px-4 py-2 text-sm font-medium flex justify-between items-center transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                        <div className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${isDarkMode ? 'bg-[#86efac] justify-end' : 'bg-black/15 justify-start'}`}>
                                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </button>
                                    <button className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>Settings</button>
                                </div>
                                <div className={`border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                    <form action="/auth/sign-out" method="post">
                                        <button className={`w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 transition-colors ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>Logout</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-grow px-6 md:px-10 lg:px-16 xl:px-24 pt-8 pb-20 max-w-screen-xl mx-auto w-full">
                    {/* Hero */}
                    <div className="mb-14">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-[900] tracking-tight leading-[1.05] mb-5">Control Center</h1>
                        <p className={`text-base md:text-lg font-medium max-w-lg ${muted}`}>Build, configure, and deploy AI agents for your fitness business.</p>
                        <button
                            onClick={handleCreateProject}
                            disabled={creating}
                            className={`mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${isDarkMode ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.08)]' : 'bg-[#050505] text-white hover:bg-gray-800 shadow-[0_0_30px_rgba(0,0,0,0.15)]'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            {creating ? 'Creating...' : 'Make Your Own AI'}
                        </button>
                    </div>

                    {/* Projects */}
                    <section>
                        <h2 className={`text-xs font-[800] uppercase tracking-widest mb-6 ${isDarkMode ? 'text-[#86efac]' : 'text-[#0D4F31]'}`}>Your AI Projects</h2>

                        {projects.length === 0 ? (
                            <div className={`rounded-2xl border-2 border-dashed py-20 flex flex-col items-center justify-center text-center ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                                <div className={`text-4xl mb-4`}>🤖</div>
                                <p className={`font-bold mb-1`}>No projects yet</p>
                                <p className={`text-sm ${muted}`}>Click &quot;Make Your Own AI&quot; to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {projects.map(project => (
                                    <div key={project.id} className={`group rounded-2xl border p-6 transition-all duration-300 backdrop-blur-xl ${cardBg}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-base truncate">{project.ai_name}</h3>
                                                <p className={`text-sm truncate mt-0.5 ${muted}`}>{project.business_name || 'No business set'}</p>
                                            </div>
                                            <span className={`ml-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${project.status === 'active'
                                                ? (isDarkMode ? 'bg-[#86efac]/15 text-[#86efac]' : 'bg-[#0D4F31]/10 text-[#0D4F31]')
                                                : (isDarkMode ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40')}`}>
                                                {project.status === 'active' ? '● Active' : project.status}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] mb-5 ${muted}`}>Updated {formatDate(project.updated_at)}</p>
                                        <button
                                            onClick={() => handleProjectClick(project)}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all border ${isDarkMode
                                                ? 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                                                : 'border-[#0D4F31]/15 text-[#0D4F31]/70 hover:bg-[#0D4F31]/5 hover:text-[#0D4F31]'}`}
                                        >
                                            {project.status === 'active' ? 'Manage' : 'Continue Setup'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
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
