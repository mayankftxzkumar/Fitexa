/**
 * Telegram Service Layer
 * Wraps Telegram Bot API calls for use by cron jobs and future channels.
 * The main webhook uses the webhook-response pattern (no API call needed),
 * so this service is for non-webhook sends only (follow-ups, summaries, etc.).
 */

// ────────────────────────────────────────────────────────
// Send a message via Telegram Bot API
// ────────────────────────────────────────────────────────
export async function sendMessage(
    token: string,
    chatId: number | string,
    text: string,
    parseMode: 'Markdown' | 'HTML' | '' = '',
): Promise<{ ok: boolean; error?: string }> {
    try {
        const body: Record<string, unknown> = {
            chat_id: chatId,
            text,
        };
        if (parseMode) body.parse_mode = parseMode;

        const res = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            },
        );

        const data = await res.json();

        if (!data.ok) {
            console.error('[TG-SERVICE] sendMessage failed:', data.description);
            return { ok: false, error: data.description || 'Unknown Telegram error' };
        }

        return { ok: true };
    } catch (error) {
        console.error('[TG-SERVICE] sendMessage error:', error);
        return { ok: false, error: 'Network error sending Telegram message' };
    }
}
