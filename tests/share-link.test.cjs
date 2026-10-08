const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);

const { shareLink } = require('../src/lib/share-link.ts');
const { degreeUrl, programUrl } = require('../src/lib/review-links.ts');
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const ShareLink = require('../src/components/ShareLink.tsx').default;
const ReviewPrivacyNote = require('../src/components/ReviewPrivacyNote.tsx').default;
Module._load = originalLoad;
const url = degreeUrl('42.01');

test('share destinations are exact canonical degree and program URLs', () => {
    assert.equal(url, 'https://ratemydegrees.com/majors/42.01');
    assert.equal(programUrl('42.01', '134130'), 'https://ratemydegrees.com/majors/42.01/134130');
});

test('native sharing uses the canonical URL and copy remains available', async () => {
    const calls = [];
    const target = {
        share: async data => { calls.push(['share', data]); },
        clipboard: { writeText: async text => { calls.push(['copy', text]); } },
    };
    assert.equal(await shareLink(target, url, 'Psychology reviews'), 'shared');
    assert.equal(await shareLink(target, url, 'Psychology reviews', true), 'copied');
    assert.deepEqual(calls, [['share', { title: 'Psychology reviews', url }], ['copy', url]]);
});

test('sharing falls back to copy when native share is absent, including repeated uses', async () => {
    const copied = [];
    const target = { clipboard: { writeText: async text => { copied.push(text); } } };
    assert.equal(await shareLink(target, url, 'Psychology reviews'), 'copied');
    assert.equal(await shareLink(target, url, 'Psychology reviews'), 'copied');
    assert.deepEqual(copied, [url, url]);
});

test('cancellation, failures, and unavailable clipboard have distinct results', async () => {
    const cancellation = Object.assign(new Error('Dismissed'), { name: 'AbortError' });
    assert.equal(await shareLink({ share: async () => { throw cancellation; } }, url, 'Psychology reviews'), 'canceled');
    assert.equal(await shareLink({ share: async () => { throw new Error('Blocked'); } }, url, 'Psychology reviews'), 'error');
    assert.equal(await shareLink({ clipboard: { writeText: async () => { throw new Error('Blocked'); } } }, url, 'Psychology reviews', true), 'error');
    assert.equal(await shareLink({}, url, 'Psychology reviews'), 'unavailable');
});

test('share controls and public-display note render accessible labels and feedback', () => {
    const html = renderToStaticMarkup(React.createElement(ShareLink, { url, title: 'Psychology reviews', label: 'Share degree at this school' }));
    assert.match(html, /type="button"[^>]*>Share degree at this school<\/button>/);
    assert.match(html, /type="button"[^>]*>Copy link<\/button>/);
    assert.match(html, /role="status"[^>]*aria-live="polite"/);
    const note = renderToStaticMarkup(React.createElement(ReviewPrivacyNote));
    assert.match(note, /name and account details are not displayed/);
    assert.match(note, /rating, review month, and written responses are public/);
});
