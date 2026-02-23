import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Feature-based prompt instructions
// ────────────────────────────────────────────────────────
const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply:
        `When a user shows interest (e.g., wants to join, asks about pricing, wants a visit), collect their full name and preferred visit/call time. Be proactive about converting leads into walk-ins or trials.
IMPORTANT: Once you have gathered a lead's name and intent, append this hidden tag at the very end of your response:
[LEAD_ACTION: {"name": "<user name>", "contact": "<phone or info if shared>", "intent": "<what they want>"}]
Only include this tag when you have at least a name AND intent.`,

    trial_booking:
        `Guide the user step-by-step to book a free trial session. Ask for their name, preferred date and time, and confirm the booking clearly.
When booking is confirmed, append this tag:
[LEAD_ACTION: {"name": "<user name>", "contact": "<if shared>", "intent": "trial_booking"}]`,

    follow_up_reminder:
        `If the user seems interested but not ready to commit, politely suggest you will follow up soon.
When a follow-up is warranted, append this tag:
[FOLLOWUP_ACTION: {"reason": "<why follow up>", "delay_hours": 24}]`,

    seo_content:
        'If the user asks for promotional content, social media posts, or SEO text, generate high-quality, engaging promotional copy for the business.',

    renewal_reminder:
        `If the user mentions membership or renewal, help them understand renewal options and encourage timely renewal.
When renewal interest is detected, append this tag:
[LEAD_ACTION: {"name": "<user name>", "contact": "<if shared>", "intent": "renewal"}]`,
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
    const featureInstructions = (project.enabled_features || [])
        .filter((f: string) => FEATURE_PROMPTS[f])
        .map((f: string) => `- ${FEATURE_PROMPTS[f]}`)
        .join('\n');

    return `You are the professional AI assistant for "${project.business_name}", a ${project.business_category} business located in ${project.business_location}.

Business description: ${project.business_description || 'A professional fitness business.'}

CORE RULES:
- You represent this business directly. Never reveal you are an AI.
- Speak as "we" (the business team). Be friendly, concise, persuasive.
- Your goal is to convert every conversation into a lead, booking, or visit.
- Keep replies short (2-4 sentences max unless detail is requested).
- Do NOT include citations or references like [1], [2], etc.
- Do NOT use markdown formatting like ** or __ or backticks.

ENABLED CAPABILITIES:
${featureInstructions || '- Respond helpfully to all inquiries about the business.'}

Action tags like [LEAD_ACTION: ...] and [FOLLOWUP_ACTION: ...] are INTERNAL ONLY. They must appear ONLY at the very end of your response. The user must NEVER see these tags.

Always be warm, helpful, and action-oriented.`;
}

// ────────────────────────────────────────────────────────
// Parse action tags from AI response
// ────────────────────────────────────────────────────────
function parseActionTags(response: string): {
    cleanText: string;
    leadAction: { name?: string; contact?: string; intent?: string } | null;
    followUpAction: { reason?: string; delay_hours?: number } | null;
} {
    let cleanText = response;
    let leadAction = null;
    let followUpAction = null;

    const leadMatch = response.match(/\[LEAD_ACTION:\s*(\{[^}]+\})\]/);
    if (leadMatch) {
        try { leadAction = JSON.parse(leadMatch[1]); } catch { /* ignore */ }
        cleanText = cleanText.replace(leadMatch[0], '').trim();
    }

    const followUpMatch = response.match(/\[FOLLOWUP_ACTION:\s*(\{[^}]+\})\]/);
    if (followUpMatch) {
        try { followUpAction = JSON.parse(followUpMatch[1]); } catch { /* ignore */ }
        cleanText = cleanText.replace(followUpMatch[0], '').trim();
    }

    return { cleanText, leadAction, followUpAction };
}

// ────────────────────────────────────────────────────────
// Sanitize message for Telegram — strip ALL markdown
// ────────────────────────────────────────────────────────
function sanitizeForTelegram(text: string): string {
    let safe = text;

    // Strip citation markers like [1], [2], [1][2]
    safe = safe.replace(/\[\d+\]/g, '');

    // Strip markdown bold **text** and __text__
    safe = safe.replace(/\*\*(.*?)\*\*/g, '$1');
    safe = safe.replace(/__(.*?)__/g, '$1');

    // Strip markdown italic *text* and _text_
    safe = safe.replace(/\*(.*?)\*/g, '$1');
    safe = safe.replace(/_(.*?)_/g, '$1');

    // Strip backticks (inline code and code blocks)
    safe = safe.replace(/```[\s\S]*?```/g, '');
    safe = safe.replace(/`(.*?)`/g, '$1');

    // Strip markdown links [text](url) -> text
    safe = safe.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Clean up multiple spaces and newlines
    safe = safe.replace(/  +/g, ' ');
    safe = safe.replace(/\n{3,}/g, '\n\n');

    // Trim and ensure non-empty
    safe = safe.trim();

    // Truncate to 4000 chars (Telegram limit is 4096)
    if (safe.length > 4000) {
        safe = safe.substring(0, 4000) + '...';
    }

    return safe || "Thanks for your message! I'm here to help 😊";
}

