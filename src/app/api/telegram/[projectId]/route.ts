import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Feature-based prompt instructions
// ────────────────────────────────────────────────────────
const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply:
        `When a user shows interest (e.g., wants to join, asks about pricing, wants a visit), collect their full name and preferred visit/call time. Be proactive about converting leads into walk-ins or trials.
IMPORTANT: Once you have gathered a lead's name and intent, you MUST append the following hidden tag at the very end of your response (after your normal text):
[LEAD_ACTION: {"name": "<user name>", "contact": "<phone or info if shared>", "intent": "<what they want, e.g. trial, membership, visit>"}]
Only include this tag when you have at least a name AND intent. Never show this tag text to the user in your visible reply.`,

    trial_booking:
        `Guide the user step-by-step to book a free trial session. Ask for their name, preferred date and time, and confirm the booking clearly.
When booking is confirmed, append this hidden tag at the end of your response:
[LEAD_ACTION: {"name": "<user name>", "contact": "<if shared>", "intent": "trial_booking"}]`,

    follow_up_reminder:
        `If the user seems interested but not ready to commit, politely suggest you will follow up soon. Encourage them to come back.
When a follow-up is warranted, append this hidden tag at the end of your response:
[FOLLOWUP_ACTION: {"reason": "<why follow up>", "delay_hours": 24}]
Only include this when the user shows interest but does not commit.`,

    seo_content:
        'If the user asks for promotional content, social media posts, or SEO text, generate high-quality, engaging promotional copy for the business.',

    renewal_reminder:
        `If the user mentions membership or renewal, help them understand renewal options and encourage timely renewal.
When renewal interest is detected, append this hidden tag at the end of your response:
[LEAD_ACTION: {"name": "<user name>", "contact": "<if shared>", "intent": "renewal"}]`,
};

// ────────────────────────────────────────────────────────
// Build system prompt from project config & enabled features
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
- You represent this business directly. Never reveal you are an AI, language model, or chatbot.
- Speak as "we" (the business team). Be friendly, concise, persuasive, and professional.
- Your goal is to convert every conversation into a lead, booking, or visit.
- Ask clarifying questions when needed. Keep replies short (2-4 sentences max unless detail is requested).
- Use the business name and details naturally in your responses.
- If someone asks something you cannot answer, say you will connect them with the team.

ENABLED CAPABILITIES:
${featureInstructions || '- Respond helpfully to all inquiries about the business.'}

CRITICAL FORMATTING RULE:
- Action tags like [LEAD_ACTION: ...] and [FOLLOWUP_ACTION: ...] are INTERNAL ONLY.
- They must appear ONLY at the very end of your response, after your normal human-readable text.
- The user must NEVER see these tags. They are for the system to extract data.
- If you have no action to report, do NOT include any tags.

