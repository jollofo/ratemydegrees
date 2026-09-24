const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
const rows = [
    { cip4: '30.70', title: 'Data Science.', aliases: [{ alias: 'DS' }], institutions: [], reviews: [] },
    { cip4: '11.07', title: 'Computer Science.', aliases: [{ alias: 'CS' }], institutions: [{ unitid: '195030' }], reviews: [] },
    { cip4: '11.01', title: 'Computer and Information Sciences.', aliases: [], institutions: [{ unitid: 'other-school' }], reviews: [] },
    { cip4: '30.08', title: 'Mathematics and Computer Science.', aliases: [], institutions: [], reviews: [{ unitid: '195030', status: 'APPROVED' }] },
];
function matches(row, where) {
    return Object.entries(where).every(([key, value]) => {
        if (key === 'AND') return value.every(condition => matches(row, condition));
        if (key === 'OR') return value.some(condition => matches(row, condition));
        if (key === 'NOT') return !matches(row, value);
        if (value.some) return row[key].some(item => matches(item, value.some));
        if (value.contains !== undefined) return row[key].toLowerCase().includes(value.contains.toLowerCase());
        return row[key] === value;
    });
}
const prisma = { major: {
    count: async ({ where }) => rows.filter(row => matches(row, where)).length,
    findMany: async ({ where, skip, take, select }) => rows.filter(row => matches(row, where)).sort((a, b) => a.title.localeCompare(b.title)).slice(skip, skip + take).map(row => ({ ...row, _count: { reviews: row.reviews.filter(review => matches(review, select._count.select.reviews.where)).length } })),
} };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === './prisma' && parent.filename.endsWith('institution-degree-search.ts')) return { __esModule: true, default: prisma };
    return originalLoad.call(this, request, parent, isMain);
};
const { searchInstitutionDegrees } = require('../src/lib/institution-degree-search.ts');
Module._load = originalLoad;

test('Rochester data science remains reviewable without a catalog pairing', async () => {
    const result = await searchInstitutionDegrees('195030', 'data science');
    assert.deepEqual(result.items, [{ id: '30.70', name: 'Data Science.', reviewCount: 0, catalogListed: false }]);
});
test('empty browsing includes only school catalog entries or approved student reviews', async () => {
    const result = await searchInstitutionDegrees('195030', '');
    assert.deepEqual(result.items.map(row => row.id), ['11.07', '30.08']);
    assert.equal(result.items.every(row => row.catalogListed), true);
});
test('known school matches precede other degree matches across page boundaries', async () => {
    const first = await searchInstitutionDegrees('195030', 'science', 1, 2);
    const second = await searchInstitutionDegrees('195030', 'science', 2, 2);
    assert.equal(first.totalPages, 2);
    assert.equal(first.items.every(row => row.catalogListed), true);
    assert.equal(second.items.every(row => !row.catalogListed), true);
    assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 4);
    assert.equal(first.items.find(row => row.id === '30.08').reviewCount, 1);
});
test('alternate names find degrees without treating another school’s catalog as confirmation', async () => {
    const result = await searchInstitutionDegrees('other-school', 'CS');
    assert.equal(result.items.find(row => row.id === '11.07').catalogListed, false);
});
