const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
const rows = [
    { unitid: '195030', name: 'University of Rochester', active: true, offeredMajors: [], reviews: [] },
    { unitid: 'known', name: 'University Z', active: true, offeredMajors: [{ cip4: '30.70' }], reviews: [{ cip4: '11.07', status: 'APPROVED' }] },
    { unitid: 'reviewed', name: 'University Y', active: true, offeredMajors: [], reviews: [{ cip4: '30.70', status: 'APPROVED' }] },
    { unitid: 'inactive', name: 'University of Rochester Closed', active: false, offeredMajors: [], reviews: [] },
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
const prisma = { institution: {
    count: async ({ where }) => rows.filter(row => matches(row, where)).length,
    findMany: async ({ where, skip, take, select }) => rows.filter(row => matches(row, where)).sort((a, b) => a.name.localeCompare(b.name)).slice(skip, skip + take).map(row => ({ unitid: row.unitid, name: row.name, city: null, state: null, _count: { reviews: row.reviews.filter(review => matches(review, select._count.select.reviews.where)).length } })),
} };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === './prisma' && parent.filename.endsWith('degree-school-search.ts')) return { __esModule: true, default: prisma };
    return originalLoad.call(this, request, parent, isMain);
};
const { searchDegreeSchools } = require('../src/lib/degree-school-search.ts');
Module._load = originalLoad;

test('submitted Rochester school search returns a result without a data science catalog link', async () => {
    const result = await searchDegreeSchools('30.70', 'University of Rochester');
    assert.equal(result.total, 1);
    assert.equal(result.schools[0].unitid, '195030');
    assert.equal(result.schools[0].catalogListed, false);
});
test('browsing keeps known schools and degree-specific approved review counts', async () => {
    const result = await searchDegreeSchools('30.70', '');
    assert.deepEqual(result.schools.map(row => row.unitid), ['reviewed', 'known']);
    assert.deepEqual(result.schools.map(row => row._count.reviews), [1, 0]);
});
test('additional matching schools remain reachable when known matches fill the first page', async () => {
    const first = await searchDegreeSchools('30.70', 'University', 1, 2);
    const second = await searchDegreeSchools('30.70', 'University', 2, 2);
    assert.equal(first.total, 3);
    assert.equal(first.totalPages, 2);
    assert.equal(first.schools.every(row => row.catalogListed), true);
    assert.equal(second.schools[0].unitid, '195030');
    assert.equal(second.schools[0].catalogListed, false);
});
