const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const { draftKey, draftLifetimeMs, writeDraft, readDraft, discardDraft } = require('../src/lib/review-draft.ts');
const { safeDestination } = require('../src/lib/navigation.ts');
Module._load = originalLoad;

function storage() {
    const values = new Map();
    return { values, setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) ?? null, removeItem: key => values.delete(key) };
}
const target = { majorId: '11.07', institutionId: '134130' };
const draft = { data: { majorId: '11.07', institutionId: '134130', status: 'current', graduationYear: '', ratings: { satisfaction: 4, rigor: 3 }, fit: 'Coursework experience', challenge: 'A difficult project', misconception: '', differently: '', outcomeStatus: '', jobTitle: '', industry: '', gradSchool: '', timeToOutcome: '' }, majorQuery: 'Computer Science', schoolQuery: 'University of Florida', step: 3 };

test('draft survives auth cancellation or callback and preserves every field and exact labels', () => {
    const local = storage();
    writeDraft(local, target, draft, 1000);
    assert.deepEqual(readDraft(local, target, 2000), draft);
    assert.deepEqual(readDraft(local, target, 3000), draft);
    assert.equal(safeDestination('/write-review?majorId=11.07&institutionId=134130'), '/write-review?majorId=11.07&institutionId=134130');
});

test('drafts are isolated by page target and expire after seven days', () => {
    const local = storage();
    writeDraft(local, target, draft, 1000);
    assert.equal(readDraft(local, { majorId: '52.02', institutionId: '134130' }, 2000), null);
    assert.equal(readDraft(local, target, 1000 + draftLifetimeMs + 1), null);
    assert.equal(local.getItem(draftKey(target)), null);
});

test('unavailable storage can be handled without uploading a draft', () => {
    const unavailable = { setItem() { throw Error('blocked'); }, getItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
    assert.throws(() => writeDraft(unavailable, target, draft));
    assert.throws(() => readDraft(unavailable, target));
});

test('draft clears only on explicit discard or successful submission cleanup', () => {
    const local = storage();
    writeDraft(local, target, draft, 1000);
    assert.deepEqual(readDraft(local, target, 2000), draft); // Failed submit leaves it intact.
    discardDraft(local, target);
    assert.equal(readDraft(local, target, 2000), null);
});

test('invalid draft content and unsafe auth destinations are rejected', () => {
    const local = storage();
    writeDraft(local, target, draft, 1000);
    const saved = JSON.parse(local.getItem(draftKey(target)));
    saved.target.majorId = '52.02';
    local.setItem(draftKey(target), JSON.stringify(saved));
    assert.equal(readDraft(local, target, 2000), null);
    assert.equal(safeDestination('//evil.example/write-review'), '/');
    assert.equal(safeDestination('/%2F%2Fevil.example'), '/');
});
