/**
 * Google Business Service Layer
 * Centralized Google Business API operations.
 * Used by both cron jobs and the agent action registry.
 *
 * Enterprise-grade:
 * - isGoogleConnected()        — strict 3-field validation
 * - getValidGoogleAccessToken() — auto-disconnect on refresh failure
 * - All action handlers validate before executing
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import type { AIProject, ActionResult } from '@/lib/types';
import { checkAndTrackLLMUsage } from '@/core/llmGuard';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

// ────────────────────────────────────────────────────────
// Strict Connection Check
// Returns TRUE only if all three conditions are met.
// ────────────────────────────────────────────────────────
export function isGoogleConnected(project: AIProject): boolean {
    return (
        project.google_connected === true &&
        !!project.google_refresh_token &&
        !!project.google_location_id
    );
}

// ────────────────────────────────────────────────────────
// Access Token Wrapper — refresh + auto-disconnect
// All Google API calls MUST use this function.
// ────────────────────────────────────────────────────────
export async function getValidGoogleAccessToken(
    project: AIProject,
): Promise<{ accessToken: string | null; error?: string }> {
    if (!project.google_refresh_token) {
        return { accessToken: null, error: '⚠️ Google connection expired. Please reconnect.' };
    }

    try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: project.google_refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        const data = await res.json();

        if (data.error) {
            console.error('[GOOGLE-SVC] Token refresh error:', data.error);

            // Mark project as disconnected
            const supabase = createAdminClient();
            await supabase
                .from('ai_projects')
                .update({ google_connected: false })
                .eq('id', project.id);

            return { accessToken: null, error: '⚠️ Google connection expired. Please reconnect.' };
        }

        // Persist new access token + validation timestamp
        const supabase = createAdminClient();
        await supabase
            .from('ai_projects')
            .update({
                google_access_token: data.access_token,
                google_last_validated_at: new Date().toISOString(),
            })
            .eq('id', project.id);

        return { accessToken: data.access_token };
    } catch (err) {
        console.error('[GOOGLE-SVC] Token refresh network error:', err);

        // Mark project as disconnected on network failure
        try {
            const supabase = createAdminClient();
            await supabase
                .from('ai_projects')
                .update({ google_connected: false })
                .eq('id', project.id);
        } catch {
            // Best-effort disconnect
        }

        return { accessToken: null, error: '⚠️ Google connection expired. Please reconnect.' };
    }
}

// ────────────────────────────────────────────────────────
// Fetch latest Google Reviews
// ────────────────────────────────────────────────────────
export async function fetchLatestReviews(
    project: AIProject,
    accessToken: string,
): Promise<{ reviews: GoogleReview[]; error?: string }> {
    if (!project.google_location_id) {
        return { reviews: [], error: 'No Google location ID configured' };
    }

    try {
        const url = `https://mybusiness.googleapis.com/v4/${project.google_location_id}/reviews`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('[GOOGLE-SVC] Fetch reviews failed:', text);
            return { reviews: [], error: `Failed to fetch reviews: ${res.status}` };
        }

        const data = await res.json();
        return { reviews: data.reviews || [] };
    } catch (err) {
        console.error('[GOOGLE-SVC] Fetch reviews error:', err);
        return { reviews: [], error: 'Network error fetching reviews' };
    }
}

// ────────────────────────────────────────────────────────
// Reply to a single review
// ────────────────────────────────────────────────────────
export async function replyToReview(
    project: AIProject,
    accessToken: string,
    reviewId: string,
    replyText: string,
): Promise<{ ok: boolean; error?: string }> {
    if (!project.google_location_id) {
        return { ok: false, error: 'No Google location ID configured' };
    }

    try {
        const url = `https://mybusiness.googleapis.com/v4/${project.google_location_id}/reviews/${reviewId}/reply`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comment: replyText }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('[GOOGLE-SVC] Reply failed:', text);
            return { ok: false, error: `Reply failed: ${res.status}` };
        }

        return { ok: true };
    } catch (err) {
        console.error('[GOOGLE-SVC] Reply error:', err);
        return { ok: false, error: 'Network error posting reply' };
    }
}

// ────────────────────────────────────────────────────────
// Reply to latest unreplied reviews (action handler)
// Used by both action registry AND cron job
// ────────────────────────────────────────────────────────
export async function replyToLatestReviews(
    payload: Record<string, unknown>,
    context: { project: AIProject },
): Promise<ActionResult> {
    const { project } = context;

    // Hard validation before action
    if (!isGoogleConnected(project)) {
        return {
            success: false,
            message: '❌ Google Business is not connected. Please reconnect from dashboard.',
            error: 'Google not connected (strict check)',
        };
    }

    // 1. Get valid access token (auto-disconnects on failure)
    const { accessToken, error: tokenErr } = await getValidGoogleAccessToken(project);
    if (!accessToken) {
        return {
            success: false,
            message: tokenErr || '⚠️ Google connection expired. Please reconnect.',
            error: tokenErr,
        };
    }

    // 2. Fetch reviews
    const { reviews, error: fetchErr } = await fetchLatestReviews(project, accessToken);
    if (fetchErr) {
        return { success: false, message: '❌ Could not fetch reviews from Google.', error: fetchErr };
    }

    // 3. Filter unreplied
    const unreplied = reviews.filter((r) => !r.reviewReply);
    if (unreplied.length === 0) {
        return { success: true, message: '✅ All reviews are already replied to. No action needed.' };
    }

    // 4. Limit to specified count or default 5
    const limit = typeof payload.limit === 'number' ? payload.limit : 5;
    const toReply = unreplied.slice(0, limit);

    let repliedCount = 0;

    for (const review of toReply) {
        // Generate AI reply
        const prompt = `You are the owner of "${project.business_name}", a ${project.business_category} in ${project.business_location}. Provide a polite, professional, and SEO-friendly response to the following customer review. Keep it under 3 sentences. Mention the business name organically if positive. If negative, apologize professionally and offer an offline contact path.`;

        // Check LLM usage before generating AI reply
        const llmGuard = await checkAndTrackLLMUsage(project.id, 'review_reply');
        if (!llmGuard.allowed) {
            console.warn('[GOOGLE] LLM limit reached during review replies — stopping');
            break;
        }

        const aiReply = await callPerplexitySimple(prompt, `Rating: ${review.starRating}\nReview Text: ${review.comment}`);
        if (!aiReply) continue;

        // Post reply
        const { ok } = await replyToReview(project, accessToken, review.reviewId, aiReply);
        if (ok) repliedCount++;
    }

    return {
        success: true,
        message: `✅ Replied to ${repliedCount} of ${toReply.length} reviews successfully.`,
        data: { repliedCount, totalUnreplied: unreplied.length },
    };
}

// ────────────────────────────────────────────────────────
// Update business profile description (action handler)
// ────────────────────────────────────────────────────────
export async function updateProfile(
    payload: Record<string, unknown>,
    context: { project: AIProject },
): Promise<ActionResult> {
    const { project } = context;

    // Hard validation before action
    if (!isGoogleConnected(project)) {
        return {
            success: false,
            message: '❌ Google Business is not connected. Please reconnect from dashboard.',
            error: 'Google not connected (strict check)',
        };
    }

    const { accessToken, error: tokenErr } = await getValidGoogleAccessToken(project);
    if (!accessToken) {
        return {
            success: false,
            message: tokenErr || '⚠️ Google connection expired. Please reconnect.',
            error: tokenErr,
        };
    }

    const newDescription = typeof payload.description === 'string' ? payload.description : null;
    if (!newDescription) {
        return { success: false, message: '❌ No description provided.', error: 'Missing description in payload' };
    }

    try {
        const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${project.google_location_id}?updateMask=profile.description`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                profile: { description: newDescription },
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('[GOOGLE-SVC] updateProfile failed:', text);
            return { success: false, message: '❌ Failed to update business description.', error: text };
        }

        // Also update local DB
        const supabase = createAdminClient();
        await supabase
            .from('ai_projects')
            .update({ business_description: newDescription })
            .eq('id', project.id);

        return { success: true, message: '✅ Business description updated successfully.' };
    } catch (err) {
        console.error('[GOOGLE-SVC] updateProfile error:', err);
        return { success: false, message: '❌ Network error updating profile.', error: String(err) };
    }
}

// ────────────────────────────────────────────────────────
// Get business data from Google (action handler)
// ────────────────────────────────────────────────────────
export async function getBusinessData(
    project: AIProject,
): Promise<ActionResult> {
    // Hard validation before action
    if (!isGoogleConnected(project)) {
        return {
            success: false,
            message: '❌ Google Business is not connected. Please reconnect from dashboard.',
            error: 'Google not connected (strict check)',
        };
    }

    const { accessToken, error: tokenErr } = await getValidGoogleAccessToken(project);
    if (!accessToken) {
        return {
            success: false,
            message: tokenErr || '⚠️ Google connection expired. Please reconnect.',
            error: tokenErr,
        };
    }

    try {
        const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${project.google_location_id}?readMask=name,title,storefrontAddress,categories,profile`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
            return { success: false, message: '❌ Could not fetch business data.', error: `Status ${res.status}` };
        }

        const data = await res.json();
        return { success: true, message: 'Business data fetched.', data };
    } catch (err) {
        console.error('[GOOGLE-SVC] getBusinessData error:', err);
        return { success: false, message: '❌ Network error.', error: String(err) };
    }
}

// ────────────────────────────────────────────────────────
// Internal helper: simple Perplexity call
// ────────────────────────────────────────────────────────
async function callPerplexitySimple(
    systemPrompt: string,
    userMessage: string,
): Promise<string | null> {
    if (!PERPLEXITY_API_KEY) return null;
    try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 150,
            }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch {
        return null;
    }
}

// ────────────────────────────────────────────────────────
// Type for Google review API response
// ────────────────────────────────────────────────────────
interface GoogleReview {
    reviewId: string;
    comment: string;
    starRating: string;
    reviewReply?: { comment: string };
}
