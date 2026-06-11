/**
 * Typesense Indexing Script
 * Run with: npm run typesense:index
 *
 * Creates/updates the majors and institutions collections in Typesense
 * and pushes all records from the database.
 * Safe to re-run — recreates collections to apply schema modifications.
 *
 * IMPORTANT: This script MUST be run to synchronize Typesense whenever:
 * 1. Database major descriptions/definitions are updated (e.g. from IPEDS).
 * 2. New MajorAlias records are loaded or edited.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Typesense from 'typesense';
import path from 'path';
import { parseCsv } from './etl/utils/parseCsv';
import prisma from '../src/lib/prisma';
import { getEmbedding } from '../src/lib/embeddings';

const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST!;
const port = parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? '443');
const protocol = process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? 'https';
const adminKey = process.env.TYPESENSE_ADMIN_KEY!;

if (!host || !adminKey) {
    console.error('❌  Missing NEXT_PUBLIC_TYPESENSE_HOST or TYPESENSE_ADMIN_KEY in .env');
    process.exit(1);
}

const client = new Typesense.Client({
    nodes: [{ host, port, protocol: protocol as 'https' | 'http' }],
    apiKey: adminKey,
    connectionTimeoutSeconds: 10,
});

// ─── Schema Definitions ──────────────────────────────────────────────────────

const majorsSchema = {
    name: 'majors',
    fields: [
        { name: 'id', type: 'string' as const },
        { name: 'cip4', type: 'string' as const },
        { name: 'title', type: 'string' as const },
        { name: 'category', type: 'string' as const, optional: true },
        { name: 'description', type: 'string' as const, optional: true },
        { name: 'aliases', type: 'string[]' as const, optional: true },
        { name: 'reviewCount', type: 'int32' as const },
        { name: 'salaryRange', type: 'string' as const, optional: true },
        { name: 'commonJobs', type: 'string[]' as const, optional: true },
        { name: 'vec', type: 'float[]' as const, num_dim: 384 },
    ],
    default_sorting_field: 'reviewCount',
};

const institutionsSchema = {
    name: 'institutions',
    fields: [
        { name: 'id', type: 'string' as const },
        { name: 'unitid', type: 'string' as const },
        { name: 'name', type: 'string' as const },
        { name: 'city', type: 'string' as const, optional: true },
        { name: 'state', type: 'string' as const, optional: true, facet: true },
        { name: 'control', type: 'string' as const, optional: true, facet: true },
        { name: 'reviewCount', type: 'int32' as const },
        { name: 'aliases', type: 'string[]' as const, optional: true },
        { name: 'vec', type: 'float[]' as const, num_dim: 384 },
    ],
    default_sorting_field: 'reviewCount',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureCollection(schema: typeof majorsSchema | typeof institutionsSchema) {
    try {
        await client.collections(schema.name).retrieve();
        console.log(`  ℹ️  Collection "${schema.name}" already exists — deleting to apply new schema...`);
        await client.collections(schema.name).delete();
    } catch {
        // Collection doesn't exist, which is fine
    }
    
    console.log(`  ➕  Creating collection "${schema.name}"...`);
    await client.collections().create(schema as any);
    console.log(`  ✅  Collection "${schema.name}" created.`);
}

// ─── Indexing Functions ───────────────────────────────────────────────────────

async function indexMajors() {
    console.log('\n📚  Fetching majors from database...');
    await ensureCollection(majorsSchema);

    const majors = await prisma.major.findMany({
        select: {
            cip4: true,
            title: true,
            category: true,
            description: true,
            outcomes: true,
            aliases: {
                select: {
                    alias: true
                }
            },
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    console.log(`  Generating vector embeddings for ${majors.length} majors...`);
    const records = [];
    for (let i = 0; i < majors.length; i++) {
        const m = majors[i];
        const outcomes = m.outcomes ? JSON.parse(m.outcomes) : null;
        const aliasesList = m.aliases.map((a) => a.alias);

        // Combine title + description + aliases for vector search corpus
        const searchCorpus = `${m.title} ${m.description ?? ''} ${aliasesList.join(' ')}`.trim();
        const vec = await getEmbedding(searchCorpus);

        records.push({
            id: m.cip4,
            cip4: m.cip4,
            title: m.title,
            category: m.category ?? '',
            description: m.description ?? '',
            aliases: aliasesList,
            reviewCount: m._count.reviews,
            salaryRange: outcomes?.salaryRange ?? '',
            commonJobs: outcomes?.commonJobs ?? [],
            vec,
        });

        if ((i + 1) % 100 === 0) {
            console.log(`  ✓  Embedded ${i + 1}/${majors.length} majors...`);
        }
    }

    console.log(`  → Upserting ${records.length} majors...`);

    // Import in batches of 500
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await client.collections('majors').documents().import(batch, { action: 'upsert' });
        console.log(`  ✓  Batch ${Math.floor(i / batchSize) + 1} done (${Math.min(i + batchSize, records.length)}/${records.length})`);
    }

    console.log('  ✅  Majors indexed.');
}

function parseAliases(aliasStr: string): string[] {
    if (!aliasStr || !aliasStr.trim()) return [];
    
    // Split by ||, |, comma, or double-or-more spaces
    const parts = aliasStr.split(/[|,\n\r\t]+|\s{2,}/);
    
    return parts
        .map(p => p.trim())
        .filter(p => p.length > 0 && p.toLowerCase() !== 'null' && p.toLowerCase() !== '-2');
}

async function indexInstitutions() {
    console.log('\n🏛️   Fetching institutions from database...');
    await ensureCollection(institutionsSchema);

    const institutions = await prisma.institution.findMany({
        where: { active: true },
        select: {
            unitid: true,
            name: true,
            city: true,
            state: true,
            control: true,
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    const filePath = path.join(process.cwd(), 'data', 'hd2024.csv');
    console.log(`  Reading aliases from IPEDS dataset: ${filePath}...`);
    const csvRecords = await parseCsv<any>(filePath);
    const aliasMap = new Map<string, string[]>();
    for (const record of csvRecords) {
        const unitid = String(record['UNITID']);
        const aliasStr = record['IALIAS'] || '';
        const aliases = parseAliases(aliasStr);
        if (aliases.length > 0) {
            aliasMap.set(unitid, aliases);
        }
    }

    console.log(`  Generating vector embeddings for ${institutions.length} institutions...`);
    const records = [];
    for (let i = 0; i < institutions.length; i++) {
        const inst = institutions[i];
        const aliasesList = aliasMap.get(inst.unitid) ?? [];
        
        // Combine name + city + state + aliases for vector search corpus
        const searchCorpus = `${inst.name} ${inst.city ?? ''} ${inst.state ?? ''} ${aliasesList.join(' ')}`.trim();
        const vec = await getEmbedding(searchCorpus);

        records.push({
            id: inst.unitid,
            unitid: inst.unitid,
            name: inst.name,
            city: inst.city ?? '',
            state: inst.state ?? '',
            control: inst.control ?? '',
            reviewCount: inst._count.reviews,
            aliases: aliasesList,
            vec,
        });

        if ((i + 1) % 1000 === 0) {
            console.log(`  ✓  Embedded ${i + 1}/${institutions.length} institutions...`);
        }
    }

    console.log(`  → Upserting ${records.length} institutions...`);

    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await client.collections('institutions').documents().import(batch, { action: 'upsert' });
        console.log(`  ✓  Batch ${Math.floor(i / batchSize) + 1} done (${Math.min(i + batchSize, records.length)}/${records.length})`);
    }

    console.log('  ✅  Institutions indexed.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🔍  Starting Typesense indexing...');
    try {
        await indexMajors();
        await indexInstitutions();
        console.log('\n🎉  All collections updated successfully!\n');
    } catch (err) {
        console.error('❌  Indexing failed:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
