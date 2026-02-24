import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SetupPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-fitexa-beige text-fitexa-black flex items-center justify-center p-8 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 border border-fitexa-black/5 shadow-2xl text-center">
                <h1 className="text-4xl font-[900] text-fitexa-green tracking-tighter mb-6">Setup Your AI Agent</h1>
                <p className="text-fitexa-black/60 font-medium mb-10 leading-relaxed">
                    Welcome! Before we start, we need to set up your AI Front Desk. This only takes a minute.
                </p>

                <div className="space-y-6">
                    <div className="p-6 bg-fitexa-beige rounded-2xl border border-fitexa-black/5 text-left">
                        <h3 className="font-bold mb-2 text-fitexa-black">1. Connect Google Profile</h3>
                        <p className="text-sm text-fitexa-black/60">Link your business details to train the AI instantly.</p>
                    </div>
                    <div className="p-6 bg-fitexa-beige rounded-2xl border border-fitexa-black/5 text-left opacity-50">
                        <h3 className="font-bold mb-2 text-fitexa-black">2. Deploy to Telegram</h3>
                        <p className="text-sm text-fitexa-black/60">Connect your bot so customers can start chatting.</p>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4">
                    <Link href="/dashboard" className="bg-fitexa-black text-fitexa-beige px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all text-center">
                        Get Started
                    </Link>
                    <form action="/auth/sign-out" method="post">
                        <button className="text-fitexa-black/40 hover:text-fitexa-black font-bold text-sm transition-all uppercase tracking-widest cursor-pointer w-full mt-2">
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

