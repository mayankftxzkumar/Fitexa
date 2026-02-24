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
    const [errorToast, setErrorToast] = useState<string | null>(null);
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
            .order('created_at', { ascending: false });
        if (data) setProjects(data);
        setLoading(false);
    };

    const showError = (msg: string) => {
        setErrorToast(msg);
        setTimeout(() => setErrorToast(null), 5000);
    };

    const handleCreateProject = async () => {
        setCreating(true);
        setErrorToast(null);
        try {
            const { data, error } = await supabase
                .from('ai_projects')
                .insert({
                    user_id: user.id,
                    ai_name: 'Untitled AI',
                    status: 'draft',
                    current_step: 1,
                })
                .select('id')
                .single();

            if (error) {
                console.error('Error creating project:', error);
                showError(`Project creation failed: ${error.message}`);
                setCreating(false);
                return;
            }

            if (data?.id) {
                router.push(`/builder/${data.id}`);
                return;
            }

            // Fallback: insert succeeded but select returned null — fetch latest draft
            const { data: fallback } = await supabase
                .from('ai_projects')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'draft')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fallback?.id) {
                router.push(`/builder/${fallback.id}`);
            } else {
                showError('Project was created but could not be loaded. Please refresh.');
            }
        } catch (err) {
            console.error('Unexpected error creating project:', err);
            showError('Something went wrong. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleProjectClick = (project: AIProject) => {
        if (project.status === 'active') {
            router.push(`/ai/${project.id}`);
        } else {
            router.push(`/builder/${project.id}`);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
        const { error } = await supabase
            .from('ai_projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', user.id);
        if (error) {
            showError(`Failed to delete project: ${error.message}`);
        } else {
            setProjects(prev => prev.filter(p => p.id !== projectId));
        }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
            {/* Spinning branded asterisk instead of standard tailwind spinner */}
            <div className="w-12 h-12 flex items-center justify-center animate-spin-slow">
                <span className="text-4xl text-[#0D4F31]">✦</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F5F1E8] text-[#050505]">

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
                </nav>

                {/* Main Content */}
                <main className="flex-grow px-6 md:px-10 pt-12 pb-24 max-w-5xl mx-auto w-full flex flex-col items-center">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-[800] tracking-tight leading-tight mb-4">Control Center</h1>
                        <p className="text-lg text-black/60 font-medium">Manage your AI agents for your business.</p>
                        <button
                            onClick={handleCreateProject}
                            disabled={creating}
                            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white bg-[#0D4F31] hover:bg-[#0a3d26] transition-all disabled:opacity-50 shadow-[0_8px_20px_rgba(13,79,49,0.2)] hover:shadow-[0_12px_24px_rgba(13,79,49,0.3)] hover:-translate-y-0.5"
                        >
                            <span className="text-lg">＋</span>
                            {creating ? 'Creating...' : 'Make Your Own AI'}
                        </button>
                    </div>

                    {/* Projects Group */}
                    <section className="w-full">
                        <div className="flex items-center justify-between mb-8 w-full border-b border-black/10 pb-4">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-black/60">Your AI Projects</h2>
                            <span className="text-xs font-bold bg-black/5 px-3 py-1 rounded-full text-black/60">{projects.length} Total</span>
                        </div>

                        {projects.length === 0 ? (
                            <div className="bg-white rounded-[24px] border border-black/5 py-24 flex flex-col items-center justify-center text-center shadow-sm w-full">
                                <div className="text-5xl mb-4 opacity-80">🤖</div>
                                <p className="font-bold text-lg mb-2">No projects yet</p>
                                <p className="text-sm text-black/50">Click &quot;Make Your Own AI&quot; to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {projects.map(project => (
                                    <div key={project.id} className="group card-soft p-6 flex flex-col hover:-translate-y-1 transition-all duration-300 relative border-b-4 border-transparent hover:border-b-[#0D4F31]/20">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <h3 className="font-bold text-lg truncate mb-1">{project.ai_name}</h3>
                                                <p className="text-sm truncate text-black/50">{project.business_name || 'No business set'}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${project.status === 'active'
                                                ? 'bg-[#e6f7ec] text-[#0D4F31]'
                                                : 'bg-black/5 text-black/60'}`}>
                                                {project.status === 'active' ? 'Live' : 'Draft'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-black/40 mb-6">Updated {formatDate(project.updated_at || project.created_at)}</p>

                                        <div className="mt-auto pt-4 flex items-center gap-3 border-t border-black/5">
                                            <button
                                                onClick={() => handleProjectClick(project)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${project.status === 'active'
                                                    ? 'border-[#0D4F31]/20 text-[#0D4F31] bg-[#0D4F31]/5 hover:bg-[#0D4F31]/10'
                                                    : 'border-black/10 text-black/70 bg-white hover:bg-black/5'}`}
                                            >
                                                {project.status === 'active' ? 'Manage Settings' : 'Continue Setup'}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                title="Delete project"
                                                className="p-2 rounded-lg border border-black/10 text-black/30 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Error Toast */}
            {errorToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-dd">
                    <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border bg-white border-red-200 text-red-700">
                        <span className="text-base text-red-500">⚠️</span>
                        <p className="text-sm font-medium">{errorToast}</p>
                        <button onClick={() => setErrorToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs font-bold text-black/50">✕</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes dd {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-dd { animation: dd 0.15s ease-out forwards; }
            `}</style>
        </div>
    );
}
