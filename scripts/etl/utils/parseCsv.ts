import fs from 'fs';
import { parse } from 'csv-parse';

export async function parseCsv<T>(filePath: string): Promise<T[]> {
    const results: T[] = [];
    const parser = fs
        .createReadStream(filePath)
        .pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }));

    for await (const record of parser) {
        results.push(record);
    }

    return results;
}
