const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Test application TypeScript with the installed compiler, without a separate runtime service.
require.extensions['.ts'] = (module, file) => {
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
    module._compile(output.outputText, file);
};
const schemas = require('../src/lib/validation.ts');
const { safeDestination, parsePage, searchText } = require('../src/lib/navigation.ts');
const { checkReviewContent } = require('../src/lib/moderation.ts');
const { toPublicReview, publicReviewSelect, jsonRecord } = require('../src/lib/reviews.ts');
const id = 'cm123456789012345678901234';
const valid = { majorId: '11.07', institutionId: '134130', status: 'current', graduationYear: '', ratings: { satisfaction: 4 }, fit: 'I enjoyed the programming classes.', challenge: 'Balancing group projects was difficult.', misconception: '', differently: '' };

test('generated CUID review IDs work across voting, reporting and moderation', () => {
    assert.equal(schemas.voteSchema.safeParse({ reviewId: id, value: 1 }).success, true);
    assert.equal(schemas.reportSchema.safeParse({ reviewId: id, reason: 'Contains personal information' }).success, true);
    assert.equal(schemas.moderationActionSchema.safeParse({ reviewId: id, action: 'APPROVE' }).success, true);
    for (const bad of ['', 'not-a-review', '../other', '<script>']) assert.equal(schemas.voteSchema.safeParse({ reviewId: bad, value: 1 }).success, false);
});

test('redirects retain program context and reject external or malformed destinations', () => {
    const context = '/write-review?majorId=11.07&institutionId=134130';
    assert.equal(safeDestination(context), context);
    for (const destination of ['https://evil.test', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/%5cevil.test', '/%0aevil.test', '/%', 'javascript:alert(1)']) assert.equal(safeDestination(destination), '/');
});

test('public review serialization drops identity and moderation data even from an oversized row', () => {
    const publicReview = toPublicReview({
        id, graduationStatus: 'current', createdAt: new Date('2026-01-01T00:00:00Z'),
        ratings: '{"satisfaction":4}', writtenResponses: '{"fit":"My experience","challenge":"My challenge","misconception":"My surprise","differently":"My reflection"}',
        major: { title: 'Computer Science', privateField: 'secret' }, institution: { name: 'Example school' },
        _count: { votes: 3 }, votes: [{ value: 1 }], userId: 'private-author', user: { email: 'private@example.test' }, flagReasons: 'private-reason', riskScore: 90,
    });
    const payload = JSON.stringify(publicReview);
    for (const value of ['private-author', 'private@example.test', 'private-reason', 'riskScore', 'privateField']) assert.equal(payload.includes(value), false);
    assert.equal(publicReview.responses.length, 4);
    assert.equal(publicReview.hasVoted, true);
    assert.equal(publicReview.votes, 3);
    assert.equal('user' in publicReviewSelect('viewer'), false);
    assert.equal('userId' in publicReviewSelect('viewer'), false);
});

test('repeated privacy checks remain deterministic and sentiment is not a flag', () => {
    for(let i = 0; i < 5; i++) assert.equal(checkReviewContent({ fit: 'Contact student@example.test' }).flagged, true);
    assert.equal(checkReviewContent({ fit: 'The campus classes were excellent and tuition was manageable.' }).flagged, false);
    assert.equal(checkReviewContent({ fit: 'The campus classes were poor and tuition was disappointing.' }).flagged, false);
});

test('server validation accepts N/A and extended study histories, but requires actual feedback', () => {
    const result = schemas.reviewFormSchema.parse({ ...valid, graduationYear: '2008–2024', ratings: { satisfaction: 4, research: 0, career: 0 } });
    assert.equal(result.ratings.research, undefined);
    assert.equal(result.ratings.career, undefined);
    assert.equal(schemas.reviewFormSchema.safeParse({ ...valid, ratings: { satisfaction: 0 } }).success, false);
    assert.equal(schemas.reviewFormSchema.safeParse({ ...valid, fit: ' ' }).success, false);
    assert.equal(schemas.reviewFormSchema.safeParse({ ...valid, graduationYear: '2024–2019' }).success, false);
    assert.equal(schemas.reviewFormSchema.safeParse({ ...valid, challenge: 'x'.repeat(5001) }).success, false);
});

test('query bounds and malformed legacy JSON cannot crash display helpers', () => {
    for (const value of [undefined, '-1', 'NaN', '0', '1.5']) assert.equal(parsePage(value), 1);
    assert.equal(parsePage('900000'), 10000);
    assert.equal(searchText(' x '.repeat(200)).length, 200);
    for (const value of ['bad', 'null', '[]', '3']) assert.deepEqual(jsonRecord(value), {});
});

test('rating summaries weight all reviews, exclude N/A, and enforce each category threshold', () => {
 const {summarizeRatings} = require('../src/lib/reviews.ts');
 const rows = [{ratings: JSON.stringify({satisfaction: 5, research: 4}), _count:{_all:4}}, {ratings: JSON.stringify({satisfaction:1,research:0}),_count:{_all:2}}, {ratings:'bad',_count:{_all:20}}];
 const summary=summarizeRatings(rows);
 assert.equal(summary.find(row=>row.label.toLowerCase().includes('satisfaction')).count,6);
 assert.equal(summary.find(row=>row.label.toLowerCase().includes('satisfaction')).score,3.7);
 const research=summary.find(row=>row.label.toLowerCase().includes('research'));
 assert.equal(research.count,4);
 assert.equal(research.score,null);
});

