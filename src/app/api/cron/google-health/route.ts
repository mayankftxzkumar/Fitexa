/**
 * Cron Job: Google Health Check
 * Daily validation of all connected Google Business profiles.
 * Attempts token refresh + location fetch for each project.
 * Marks projects as disconnected if validation fails.
 */

import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function GET(request: Request) {
    // CRON_SECRET is REQUIRED — block if not configured
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // Fetch all projects marked as connected
        const { data: projects, error } = await supabase
            .from('ai_projects')
            .select('id, google_refresh_token, google_location_id, google_account_name')
            .eq('google_connected', true)
            .not('google_refresh_token', 'is', null)
            .not('google_location_id', 'is', null);

        if (error || !projects) {
            console.error('[GOOGLE-HEALTH] Failed to fetch projects:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        console.log(`[GOOGLE-HEALTH] Validating ${projects.length} connected projects`);

        const results = [];

        for (const project of projects) {
            try {
                // Step 1: Attempt token refresh
                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: GOOGLE_CLIENT_ID,
                        client_secret: GOOGLE_CLIENT_SECRET,
                        refresh_token: project.google_refresh_token,
                        grant_type: 'refresh_token',
                    }),
                });

                const tokenData = await tokenRes.json();

                if (tokenData.error) {
                    console.warn(`[GOOGLE-HEALTH] Token refresh failed for project ${project.id}:`, tokenData.error);
                    await supabase
                        .from('ai_projects')
                        .update({ google_connected: false })
                        .eq('id', project.id);

                    results.push({ projectId: project.id, status: 'disconnected', reason: 'token_refresh_failed' });
                    continue;
                }

                // Step 2: Attempt location fetch
                const accountName = project.google_account_name;
                let locationValid = false;

                if (accountName) {
                    const locRes = await fetch(
                        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name`,
                        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
                    );
                    const locData = await locRes.json();
                    locationValid = !locData.error && locData.locations && locData.locations.length > 0;
                } else {
                    // No account name stored — try to validate location directly
                    const locRes = await fetch(
                        `https://mybusinessbusinessinformation.googleapis.com/v1/${project.google_location_id}?readMask=name`,
                        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
                    );
                    locationValid = locRes.ok;
                }

                if (!locationValid) {
                    console.warn(`[GOOGLE-HEALTH] Location validation failed for project ${project.id}`);
                    await supabase
                        .from('ai_projects')
                        .update({ google_connected: false })
                        .eq('id', project.id);

                    results.push({ projectId: project.id, status: 'disconnected', reason: 'location_fetch_failed' });
                    continue;
                }

                // Validation passed — update timestamps
                await supabase
                    .from('ai_projects')
                    .update({
                        google_access_token: tokenData.access_token,
                        google_last_validated_at: new Date().toISOString(),
                    })
                    .eq('id', project.id);

                results.push({ projectId: project.id, status: 'healthy' });

            } catch (projectError) {
                console.error(`[GOOGLE-HEALTH] Error validating project ${project.id}:`, projectError);
                await supabase
                    .from('ai_projects')
                    .update({ google_connected: false })
                    .eq('id', project.id);

                results.push({ projectId: project.id, status: 'disconnected', reason: 'unexpected_error' });
            }
        }

        const healthy = results.filter(r => r.status === 'healthy').length;
        const disconnected = results.filter(r => r.status === 'disconnected').length;
        console.log(`[GOOGLE-HEALTH] Done: ${healthy} healthy, ${disconnected} disconnected`);

        return NextResponse.json({
            success: true,
            total: projects.length,
            healthy,
            disconnected,
            results,
        });
    } catch (err) {
        console.error('[GOOGLE-HEALTH] Cron job error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