Always be warm, helpful, and action-oriented. End messages with a clear next step or question when appropriate.`;
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
// POST — Telegram Webhook Handler
// ────────────────────────────────────────────────────────
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;

    // CRITICAL: Always return 200 to Telegram regardless of internal errors
    // to prevent Telegram from retrying the same update repeatedly.
    try {
        const body = await request.json();

        // ── Extract message safely ──
        const message = body?.message;
        if (!message) {
            console.log(`[WEBHOOK ${projectId}] Non-message update received (callback, edit, etc.) — ignoring`);
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat?.id;
        const userText = message.text;

        if (!chatId) {
            console.log(`[WEBHOOK ${projectId}] No chat_id in update — ignoring`);
            return NextResponse.json({ ok: true });
        }

        if (!userText) {
            console.log(`[WEBHOOK ${projectId}] Non-text message (photo, sticker, etc.) — ignoring`);
            return NextResponse.json({ ok: true });
        }

        console.log(`[WEBHOOK ${projectId}] Incoming message from chat ${chatId}: "${userText.substring(0, 100)}"`);

        // ── Use admin client (service role) to bypass RLS ──
        const supabase = createAdminClient();

        // ── Fetch project and validate ──
        const { data: project, error: projError } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projError || !project) {
            console.error(`[WEBHOOK ${projectId}] Project not found:`, projError?.message);
            return NextResponse.json({ ok: true });
        }

        if (project.status !== 'active') {
            console.error(`[WEBHOOK ${projectId}] Project not active (status: ${project.status})`);
            return NextResponse.json({ ok: true });
        }

        if (!project.telegram_token) {
            console.error(`[WEBHOOK ${projectId}] No telegram_token configured`);
            return NextResponse.json({ ok: true });
        }

        // ── Handle /start command ──
        if (userText.startsWith('/start')) {
            const welcomeText = `Hey there! 👋 Welcome to ${project.business_name || 'our business'}! How can I help you today?`;
            console.log(`[WEBHOOK ${projectId}] Sending /start welcome to chat ${chatId}`);
            await sendTelegramMessage(project.telegram_token, chatId, welcomeText);
            return NextResponse.json({ ok: true });
        }

        // ── Fetch or create conversation for memory context ──
        const { data: convo } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('project_id', projectId)
            .eq('chat_id', chatId)
            .single();

        const existingMessages: Array<{ role: string; content: string }> = convo?.messages || [];
        const recentHistory = existingMessages.slice(-10); // Last 5-10 messages for context

        // ── Build messages for Perplexity ──
        const systemPrompt = buildSystemPrompt(project);
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            { role: 'user', content: userText },
        ];

        // ── Call Perplexity API ──
        console.log(`[WEBHOOK ${projectId}] Calling Perplexity API...`);
        const aiResponse = await callPerplexity(apiMessages);

        if (!aiResponse) {
            console.error(`[WEBHOOK ${projectId}] Perplexity API failed — sending fallback`);
            await sendTelegramMessage(
                project.telegram_token,
                chatId,
                `Thanks for reaching out to ${project.business_name || 'us'}! We're currently experiencing a brief technical issue. Our team will get back to you shortly. 🙏`
            );
            return NextResponse.json({ ok: true });
        }

        // ── Parse action tags ──
        const { cleanText: rawCleanText, leadAction, followUpAction } = parseActionTags(aiResponse);

        // Strip Perplexity citation markers like [1], [2], [1][2] etc.
        const cleanText = rawCleanText.replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ').trim();
        console.log(`[WEBHOOK ${projectId}] AI response generated (${cleanText.length} chars), lead: ${!!leadAction}, followup: ${!!followUpAction}`);

        // ── Save lead if detected ──
        if (leadAction && leadAction.name) {
            console.log(`[WEBHOOK ${projectId}] Saving lead: ${leadAction.name}`);
            await supabase.from('ai_leads').insert({
                project_id: projectId,
                chat_id: chatId,
                name: leadAction.name,
                contact_info: leadAction.contact || '',
                interest_level: leadAction.intent || 'general',
                status: 'new',
            });
        }

        // ── Schedule follow-up if detected ──
        if (followUpAction) {
            const delayHours = followUpAction.delay_hours || 24;
            const executeAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
            console.log(`[WEBHOOK ${projectId}] Scheduling follow-up in ${delayHours}h`);
            await supabase.from('ai_tasks').insert({
                project_id: projectId,
                chat_id: chatId,
                action_type: 'follow_up',
                context: { reason: followUpAction.reason || 'User showed interest' },
                execute_at: executeAt,
                status: 'pending',
            });
        }

        // ── Update conversation history ──
        const updatedMessages = [
            ...existingMessages,
            { role: 'user', content: userText },
            { role: 'assistant', content: cleanText },
        ].slice(-20);

        if (convo) {
            await supabase
                .from('ai_conversations')
                .update({ messages: updatedMessages })
                .eq('id', convo.id);
        } else {
            await supabase.from('ai_conversations').insert({
                project_id: projectId,
                chat_id: chatId,
                messages: updatedMessages,
            });
        }
        console.log(`[WEBHOOK ${projectId}] Conversation saved to DB`);

        // ── CRITICAL: Send reply back to Telegram ──
        console.log(`[WEBHOOK ${projectId}] Sending reply to Telegram chat ${chatId}...`);
        const sendResult = await sendTelegramMessage(project.telegram_token, chatId, cleanText);
        console.log(`[WEBHOOK ${projectId}] sendMessage result: ${sendResult ? 'SUCCESS' : 'FAILED'}`);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error(`[WEBHOOK ${projectId}] Unexpected error:`, error);
        // ALWAYS return 200 to prevent Telegram retry loops
        return NextResponse.json({ ok: true });
    }
}

// ────────────────────────────────────────────────────────
// Perplexity API call
// ────────────────────────────────────────────────────────
async function callPerplexity(messages: Array<{ role: string; content: string }>): Promise<string | null> {
    try {
        if (!perplexityKey) {
            console.error('[PERPLEXITY] API key not configured');
            return null;
        }

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
            console.error(`[PERPLEXITY] API error ${res.status}:`, errText);
            return null;
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            console.error('[PERPLEXITY] Empty response from API');
            return null;
        }

        return content;
    } catch (error) {
        console.error('[PERPLEXITY] Network/parse error:', error);
        return null;
    }
}

// ────────────────────────────────────────────────────────
// Send message to Telegram — returns true on success
// ────────────────────────────────────────────────────────
async function sendTelegramMessage(token: string, chatId: number, text: string): Promise<boolean> {
    // Send as plain text (no parse_mode) to avoid Markdown formatting issues
    const payload = { chat_id: chatId, text };
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    console.log(`[TELEGRAM] Calling sendMessage: chat_id=${chatId}, text_length=${text.length}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log(`[TELEGRAM] sendMessage response: ok=${data.ok}, description=${data.description || 'none'}`);

        if (!data.ok) {
            console.error(`[TELEGRAM] sendMessage FAILED:`, JSON.stringify(data));
            return false;
        }

        console.log(`[TELEGRAM] Message sent successfully to chat ${chatId}`);
        return true;
    } catch (error) {
        console.error(`[TELEGRAM] sendMessage network error:`, error);
        return false;
    }
}

// ────────────────────────────────────────────────────────
// GET — Webhook health check
// ────────────────────────────────────────────────────────
export async function GET() {
    return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
