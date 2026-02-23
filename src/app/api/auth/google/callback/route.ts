import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // State contains projectId
    const error = searchParams.get('error');

    if (error || !code || !state) {
        return NextResponse.redirect(new URL(`/builder/${state}?error=google_oauth_failed`, request.url));
    }

    const projectId = state;
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Google token error:', tokenData.error, tokenData.error_description);
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_token_exchange`, request.url));
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch user's Google Business Locations to get the primary location ID
        const locationResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });

        const locationData = await locationResponse.json();
        let locationId = '';

        if (locationData.accounts && locationData.accounts.length > 0) {
            // Usually, an account contains multiple locations. We fetch locations for their first account.
            const accountName = locationData.accounts[0].name;
            const locListResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`, {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });
            const locListData = await locListResponse.json();
            if (locListData.locations && locListData.locations.length > 0) {
                locationId = locListData.locations[0].name; // format is "locations/XXXXX"
            }
        }

        // Save tokens and location to DB
        // If the user already authorized the app before, Google might omit the refresh_token.
        // We only overwrite the refresh_token if a new one is provided.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
            google_access_token: tokenData.access_token,
            google_location_id: locationId,
        };
        if (tokenData.refresh_token) {
            updatePayload.google_refresh_token = tokenData.refresh_token;
        }

        const { error: dbError } = await supabase
            .from('ai_projects')
            .update(updatePayload)
            .eq('id', projectId);

        if (dbError) {
            console.error('Failed to save Google tokens:', dbError);
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=db_save_failed`, request.url));
        }

        return NextResponse.redirect(new URL(`/builder/${projectId}?google=connected`, request.url));

    } catch (err) {
        console.error('Google callback error:', err);
        return NextResponse.redirect(new URL(`/builder/${projectId}?error=internal_server_error`, request.url));
    }
}
