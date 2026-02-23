export interface AIProject {
    id: string;
    user_id: string;
    ai_name: string;
    business_name: string;
    business_location: string;
    business_category: string;
    business_description: string;
    telegram_token: string;
    enabled_features: string[];
    status: 'draft' | 'active';
    webhook_url: string;
    current_step: number;
    created_at: string;
    updated_at: string;
    google_access_token?: string;
    google_refresh_token?: string;
    google_location_id?: string;
    telegram_bot_username?: string;
}

export interface AILead {
    id: string;
    project_id: string;
    chat_id: number;
    name?: string;
    contact_info?: string;
    interest_level?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AITask {
    id: string;
    project_id: string;
    chat_id?: number;
    action_type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any;
    execute_at: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface AIFeature {
    id: string;
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
    disabled?: boolean;       // future placeholder
    comingSoon?: boolean;
}

export const PREBUILT_FEATURES: AIFeature[] = [
    {
        id: 'auto_lead_reply',
        name: 'Auto Lead Reply',
        description: 'Instantly respond to incoming Telegram messages with AI-powered replies.',
        icon: '⚡',
        enabled: false,
    },
    {
        id: 'trial_booking',
        name: 'Trial Booking Assistant',
        description: 'Collect user name and preferred time to book trial sessions automatically.',
        icon: '📅',
        enabled: false,
    },
    {
        id: 'follow_up_reminder',
        name: 'Follow-Up Reminder',
        description: 'Auto-message leads after interactions to keep them engaged.',
        icon: '🔔',
        enabled: false,
    },
    {
        id: 'google_review_reply',
        name: 'Google Review Auto Reply',
        description: 'Automatically respond to Google reviews with smart replies.',
        icon: '⭐',
        enabled: false,
        disabled: true,
        comingSoon: true,
    },
    {
        id: 'seo_content',
        name: 'Auto SEO Content Generator',
        description: 'Generate weekly business post content optimized for search and engagement.',
        icon: '📝',
        enabled: false,
    },
    {
        id: 'renewal_reminder',
        name: 'Member Renewal Reminder',
        description: 'Scheduled reminder system for upcoming membership renewals.',
        icon: '🔄',
        enabled: false,
    },
];
