import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch project (RLS ensures user can only see their own)
        const { data: project, error } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();

        if (error || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (!project.telegram_token) {
            return NextResponse.json({ error: 'No Telegram token configured' }, { status: 400 });
        }

        // Determine the public webhook URL
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const webhookUrl = `${protocol}://${host}/api/telegram/${projectId}`;

        // Register webhook with Telegram
        const telegramRes = await fetch(
            `https://api.telegram.org/bot${project.telegram_token}/setWebhook`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: webhookUrl }),
            }
        );

        const telegramData = await telegramRes.json();

        if (!telegramData.ok) {
            console.error('Telegram setWebhook failed:', telegramData);
            return NextResponse.json(
                { error: 'Failed to register Telegram webhook', details: telegramData.description },
                { status: 400 }
            );
        }

        // Update project status to active
        const { error: updateError } = await supabase
            .from('ai_projects')
            .update({
                status: 'active',
                webhook_url: webhookUrl,
            })
            .eq('id', projectId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            webhook_url: webhookUrl,
            telegram_response: telegramData,
        });
    } catch (err) {
        console.error('Activation error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
