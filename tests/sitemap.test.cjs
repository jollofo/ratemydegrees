const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === '@/lib/prisma') return { __esModule: true, default: {
        institution: { findMany: async () => [{ unitid: '134130', updatedAt: new Date('2026-01-01') }] },
        major: { findMany: async () => [{ cip4: '42.01', updatedAt: new Date('2026-01-02') }] },
    } };
    return originalLoad.call(this, request, parent, isMain);
};
const sitemap = require('../src/app/sitemap.ts').default;
Module._load = originalLoad;

test('sitemap includes canonical public indexes and degree and school entries', async () => {
    const entries = await sitemap();
    const urls = entries.map(entry => entry.url);
    assert.deepEqual(urls, [
        'https://ratemydegrees.com',
        'https://ratemydegrees.com/institutions',
        'https://ratemydegrees.com/majors',
        'https://ratemydegrees.com/guidelines',
        'https://ratemydegrees.com/institutions/134130',
        'https://ratemydegrees.com/majors/42.01',
    ]);
    assert.equal(new Set(urls).size, urls.length);
});
