import { pipeline } from '@xenova/transformers';

async function main() {
    console.log('Initializing embedding pipeline...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log('Generating embedding for "Biomedical Engineering"...');
    const text = 'Biomedical Engineering. A program that focuses on applying engineering principles...';
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    const vector = Array.from(output.data);
    console.log(`Success! Embedding length: ${vector.length}`);
    console.log('Sample dimensions (first 5):', vector.slice(0, 5));
}

main().catch(console.error);
