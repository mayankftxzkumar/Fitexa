import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const perplexityKey = process.env.PERPLEXITY_API_KEY!;

// Feature-based prompt instructions
const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply:
        'When a user shows interest, collect their full name and preferred visit/call time. Be proactive about converting leads into walk-ins or trials.',
    trial_booking:
        'Guide the user step-by-step to book a free trial session. Ask for their name, preferred date and time, and confirm the booking clearly.',
    follow_up_reminder:
        'If the user seems interested but not ready to commit, politely suggest you will follow up soon. Encourage them to come back.',
    seo_content:
        'If the user asks for promotional content, social media posts, or SEO text, generate high-quality, engaging promotional copy for the business.',
    renewal_reminder:
        'If the user mentions membership or renewal, help them understand renewal options and encourage timely renewal.',
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

Always be warm, helpful, and action-oriented. End messages with a clear next step or question when appropriate.`;
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

        // Skip commands like /start
        if (userText.startsWith('/start')) {
            const welcomeText = 'Hey there! 👋 Welcome! How can I help you today?';
            // We still need the project to get the token
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: proj } = await supabase
                .from('ai_projects')
                .select('telegram_token')
                .eq('id', projectId)
                .eq('status', 'active')
                .single();
            if (proj?.telegram_token) {
                await sendTelegramMessage(proj.telegram_token, chatId, welcomeText);
            }
            return NextResponse.json({ ok: true });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

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

        // Update conversation history
        const updatedMessages = [
            ...existingMessages,
            { role: 'user', content: userText },
            { role: 'assistant', content: aiResponse },
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

        // Send response to Telegram
        await sendTelegramMessage(project.telegram_token, chatId, aiResponse);

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
                max_tokens: 400,
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
