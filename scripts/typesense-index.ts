/**
 * Typesense Indexing Script
 * Run with: npm run typesense:index
 *
 * Creates/updates the majors and institutions collections in Typesense
 * and pushes all records from the database.
 * Safe to re-run — uses upsert mode.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Typesense from 'typesense';
import prisma from '../src/lib/prisma';

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
        { name: 'reviewCount', type: 'int32' as const },
        { name: 'salaryRange', type: 'string' as const, optional: true },
        { name: 'commonJobs', type: 'string[]' as const, optional: true },
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
    ],
    default_sorting_field: 'reviewCount',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureCollection(schema: typeof majorsSchema | typeof institutionsSchema) {
    try {
        await client.collections(schema.name).retrieve();
        console.log(`  ℹ️  Collection "${schema.name}" already exists — will upsert records.`);
    } catch {
        console.log(`  ➕  Creating collection "${schema.name}"...`);
        await client.collections().create(schema as any);
        console.log(`  ✅  Collection "${schema.name}" created.`);
    }
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
            _count: {
                select: { reviews: { where: { status: 'APPROVED' } } }
            }
        }
    });

    const records = majors.map((m) => {
        const outcomes = m.outcomes ? JSON.parse(m.outcomes) : null;
        return {
            id: m.cip4,
            cip4: m.cip4,
            title: m.title,
            category: m.category ?? '',
            description: m.description ?? '',
            reviewCount: m._count.reviews,
            salaryRange: outcomes?.salaryRange ?? '',
            commonJobs: outcomes?.commonJobs ?? [],
        };
    });

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

    const records = institutions.map((i) => ({
        id: i.unitid,
        unitid: i.unitid,
        name: i.name,
        city: i.city ?? '',
        state: i.state ?? '',
        control: i.control ?? '',
        reviewCount: i._count.reviews,
    }));

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
