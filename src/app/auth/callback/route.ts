import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createClient();
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && session?.user) {
            // Step 6: Check if user exists in users table, insert if not
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', session.user.id)
                .single();

            if (!userExists) {
                await supabase.from('users').insert({
                    id: session.user.id,
                    email: session.user.email,
                });
            }
        }
    }

    // return the user to an internal page
    return NextResponse.redirect(`${origin}${next}`);
}
