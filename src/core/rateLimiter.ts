/**
 * Rate Limiter — Per-Project Action Throttling
 * Enforces minute (5/min) and daily (100/day) limits on structured actions.
 * Chat-only responses are NEVER rate limited — this module is only called for actions.
 * Fail-open: if the DB is unreachable, actions are allowed through.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';

export interface RateLimitResult {
    allowed: boolean;
    reason?: 'minute_limit' | 'daily_limit';
}

const MINUTE_LIMIT = 5;
const DAILY_LIMIT = 100;

// ────────────────────────────────────────────────────────
// Check rate limit for a project action
// ────────────────────────────────────────────────────────
export async function checkRateLimit(
    projectId: string,
    actionType: string,
): Promise<RateLimitResult> {
    try {
        const supabase = createAdminClient();
        const now = new Date();

        // ── A) Minute limit: max 5 actions in last 60 seconds ──
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
        const { count: minuteCount, error: minuteErr } = await supabase
            .from('ai_rate_limits')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', oneMinuteAgo);

        if (minuteErr) {
            console.warn('[RATE-LIMIT] Minute count query failed:', minuteErr.message);
            // Fail open — allow the action
            return { allowed: true };
        }

        if ((minuteCount ?? 0) >= MINUTE_LIMIT) {
            console.warn(`[RATE-LIMIT] Minute limit hit for project ${projectId}: ${minuteCount}/${MINUTE_LIMIT}`);
            return { allowed: false, reason: 'minute_limit' };
        }

        // ── B) Daily limit: max 100 actions in last 24 hours ──
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const { count: dailyCount, error: dailyErr } = await supabase
            .from('ai_rate_limits')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', twentyFourHoursAgo);

        if (dailyErr) {
            console.warn('[RATE-LIMIT] Daily count query failed:', dailyErr.message);
            return { allowed: true };
        }

        if ((dailyCount ?? 0) >= DAILY_LIMIT) {
            console.warn(`[RATE-LIMIT] Daily limit hit for project ${projectId}: ${dailyCount}/${DAILY_LIMIT}`);
            return { allowed: false, reason: 'daily_limit' };
        }

        // ── C) Allowed — record this action ──
        const { error: insertErr } = await supabase.from('ai_rate_limits').insert({
            project_id: projectId,
            action_type: actionType,
        });

        if (insertErr) {
            console.warn('[RATE-LIMIT] Failed to insert rate limit row:', insertErr.message);
            // Still allow — recording failure shouldn't block the action
        }

        return { allowed: true };
    } catch (err) {
        // Fail open — never break the system due to rate limiting failure
        console.error('[RATE-LIMIT] Unexpected error:', err);
        return { allowed: true };
    }
}
