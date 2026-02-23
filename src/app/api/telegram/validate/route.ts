import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // Auth check — only authenticated users can validate tokens
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });
        }

        // Validate token format
        const tokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
        if (!tokenRegex.test(token)) {
            return NextResponse.json({ valid: false, error: 'Invalid token format' }, { status: 400 });
        }

        // Call Telegram getMe API
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await res.json();

        if (!data.ok) {
            return NextResponse.json(
                { valid: false, error: data.description || 'Invalid bot token' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            valid: true,
            bot_username: data.result.username,
            bot_name: data.result.first_name,
        });
    } catch {
        return NextResponse.json(
            { valid: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}
