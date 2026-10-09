const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.tsx'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
let outcome = { status: 'PENDING', id: 'review-1' };
let failure = null;
let events = [], discarded = 0, pushes = [];
const realReact = require('react');
let hookIndex = 0;
const react = { ...realReact, useState(initial) { hookIndex++; return [hookIndex === 2 ? 3 : initial, () => {}]; }, useMemo(fn) { return fn(); }, useRef(initial) { return { current: initial }; }, useEffect() {} };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'react') return react;
    if (request === 'next/navigation') return { useRouter: () => ({ push: value => pushes.push(value), refresh() {} }) };
    if (request === './actions' && parent.filename.endsWith('ReviewForm.tsx')) return { submitReview: async () => { if (failure) throw failure; return outcome; } };
    if (request === '@/components/ReviewSearchField') return { __esModule: true, default: () => null };
    if (request === '@/lib/product-analytics') return { trackProductEventOnce: async (...args) => { events.push(args); return true; }, trackProductErrorOnce: async (key, stage, category) => { events.push([key, 'product_error', { stage, category }]); return true; } };
    if (request === '@/lib/review-draft') return { draftKey: () => 'target', discardDraft: () => { discarded++; }, readDraft: () => null, writeDraft() {} };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const ReviewForm = require('../src/app/write-review/ReviewForm.tsx').default;
Module._load = originalLoad;
global.localStorage = {};

const data = { majorId: '11.07', institutionId: '134130', status: 'current', graduationYear: '', ratings: { satisfaction: 4 }, fit: 'The coursework was useful.', challenge: 'Projects took substantial time.', misconception: '', differently: '', outcomeStatus: '', jobTitle: '', industry: '', gradSchool: '', timeToOutcome: '' };
function form() { hookIndex = 0; return ReviewForm({ majors: [], institutions: [], initialData: data, signedIn: true }).props; }
test.beforeEach(() => { outcome = { status: 'PENDING', id: 'review-1' }; failure = null; events = []; discarded = 0; pushes = []; });
test.after(() => { delete global.localStorage; });

test('confirmed server submission captures moderation status and clears the draft', async () => {
    await form().onSubmit({ preventDefault() {} });
    assert.equal(discarded, 1);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].slice(1), ['review_submitted', { major_id: '11.07', institution_id: '134130', status: 'pending' }]);
    assert.match(pushes[0], /^\/my-reviews\?/);
});

test('failed server submission sends only a categorized error and retains the draft', async () => {
    failure = Error('You already have a review for this degree');
    await form().onSubmit({ preventDefault() {} });
    assert.equal(discarded, 0);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].slice(1), ['product_error', { stage: 'review_submit', category: 'duplicate' }]);
    assert.equal(pushes.length, 0);
});
