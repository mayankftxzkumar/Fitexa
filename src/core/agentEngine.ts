/**
 * Agent Engine — Enterprise AI Orchestrator
 * Central entry point for all incoming messages.
 * Channel-agnostic: receives input, classifies intent, routes actions, returns response.
 * Never directly calls external APIs — always routes through service layer.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import type { AgentInput, ActionResult } from '@/lib/types';
import { buildSystemPrompt, classifyIntent } from '@/core/intentEngine';
import { executeAction } from '@/core/actionRegistry';
import { logActivity } from '@/logging/activityLogger';
import { checkRateLimit } from '@/core/rateLimiter';
import { validateEnv } from '@/lib/envGuard';

// One-time startup validation
const envCheck = validateEnv();
if (!envCheck.valid) {
    console.error(`[AGENT] ⛔ Critical env vars missing: ${envCheck.missing.join(', ')}`);
}

// ────────────────────────────────────────────────────────
// Handle incoming message (orchestrator entry point)
// ────────────────────────────────────────────────────────
export async function handleMessage(input: AgentInput): Promise<string> {
    const { projectId, channel, message, chatId } = input;
    console.log(`[AGENT] === handleMessage | project=${projectId} channel=${channel} chat=${chatId} ===`);

    const supabase = createAdminClient();

    // ── 1. Load project config ──
    const { data: project, error: projectErr } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (projectErr || !project || project.status !== 'active') {
        console.error('[AGENT] Project not found or not active');
        return "Sorry, this service is currently unavailable.";
    }
    console.log(`[AGENT] Project loaded: "${project.ai_name}" | features: [${(project.enabled_features || []).join(', ')}]`);

    // ── 2. Load conversation history ──
    const { data: convo } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('project_id', projectId)
        .eq('chat_id', String(chatId))
        .single();

    const history: Array<{ role: string; content: string }> = convo?.messages || [];

    // ── 3. Build system prompt ──
    const systemPrompt = buildSystemPrompt(project);

    // ── 4. Classify intent via LLM ──
    console.log('[AGENT] Classifying intent...');
    const intent = await classifyIntent(systemPrompt, history, message);
    console.log(`[AGENT] Intent: type="${intent.type}" action="${intent.action}"`);

    let reply: string;

    // ── 5. Route based on intent type ──
    if (intent.type === 'action' && intent.action) {
        // ── 5a. Rate limit check (actions only, never chat) ──
        const rateCheck = await checkRateLimit(projectId, intent.action);

        if (!rateCheck.allowed) {
            const rateLimitMessage = rateCheck.reason === 'minute_limit'
                ? '⚠️ Too many actions. Please wait a moment before trying again.'
                : '⚠️ Daily action limit reached. You can perform more actions tomorrow.';

            const rateLimitStatus = rateCheck.reason === 'minute_limit'
                ? 'rate_limited'
                : 'daily_limit_exceeded';

            await logActivity(
                projectId,
                intent.action,
                rateLimitStatus as 'success' | 'failed',
                { userMessage: message, intent: intent.action, payload: intent.payload },
                { success: false, message: rateLimitMessage },
            );

            console.warn(`[AGENT] Rate limited: ${rateCheck.reason} for action "${intent.action}"`);

            // Save conversation with rate limit response
            const updated = [
                ...history,
                { role: 'user', content: message },
                { role: 'assistant', content: rateLimitMessage },
            ].slice(-20);

            if (convo) {
                await supabase.from('ai_conversations').update({ messages: updated }).eq('id', convo.id);
            } else {
                await supabase.from('ai_conversations').insert({
                    project_id: projectId,
                    chat_id: String(chatId),
                    messages: updated,
                });
            }

            return rateLimitMessage;
        }

        // ── 5b. Execute action via registry ──
        console.log(`[AGENT] Executing action: "${intent.action}"`);

        const actionResult: ActionResult = await executeAction(
            intent.action,
            intent.payload,
            { project, chatId, channel },
        );

        // Log action to activity logger
        await logActivity(
            projectId,
            intent.action,
            actionResult.success ? 'success' : 'failed',
            { userMessage: message, intent: intent.action, payload: intent.payload },
            { success: actionResult.success, message: actionResult.message, data: actionResult.data },
        );

        // Build reply: include conversational message + action result
        const parts: string[] = [];
        if (intent.message) parts.push(intent.message);
        parts.push(actionResult.message);
        reply = parts.join('\n\n');
    } else {
        // ── 5b. Simple chat reply ──
        reply = intent.message || `Thanks for reaching out to ${project.business_name}! Our team will get back to you shortly.`;
    }

    // ── 6. Save conversation ──
    const updated = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
    ].slice(-20);

    if (convo) {
        await supabase.from('ai_conversations').update({ messages: updated }).eq('id', convo.id);
    } else {
        await supabase.from('ai_conversations').insert({
            project_id: projectId,
            chat_id: String(chatId),
            messages: updated,
        });
    }
    console.log('[AGENT] Conversation saved');

    return reply;
}
