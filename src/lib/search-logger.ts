import fs from 'fs';
import path from 'path';

export interface SearchGapLog {
    timestamp: string;
    query: string;
    type: 'major' | 'institution_for_major';
    cip4?: string;
    resolvedMajorTitle?: string;
    details?: string;
}

/**
 * Logs a search query that returned zero results to help identify gaps in synonyms,
 * aliases, or academic catalog coverage.
 */
export function logSearchGap(log: Omit<SearchGapLog, 'timestamp'>) {
    try {
        const logEntry: SearchGapLog = {
            timestamp: new Date().toISOString(),
            ...log
        };
        
        // Write to local jsonl file for audit
        const dir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const filePath = path.join(dir, 'search_gaps.jsonl');
        fs.appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf8');
        
        // Also write to standard logs for Vercel/Sentry
        console.warn(
            `🔍 [SEARCH GAP] type=${log.type} query="${log.query}" cip4=${log.cip4 ?? 'none'} title="${log.resolvedMajorTitle ?? 'none'}" details="${log.details ?? 'none'}"`
        );
    } catch (err) {
        console.error('Failed to log search gap:', err);
    }
}
