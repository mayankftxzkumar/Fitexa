import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolves the production base URL for webhook registration.
 * Priority: NEXT_PUBLIC_APP_URL env var > request host header > fallback
 */
function getBaseUrl(request: NextRequest): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) {
        return envUrl.replace(/\/$/, '');
    }
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ISOLATED TELEGRAM ACTIVATION SERVICE
// This module handles only the Telegram bot registration flow.
// It is designed to be independent of UI changes.
// Only modify this file when the Telegram API integration logic needs updating.
// ─────────────────────────────────────────────────────────────────────────────

async function saveProjectData(
    admin: ReturnType<typeof createAdminClient>,
    projectId: string,
    userId: string,
    payload: Record<string, unknown>,
): Promise<{ error: string | null }> {
    const { error } = await admin
        .from('ai_projects')
        .update(payload)
        .eq('id', projectId)
        .eq('user_id', userId);

    if (error) {
        return { error: error.message };
    }
    return { error: null };
}

async function saveActivationStatus(
    admin: ReturnType<typeof createAdminClient>,
    projectId: string,
    webhookUrl: string,
    botUsername: string,
): Promise<{ error: string | null }> {
    // Try to save all fields including telegram_bot_username
    const { error: fullErr } = await admin
        .from('ai_projects')
        .update({
            status: 'active',
            webhook_url: webhookUrl,
            telegram_bot_username: botUsername,
        })
        .eq('id', projectId);

    if (!fullErr) {
        return { error: null };
    }

    console.warn('[ACTIVATE] Full update failed (telegram_bot_username column may be missing):', fullErr.message);

    // Graceful fallback: save without telegram_bot_username if the column is absent in schema
    const { error: fallbackErr } = await admin
        .from('ai_projects')
        .update({
            status: 'active',
            webhook_url: webhookUrl,
        })
        .eq('id', projectId);

    if (fallbackErr) {
        return { error: fallbackErr.message };
    }

    console.warn('[ACTIVATE] Saved without telegram_bot_username — run the migration: ALTER TABLE ai_projects ADD COLUMN IF NOT EXISTS telegram_bot_username TEXT;');
    return { error: null };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    console.log(`[ACTIVATE] ====== Starting activation for project: ${projectId} ======`);

    try {
        // ── Step 1: Authenticate the user ──
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[ACTIVATE] FAILED — No authenticated user session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log(`[ACTIVATE] Step 1 PASSED — User: ${user.id}`);

        // ── Step 1b: Parse request body ──
        let bodyData: Record<string, unknown> = {};
        try {
            bodyData = await request.json();
        } catch {
            // No body sent — fall back to DB-only mode
        }

        const admin = createAdminClient();

        // ── Step 2: Save token & project core data (isolated, no telegram_bot_username yet) ──
        if (bodyData.telegram_token) {
            console.log(`[ACTIVATE] Step 2a — Saving project data...`);
            const updatePayload: Record<string, unknown> = {
                telegram_token: bodyData.telegram_token,
                current_step: 3,
            };
            if (bodyData.ai_name) updatePayload.ai_name = bodyData.ai_name;
            if (bodyData.business_name) updatePayload.business_name = bodyData.business_name;
            if (bodyData.business_location) updatePayload.business_location = bodyData.business_location;
            if (bodyData.business_category) updatePayload.business_category = bodyData.business_category;
            if (bodyData.business_description) updatePayload.business_description = bodyData.business_description;
            if (bodyData.enabled_features) updatePayload.enabled_features = bodyData.enabled_features;

            const { error: saveError } = await saveProjectData(admin, projectId, user.id, updatePayload);
            if (saveError) {
                console.error('[ACTIVATE] FAILED — Could not save project data:', saveError);
                return NextResponse.json({ error: `Failed to save project data: ${saveError}` }, { status: 500 });
            }
            console.log('[ACTIVATE] Step 2a PASSED — Core data saved');
        }

        // ── Step 2b: Fetch fresh project from DB ──
        const { data: project, error: fetchErr } = await admin
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (fetchErr || !project) {
            console.error('[ACTIVATE] FAILED — Project not found:', fetchErr?.message);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        console.log(`[ACTIVATE] Step 2b — Project fetched:`, {
            id: project.id,
            ai_name: project.ai_name,
            status: project.status,
            telegram_token_exists: !!project.telegram_token,
            business_name: project.business_name,
        });

        if (!project.telegram_token) {
            return NextResponse.json({ error: 'Telegram bot token is required. Please add it in Step 3.' }, { status: 400 });
        }
        if (!project.business_name) {
            return NextResponse.json({ error: 'Business name is required. Please fill it in Step 1.' }, { status: 400 });
        }
        console.log(`[ACTIVATE] Step 2 PASSED — Project "${project.ai_name}" found`);

        // Build webhook URL
        const baseUrl = getBaseUrl(request);
        const webhookUrl = `${baseUrl}/api/telegram/${projectId}`;
        console.log(`[ACTIVATE] Webhook URL: ${webhookUrl}`);

        // Prevent duplicate registration
        if (project.status === 'active' && project.webhook_url === webhookUrl) {
            console.log('[ACTIVATE] Already active with same webhook — skipping');
            return NextResponse.json({ success: true, message: 'AI is already active', webhook_url: webhookUrl });
        }

        // ── Step 3: Validate Telegram token via getMe ──
        console.log('[ACTIVATE] Step 3 — Calling Telegram getMe...');
        let getMeData;
        try {
            const getMeRes = await fetch(`https://api.telegram.org/bot${project.telegram_token}/getMe`);
            getMeData = await getMeRes.json();
        } catch (err) {
            console.error('[ACTIVATE] FAILED — getMe network error:', err);
            return NextResponse.json({ error: 'Cannot reach Telegram API. Please try again.' }, { status: 502 });
        }

        if (!getMeData.ok) {
            return NextResponse.json({ error: `Invalid bot token: ${getMeData.description || 'Unknown error'}` }, { status: 400 });
        }
        const botUsername = getMeData.result.username;
        console.log(`[ACTIVATE] Step 3 PASSED — Bot verified: @${botUsername}`);

        // ── Step 4: Register webhook with Telegram ──
        console.log(`[ACTIVATE] Step 4 — Calling setWebhook...`);
        let webhookData;
        try {
            const webhookRes = await fetch(
                `https://api.telegram.org/bot${project.telegram_token}/setWebhook`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: webhookUrl }),
                }
            );
            webhookData = await webhookRes.json();
        } catch (err) {
            console.error('[ACTIVATE] FAILED — setWebhook network error:', err);
            return NextResponse.json({ error: 'Failed to register webhook. Please try again.' }, { status: 502 });
        }

        if (!webhookData.ok) {
            return NextResponse.json({ error: `Webhook registration failed: ${webhookData.description || 'Unknown error'}` }, { status: 400 });
        }
        console.log('[ACTIVATE] Step 4 PASSED — Webhook registered');

        // ── Step 5: Save activation status (with graceful telegram_bot_username fallback) ──
        console.log('[ACTIVATE] Step 5 — Saving activation status...');
        const { error: activationError } = await saveActivationStatus(admin, projectId, webhookUrl, botUsername);
        if (activationError) {
            console.error('[ACTIVATE] FAILED — Activation save error:', activationError);
            return NextResponse.json({ error: `Failed to save activation status: ${activationError}` }, { status: 500 });
        }
        console.log(`[ACTIVATE] Step 5 PASSED — Project ${projectId} is now active`);
        console.log(`[ACTIVATE] ====== Activation complete for @${botUsername} ======`);

        return NextResponse.json({
            success: true,
            webhook_url: webhookUrl,
            bot_username: botUsername,
        });

    } catch (err) {
        console.error('[ACTIVATE] UNEXPECTED ERROR:', err);
        return NextResponse.json({ error: 'Internal server error during activation' }, { status: 500 });
    }
}
