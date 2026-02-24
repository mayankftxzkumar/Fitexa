/**
 * Runtime Environment Variable Guard
 * Validates that all critical environment variables are set.
 * Called once during initialization — throws a clear error if any are missing.
 * This prevents silent failures in production.
 */

interface EnvVar {
    name: string;
    required: boolean;
    serverOnly: boolean; // True = must NOT be NEXT_PUBLIC_
}

const REQUIRED_ENV_VARS: EnvVar[] = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, serverOnly: false },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, serverOnly: false },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, serverOnly: true },
    { name: 'PERPLEXITY_API_KEY', required: true, serverOnly: true },
    { name: 'GOOGLE_CLIENT_ID', required: true, serverOnly: true },
    { name: 'GOOGLE_CLIENT_SECRET', required: true, serverOnly: true },
    { name: 'CRON_SECRET', required: true, serverOnly: true },
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
    { name: 'NEXT_PUBLIC_APP_URL', required: false, serverOnly: false },
];

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const v of REQUIRED_ENV_VARS) {
        if (!process.env[v.name]) {
            missing.push(v.name);
        }
    }

    for (const v of OPTIONAL_ENV_VARS) {
        if (!process.env[v.name]) {
            warnings.push(`${v.name} is not set — using fallback behavior`);
        }
    }

    if (missing.length > 0) {
        console.error(`[ENV-GUARD] ❌ Missing critical environment variables: ${missing.join(', ')}`);
    }

    if (warnings.length > 0) {
        for (const w of warnings) {
            console.warn(`[ENV-GUARD] ⚠️ ${w}`);
        }
    }

    return { valid: missing.length === 0, missing, warnings };
}
