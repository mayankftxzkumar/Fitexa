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

        const supabase = createAdminClient();

        // Fetch user's Google Business accounts
        // NOTE: accounts listing lives on the Account Management API, NOT Business Information API
        const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });

        const accountsData = await accountsResponse.json();
        let locationId = '';
        let businessName = '';
        let businessLocation = '';
        let businessCategory = '';
        let businessDescription = '';

        if (accountsData.error) {
            console.warn('[Google Callback] Accounts API error:', accountsData.error);
        } else if (accountsData.accounts && accountsData.accounts.length > 0) {
            const accountName = accountsData.accounts[0].name;

            // Fetch locations for the first account (this endpoint IS on the Business Information API)
            const locListResponse = await fetch(
                `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,categories,profile`,
                { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
            );
            const locListData = await locListResponse.json();

            if (locListData.error) {
                console.warn('[Google Callback] Locations API error:', locListData.error);
            } else if (locListData.locations && locListData.locations.length > 0) {
                const loc = locListData.locations[0];
                locationId = loc.name || ''; // format: "locations/XXXXX"

                // Extract business name from title
                if (loc.title) {
                    businessName = loc.title;
                }

                // Extract address
                if (loc.storefrontAddress) {
                    const addr = loc.storefrontAddress;
                    const parts = [
                        addr.locality,
                        addr.administrativeArea,
                        addr.regionCode,
                    ].filter(Boolean);
                    businessLocation = parts.join(', ');
                }

                // Extract primary category
                if (loc.categories?.primaryCategory?.displayName) {
                    businessCategory = loc.categories.primaryCategory.displayName;
                }

                // Extract profile description
                if (loc.profile?.description) {
                    businessDescription = loc.profile.description;
                }
            }
        } else {
            console.warn('[Google Callback] No accounts found for this Google user');
        }

        // Save tokens, location, and business data to DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
            google_access_token: tokenData.access_token,
            google_location_id: locationId,
        };

        if (tokenData.refresh_token) {
            updatePayload.google_refresh_token = tokenData.refresh_token;
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
            console.error('Failed to save Google tokens:', dbError);
            return NextResponse.redirect(new URL(`/builder/${projectId}?error=db_save_failed`, request.url));
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
        console.error('Google callback error:', err);
        return NextResponse.redirect(new URL(`/builder/${projectId}?error=internal_server_error`, request.url));
    }
}