// ────────────────────────────────────────────────────────
// POST — Telegram Webhook Handler
// ────────────────────────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    console.log(`[WEBHOOK] ====== Incoming update for project: ${projectId} ======`);

    try {
        const body = await request.json();
        console.log(`[WEBHOOK] Update payload keys: ${Object.keys(body).join(', ')}`);

        // ── Step 1: Extract chat_id and text STRICTLY from update.message ──
        const message = body?.message;
        if (!message) {
            console.log(`[WEBHOOK] No message field in update — ignoring (callback/edit/etc)`);
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat?.id;
        if (!chatId) {
            console.error(`[WEBHOOK] CRITICAL: No chat.id in message — cannot reply`);
            return NextResponse.json({ ok: true });
        }

        const userText = message.text;
        if (!userText || typeof userText !== 'string') {
            console.log(`[WEBHOOK] Non-text message (photo/sticker/etc) from chat ${chatId} — ignoring`);
            return NextResponse.json({ ok: true });
        }

        console.log(`[WEBHOOK] chat_id: ${chatId}, text: "${userText.substring(0, 80)}"`);

        // ── Step 2: Load project using admin client ──
        const supabase = createAdminClient();

        const { data: project, error: projError } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projError || !project) {
            console.error(`[WEBHOOK] Project ${projectId} not found:`, projError?.message);
            return NextResponse.json({ ok: true });
        }

        if (project.status !== 'active') {
            console.error(`[WEBHOOK] Project ${projectId} not active (status: ${project.status})`);
            return NextResponse.json({ ok: true });
        }

        const token = project.telegram_token;
        if (!token) {
            console.error(`[WEBHOOK] No telegram_token for project ${projectId}`);
            return NextResponse.json({ ok: true });
        }

        console.log(`[WEBHOOK] Project loaded: "${project.ai_name}", status: ${project.status}, token present: true`);

        // ── Step 3: Handle /start command ──
        if (userText.startsWith('/start')) {
            const welcomeMsg = `Hey there! 👋 Welcome to ${project.business_name || 'our business'}! How can I help you today?`;
            console.log(`[WEBHOOK] /start command — sending welcome`);
            await sendToTelegram(token, chatId, welcomeMsg);
            return NextResponse.json({ ok: true });
        }

        // ── Step 4: Load conversation history ──
        const { data: convo } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('project_id', projectId)
            .eq('chat_id', String(chatId))
            .single();

        const existingMessages: Array<{ role: string; content: string }> = convo?.messages || [];
        const recentHistory = existingMessages.slice(-10);
        console.log(`[WEBHOOK] Conversation history: ${existingMessages.length} total, using last ${recentHistory.length}`);

        // ── Step 5: Call Perplexity AI ──
        const systemPrompt = buildSystemPrompt(project);
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            { role: 'user', content: userText },
        ];

        console.log(`[WEBHOOK] Calling Perplexity API...`);
        const aiResponse = await callPerplexity(apiMessages);
        console.log(`[WEBHOOK] Perplexity returned: ${aiResponse ? aiResponse.length + ' chars' : 'NULL'}`);

        // ── Step 6: Prepare safe message ──
        let safeMessage: string;
        if (!aiResponse || aiResponse.trim().length === 0) {
            safeMessage = `Thanks for reaching out to ${project.business_name || 'us'}! We're here to help. Our team will get back to you shortly. 🙏`;
            console.log(`[WEBHOOK] Using fallback message (Perplexity failed or empty)`);
        } else {
            const { cleanText, leadAction, followUpAction } = parseActionTags(aiResponse);
            safeMessage = sanitizeForTelegram(cleanText);
            console.log(`[WEBHOOK] Sanitized message: ${safeMessage.length} chars, lead: ${!!leadAction}, followup: ${!!followUpAction}`);

            // Save lead if detected
            if (leadAction && leadAction.name) {
                await supabase.from('ai_leads').insert({
                    project_id: projectId,
                    chat_id: String(chatId),
                    name: leadAction.name,
                    contact_info: leadAction.contact || '',
                    interest_level: leadAction.intent || 'general',
                    status: 'new',
                });
            }

            // Schedule follow-up if detected
            if (followUpAction) {
                const delayHours = followUpAction.delay_hours || 24;
                await supabase.from('ai_tasks').insert({
                    project_id: projectId,
                    chat_id: String(chatId),
                    action_type: 'follow_up',
                    context: { reason: followUpAction.reason || 'User showed interest' },
                    execute_at: new Date(Date.now() + delayHours * 3600000).toISOString(),
                    status: 'pending',
                });
            }
        }

        // ── Step 7: Save conversation to DB ──
        const updatedMessages = [
            ...existingMessages,
            { role: 'user', content: userText },
            { role: 'assistant', content: safeMessage },
        ].slice(-20);

        if (convo) {
            await supabase
                .from('ai_conversations')
                .update({ messages: updatedMessages })
                .eq('id', convo.id);
        } else {
            await supabase.from('ai_conversations').insert({
                project_id: projectId,
                chat_id: String(chatId),
                messages: updatedMessages,
            });
        }
        console.log(`[WEBHOOK] Conversation saved to DB`);

        // ── Step 8: SEND REPLY TO TELEGRAM — THIS IS THE CRITICAL STEP ──
        console.log(`[WEBHOOK] >>>>>> SENDING MESSAGE TO TELEGRAM <<<<<<`);
        console.log(`[WEBHOOK] Token (first 10): ${token.substring(0, 10)}...`);
        console.log(`[WEBHOOK] Chat ID: ${chatId} (type: ${typeof chatId})`);
        console.log(`[WEBHOOK] Message length: ${safeMessage.length}`);
        console.log(`[WEBHOOK] Message preview: "${safeMessage.substring(0, 100)}..."`);

        const sendSuccess = await sendToTelegram(token, chatId, safeMessage);

        console.log(`[WEBHOOK] >>>>>> SEND RESULT: ${sendSuccess ? 'SUCCESS ✅' : 'FAILED ❌'} <<<<<<`);
        console.log(`[WEBHOOK] ====== Done processing for project ${projectId} ======`);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(`[WEBHOOK] UNEXPECTED ERROR for project ${projectId}:`, error);
        return NextResponse.json({ ok: true }); // Always 200
    }
}

