import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import Typesense from 'typesense';

const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST!;
const port = parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? '443');
const protocol = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https';
const adminKey = process.env.TYPESENSE_ADMIN_KEY!;

async function main() {
    console.log(`Connecting to Typesense at ${protocol}://${host}:${port}...`);
    const client = new Typesense.Client({
        nodes: [{ host, port, protocol: protocol as 'https' | 'http' }],
        apiKey: adminKey,
        connectionTimeoutSeconds: 10,
    });

    try {
        const health = await client.health.retrieve();
        console.log('Health check:', health);
        
        const debug = await client.debug.retrieve();
        console.log('Debug/Version details:', debug);
    } catch (err) {
        console.error('Error connecting to Typesense:', err);
    }
}

main();
