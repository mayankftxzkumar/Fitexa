import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!GOOGLE_CLIENT_ID) {
        console.error('Missing GOOGLE_CLIENT_ID environment variable');
        return NextResponse.redirect(new URL(`/builder/${projectId}?error=missing_google_creds`, request.url));
    }

    // Ensure we use the exact same redirect URI for callback verification
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Construct the Google OAuth URL requesting offline access to get a refresh token
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/business.manage');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent'); // Force consent to guarantee refresh token
    authUrl.searchParams.append('state', projectId); // Pass project ID back through state

    return NextResponse.redirect(authUrl.toString());
}
