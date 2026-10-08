const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);

let status = 'APPROVED';
const review = () => ({ id: 'review-1', cip4: '42.01', unitid: '134130', status, writtenResponses: '{}', major: { title: 'Psychology' }, institution: { name: 'Example University' } });
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/lib/prisma') return { __esModule: true, default: { review: { findMany: async () => [review()], count: async () => 1 } } };
    if (request === '@/utils/supabase/server') return { createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) } }) };
    if (request === '@/lib/auth-redirect') return { redirectToLogin: () => { throw new Error('unexpected redirect'); } };
    if (request === '@/lib/navigation') return { parsePage: () => 1 };
    if (request === '@/lib/reviews') return { jsonRecord: () => ({ fit: 'My experience.' }) };
    if (request === '@/components/DeleteReviewButton' || request === '@/components/Pagination') return { __esModule: true, default: () => null };
    if (request === '@/components/ShareLink') return { __esModule: true, default: ({ url }) => React.createElement('a', { href: url, 'data-share': true }, 'Share') };
    if (request === '@/lib/review-links') return require('../src/lib/review-links.ts');
    return originalLoad.call(this, request, parent, isMain);
};
const MyReviews = require('../src/app/my-reviews/page.tsx').default;
Module._load = originalLoad;

test('successful published submission offers the canonical program page', async () => {
    status = 'APPROVED';
    const html = renderToStaticMarkup(await MyReviews({ searchParams: { submitted: 'approved', reviewId: 'review-1' } }));
    assert.match(html, /Your review is published/);
    assert.match(html, /data-share="true"[^>]*href="https:\/\/ratemydegrees.com\/majors\/42.01\/134130"|href="https:\/\/ratemydegrees.com\/majors\/42.01\/134130"[^>]*data-share="true"/);
});

test('pending submission offers the page without claiming the review is public', async () => {
    status = 'PENDING';
    const html = renderToStaticMarkup(await MyReviews({ searchParams: { submitted: 'pending', reviewId: 'review-1' } }));
    assert.match(html, /awaiting moderation and is not public yet/);
    assert.match(html, /https:\/\/ratemydegrees.com\/majors\/42.01\/134130/);
});

test('unmatched review IDs do not produce a share prompt', async () => {
    const html = renderToStaticMarkup(await MyReviews({ searchParams: { submitted: 'approved', reviewId: 'not-owned' } }));
    assert.doesNotMatch(html, /data-share="true"/);
});
