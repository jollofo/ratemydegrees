export type ShareResult = 'shared' | 'copied' | 'canceled' | 'unavailable' | 'error';

type ShareTarget = {
    share?: (data: { title: string; url: string }) => Promise<void>;
    clipboard?: { writeText: (text: string) => Promise<void> };
};

export async function shareLink(target: ShareTarget, url: string, title: string, copyOnly = false): Promise<ShareResult> {
    try {
        if (!copyOnly && target.share) {
            await target.share({ title, url });
            return 'shared';
        }
        if (!target.clipboard?.writeText) return 'unavailable';
        await target.clipboard.writeText(url);
        return 'copied';
    } catch (error) {
        if (!copyOnly && error instanceof Error && error.name === 'AbortError') return 'canceled';
        return 'error';
    }
}