// ────────────────────────────────────────────────────────
// Send message to Telegram — GUARANTEED awaited, returns success boolean
// ────────────────────────────────────────────────────────
async function sendToTelegram(token: string, chatId: number, text: string): Promise<boolean> {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: text,
    };

    console.log(`[TELEGRAM-SEND] POST ${url}`);
    console.log(`[TELEGRAM-SEND] Payload: chat_id=${chatId}, text_length=${text.length}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log(`[TELEGRAM-SEND] HTTP status: ${response.status}`);
        console.log(`[TELEGRAM-SEND] Raw response: ${responseText}`);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            console.error(`[TELEGRAM-SEND] Failed to parse response JSON`);
            return false;
        }

        if (data.ok === true) {
            console.log(`[TELEGRAM-SEND] ✅ Message delivered to chat ${chatId} (message_id: ${data.result?.message_id})`);
            return true;
        } else {
            console.error(`[TELEGRAM-SEND] ❌ Telegram API error: ${data.error_code} — ${data.description}`);
            return false;
        }
    } catch (error) {
        console.error(`[TELEGRAM-SEND] ❌ Network/fetch error:`, error);
        return false;
    }
}

// ────────────────────────────────────────────────────────
// Perplexity API call
// ────────────────────────────────────────────────────────
async function callPerplexity(messages: Array<{ role: string; content: string }>): Promise<string | null> {
    if (!perplexityKey) {
        console.error('[PERPLEXITY] API key not configured');
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
            const errText = await res.text();
            console.error(`[PERPLEXITY] API error ${res.status}: ${errText}`);
            return null;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            console.error('[PERPLEXITY] Empty response');
            return null;
        }
        return content;
    } catch (error) {
        console.error('[PERPLEXITY] Error:', error);
        return null;
    }
}

// ────────────────────────────────────────────────────────
// GET — Health check
// ────────────────────────────────────────────────────────
export async function GET() {
    return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
