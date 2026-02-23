import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Feature-based prompt instructions
// ────────────────────────────────────────────────────────
const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply:
        'When a user shows interest, collect their full name and preferred visit/call time. Be proactive about converting leads.',
    trial_booking:
        'Guide the user to book a free trial session. Ask for name, preferred date and time.',
    follow_up_reminder:
        'If the user seems interested but not ready, politely suggest following up.',
    seo_content:
        'If asked for promotional content, generate high-quality engaging copy.',
    renewal_reminder:
        'If the user mentions membership or renewal, help them understand renewal options.',
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

    return `You are the professional AI assistant for "${project.business_name}", a ${project.business_category} business in ${project.business_location}.
Business: ${project.business_description || 'A professional fitness business.'}
Rules: Speak as the business team ("we"). Be friendly and concise (2-4 sentences). Never say you are AI. Do NOT use markdown. Do NOT use citations like [1]. Keep it plain text.
${features ? 'Capabilities:\n' + features : ''}`;
}

// ────────────────────────────────────────────────────────
// POST — Telegram Webhook Handler
// ────────────────────────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    console.log(`[WH] === Update for project ${projectId} ===`);

    try {
        const body = await request.json();

        // ── Extract chat_id and text ──
        const msg = body?.message;
        if (!msg) {
            console.log('[WH] No message field — skip');
            return NextResponse.json({ ok: true });
        }

        const chatId = msg.chat?.id;
        if (!chatId && chatId !== 0) {
            console.log('[WH] No chat.id — skip');
            return NextResponse.json({ ok: true });
        }

        const userText = msg.text;
        if (!userText || typeof userText !== 'string') {
            console.log('[WH] No text — skip');
            return NextResponse.json({ ok: true });
        }

        // Force chatId to number
        const numericChatId = Number(chatId);
        console.log(`[WH] chatId=${numericChatId} (type=${typeof numericChatId}), text="${userText.substring(0, 60)}"`);

        // ── Load project ──
        const supabase = createAdminClient();
        const { data: project, error: err } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (err || !project) {
            console.error('[WH] Project not found');
            return NextResponse.json({ ok: true });
        }
        if (project.status !== 'active' || !project.telegram_token) {
            console.error('[WH] Project not active or no token');
            return NextResponse.json({ ok: true });
        }

        const token = project.telegram_token;
        console.log(`[WH] Project loaded, token starts with: ${token.substring(0, 15)}...`);

        // ── Handle /start ──
        if (userText.startsWith('/start')) {
            const welcome = `Hey! Welcome to ${project.business_name || 'our business'}! How can I help you today?`;
            await telegramSend(token, numericChatId, welcome);
            return NextResponse.json({ ok: true });
        }

        // ── Load conversation history ──
        const { data: convo } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('project_id', projectId)
            .eq('chat_id', String(numericChatId))
            .single();

        const history: Array<{ role: string; content: string }> = convo?.messages || [];

        // ── Call Perplexity ──
        console.log('[WH] Calling Perplexity...');
        const aiRaw = await callPerplexity([
            { role: 'system', content: buildSystemPrompt(project) },
            ...history.slice(-10),
            { role: 'user', content: userText },
        ]);

        // ── Prepare safe reply ──
        let reply: string;
        if (!aiRaw || aiRaw.trim().length === 0) {
            reply = `Thanks for reaching out to ${project.business_name}! Our team will get back to you shortly.`;
            console.log('[WH] Perplexity failed, using fallback');
        } else {
            // Strip action tags
            reply = aiRaw
                .replace(/\[LEAD_ACTION:\s*\{[^}]*\}\]/g, '')
                .replace(/\[FOLLOWUP_ACTION:\s*\{[^}]*\}\]/g, '')
                .trim();

            // Strip ALL markdown and citations
            reply = reply
                .replace(/\[\d+\]/g, '')       // [1], [2]
                .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
                .replace(/__(.*?)__/g, '$1')     // __underline__
                .replace(/\*(.*?)\*/g, '$1')     // *italic*
                .replace(/_(.*?)_/g, '$1')       // _italic_
                .replace(/`([^`]*)`/g, '$1')     // `code`
                .replace(/```[\s\S]*?```/g, '')  // ```code blocks```
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url)
                .replace(/  +/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            if (reply.length > 4000) {
                reply = reply.substring(0, 4000) + '...';
            }
            if (reply.length === 0) {
                reply = "Thanks for your message! I'm here to help.";
            }
        }

        console.log(`[WH] Reply prepared (${reply.length} chars): "${reply.substring(0, 80)}..."`);

        // ── Save to DB ──
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
                chat_id: String(numericChatId),
                messages: updated,
            });
        }
        console.log('[WH] DB saved');

        // ── SEND TO TELEGRAM ──
        console.log('[WH] >>> SENDING TO TELEGRAM <<<');
        const sent = await telegramSend(token, numericChatId, reply);
        console.log(`[WH] >>> RESULT: ${sent ? 'DELIVERED' : 'FAILED'} <<<`);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[WH] CRASH:', error);
        return NextResponse.json({ ok: true });
    }
}

// ────────────────────────────────────────────────────────
// Send to Telegram — full error capture
// ────────────────────────────────────────────────────────
async function telegramSend(token: string, chatId: number, text: string): Promise<boolean> {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    // Build the simplest possible payload
    const body = JSON.stringify({
        chat_id: chatId,
        text: text
    });

    console.log(`[TG] POST sendMessage | chat_id=${chatId} | text_len=${text.length}`);
    console.log(`[TG] Payload: ${body.substring(0, 200)}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
        });

        const raw = await res.text();

        // Log the FULL raw response — split if needed for Vercel log limit
        console.log(`[TG] HTTP ${res.status}`);
        console.log(`[TG] Response: ${raw}`);

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            console.error('[TG] Could not parse response JSON');
            return false;
        }

        if (data.ok === true) {
            console.log(`[TG] DELIVERED msg_id=${data.result?.message_id}`);
            return true;
        }

        // Log FULL error details
        console.error(`[TG] FAILED error_code=${data.error_code}`);
        console.error(`[TG] FAILED description=${data.description}`);
        console.error(`[TG] FAILED full=${JSON.stringify(data)}`);

        // If error, retry with ultra-simple message
        if (data.error_code === 400) {
            console.log('[TG] Retrying with simple test message...');
            const retryRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: 'Hello! Thanks for your message.'
                }),
            });
            const retryRaw = await retryRes.text();
            console.log(`[TG] Retry response: ${retryRaw}`);
            const retryData = JSON.parse(retryRaw);
            if (retryData.ok) {
                console.log('[TG] Retry succeeded — original message content was the problem');
                return true;
            } else {
                console.error('[TG] Retry also failed — chat_id or token issue');
                console.error(`[TG] Retry error: ${retryData.description}`);
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error('[TG] Network error:', error);
        return false;
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
