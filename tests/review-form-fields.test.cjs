const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'next/navigation') return { useRouter: () => ({}) };
    if (request === './actions' && parent.filename.endsWith('ReviewForm.tsx')) return { submitReview: async () => ({ status: 'APPROVED' }) };
    if (request === '@/app/actions/search') return {};
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const ReviewForm = require('../src/app/write-review/ReviewForm.tsx').default;
Module._load = originalLoad;
const major = { cip4: '30.70', title: 'Data Science.', category: null };
const school = { unitid: '195030', name: 'University of Rochester', city: 'Rochester', state: 'NY' };

for (const [label, props, expectedSchool, expectedDegree] of [
    ['no context', {}, '', ''],
    ['degree page', { preSelectedMajor: major }, '', 'Data Science'],
    ['school page', { preSelectedInstitution: school }, 'University of Rochester', ''],
    ['degree and school page', { preSelectedMajor: major, preSelectedInstitution: school }, 'University of Rochester', 'Data Science'],
]) {
    test(`review form has single, correctly prefilled fields from ${label}`, () => {
        // Selected entries need not be in the first page of initial search results.
        const html = renderToStaticMarkup(React.createElement(ReviewForm, { majors: [], institutions: [], ...props }));
        const schoolInput = html.match(/<input[^>]*id="school-search"[^>]*>/g) ?? [];
        const degreeInput = html.match(/<input[^>]*id="major-search"[^>]*>/g) ?? [];
        assert.equal(schoolInput.length, 1);
        assert.equal(degreeInput.length, 1);
        assert.ok(schoolInput[0].includes(`value="${expectedSchool}"`));
        assert.ok(degreeInput[0].includes(`value="${expectedDegree}"`));
        assert.doesNotMatch(html, /<select[^>]*id="(?:institutionId|majorId)"/);
        assert.doesNotMatch(html, /Select your (?:school|degree) from the results/);
    });
}
