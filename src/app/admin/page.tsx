import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/admin/AdminClient';

// Only this email can access the admin panel
const ADMIN_EMAIL = 'mayankftzx@gmail.com';

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in → redirect to home
    if (!user) {
        redirect('/');
    }

    // Not admin → redirect to dashboard
    if (user.email !== ADMIN_EMAIL) {
        redirect('/dashboard');
    }

    // Fetch all projects (admin view — all users)
    const { data: projects } = await supabase
        .from('ai_projects')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch recent activity logs (last 50)
    const { data: activityLogs } = await supabase
        .from('ai_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    // Fetch LLM usage count (last 24h, all projects)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: llmUsageToday } = await supabase
        .from('ai_llm_usage')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);

    // Fetch rate limit count (last 24h, all projects)
    const { count: actionsToday } = await supabase
        .from('ai_rate_limits')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);

    return (
        <AdminClient
            user={user}
            projects={projects || []}
            activityLogs={activityLogs || []}
            llmUsageToday={llmUsageToday ?? 0}
            actionsToday={actionsToday ?? 0}
        />
    );
}
