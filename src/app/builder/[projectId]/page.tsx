import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BuilderClient from '@/components/builder/BuilderClient';

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default async function BuilderPage({ params }: PageProps) {
    const { projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    // Fetch the project — only safe columns (no tokens sent to client)
    const { data: project } = await supabase
        .from('ai_projects')
        .select('id, user_id, ai_name, business_name, business_location, business_category, business_description, enabled_features, status, webhook_url, telegram_bot_username, google_connected, google_location_id, created_at')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (!project) {
        redirect('/dashboard');
    }

    return <BuilderClient user={user} project={project} />;
}
