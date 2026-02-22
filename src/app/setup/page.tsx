import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function SetupPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-fitexa-beige text-fitexa-black flex items-center justify-center p-8">
            <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 border border-fitexa-black/5 shadow-2xl text-center">
                <h1 className="text-4xl font-[900] text-fitexa-green tracking-tighter mb-6">Setup Your Studio</h1>
                <p className="text-fitexa-black/60 font-medium mb-10 leading-relaxed">
                    Welcome! Before we start, we need to set up your AI Front Desk. This only takes a minute.
                </p>

                <div className="space-y-6">
                    <div className="p-6 bg-fitexa-beige rounded-2xl border border-fitexa-black/5 text-left">
                        <h3 className="font-bold mb-2">1. Connect WhatsApp</h3>
                        <p className="text-sm opacity-70">Link your business number to start receiving leads.</p>
                    </div>
                    <div className="p-6 bg-fitexa-beige rounded-2xl border border-fitexa-black/5 text-left opacity-50">
                        <h3 className="font-bold mb-2">2. Training AI</h3>
                        <p className="text-sm opacity-70">Upload your studio schedule and pricing.</p>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4">
                    <button className="bg-fitexa-black text-fitexa-beige px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all cursor-pointer">
                        Get Started
                    </button>
                    <form action="/auth/sign-out" method="post">
                        <button className="text-fitexa-black/40 hover:text-fitexa-black font-bold text-sm transition-all uppercase tracking-widest cursor-pointer">
                            Logout
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
