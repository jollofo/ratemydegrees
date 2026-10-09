const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.tsx'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);
let events = [], codeError = Error('private auth detail'), sentError = Error('private send detail'), pushes = [], hookIndex = 0;
const realReact = require('react');
const react = { ...realReact, useState(initial) { hookIndex++; return [hookIndex === 3 ? true : initial, () => {}]; }, useEffect() {} };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'react') return react;
    if (request === 'next/navigation') return { useRouter: () => ({ push: value => pushes.push(value), refresh() {} }) };
    if (request === '@/utils/supabase/client') return { createClient: () => ({ auth: {
        signInWithOtp: async () => ({ error: sentError }), verifyOtp: async () => ({ error: codeError }),
    } }) };
    if (request === '@/lib/product-analytics') return { trackProductEventOnce: async (...args) => { events.push(args.slice(1)); return true; }, trackProductErrorOnce: async (key, stage, category) => { events.push(['product_error', { stage, category }]); return true; } };
    if (request === '@/lib/google-auth-analytics') return { clearGoogleSignInPending() {}, markGoogleSignInPending() {} };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const LoginForm = require('../src/components/LoginForm.tsx').default;
Module._load = originalLoad;
function forms() { hookIndex = 0; return LoginForm({ signInAction() {}, nextUrl: '/write-review' }).props.children; }
test.beforeEach(() => { events = []; pushes = []; codeError = Error('private auth detail'); sentError = Error('private send detail'); });

test('email send and verification errors use fixed categories without provider messages', async () => {
    const children = forms();
    await children[2].props.onSubmit({ preventDefault() {} });
    await children[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(events, [
        ['sign_in_started', { method: 'email' }],
        ['product_error', { stage: 'auth_send', category: 'provider' }],
        ['product_error', { stage: 'auth_verify', category: 'provider' }],
    ]);
    assert.equal(pushes.length, 0);
});

test('email completion is sent only after successful verification', async () => {
    codeError = null;
    const children = forms();
    await children[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(events, [['sign_in_completed', { method: 'email' }]]);
    assert.deepEqual(pushes, ['/write-review']);
});
