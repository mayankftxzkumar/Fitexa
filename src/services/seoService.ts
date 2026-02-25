/**
 * SEO Service Layer
 * Generates SEO-optimized content using Perplexity AI.
 * Returns results for the agent engine to relay — never sends directly to Telegram.
 */

import type { AIProject, ActionResult } from '@/lib/types';
import { checkAndTrackLLMUsage } from '@/core/llmGuard';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

const LLM_LIMIT_MSG: ActionResult = {
    success: false,
    message: '⚠️ Daily AI usage limit reached. Please try again tomorrow.',
    error: 'llm_limit_exceeded',
};

// ────────────────────────────────────────────────────────
// Generate SEO-optimized business description
// ────────────────────────────────────────────────────────
export async function generateOptimizedDescription(
    payload: Record<string, unknown>,
    context: { project: AIProject },
): Promise<ActionResult> {
    const { project } = context;

    const prompt = `You are an expert SEO copywriter. Write an SEO-optimized Google Business description for the following business. Keep it under 750 characters. Include relevant keywords naturally. Do not use markdown formatting.

Business Name: ${project.business_name}
Category: ${project.business_category}
Location: ${project.business_location}
Current Description: ${project.business_description || 'None'}
${payload.focus ? `Focus areas: ${payload.focus}` : ''}`;

    const guard1 = await checkAndTrackLLMUsage(project.id, 'seo_description');
    if (!guard1.allowed) return LLM_LIMIT_MSG;

    const result = await callPerplexity(prompt);
    if (!result) {
        return { success: false, message: '❌ Failed to generate description. Try again later.', error: 'LLM call failed' };
    }

    return {
        success: true,
        message: `✅ Here is your optimized description:\n\n${result}`,
        data: { description: result },
    };
}

// ────────────────────────────────────────────────────────
// Generate a promotional/weekly social media post
// ────────────────────────────────────────────────────────
export async function generatePost(
    payload: Record<string, unknown>,
    context: { project: AIProject },
): Promise<ActionResult> {
    const { project } = context;

    const topic = typeof payload.topic === 'string' ? payload.topic : 'weekly update';

    const prompt = `You are a social media expert for local businesses. Write an engaging, SEO-friendly promotional post for the following business. Keep it under 280 characters suitable for social media. Include a call to action. Do not use markdown. Do not use hashtags unless requested.

Business Name: ${project.business_name}
Category: ${project.business_category}
Location: ${project.business_location}
Topic: ${topic}
${payload.tone ? `Tone: ${payload.tone}` : 'Tone: Professional and friendly'}`;

    const guard2 = await checkAndTrackLLMUsage(project.id, 'seo_post');
    if (!guard2.allowed) return LLM_LIMIT_MSG;

    const result = await callPerplexity(prompt);
    if (!result) {
        return { success: false, message: '❌ Failed to generate post content.', error: 'LLM call failed' };
    }

    return {
        success: true,
        message: `✅ Here is your generated post:\n\n${result}`,
        data: { post: result, topic },
    };
}

// ────────────────────────────────────────────────────────
// Suggest SEO keywords for the business
// ────────────────────────────────────────────────────────
export async function suggestKeywords(
    payload: Record<string, unknown>,
    context: { project: AIProject },
): Promise<ActionResult> {
    const { project } = context;

    const prompt = `You are an SEO specialist. Suggest 10 high-impact local SEO keywords for the following business. Return as a numbered list. Consider local intent, service-related terms, and competitor keywords. Do not use markdown formatting.

Business Name: ${project.business_name}
Category: ${project.business_category}
Location: ${project.business_location}
Description: ${project.business_description || 'N/A'}
${payload.focus ? `Specific focus: ${payload.focus}` : ''}`;

    const guard3 = await checkAndTrackLLMUsage(project.id, 'seo_keywords');
    if (!guard3.allowed) return LLM_LIMIT_MSG;

    const result = await callPerplexity(prompt);
    if (!result) {
        return { success: false, message: '❌ Failed to generate keyword suggestions.', error: 'LLM call failed' };
    }

    return {
        success: true,
        message: `✅ Keyword suggestions:\n\n${result}`,
        data: { keywords: result },
    };
}

// ────────────────────────────────────────────────────────
// Internal: Perplexity call
// ────────────────────────────────────────────────────────
async function callPerplexity(prompt: string): Promise<string | null> {
    if (!PERPLEXITY_API_KEY) {
        console.error('[SEO-SVC] No Perplexity API key');
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
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 400,
                temperature: 0.7,
            }),
        });

        if (!res.ok) {
            console.error(`[SEO-SVC] Perplexity error ${res.status}`);
            return null;
        }

        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch (err) {
        console.error('[SEO-SVC] Perplexity error:', err);
        return null;
    }
}
