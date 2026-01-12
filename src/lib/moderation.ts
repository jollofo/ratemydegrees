const PROHIBITED_KEYWORDS = [
    'administration', 'tuition', 'politic', 'housing', 'dining', 'cafeteria',
    'financial aid', 'parking', 'dorm', 'safety', 'campus', 'president',
    'chancellor', 'policy', 'liberal', 'conservative', 'woke', 'agenda',
    'scam', 'fraud', 'illegal', 'crime', 'lawsuit', 'sue', 'stole'
];

const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    url: /(https?:\/\/[^\s]+)/g
};

export function checkReviewContent(responses: any): { flagged: boolean, reasons: string[], riskScore: number } {
    const reasons: string[] = [];
    let riskScore = 0;
    const textToSearch = Object.values(responses).join(' ').toLowerCase();

    // Check Keywords
    PROHIBITED_KEYWORDS.forEach(keyword => {
        if (textToSearch.includes(keyword)) {
            reasons.push(`Off-topic: ${keyword}`);
            riskScore += 10;
        }
    });

    // Check PII
    if (PII_PATTERNS.email.test(textToSearch)) {
        reasons.push('Contains potential email address');
        riskScore += 30;
    }
    if (PII_PATTERNS.phone.test(textToSearch)) {
        reasons.push('Contains potential phone number');
        riskScore += 30;
    }
    if (PII_PATTERNS.url.test(textToSearch)) {
        reasons.push('Contains external URL');
        riskScore += 20;
    }

    return {
        flagged: riskScore > 0,
        reasons,
        riskScore
    };
}
