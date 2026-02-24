/**
 * Action Registry
 * Maps action names to service handlers with feature permission guards.
 * Only registered actions can be executed — no dynamic dispatch.
 */

import type { ActionResult, ActionRegistryEntry, ActionContext } from '@/lib/types';
import * as googleService from '@/services/googleService';
import * as seoService from '@/services/seoService';

// ────────────────────────────────────────────────────────
// Registry: action name → handler + required feature
// ────────────────────────────────────────────────────────
const registry: Record<string, ActionRegistryEntry> = {
    reply_google_review: {
        handler: googleService.replyToLatestReviews,
        requiredFeature: 'google_review_reply',
        description: 'Reply to unreplied Google Business reviews with AI-generated responses',
    },
    update_business_description: {
        handler: googleService.updateProfile,
        requiredFeature: 'google_review_reply',
        description: 'Update the Google Business profile description',
    },
    generate_seo_post: {
        handler: seoService.generatePost,
        requiredFeature: 'seo_content',
        description: 'Generate an SEO-optimized promotional post',
    },
    generate_seo_description: {
        handler: seoService.generateOptimizedDescription,
        requiredFeature: 'seo_content',
        description: 'Generate an SEO-optimized business description',
    },
    suggest_keywords: {
        handler: seoService.suggestKeywords,
        requiredFeature: 'seo_content',
        description: 'Suggest SEO keywords for the business',
    },
};

// ────────────────────────────────────────────────────────
// Execute a registered action with permission guard
// ────────────────────────────────────────────────────────
export async function executeAction(
    actionName: string,
    payload: Record<string, unknown>,
    context: ActionContext,
): Promise<ActionResult> {
    // 1. Check if action exists in registry
    const entry = registry[actionName];
    if (!entry) {
        console.warn(`[ACTION-REG] Unknown action: "${actionName}"`);
        return {
            success: false,
            message: `❌ I don't know how to perform "${actionName}". Please try rephrasing your request.`,
            error: `Unregistered action: ${actionName}`,
        };
    }

    // 2. Feature permission guard
    const enabledFeatures: string[] = context.project.enabled_features || [];
    if (!enabledFeatures.includes(entry.requiredFeature)) {
        console.warn(`[ACTION-REG] Feature "${entry.requiredFeature}" not enabled for action "${actionName}"`);
        return {
            success: false,
            message: `❌ This feature is not enabled for your project. Please enable "${entry.requiredFeature}" in your AI builder settings to use this action.`,
            error: `Feature not enabled: ${entry.requiredFeature}`,
        };
    }

    // 3. Execute via handler
    console.log(`[ACTION-REG] Executing: "${actionName}" (feature: ${entry.requiredFeature})`);
    try {
        const result = await entry.handler(payload, context);
        console.log(`[ACTION-REG] Result: ${result.success ? 'SUCCESS' : 'FAILED'} — ${result.message}`);
        return result;
    } catch (err) {
        console.error(`[ACTION-REG] Unexpected error executing "${actionName}":`, err);
        return {
            success: false,
            message: '❌ Something went wrong while executing this action. Please try again.',
            error: String(err),
        };
    }
}

// ────────────────────────────────────────────────────────
// List registered actions (for diagnostics)
// ────────────────────────────────────────────────────────
export function listActions(): Array<{ name: string; requiredFeature: string; description: string }> {
    return Object.entries(registry).map(([name, entry]) => ({
        name,
        requiredFeature: entry.requiredFeature,
        description: entry.description,
    }));
}
