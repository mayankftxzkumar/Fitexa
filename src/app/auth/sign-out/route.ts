import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check if session exists before signing out
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        await supabase.auth.signOut();
    }

    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}`, {
        status: 302,
    });
}
