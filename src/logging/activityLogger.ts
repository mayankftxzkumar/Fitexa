/**
 * Activity Logger — Enterprise Observability
 * Logs every executed action to the ai_activity_logs table.
 * Required for audit trail, debugging, and analytics.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';

// ────────────────────────────────────────────────────────
// Log an activity to the database
// ────────────────────────────────────────────────────────
export async function logActivity(
    projectId: string,
    actionType: string,
    status: 'success' | 'failed',
    inputPayload: Record<string, unknown> = {},
    result: Record<string, unknown> = {},
): Promise<void> {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from('ai_activity_logs').insert({
            project_id: projectId,
            action_type: actionType,
            status,
            input_payload: inputPayload,
            result,
        });

        if (error) {
            // Log but don't throw — activity logging should never break the main flow
            console.error('[ACTIVITY-LOG] Failed to insert log:', error.message);
        }
    } catch (err) {
        console.error('[ACTIVITY-LOG] Unexpected error:', err);
    }
}
