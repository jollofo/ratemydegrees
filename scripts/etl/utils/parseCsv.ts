import fs from 'fs';
import { parse } from 'csv-parse';

export async function parseCsv<T>(filePath: string): Promise<T[]> {
    const results: T[] = [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Clean Excel artifacts: replace ="value" with "value"
    // We replace /="/g with '"'
    const cleanedContent = fileContent.replace(/="/g, '"');

    const parser = parse(cleanedContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        skip_records_with_error: true,
    });

    for await (const record of parser) {
        results.push(record);
    }

    return results;
}
