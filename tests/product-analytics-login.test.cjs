const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.tsx'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, file);
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
let events = [], codeError = Error('private auth detail'), sentError = Error('private send detail'), pushes = [], hookIndex = 0, inputCode = '', verifiedTokens = [];
const realReact = require('react');
const react = { ...realReact, useState(initial) {
    hookIndex++;
    if (hookIndex === 2) return [inputCode, value => { inputCode = value; }];
    return [hookIndex === 3 ? true : initial, () => {}];
}, useEffect() {} };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'react') return react;
    if (request === 'next/navigation') return { useRouter: () => ({ push: value => pushes.push(value), refresh() {} }) };
    if (request === '@/utils/supabase/client') return { createClient: () => ({ auth: {
        signInWithOtp: async () => ({ error: sentError }), verifyOtp: async ({ token }) => { verifiedTokens.push(token); return { error: codeError }; },
    } }) };
    if (request === '@/lib/product-analytics') return { trackProductEventOnce: async (...args) => { events.push(args.slice(1)); return true; }, trackProductErrorOnce: async (key, stage, category) => { events.push(['product_error', { stage, category }]); return true; } };
    if (request === '@/lib/google-auth-analytics') return { clearGoogleSignInPending() {}, markGoogleSignInPending() {} };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const LoginForm = require('../src/components/LoginForm.tsx').default;
Module._load = originalLoad;
function forms() { hookIndex = 0; return LoginForm({ signInAction() {}, nextUrl: '/write-review' }).props.children; }
test.beforeEach(() => { events = []; pushes = []; inputCode = '12345678'; verifiedTokens = []; codeError = Error('private auth detail'); sentError = Error('private send detail'); });

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
    assert.deepEqual(verifiedTokens, ['12345678']);
});

test('typed and pasted eight-digit codes reach Supabase unchanged', async () => {
    const input = forms()[3].props.children[2];
    assert.equal(input.props.pattern, '[0-9]{6,10}');
    assert.equal(input.props.maxLength, undefined);
    input.props.onChange({ target: { value: '87654321' } });
    await forms()[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(verifiedTokens, ['87654321']);
    input.props.onChange({ target: { value: '8765 4321' } });
    await forms()[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(verifiedTokens, ['87654321', '87654321']);
});

test('six- and ten-digit codes remain supported while malformed and out-of-range codes never reach Supabase', async () => {
    inputCode = '123456';
    await forms()[3].props.onSubmit({ preventDefault() {} });
    inputCode = '1234567890';
    await forms()[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(verifiedTokens, ['123456', '1234567890']);
    for (const invalid of ['12345', '12345678901', '1234x678', '12 34 56 78 x']) {
        inputCode = invalid;
        await forms()[3].props.onSubmit({ preventDefault() {} });
    }
    assert.deepEqual(verifiedTokens, ['123456', '1234567890']);
});

test('expired or wrong codes remain provider errors without leaking details', async () => {
    codeError = Error('expired or wrong private provider detail');
    await forms()[3].props.onSubmit({ preventDefault() {} });
    assert.deepEqual(verifiedTokens, ['12345678']);
    assert.deepEqual(events, [['product_error', { stage: 'auth_verify', category: 'provider' }]]);
    assert.equal(pushes.length, 0);
});
