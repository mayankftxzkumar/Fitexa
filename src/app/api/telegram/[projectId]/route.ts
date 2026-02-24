/**
 * Telegram Webhook Controller
 * Thin route handler — parses Telegram update, validates project, delegates to AgentEngine.
 * No business logic here. All orchestration happens in core/agentEngine.
 *
 * Uses WEBHOOK REPLY method to respond directly through the HTTP response body.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import { handleMessage } from '@/core/agentEngine';
import { NextRequest, NextResponse } from 'next/server';

// ────────────────────────────────────────────────────────
// POST — Telegram Webhook
// ────────────────────────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    console.log(`[WH] === Incoming for ${projectId} ===`);

    try {
        const body = await request.json();
        const msg = body?.message;

        if (!msg?.chat?.id || !msg?.text) {
            console.log('[WH] No chat_id or text — skip');
            return NextResponse.json({ ok: true });
        }

        const chatId = Number(msg.chat.id);
        const userText: string = msg.text;
        console.log(`[WH] chat=${chatId} text="${userText.substring(0, 60)}"`);

        // Quick validation: project must exist and be active
        const supabase = createAdminClient();
        const { data: project, error: err } = await supabase
            .from('ai_projects')
            .select('id, status, business_name, telegram_token')
            .eq('id', projectId)
            .single();

        if (err || !project || project.status !== 'active') {
            console.error('[WH] Project not found or not active');
            return NextResponse.json({ ok: true });
        }

        // Handle /start — simple welcome, no engine needed
        if (userText.startsWith('/start')) {
            const welcome = `Hey! 👋 Welcome to ${project.business_name || 'our business'}! How can I help you today?`;
            console.log('[WH] /start — replying via webhook response');
            return NextResponse.json({
                method: 'sendMessage',
                chat_id: chatId,
                text: welcome,
            });
        }

        // ════════════════════════════════════════════════
        // DELEGATE TO AGENT ENGINE
        // The engine handles: prompt building, intent
        // classification, action execution, logging,
        // and conversation history.
        // ════════════════════════════════════════════════
        console.log('[WH] Delegating to AgentEngine...');
        const reply = await handleMessage({
            projectId,
            channel: 'telegram',
            message: userText,
            chatId,
        });

        console.log(`[WH] Reply (${reply.length} chars): "${reply.substring(0, 80)}..."`);

        // ════════════════════════════════════════════════
        // REPLY VIA WEBHOOK RESPONSE
        // Telegram processes this using the SAME bot
        // that received the update — no token needed!
        // ════════════════════════════════════════════════
        return NextResponse.json({
            method: 'sendMessage',
            chat_id: chatId,
            text: reply,
        });

    } catch (error) {
        console.error('[WH] ERROR:', error);
        return NextResponse.json({ ok: true });
    }
}

// ────────────────────────────────────────────────────────
// GET — Health check
// ────────────────────────────────────────────────────────
export async function GET() {
    return NextResponse.json({ status: 'active' });
}
