import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolves the production base URL for webhook registration.
 * Priority: NEXT_PUBLIC_APP_URL env var > request host header > fallback
 */
function getBaseUrl(request: NextRequest): string {
    // 1. Explicit env var (most reliable for production)
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) {
        return envUrl.replace(/\/$/, ''); // strip trailing slash
    }

    // 2. Fallback to request host header
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
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

        // ── Step 1b: Parse request body for token and project data ──
        let bodyData: Record<string, unknown> = {};
        try {
            bodyData = await request.json();
        } catch {
            // No body sent — fall back to DB-only mode
        }

        const admin = createAdminClient();

        // ── Step 2: Save token & project data via admin client (bypasses RLS) ──
        if (bodyData.telegram_token) {
            console.log(`[ACTIVATE] Step 2a — Saving telegram_token via admin client (length: ${(bodyData.telegram_token as string).length})`);
            const updatePayload: Record<string, unknown> = {
                telegram_token: bodyData.telegram_token,
            };
            // Also save any other fields sent from the builder
            if (bodyData.telegram_bot_username) updatePayload.telegram_bot_username = bodyData.telegram_bot_username;
            if (bodyData.ai_name) updatePayload.ai_name = bodyData.ai_name;
            if (bodyData.business_name) updatePayload.business_name = bodyData.business_name;
            if (bodyData.business_location) updatePayload.business_location = bodyData.business_location;
            if (bodyData.business_category) updatePayload.business_category = bodyData.business_category;
            if (bodyData.business_description) updatePayload.business_description = bodyData.business_description;
            if (bodyData.enabled_features) updatePayload.enabled_features = bodyData.enabled_features;
            updatePayload.current_step = 3;

            const { error: saveErr } = await admin
                .from('ai_projects')
                .update(updatePayload)
                .eq('id', projectId)
                .eq('user_id', user.id);

            if (saveErr) {
                console.error('[ACTIVATE] FAILED — Admin save error:', saveErr.message);
                return NextResponse.json({ error: `Failed to save project data: ${saveErr.message}` }, { status: 500 });
            }
            console.log('[ACTIVATE] Step 2a PASSED — Data saved via admin client');
        }

        // ── Step 2b: Fetch project fresh from DB (using admin to ensure we see everything) ──
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
            telegram_token_length: project.telegram_token?.length || 0,
            business_name: project.business_name,
            user_id: project.user_id,
        });

        if (!project.telegram_token) {
            console.error('[ACTIVATE] FAILED — Missing telegram_token even after save');
            return NextResponse.json({ error: 'Telegram bot token is required. Please add it in Step 3.' }, { status: 400 });
        }
        if (!project.business_name) {
            console.error('[ACTIVATE] FAILED — Missing business_name');
            return NextResponse.json({ error: 'Business name is required. Please fill it in Step 1.' }, { status: 400 });
        }
        console.log(`[ACTIVATE] Step 2 PASSED — Project "${project.ai_name}" found, required fields present`);

        // Build webhook URL from production domain
        const baseUrl = getBaseUrl(request);
        const webhookUrl = `${baseUrl}/api/telegram/${projectId}`;
        console.log(`[ACTIVATE] Webhook URL resolved: ${webhookUrl}`);

        // Prevent duplicate registration if already active with same webhook
        if (project.status === 'active' && project.webhook_url === webhookUrl) {
            console.log('[ACTIVATE] Already active with same webhook — skipping');
            return NextResponse.json({
                success: true,
                message: 'AI is already active',
                webhook_url: webhookUrl,
            });
        }

        // ── Step 3: Validate Telegram token via getMe ──
        console.log('[ACTIVATE] Step 3 — Calling Telegram getMe...');
        let getMeData;
        try {
            const getMeRes = await fetch(`https://api.telegram.org/bot${project.telegram_token}/getMe`);
            getMeData = await getMeRes.json();
            console.log('[ACTIVATE] getMe response:', JSON.stringify(getMeData));
        } catch (err) {
            console.error('[ACTIVATE] FAILED — getMe network error:', err);
            return NextResponse.json({ error: 'Cannot reach Telegram API. Please try again.' }, { status: 502 });
        }

        if (!getMeData.ok) {
            console.error('[ACTIVATE] FAILED — getMe returned ok:false:', getMeData.description);
            return NextResponse.json(
                { error: `Invalid bot token: ${getMeData.description || 'Unknown error'}` },
                { status: 400 }
            );
        }
        const botUsername = getMeData.result.username;
        console.log(`[ACTIVATE] Step 3 PASSED — Bot verified: @${botUsername}`);

        // ── Step 4: Register webhook with Telegram ──
        console.log(`[ACTIVATE] Step 4 — Calling setWebhook with URL: ${webhookUrl}`);
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
            console.log('[ACTIVATE] setWebhook response:', JSON.stringify(webhookData));
        } catch (err) {
            console.error('[ACTIVATE] FAILED — setWebhook network error:', err);
            return NextResponse.json({ error: 'Failed to register webhook with Telegram. Please try again.' }, { status: 502 });
        }

        if (!webhookData.ok) {
            console.error('[ACTIVATE] FAILED — setWebhook returned ok:false:', webhookData.description);
            return NextResponse.json(
                { error: `Webhook registration failed: ${webhookData.description || 'Unknown error'}` },
                { status: 400 }
            );
        }
        console.log('[ACTIVATE] Step 4 PASSED — Webhook registered successfully');

        console.log('[ACTIVATE] Step 5 — Updating database...');
        const { error: updateErr } = await admin
            .from('ai_projects')
            .update({
                status: 'active',
                webhook_url: webhookUrl,
                telegram_bot_username: botUsername,
            })
            .eq('id', projectId);

        if (updateErr) {
            console.error('[ACTIVATE] FAILED — DB update error:', updateErr.message);
            return NextResponse.json({ error: 'Failed to save activation status. Please try again.' }, { status: 500 });
        }
        console.log(`[ACTIVATE] Step 5 PASSED — Project ${projectId} status set to "active"`);
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
