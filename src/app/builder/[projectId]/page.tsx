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

    // Fetch the project — select all, then strip sensitive fields before sending to client
    const { data: rawProject, error } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    // Strip only OAuth tokens (server secrets) before passing to client
    // google_connected comes directly from DB (set atomically during OAuth)
    const project = rawProject ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { google_access_token, google_refresh_token, ...safe } = rawProject;
        return safe;
    })() : null;

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F1E8] text-[#050505] font-sans">
                <p className="text-6xl mb-4 opacity-80">🚫</p>
                <h1 className="text-2xl font-[800] tracking-tight mb-2">Project not found</h1>
                <p className="text-black/50 text-sm mb-8 font-medium">This project doesn&apos;t exist or you don&apos;t have access to it.</p>
                <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-[#050505] text-white text-sm font-bold hover:bg-black/80 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return <BuilderClient user={user} project={project} />;
}
