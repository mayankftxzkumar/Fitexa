import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// Feature-based prompt instructions
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

// Parse action tags from AI response and strip them from the visible text
function parseActionTags(response: string): {
    cleanText: string;
    leadAction: { name?: string; contact?: string; intent?: string } | null;
    followUpAction: { reason?: string; delay_hours?: number } | null;
} {
    let cleanText = response;
    let leadAction = null;
    let followUpAction = null;

    // Extract [LEAD_ACTION: {...}]
    const leadMatch = response.match(/\[LEAD_ACTION:\s*(\{[^}]+\})\]/);
    if (leadMatch) {
        try {
            leadAction = JSON.parse(leadMatch[1]);
        } catch { /* ignore parse errors */ }
        cleanText = cleanText.replace(leadMatch[0], '').trim();
    }

    // Extract [FOLLOWUP_ACTION: {...}]
    const followUpMatch = response.match(/\[FOLLOWUP_ACTION:\s*(\{[^}]+\})\]/);
    if (followUpMatch) {
        try {
            followUpAction = JSON.parse(followUpMatch[1]);
        } catch { /* ignore parse errors */ }
        cleanText = cleanText.replace(followUpMatch[0], '').trim();
    }

    return { cleanText, leadAction, followUpAction };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();

        // Extract message from Telegram update
        const message = body?.message;
        if (!message?.text || !message?.chat?.id) {
            return NextResponse.json({ ok: true }); // Ignore non-text updates
        }

        const chatId = message.chat.id;
        const userText = message.text;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Skip commands like /start
        if (userText.startsWith('/start')) {
            const { data: proj } = await supabase
                .from('ai_projects')
                .select('telegram_token, business_name')
                .eq('id', projectId)
                .eq('status', 'active')
                .single();
            if (proj?.telegram_token) {
                const welcomeText = `Hey there! 👋 Welcome to ${proj.business_name || 'our business'}! How can I help you today?`;
                await sendTelegramMessage(proj.telegram_token, chatId, welcomeText);
            }
            return NextResponse.json({ ok: true });
        }

        // Fetch project
        const { data: project, error: projError } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projError || !project) {
            console.error('Project not found:', projectId);
            return NextResponse.json({ ok: true });
        }

        if (project.status !== 'active') {
            console.error('Project not active:', projectId);
            return NextResponse.json({ ok: true });
        }

        if (!project.telegram_token) {
            console.error('No telegram token for project:', projectId);
            return NextResponse.json({ ok: true });
        }

        // Fetch or create conversation
        const { data: convo } = await supabase
            .from('ai_conversations')
            .select('*')
            .eq('project_id', projectId)
            .eq('chat_id', chatId)
            .single();

        const existingMessages: Array<{ role: string; content: string }> = convo?.messages || [];

        // Keep last 10 messages for context
        const recentHistory = existingMessages.slice(-10);

        // Build messages for Perplexity
        const systemPrompt = buildSystemPrompt(project);
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            { role: 'user', content: userText },
        ];

        // Call Perplexity API
        const aiResponse = await callPerplexity(apiMessages);

        if (!aiResponse) {
            await sendTelegramMessage(
                project.telegram_token,
                chatId,
                "Sorry, I'm having a brief issue. Please try again in a moment!"
            );
            return NextResponse.json({ ok: true });
        }

        // Parse action tags from AI response
        const { cleanText, leadAction, followUpAction } = parseActionTags(aiResponse);

        // Save lead if detected
        if (leadAction && leadAction.name) {
            await supabase.from('ai_leads').insert({
                project_id: projectId,
                chat_id: chatId,
                name: leadAction.name,
                contact_info: leadAction.contact || '',
                interest_level: leadAction.intent || 'general',
                status: 'new',
            });
        }

        // Schedule follow-up task if detected
        if (followUpAction) {
            const delayHours = followUpAction.delay_hours || 24;
            const executeAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
            await supabase.from('ai_tasks').insert({
                project_id: projectId,
                chat_id: chatId,
                action_type: 'follow_up',
                context: { reason: followUpAction.reason || 'User showed interest' },
                execute_at: executeAt,
                status: 'pending',
            });
        }

        // Update conversation history (store clean text without tags)
        const updatedMessages = [
            ...existingMessages,
            { role: 'user', content: userText },
            { role: 'assistant', content: cleanText },
        ].slice(-20); // Keep last 20 messages total

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

        // Send clean response to Telegram (tags stripped)
        await sendTelegramMessage(project.telegram_token, chatId, cleanText);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: true }); // Always 200 to Telegram
    }
}

async function callPerplexity(messages: Array<{ role: string; content: string }>): Promise<string | null> {
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
            console.error('Perplexity API error:', res.status, await res.text());
            return null;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('Perplexity call failed:', error);
        return null;
    }
}

async function sendTelegramMessage(token: string, chatId: number, text: string) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'Markdown',
            }),
        });
    } catch (error) {
        console.error('Telegram sendMessage failed:', error);
    }
}

// Handle GET for webhook verification
export async function GET() {
    return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
