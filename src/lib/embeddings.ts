import { pipeline } from '@xenova/transformers';

let extractor: any = null;

/**
 * Generates a 384-dimensional vector embedding for a given text query or document
 * using the local all-MiniLM-L6-v2 ONNX model.
 */
export async function getEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
        return new Array(384).fill(0);
    }
    
    if (!extractor) {
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    const output = await extractor(text.trim(), { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
}
