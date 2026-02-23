import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;
    console.log(`[ACTIVATE] Starting activation for project: ${projectId}`);

    try {
        // ── 1. Authenticate the user ──
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[ACTIVATE] Unauthorized — no user session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log(`[ACTIVATE] User authenticated: ${user.id}`);

        // ── 2. Fetch project & validate required fields ──
        const { data: project, error: fetchErr } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (fetchErr || !project) {
            console.error('[ACTIVATE] Project not found:', fetchErr?.message);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Check required fields
        if (!project.telegram_token) {
            console.error('[ACTIVATE] Missing telegram_token');
            return NextResponse.json({ error: 'Telegram bot token is required. Please add it in Step 3.' }, { status: 400 });
        }
        if (!project.business_name) {
            console.error('[ACTIVATE] Missing business_name');
            return NextResponse.json({ error: 'Business name is required. Please fill it in Step 1.' }, { status: 400 });
        }

        // Prevent re-activation if already active with same webhook
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/telegram/${projectId}`;

        if (project.status === 'active' && project.webhook_url === webhookUrl) {
            console.log('[ACTIVATE] Project already active with same webhook — skipping re-registration');
            return NextResponse.json({
                success: true,
                message: 'AI is already active',
                webhook_url: webhookUrl,
            });
        }

        // ── 3. Validate Telegram token via getMe ──
        console.log('[ACTIVATE] Validating Telegram token via getMe...');
        let getMeData;
        try {
            const getMeRes = await fetch(`https://api.telegram.org/bot${project.telegram_token}/getMe`);
            getMeData = await getMeRes.json();
        } catch (err) {
            console.error('[ACTIVATE] getMe network error:', err);
            return NextResponse.json({ error: 'Failed to reach Telegram API. Please try again.' }, { status: 502 });
        }

        if (!getMeData.ok) {
            console.error('[ACTIVATE] getMe failed:', getMeData);
            return NextResponse.json(
                { error: 'Invalid Telegram bot token. Please check your token and try again.', details: getMeData.description },
                { status: 400 }
            );
        }
        const botUsername = getMeData.result.username;
        console.log(`[ACTIVATE] Token valid — bot: @${botUsername}`);

        // ── 4. Register webhook with Telegram ──
        console.log(`[ACTIVATE] Setting webhook: ${webhookUrl}`);
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
            console.error('[ACTIVATE] setWebhook network error:', err);
            return NextResponse.json({ error: 'Failed to register webhook with Telegram.' }, { status: 502 });
        }

        if (!webhookData.ok) {
            console.error('[ACTIVATE] setWebhook failed:', webhookData);
            return NextResponse.json(
                { error: 'Telegram webhook registration failed', details: webhookData.description },
                { status: 400 }
            );
        }
        console.log('[ACTIVATE] Webhook registered successfully');

        // ── 5. Update project status using admin client (bypasses RLS for reliable update) ──
        const admin = createAdminClient();
        const { error: updateErr } = await admin
            .from('ai_projects')
            .update({
                status: 'active',
                webhook_url: webhookUrl,
                telegram_bot_username: botUsername,
            })
            .eq('id', projectId);

        if (updateErr) {
            console.error('[ACTIVATE] DB update failed:', updateErr.message);
            return NextResponse.json({ error: 'Failed to update project status' }, { status: 500 });
        }
        console.log(`[ACTIVATE] Project ${projectId} activated successfully`);

        return NextResponse.json({
            success: true,
            webhook_url: webhookUrl,
            bot_username: botUsername,
            telegram_response: webhookData,
        });
    } catch (err) {
        console.error('[ACTIVATE] Unexpected error:', err);
        return NextResponse.json({ error: 'Internal server error during activation' }, { status: 500 });
    }
}
