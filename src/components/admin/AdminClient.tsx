'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ActivityLog {
    id: string;
    project_id: string;
    action_type: string;
    status: string;
    input_payload: Record<string, unknown>;
    result: Record<string, unknown>;
    created_at: string;
}

interface Project {
    id: string;
    ai_name: string;
    business_name: string;
    business_category: string;
    business_location: string;
    status: string;
    enabled_features: string[];
    telegram_token?: string;
    google_refresh_token?: string;
    created_at: string;
}

interface AdminProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    projects: Project[];
    activityLogs: ActivityLog[];
    llmUsageToday: number;
    actionsToday: number;
}

export default function AdminClient({ user, projects, activityLogs, llmUsageToday, actionsToday }: AdminProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'logs'>('overview');

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalProjects = projects.length;
    const connectedGoogle = projects.filter(p => !!p.google_refresh_token).length;
    const connectedTelegram = projects.filter(p => !!p.telegram_token).length;

    function formatDate(d: string) {
        return new Date(d).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    function statusBadge(status: string) {
        const colors: Record<string, string> = {
            success: '#22c55e',
            failed: '#ef4444',
            rate_limited: '#f59e0b',
            daily_limit_exceeded: '#f59e0b',
            usage_limit_exceeded: '#f97316',
        };
        return colors[status] || '#6b7280';
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
            color: '#e5e5e5',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* Header */}
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 40px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 700, color: '#fff',
                    }}>F</div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                        Fitexa Admin
                    </span>
                    <span style={{
                        fontSize: '11px', padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>Restricted</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#888' }}>{user.email}</span>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                            background: 'transparent', color: '#ccc', fontSize: '13px', cursor: 'pointer',
                        }}
                    >← Dashboard</button>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav style={{
                display: 'flex', gap: '4px', padding: '16px 40px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                {(['overview', 'projects', 'logs'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px', border: 'none', cursor: 'pointer',
                            borderRadius: '8px 8px 0 0', fontSize: '13px', fontWeight: 600,
                            textTransform: 'capitalize',
                            background: activeTab === tab ? 'rgba(34,197,94,0.1)' : 'transparent',
                            color: activeTab === tab ? '#22c55e' : '#888',
                            borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
                            transition: 'all 0.2s',
                        }}
                    >{tab}</button>
                ))}
            </nav>

            <main style={{ padding: '30px 40px', maxWidth: '1200px' }}>

                {/* ── OVERVIEW TAB ── */}
                {activeTab === 'overview' && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
                            System Overview
                        </h2>

                        {/* Stats Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                            {[
                                { label: 'Total Projects', value: totalProjects, color: '#3b82f6' },
                                { label: 'Active Projects', value: activeProjects, color: '#22c55e' },
                                { label: 'Google Connected', value: connectedGoogle, color: '#f59e0b' },
                                { label: 'Telegram Connected', value: connectedTelegram, color: '#06b6d4' },
                                { label: 'LLM Calls (24h)', value: llmUsageToday, color: '#8b5cf6' },
                                { label: 'Actions (24h)', value: actionsToday, color: '#ec4899' },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    padding: '20px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {stat.label}
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Info */}
                        <div style={{
                            padding: '20px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>System Limits</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px', color: '#aaa' }}>
                                <div>Actions per minute: <strong style={{ color: '#fff' }}>5</strong></div>
                                <div>Actions per day: <strong style={{ color: '#fff' }}>100</strong></div>
                                <div>LLM calls per day: <strong style={{ color: '#fff' }}>300</strong></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PROJECTS TAB ── */}
                {activeTab === 'projects' && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
                            All Projects ({totalProjects})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {projects.map(p => (
                                <div key={p.id} style={{
                                    padding: '16px 20px', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                    alignItems: 'center', gap: '12px',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{p.business_name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{p.ai_name} · {p.business_category}</div>
                                    </div>
                                    <div style={{
                                        fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                                        color: p.status === 'active' ? '#22c55e' : '#f59e0b',
                                    }}>{p.status}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>
                                        {p.enabled_features?.length || 0} features
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {formatDate(p.created_at)}
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No projects found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── LOGS TAB ── */}
                {activeTab === 'logs' && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
                            Activity Logs (Last 50)
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activityLogs.map(log => (
                                <div key={log.id} style={{
                                    padding: '14px 20px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'grid', gridTemplateColumns: '140px 180px 120px 1fr',
                                    alignItems: 'center', gap: '12px', fontSize: '13px',
                                }}>
                                    <div style={{ color: '#888' }}>{formatDate(log.created_at)}</div>
                                    <div style={{ color: '#ccc', fontWeight: 500 }}>{log.action_type}</div>
                                    <div>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                            background: `${statusBadge(log.status)}20`,
                                            color: statusBadge(log.status),
                                        }}>{log.status}</span>
                                    </div>
                                    <div style={{ color: '#666', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {typeof log.result === 'object' && log.result && 'message' in log.result
                                            ? String((log.result as Record<string, unknown>).message).substring(0, 80)
                                            : '—'}
                                    </div>
                                </div>
                            ))}
                            {activityLogs.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No activity logs yet.</div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
