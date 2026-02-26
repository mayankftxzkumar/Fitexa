import { createAdminClient } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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
        // ─────────────────────────────────────────────────
        // STEP 1: Exchange code for tokens (hold in memory)
        // ─────────────────────────────────────────────────
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
            console.error('[Google Callback] Token exchange failed:', tokenData.error, tokenData.error_description);
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_token_exchange`, request.url));
        }

        // Hold tokens in memory — DO NOT save to DB yet
        const accessToken: string = tokenData.access_token;
        const refreshToken: string | undefined = tokenData.refresh_token;

        if (!accessToken) {
            console.error('[Google Callback] No access_token received');
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_no_access_token`, request.url));
        }

        // ─────────────────────────────────────────────────
        // STEP 2: Fetch Google Business accounts
        // ─────────────────────────────────────────────────
        const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        const accountsData = await accountsResponse.json();

        if (accountsData.error || !accountsData.accounts || accountsData.accounts.length === 0) {
            console.error('[Google Callback] No accounts found:', JSON.stringify(accountsData));
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_no_accounts`, request.url));
        }

        const accountName: string = accountsData.accounts[0].name;

        // ─────────────────────────────────────────────────
        // STEP 3: Fetch locations for the account
        // ─────────────────────────────────────────────────
        const locListResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,categories,profile`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const locListData = await locListResponse.json();

        if (locListData.error || !locListData.locations || locListData.locations.length === 0) {
            console.error('[Google Callback] No locations found:', JSON.stringify(locListData));
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_no_locations`, request.url));
        }

        // ─────────────────────────────────────────────────
        // STEP 4: Extract first valid location metadata
        // ─────────────────────────────────────────────────
        const loc = locListData.locations[0];
        const locationId: string = loc.name || '';

        if (!locationId) {
            console.error('[Google Callback] Location has no name/id');
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_no_location_id`, request.url));
        }

        let businessName = '';
        let businessLocation = '';
        let businessCategory = '';
        let businessDescription = '';

        if (loc.title) {
            businessName = loc.title;
        }

        if (loc.storefrontAddress) {
            const addr = loc.storefrontAddress;
            const parts = [
                addr.locality,
                addr.administrativeArea,
                addr.regionCode,
            ].filter(Boolean);
            businessLocation = parts.join(', ');
        }

        if (loc.categories?.primaryCategory?.displayName) {
            businessCategory = loc.categories.primaryCategory.displayName;
        }

        if (loc.profile?.description) {
            businessDescription = loc.profile.description;
        }

        // ─────────────────────────────────────────────────
        // STEP 5: Atomic DB update — ALL fields at once
        //         Only reaches here if ALL above steps passed
        // ─────────────────────────────────────────────────
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
            google_access_token: accessToken,
            google_location_id: locationId,
            google_account_name: accountName,
            google_connected: true,
            google_connected_at: now,
            google_last_validated_at: now,
        };

        // Only save refresh_token if provided (first auth always provides it)
        if (refreshToken) {
            updatePayload.google_refresh_token = refreshToken;
        }

        // Auto-fill business data from Google
        if (businessName) updatePayload.business_name = businessName;
        if (businessLocation) updatePayload.business_location = businessLocation;
        if (businessCategory) updatePayload.business_category = businessCategory;
        if (businessDescription) updatePayload.business_description = businessDescription;

        const { error: dbError } = await supabase
            .from('ai_projects')
            .update(updatePayload)
            .eq('id', projectId);

        if (dbError) {
            console.error('[Google Callback] Failed to save Google data:', dbError);
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_db_save_failed`, request.url));
        }

        // Auto-enable google_review_reply feature after successful GBP connection
        try {
            const { data: project } = await supabase
                .from('ai_projects')
                .select('enabled_features')
                .eq('id', projectId)
                .single();

            const currentFeatures: string[] = project?.enabled_features || [];

            if (!currentFeatures.includes('google_review_reply')) {
                const updatedFeatures = [...currentFeatures, 'google_review_reply'];

                const { error: featErr } = await supabase
                    .from('ai_projects')
                    .update({ enabled_features: updatedFeatures })
                    .eq('id', projectId);

                if (featErr) {
                    console.error('[Google Callback] Failed to auto-enable google_review_reply:', featErr);
                }
            }
        } catch (featError) {
            console.error('[Google Callback] Error auto-enabling google_review_reply:', featError);
        }

        return NextResponse.redirect(new URL(`/builder/${projectId}?google=connected`, request.url));

    } catch (err) {
        console.error('[Google Callback] Unexpected error:', err);
        return NextResponse.redirect(new URL(`/builder/${projectId}?error=google_unexpected_error`, request.url));
    }
}
