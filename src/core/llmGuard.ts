/**
 * LLM Usage Guard — Per-Project Daily Limit
 * Tracks every Perplexity API call and enforces a 300/day limit.
 * Fail-open: if DB fails, allow the call but log a warning.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';

export interface LLMGuardResult {
    allowed: boolean;
}

const DAILY_LLM_LIMIT = 300;

// ────────────────────────────────────────────────────────
// Check and track LLM usage for a project
// ────────────────────────────────────────────────────────
export async function checkAndTrackLLMUsage(
    projectId: string,
    usageType: string,
): Promise<LLMGuardResult> {
    try {
        const supabase = createAdminClient();

        // Count calls in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error: countErr } = await supabase
            .from('ai_llm_usage')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gte('created_at', twentyFourHoursAgo);

        if (countErr) {
            console.warn('[LLM-GUARD] Count query failed:', countErr.message);
            return { allowed: true }; // Fail open
        }

        if ((count ?? 0) >= DAILY_LLM_LIMIT) {
            console.warn(`[LLM-GUARD] Daily limit hit for project ${projectId}: ${count}/${DAILY_LLM_LIMIT}`);
            return { allowed: false };
        }

        // Record this usage
        const { error: insertErr } = await supabase.from('ai_llm_usage').insert({
            project_id: projectId,
            usage_type: usageType,
        });

        if (insertErr) {
            console.warn('[LLM-GUARD] Failed to insert usage row:', insertErr.message);
            // Still allow — recording failure shouldn't block the call
        }

        return { allowed: true };
    } catch (err) {
        console.error('[LLM-GUARD] Unexpected error:', err);
        return { allowed: true }; // Fail open
    }
}
