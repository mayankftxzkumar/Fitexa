import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AIManagementClient from '@/components/ai/AIManagementClient';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function AIManagementPage({ params }: PageProps) {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch the project — select all, then strip sensitive fields before sending to client
    const { data: rawProject } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    // Strip sensitive server-only fields before passing to client
    const project = rawProject ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { telegram_token, google_access_token, google_refresh_token, ...safe } = rawProject;
        return safe;
    })() : null;

    if (!project) {
        redirect('/dashboard');
    }

    // Fetch conversations for this project
    const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(50);

    return <AIManagementClient user={user} project={project} conversations={conversations || []} />;
}
