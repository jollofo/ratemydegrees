/** Sentiment is never a moderation signal. Queue possible private data for review. */
export function checkReviewContent(responses: Record<string, string>): { flagged: boolean; reasons: string[]; riskScore: number } {
    const text = Object.values(responses).join(' ');
    const reasons: string[] = [];
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) reasons.push('Contains potential email address');
    if (/(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text)) reasons.push('Contains potential phone number');
    if (/https?:\/\/\S+/i.test(text)) reasons.push('Contains external URL');
    return { flagged: reasons.length > 0, reasons, riskScore: reasons.length * 30 };
}
