import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'IPEDS.csv');
const rawContent = fs.readFileSync(filePath, 'utf-8');
const cleanedContent = rawContent.replace(/="(.*?)"/g, '"$1"');
const lines = cleanedContent.split('\n');
for (let i = 0; i < lines.length; i++) {
    try {
        parse(lines[i], { relax_quotes: true });
    } catch (e: any) {
        console.log(`Failed at line ${i + 1}: ${e.message}`);
        console.log(`Line content: ${lines[i]}`);
        break;
    }
}
