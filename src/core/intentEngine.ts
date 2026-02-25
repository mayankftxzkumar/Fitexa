/**
 * Intent Engine
 * Classifies user messages into structured intents using LLM.
 * Returns IntentResult with type (chat/action), action name, payload, and message.
 * Includes fallback to plain chat if structured parsing fails.
 */

import type { IntentResult } from '@/lib/types';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Feature skill prompts (migrated from webhook route)
// ────────────────────────────────────────────────────────
export const FEATURE_PROMPTS: Record<string, string> = {
    auto_lead_reply:
        'When a user shows interest, collect their name and preferred visit time. Convert leads into walk-ins.',
    trial_booking:
        'Guide the user to book a free trial. Ask for name, preferred date and time.',
    follow_up_reminder:
        'If interested but not ready, suggest following up.',
    seo_content:
        'If asked for promotional content, generate engaging copy.',
    renewal_reminder:
        'Help with membership renewal inquiries.',
    google_review_reply:
        'If the user asks to reply to Google reviews, classify as action with action "reply_google_review".',
};

// ────────────────────────────────────────────────────────
// Build system prompt (migrated from webhook route)
// ────────────────────────────────────────────────────────
export function buildSystemPrompt(project: {
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
About: ${project.business_description || 'A professional local business.'}
Rules: Speak as the business ("we"). Be friendly, concise (2-4 sentences). Never say you are AI.

CRITICAL INSTRUCTION — RESPONSE FORMAT:
You MUST ALWAYS respond with a valid JSON object and NOTHING else. No text before or after the JSON.

The JSON must have this exact structure:
{
  "type": "chat" or "action" or "system_query",
  "action": null or one of: "reply_google_review", "update_business_description", "generate_seo_post", "generate_seo_description", "suggest_keywords",
  "payload": {},
  "message": "your conversational reply here",
  "query": null or one of: "google_status", "telegram_status", "usage_status", "feature_status", "full_status"
}

Rules for choosing type:
- If the user is making general conversation, asking questions, or chatting, use type "chat" with action null.
- If the user explicitly asks to perform an external action (reply to reviews, update profile, generate SEO content, etc.), use type "action" with the appropriate action name.
- If the user asks about system status, connection status, enabled features, remaining actions, or integration health, use type "system_query" with the appropriate query value.
  - "google_status" for Google connection questions
  - "telegram_status" for Telegram/bot connection questions
  - "usage_status" for action count, remaining actions, or rate limit questions
  - "feature_status" for enabled feature questions
  - "full_status" for general system, status, or overview questions
- The "message" field should ALWAYS contain a human-friendly response.
- For actions, set "payload" with relevant parameters extracted from the user message.
- Do NOT use markdown formatting like ** or __ in the message field. Plain text only.
- Do NOT include citations like [1]. Plain text only.

${features ? 'Skills:\n' + features : ''}`;
}

// ────────────────────────────────────────────────────────
// Sanitize text for Telegram (migrated from webhook route)
// ────────────────────────────────────────────────────────
export function sanitize(text: string): string {
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
// System query patterns (local detection — no LLM needed)
// ────────────────────────────────────────────────────────
const SYSTEM_QUERY_PATTERNS: Array<{ pattern: RegExp; query: IntentResult['query'] }> = [
    { pattern: /\b(google|gbp|business profile)\b.*\b(connect|status|linked|active)\b/i, query: 'google_status' },
    { pattern: /\b(is|check)\b.*\bgoogle\b.*\bconnect/i, query: 'google_status' },
    { pattern: /\b(telegram|bot)\b.*\b(connect|status|active|linked)\b/i, query: 'telegram_status' },
    { pattern: /\b(is|check)\b.*\b(telegram|bot)\b.*\b(connect|active)/i, query: 'telegram_status' },
    { pattern: /\b(how many|actions? (left|remaining)|usage|quota|limit)\b/i, query: 'usage_status' },
    { pattern: /\b(why can.?t|can.?t .* (reply|action|execute))\b/i, query: 'usage_status' },
    { pattern: /\b(feature|enabled|what.*feature|which.*feature)\b/i, query: 'feature_status' },
    { pattern: /\b(system status|full status|connection status|status check|all connections)\b/i, query: 'full_status' },
    { pattern: /^\s*(status|system|diagnostics?)\s*$/i, query: 'full_status' },
];

function detectSystemQuery(message: string): IntentResult | null {
    for (const { pattern, query } of SYSTEM_QUERY_PATTERNS) {
        if (pattern.test(message)) {
            return {
                type: 'system_query',
                action: null,
                payload: {},
                message: null,
                query,
            };
        }
    }
    return null;
}

// ────────────────────────────────────────────────────────
// Classify intent from user message
// ────────────────────────────────────────────────────────
export async function classifyIntent(
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userMessage: string,
): Promise<IntentResult> {
    // Fast path: detect system queries locally (no LLM call needed)
    const systemQuery = detectSystemQuery(userMessage);
    if (systemQuery) {
        console.log(`[INTENT] System query detected locally: ${systemQuery.query}`);
        return systemQuery;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: userMessage },
    ];

    const rawResponse = await callPerplexity(messages);

    if (!rawResponse || rawResponse.trim().length === 0) {
        return fallbackChat("Thanks for your message! We'll get back to you shortly.");
    }

    // Attempt to parse structured JSON
    return parseIntentResponse(rawResponse);
}

// ────────────────────────────────────────────────────────
// Parse intent JSON from LLM response (with safe fallback)
// ────────────────────────────────────────────────────────
function parseIntentResponse(raw: string): IntentResult {
    try {
        // Try to extract JSON from the response (LLM might wrap in markdown code blocks)
        let jsonStr = raw.trim();

        // Remove markdown code fences if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Try to find JSON object boundaries
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);

        // Validate required fields
        if (!parsed.type || !['chat', 'action', 'system_query'].includes(parsed.type)) {
            console.warn('[INTENT] Invalid type — falling back to chat');
            return fallbackChat(sanitize(raw));
        }

        // Handle system_query from LLM
        if (parsed.type === 'system_query') {
            const validQueries = ['google_status', 'telegram_status', 'usage_status', 'feature_status', 'full_status'];
            return {
                type: 'system_query',
                action: null,
                payload: {},
                message: parsed.message ? sanitize(parsed.message) : null,
                query: validQueries.includes(parsed.query) ? parsed.query : 'full_status',
            };
        }

        // For action type, validate action name is present
        if (parsed.type === 'action' && !parsed.action) {
            console.warn('[INTENT] Action type but no action name — falling back to chat');
            return fallbackChat(sanitize(parsed.message || raw));
        }

        return {
            type: parsed.type,
            action: parsed.action || null,
            payload: parsed.payload || {},
            message: parsed.message ? sanitize(parsed.message) : null,
        };
    } catch {
        // JSON parsing failed — fall back to treating it as plain chat text
        console.warn('[INTENT] JSON parse failed — falling back to plain chat');

        // Clean any vestigial action tags (backward compat with old prompts)
        const cleaned = raw
            .replace(/\[LEAD_ACTION:\s*\{[^}]*\}\]/g, '')
            .replace(/\[FOLLOWUP_ACTION:\s*\{[^}]*\}\]/g, '')
            .trim();

        return fallbackChat(sanitize(cleaned));
    }
}

// ────────────────────────────────────────────────────────
// Fallback to simple chat response
// ────────────────────────────────────────────────────────
function fallbackChat(message: string): IntentResult {
    return {
        type: 'chat',
        action: null,
        payload: {},
        message,
    };
}

// ────────────────────────────────────────────────────────
// Perplexity API call (migrated from webhook route)
// ────────────────────────────────────────────────────────
export async function callPerplexity(
    messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
    if (!PERPLEXITY_API_KEY) {
        console.error('[INTENT] No Perplexity API key');
        return null;
    }
    try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
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
            console.error(`[INTENT] Perplexity error ${res.status}: ${await res.text()}`);
            return null;
        }
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('[INTENT] Perplexity error:', error);
        return null;
    }
}
