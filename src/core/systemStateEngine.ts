/**
 * System State Engine
 * Provides real-time system awareness — fetches integration status,
 * usage metrics, and feature flags from the database.
 * Never calls LLM. All responses are DB-driven.
 * Fail-safe: returns safe defaults on any DB error.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import type { SystemState } from '@/lib/types';

const DAILY_LIMIT = 100;
const MINUTE_LIMIT = 5;

// ────────────────────────────────────────────────────────
// Get full system state for a project
// ────────────────────────────────────────────────────────
export async function getSystemState(projectId: string): Promise<SystemState> {
    const defaults: SystemState = {
        googleConnected: false,
        telegramConnected: false,
        enabledFeatures: [],
        actionsUsedToday: 0,
        actionsRemainingToday: DAILY_LIMIT,
        minuteUsage: 0,
        minuteRemaining: MINUTE_LIMIT,
        pendingActions: 0,
        status: 'draft',
    };

    try {
        const supabase = createAdminClient();

        // ── 1. Fetch project record ──
        const { data: project, error: projErr } = await supabase
            .from('ai_projects')
            .select('status, enabled_features, telegram_token, google_refresh_token, google_location_id')
            .eq('id', projectId)
            .single();

        if (projErr || !project) {
            console.warn('[SYS-STATE] Project not found:', projErr?.message);
            return defaults;
        }

        const state: SystemState = {
            googleConnected: !!project.google_refresh_token,
            telegramConnected: !!project.telegram_token,
            enabledFeatures: project.enabled_features || [],
            actionsUsedToday: 0,
            actionsRemainingToday: DAILY_LIMIT,
            minuteUsage: 0,
            minuteRemaining: MINUTE_LIMIT,
            pendingActions: 0,
            status: project.status || 'draft',
        };

        // ── 2. Daily usage (last 24h from ai_rate_limits) ──
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: dailyCount, error: dailyErr } = await supabase
            .from('ai_rate_limits')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', twentyFourHoursAgo);

        if (!dailyErr && dailyCount !== null) {
            state.actionsUsedToday = dailyCount;
            state.actionsRemainingToday = Math.max(0, DAILY_LIMIT - dailyCount);
        }

        // ── 3. Minute usage (last 60s from ai_rate_limits) ──
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { count: minuteCount, error: minuteErr } = await supabase
            .from('ai_rate_limits')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', oneMinuteAgo);

        if (!minuteErr && minuteCount !== null) {
            state.minuteUsage = minuteCount;
            state.minuteRemaining = Math.max(0, MINUTE_LIMIT - minuteCount);
        }

        // ── 4. Pending tasks count ──
        const { count: pendingCount, error: pendingErr } = await supabase
            .from('ai_tasks')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('status', 'pending');

        if (!pendingErr && pendingCount !== null) {
            state.pendingActions = pendingCount;
        }

        return state;
    } catch (err) {
        console.error('[SYS-STATE] Unexpected error:', err);
        return defaults;
    }
}

// ────────────────────────────────────────────────────────
// Build human-readable response from system state
// ────────────────────────────────────────────────────────
export type SystemQueryType = 'google_status' | 'telegram_status' | 'usage_status' | 'feature_status' | 'full_status';

export function buildSystemResponse(queryType: SystemQueryType, state: SystemState): string {
    switch (queryType) {
        case 'google_status':
            return state.googleConnected
                ? '✅ Your Google Business Profile is connected and active.'
                : '❌ Your Google Business Profile is not connected yet. Please connect it from your dashboard.';

        case 'telegram_status':
            return state.telegramConnected
                ? '✅ Your Telegram bot is connected and active.'
                : '❌ Your Telegram bot is not connected yet. Please set it up from the AI builder.';

        case 'usage_status':
            return `📊 Usage Status:\n\n` +
                `Today: ${state.actionsUsedToday} of ${state.actionsUsedToday + state.actionsRemainingToday} actions used. ${state.actionsRemainingToday} remaining.\n` +
                `This minute: ${state.minuteUsage} of ${state.minuteUsage + state.minuteRemaining} used. ${state.minuteRemaining} remaining.` +
                (state.pendingActions > 0 ? `\n\nPending tasks: ${state.pendingActions}` : '');

        case 'feature_status':
            if (state.enabledFeatures.length === 0) {
                return '⚠️ No features are currently enabled. Enable features from your AI builder settings.';
            }
            return `🔧 Enabled features:\n\n${state.enabledFeatures.map(f => `• ${f}`).join('\n')}`;

        case 'full_status':
            const lines: string[] = [
                `📋 System Status — ${state.status === 'active' ? '🟢 Active' : '🟡 Draft'}`,
                '',
                `🔗 Google Business: ${state.googleConnected ? '✅ Connected' : '❌ Not connected'}`,
                `🤖 Telegram Bot: ${state.telegramConnected ? '✅ Connected' : '❌ Not connected'}`,
                '',
                `🔧 Features: ${state.enabledFeatures.length > 0 ? state.enabledFeatures.join(', ') : 'None enabled'}`,
                '',
                `📊 Usage: ${state.actionsUsedToday}/${state.actionsUsedToday + state.actionsRemainingToday} actions today (${state.actionsRemainingToday} left)`,
                `⏱️ This minute: ${state.minuteUsage}/${state.minuteUsage + state.minuteRemaining} (${state.minuteRemaining} left)`,
            ];

            if (state.pendingActions > 0) {
                lines.push(`\n⏳ Pending tasks: ${state.pendingActions}`);
            }

            return lines.join('\n');

        default:
            return buildSystemResponse('full_status', state);
    }
}
