import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const perplexityKey = process.env.PERPLEXITY_API_KEY!;

export async function GET(request: Request) {
    // CRON_SECRET is REQUIRED — block if not configured
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const results: { followUps: number; summaries: number } = { followUps: 0, summaries: 0 };

        // ─── PART 1: Process pending follow-up tasks ───
        const now = new Date().toISOString();
        const { data: pendingTasks } = await supabase
            .from('ai_tasks')
            .select('*, ai_projects(*)')
            .eq('status', 'pending')
            .eq('action_type', 'follow_up')
            .lte('execute_at', now);

        if (pendingTasks && pendingTasks.length > 0) {
            for (const task of pendingTasks) {
                const project = task.ai_projects;
                if (!project || !project.telegram_token || project.status !== 'active') {
                    await supabase.from('ai_tasks').update({ status: 'failed' }).eq('id', task.id);
                    continue;
                }

                // Generate a follow-up message using Perplexity
                const reason = task.context?.reason || 'User showed interest previously';
                const followUpPrompt = `You are the assistant for "${project.business_name}", a ${project.business_category} in ${project.business_location}. A potential customer showed interest earlier. The context: "${reason}". Write a short, warm follow-up message (2-3 sentences) encouraging them to visit or book. Be natural, not salesy. Do not reveal you are AI.`;

                const aiRes = await callPerplexity(followUpPrompt);
                const followUpText = aiRes || `Hey! 👋 Just checking in — we'd love to see you at ${project.business_name}. Feel free to reach out if you have any questions!`;

                // Send follow-up message to Telegram
                await sendTelegramMessage(project.telegram_token, task.chat_id, followUpText);

                // Mark task as completed
                await supabase.from('ai_tasks').update({ status: 'completed' }).eq('id', task.id);
                results.followUps++;
            }
        }

        // ─── PART 2: Daily summaries for business owners ───
        // Fetch active projects with telegram tokens
        const { data: activeProjects } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('status', 'active')
            .not('telegram_token', 'is', null);

        if (activeProjects && activeProjects.length > 0) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            for (const project of activeProjects) {
                // Get today's leads for this project
                const { data: todayLeads } = await supabase
                    .from('ai_leads')
                    .select('*')
                    .eq('project_id', project.id)
                    .gte('created_at', twentyFourHoursAgo);

                // Get today's conversations count
                const { data: todayConvos } = await supabase
                    .from('ai_conversations')
                    .select('id')
                    .eq('project_id', project.id)
                    .gte('updated_at', twentyFourHoursAgo);

                const leadCount = todayLeads?.length || 0;
                const convoCount = todayConvos?.length || 0;

                // Only send summary if there was any activity
                if (leadCount === 0 && convoCount === 0) continue;

                // Build summary
                const leadNames = todayLeads?.map(l => `• ${l.name || 'Unknown'} — ${l.interest_level || 'general interest'}`).join('\n') || 'None';

                const summaryText = `📊 *Daily AI Summary — ${project.business_name}*

🗓 Last 24 Hours

💬 *Conversations:* ${convoCount}
🎯 *New Leads:* ${leadCount}

${leadCount > 0 ? `👤 *Lead Details:*\n${leadNames}` : ''}

_Powered by Fitexa AI_`;

                // We need to find the business owner's chat_id
                // For now, we'll check if there's a stored owner_chat_id or use the first conversation
                // Since we don't have owner_chat_id yet, we log the summary
                // In production, you'd store the owner's Telegram chat_id during setup
                console.log(`[Daily Summary] Project ${project.id} (${project.business_name}):`, {
                    conversations: convoCount,
                    leads: leadCount,
                    summary: summaryText,
                });

                // If the project has enabled features that include sending summaries,
                // and there is a way to reach the owner, send it
                // For now, we store it as a completed task for audit
                await supabase.from('ai_tasks').insert({
                    project_id: project.id,
                    action_type: 'daily_summary',
                    context: { conversations: convoCount, leads: leadCount, summary: summaryText },
                    execute_at: now,
                    status: 'completed',
                });

                results.summaries++;
            }
        }

        return NextResponse.json({ success: true, ...results });
    } catch (err) {
        console.error('Telegram tasks cron error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function callPerplexity(prompt: string): Promise<string | null> {
    try {
        const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 200,
                temperature: 0.7,
            }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || null;
    } catch {
        return null;
    }
}

async function sendTelegramMessage(token: string, chatId: number, text: string) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
        });
    } catch (error) {
        console.error('Telegram sendMessage failed:', error);
    }
}
