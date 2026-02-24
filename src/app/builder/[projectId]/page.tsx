import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
        .select('id, user_id, ai_name, business_name, business_location, business_category, business_description, enabled_features, status, webhook_url, telegram_bot_username, google_connected, google_location_id, current_step, created_at')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-[#F5F2EB] font-sans">
                <p className="text-6xl mb-4">🚫</p>
                <h1 className="text-2xl font-bold mb-2">Project not found</h1>
                <p className="text-white/40 text-sm mb-6">This project doesn&apos;t exist or you don&apos;t have access to it.</p>
                <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return <BuilderClient user={user} project={project} />;
}
