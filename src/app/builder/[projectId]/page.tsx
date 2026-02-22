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

    // Fetch the project
    const { data: project } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (!project) {
        redirect('/dashboard');
    }

    return <BuilderClient user={user} project={project} />;
}
