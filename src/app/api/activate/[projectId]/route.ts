import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch project
        const { data: project, error } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (!project.telegram_token) {
            return NextResponse.json({ error: 'No Telegram token configured' }, { status: 400 });
        }

        // Determine the public webhook URL
        // In production, use your domain. In dev, you need a tunnel (ngrok etc.)
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
