import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Feature prompts
// ────────────────────────────────────────────────────────
const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply: 'When a user shows interest, collect their name and preferred visit time. Convert leads into walk-ins.',
    trial_booking: 'Guide the user to book a free trial. Ask for name, preferred date and time.',
    follow_up_reminder: 'If interested but not ready, suggest following up.',
    seo_content: 'If asked for promotional content, generate engaging copy.',
    renewal_reminder: 'Help with membership renewal inquiries.',
};

// ────────────────────────────────────────────────────────
// Build system prompt
// ────────────────────────────────────────────────────────
function buildSystemPrompt(project: {
    business_name: string;
    business_location: string;
    business_category: string;
    business_description: string;
    enabled_features: string[];
}): string {
    const features = (project.enabled_features || [])
        .filter((f: string) => FEATURE_PROMPTS[f])
        .map((f: string) => `- ${FEATURE_PROMPTS[f]}`)
        .join('\n');

    return `You are the AI assistant for "${project.business_name}", a ${project.business_category} business in ${project.business_location}.
About: ${project.business_description || 'A professional fitness business.'}
Rules: Speak as the business ("we"). Be friendly, concise (2-4 sentences). Never say you are AI. Do NOT use markdown formatting like ** or __. Do NOT include citations like [1]. Plain text only.
${features ? 'Skills:\n' + features : ''}`;
}

// ────────────────────────────────────────────────────────
// Sanitize text for Telegram
// ────────────────────────────────────────────────────────
function sanitize(text: string): string {
    return text
        .replace(/\[\d+\]/g, '')                    // citations
        .replace(/\*\*(.*?)\*\*/g, '$1')             // **bold**
        .replace(/__(.*?)__/g, '$1')                 // __underline__
        .replace(/\*(.*?)\*/g, '$1')                 // *italic*
        .replace(/_(.*?)_/g, '$1')                   // _italic_
        .replace(/`([^`]*)`/g, '$1')                 // `code`
        .replace(/```[\s\S]*?```/g, '')              // code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // [text](url)
        .replace(/  +/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .substring(0, 4000) || "Thanks for your message! I'm here to help.";
}

// ────────────────────────────────────────────────────────
// POST — Telegram Webhook
// Uses WEBHOOK REPLY method to respond directly through
// the HTTP response body, avoiding token mismatch issues.
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

        // Load project
        const supabase = createAdminClient();
        const { data: project, error: err } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (err || !project || project.status !== 'active') {
            console.error('[WH] Project not found or not active');
            return NextResponse.json({ ok: true });
        }

        console.log(`[WH] Project: "${project.ai_name}"`);

        // Handle /start — reply via webhook response
        if (userText.startsWith('/start')) {
            const welcome = `Hey! 👋 Welcome to ${project.business_name || 'our business'}! How can I help you today?`;
            console.log('[WH] /start — replying via webhook response');
            return NextResponse.json({
                method: 'sendMessage',
                chat_id: chatId,
                text: welcome,
            });
        }

        // Load conversation history
        const { data: convo } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('project_id', projectId)
            .eq('chat_id', String(chatId))
            .single();

        const history: Array<{ role: string; content: string }> = convo?.messages || [];

        // Call Perplexity
        console.log('[WH] Calling Perplexity...');
        const aiRaw = await callPerplexity([
            { role: 'system', content: buildSystemPrompt(project) },
            ...history.slice(-10),
            { role: 'user', content: userText },
        ]);

        // Prepare safe reply
        let reply: string;
        if (!aiRaw || aiRaw.trim().length === 0) {
            reply = `Thanks for reaching out to ${project.business_name}! Our team will get back to you shortly.`;
            console.log('[WH] Perplexity failed — using fallback');
        } else {
            // Strip action tags
            const cleaned = aiRaw
                .replace(/\[LEAD_ACTION:\s*\{[^}]*\}\]/g, '')
                .replace(/\[FOLLOWUP_ACTION:\s*\{[^}]*\}\]/g, '')
                .trim();
            reply = sanitize(cleaned);
        }

        console.log(`[WH] Reply (${reply.length} chars): "${reply.substring(0, 80)}..."`);

        // Save conversation to DB
        const updated = [
            ...history,
            { role: 'user', content: userText },
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
        console.log('[WH] Conversation saved');

        // ════════════════════════════════════════════════
        // REPLY VIA WEBHOOK RESPONSE
        // Instead of calling sendMessage API separately,
        // we return the reply as the webhook response body.
        // Telegram will process this using the SAME bot
        // that received the update — no token needed!
        // ════════════════════════════════════════════════
        console.log(`[WH] Replying via webhook response to chat ${chatId}`);
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
// Perplexity API
// ────────────────────────────────────────────────────────
async function callPerplexity(messages: Array<{ role: string; content: string }>): Promise<string | null> {
    if (!perplexityKey) {
        console.error('[PPX] No API key');
        return null;
    }
    try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages,
                max_tokens: 500,
                temperature: 0.7,
            }),
        });
        if (!res.ok) {
            console.error(`[PPX] Error ${res.status}: ${await res.text()}`);
            return null;
        }
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('[PPX] Error:', error);
        return null;
    }
}

// ────────────────────────────────────────────────────────
// GET — Health check
// ────────────────────────────────────────────────────────
export async function GET() {
    return NextResponse.json({ status: 'active' });
}
