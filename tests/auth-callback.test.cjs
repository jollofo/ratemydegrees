const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
let exchangeError = null;
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/utils/supabase/server') return { createClient: () => ({ auth: { exchangeCodeForSession: async () => ({ error: exchangeError }) } }) };
    if (request === 'next/server') return { NextResponse: { redirect: url => ({ url: String(url) }) } };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const { GET } = require('../src/app/auth/callback/route.ts');
Module._load = originalLoad;

test('successful callback returns to exact review context for local draft restore', async () => {
    exchangeError = null;
    const response = await GET(new Request('https://ratemydegrees.com/auth/callback?code=ok&next=%2Fwrite-review%3FmajorId%3D11.07%26institutionId%3D134130'));
    assert.equal(response.url, 'https://ratemydegrees.com/write-review?majorId=11.07&institutionId=134130');
});

test('failed callback preserves retry path and external next is rejected', async () => {
    exchangeError = Error('failed');
    const failed = await GET(new Request('https://ratemydegrees.com/auth/callback?code=bad&next=%2Fwrite-review%3FmajorId%3D11.07'));
    assert.equal(new URL(failed.url).searchParams.get('next'), '/write-review?majorId=11.07');
    exchangeError = null;
    const external = await GET(new Request('https://ratemydegrees.com/auth/callback?code=ok&next=https%3A%2F%2Fevil.example'));
    assert.equal(external.url, 'https://ratemydegrees.com/');
});
