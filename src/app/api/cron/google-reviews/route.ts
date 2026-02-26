/**
 * Cron Job: Google Review Auto-Reply
 * Iterates active projects with Google credentials and replies to unreplied reviews.
 * Now delegates to googleService instead of containing raw API logic.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';
import * as googleService from '@/services/googleService';

export async function GET(request: Request) {
    // CRON_SECRET is REQUIRED — block if not configured
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // Fetch active projects that have Google fully connected
        const { data: projects, error } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('status', 'active')
            .eq('google_connected', true)
            .not('google_location_id', 'is', null)
            .not('google_refresh_token', 'is', null);

        if (error || !projects) {
            console.error('Failed to fetch projects for cron:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const results = [];

        for (const project of projects) {
            try {
                // Delegate to googleService unified handler
                const result = await googleService.replyToLatestReviews(
                    {},
                    { project },
                );

                results.push({
                    projectId: project.id,
                    success: result.success,
                    message: result.message,
                    data: result.data,
                });
            } catch (pError) {
                console.error(`Error processing project ${project.id}:`, pError);
                results.push({
                    projectId: project.id,
                    success: false,
                    message: String(pError),
                });
            }
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (err) {
        console.error('Cron job error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
