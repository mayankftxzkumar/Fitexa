import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase admin client using SERVICE_ROLE_KEY.
 * Bypasses Row Level Security — use ONLY in server-side API routes
 * that are called by external services (Telegram webhooks, crons, etc.)
 * where there is no user session.
 */
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !serviceKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(url, serviceKey, {
        auth: { persistSession: false },
    });
}
