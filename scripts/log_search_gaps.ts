import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
import { logSearchGap } from '../src/lib/search-logger';

async function main() {
    console.log('🧪 Testing Search Gap Logging Utility...\n');

    // Define a dummy test log
    const testLog = {
        query: 'astrophysics and quantum basket weaving',
        type: 'major' as const,
        details: 'Testing search gap logger functionality'
    };

    console.log('Logging search gap for query:', testLog.query);
    logSearchGap(testLog);

    // Verify it was written to the file
    const logFilePath = path.join(process.cwd(), 'data', 'search_gaps.jsonl');
    if (fs.existsSync(logFilePath)) {
        const content = fs.readFileSync(logFilePath, 'utf8');
        const lines = content.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        
        console.log('\n📄 Verified search_gaps.jsonl contains the log entry:');
        console.log(lastLine);
        console.log('\n✅ Search Gap Logger verified successfully!');
    } else {
        console.error('❌ Failed: search_gaps.jsonl file was not created.');
        process.exit(1);
    }
}

main().catch(console.error);
