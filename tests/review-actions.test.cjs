const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);

const id = 'cm123456789012345678901234';
let user = { id: 'current-user' }, calls = [], owned = null, existing = null, visible = 'APPROVED';
const prisma = {
    major: { findUnique: async () => ({ cip4: '11.07' }) }, institution: { findUnique: async () => ({ unitid: '134130' }) },
    review: {
        findUnique: async () => ({ status: visible }),
        findFirst: async args => args.where.id ? owned : existing,
        create: async args => { calls.push(['create',args]); return { id }; },
        update: async args => { calls.push(['update',args]); return { id }; },
        updateMany: async args => { calls.push(['delete',args]); return { count: owned && args.where.userId === user.id ? 1 : 0 }; },
    },
    reviewOutcome: { deleteMany: async () => {}, create: async args => { calls.push(['outcome',args]); } },
    report: { findFirst: async () => null, create: async args => { calls.push(['report',args]); } },
    vote: { upsert: async args => { calls.push(['vote',args]); }, count: async () => 7 },
    $transaction: async (fn, options) => { calls.push(['transaction', options]); return fn(prisma); },
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/lib/prisma') return { __esModule: true, default: prisma };
    if (request === '@/lib/user') return { getOrCreatePrismaUser: async () => { if (!user) throw Error('Must be signed in'); if(user.banned) throw Error('Account restricted'); return user; } };
    if (request === '@/lib/rate-limit') return { rateLimit: () => ({ success: true }), submitReviewLimiter: {}, reportLimiter: {}, voteLimiter: {} };
    if (request === 'next/cache') return { revalidatePath: () => {} };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const { submitReview } = require('../src/app/write-review/actions.ts');
const { deleteOwnReview } = require('../src/app/my-reviews/actions.ts');
const { voteReview, reportReview } = require('../src/lib/actions.ts');
const valid = { majorId: '11.07', institutionId: '134130', status: 'current', graduationYear: '', ratings: { satisfaction: 4 }, fit: 'The classes were interesting.', challenge: 'Group projects were challenging.', misconception: '', differently: '' };
test.beforeEach(() => { user = { id: 'current-user' }; calls = []; owned = null; existing = null; visible = 'APPROVED'; });

test('review and outcome are saved together at serializable isolation', async () => {
    const result = await submitReview({ ...valid, status: 'graduated', outcomeStatus: 'employed_full', jobTitle: 'Engineer' });
    assert.equal(result.status, 'APPROVED');
    assert.equal(calls.find(c=>c[0]==='transaction')[1].isolationLevel, 'Serializable');
    assert.equal(calls.filter(c=>c[0]==='create').length, 1);
    assert.equal(calls.filter(c=>c[0]==='outcome').length, 1);
});
test('duplicate submissions do not create a second review', async () => {
    existing = { id };
    await assert.rejects(submitReview(valid), /already have a review/);
    assert.equal(calls.some(c=>c[0]==='create'), false);
});
test('editing another user review fails before mutation', async () => {
    await assert.rejects(submitReview(valid, id), /unavailable for editing/);
    assert.equal(calls.some(c=>c[0]==='update'), false);
});
test('owned edits keep their school and return to moderation', async () => {
    owned = { id, cip4: '11.07', unitid: '134130' };
    assert.equal((await submitReview(valid, id)).status, 'PENDING');
    assert.equal(calls.find(c=>c[0]==='update')[1].where.userId, user.id);
    await assert.rejects(submitReview({ ...valid, majorId: '42.01' }, id), /cannot be changed/);
});
test('deletion always scopes its mutation to the current owner', async () => {
    await assert.rejects(deleteOwnReview(id), /not found/);
    assert.equal(calls.find(c=>c[0]==='delete')[1].where.userId, user.id);
    owned = { id };
    await deleteOwnReview(id);
    assert.equal(calls.at(-1)[1].data.status, 'DELETED');
});
test('reporting does not hide a review and votes return authoritative count', async () => {
    await reportReview(id, 'Contains identifying details');
    assert.equal(calls.some(c=>c[0]==='update'), false);
    assert.equal((await voteReview(id, 1)).votes, 7);
    visible = 'PENDING';
    await assert.rejects(voteReview(id, 1), /not found/);
});
test('unauthenticated and restricted contributors cannot mutate reviews', async () => {
    user = null; await assert.rejects(submitReview(valid), /signed in/);
    user = { id: 'current-user', banned: true }; await assert.rejects(deleteOwnReview(id), /restricted/);
    assert.equal(calls.length, 0);
});
