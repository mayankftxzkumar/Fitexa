import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // API routes can use anon or service_role
const perplexityKey = process.env.PERPLEXITY_API_KEY!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function GET(request: Request) {
    // Basic auth to prevent random invocations if needed, Vercel cron uses a bearer token
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch active projects that have Google Location ID configured
        const { data: projects, error } = await supabase
            .from('ai_projects')
            .select('*')
            .eq('status', 'active')
            .not('google_location_id', 'is', null)
            .not('google_refresh_token', 'is', null);

        if (error || !projects) {
            console.error('Failed to fetch projects for cron:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const results = [];

        for (const project of projects) {
            try {
                // 1. Refresh Google Access Token
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
                    console.error(`Failed to refresh token for project ${project.id}:`, tokenData.error);
                    continue;
                }
                const newAccessToken = tokenData.access_token;

                // Update access token in DB (optional but good practice)
                await supabase.from('ai_projects').update({ google_access_token: newAccessToken }).eq('id', project.id);

                // 2. Fetch Unreplied Reviews
                // Location ID format: 'locations/12345' or 'accounts/XYZ/locations/12345' depending on API version
                // The v1 API usually uses accounts/{accountId}/locations/{locationId}
                const reviewsUrl = `https://mybusiness.googleapis.com/v4/${project.google_location_id}/reviews`;
                const reviewsRes = await fetch(reviewsUrl, {
                    headers: { 'Authorization': `Bearer ${newAccessToken}` }
                });

                if (!reviewsRes.ok) {
                    console.error(`Failed to fetch reviews for ${project.id}:`, await reviewsRes.text());
                    continue;
                }

                const reviewsData = await reviewsRes.json();
                const reviews = reviewsData.reviews || [];

                let repliedCount = 0;

                // 3. Process Reviews
                for (const review of reviews) {
                    // Skip if already replied
                    if (review.reviewReply) continue;

                    // Generate AI Reply using Perplexity
                    const systemPrompt = `You are the owner of "${project.business_name}", a ${project.business_category} in ${project.business_location}. Provide a polite, professional, and SEO-friendly response to the following customer review. Keep it under 3 sentences. Mention the business name organically if positive. If negative, apologize professionally and offer an offline contact path.`;

                    const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${perplexityKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: 'sonar',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: `Rating: ${review.starRating}\nReview Text: ${review.comment}` }
                            ],
                            max_tokens: 150,
                        }),
                    });

                    if (!aiRes.ok) continue;

                    const aiData = await aiRes.json();
                    const aiReplyText = aiData?.choices?.[0]?.message?.content;

                    if (!aiReplyText) continue;

                    // 4. Post Reply to Google
                    const replyUrl = `https://mybusiness.googleapis.com/v4/${project.google_location_id}/reviews/${review.reviewId}/reply`;
                    const postReplyRes = await fetch(replyUrl, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${newAccessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ comment: aiReplyText })
                    });

                    if (postReplyRes.ok) {
                        repliedCount++;
                    }
                }

                results.push({ projectId: project.id, repliedCount });

            } catch (pError) {
                console.error(`Error processing project ${project.id}:`, pError);
            }
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (err) {
        console.error('Cron job error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
