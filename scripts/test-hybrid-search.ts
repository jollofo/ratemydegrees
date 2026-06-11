import dotenv from 'dotenv';
// Load environment variables
dotenv.config({ path: '.env.local' });

const testCases = [
    {
        query: 'BME',
        expectedCip: '14.05',
        expectedTitle: 'Biomedical/Medical Engineering.'
    },
    {
        query: 'Bioengineering',
        expectedCip: '14.05',
        expectedTitle: 'Biomedical/Medical Engineering.'
    },
    {
        query: 'BioE',
        expectedCip: '14.05',
        expectedTitle: 'Biomedical/Medical Engineering.'
    },
    {
        query: 'CS',
        expectedCip: '11.07',
        expectedTitle: 'Computer Science.'
    },
    {
        query: 'CompSci',
        expectedCip: '11.07',
        expectedTitle: 'Computer Science.'
    },
    {
        query: 'Psych',
        expectedCip: '42.01',
        expectedTitle: 'Psychology, General.'
    },
    {
        query: 'Biochem',
        expectedCip: '26.02',
        expectedTitle: 'Biochemistry, Biophysics and Molecular Biology.'
    },
    {
        query: 'PoliSci',
        expectedCip: '45.10',
        expectedTitle: 'Political Science and Government.'
    }
];

async function runTests() {
    console.log('🧪 Starting Hybrid Semantic Search Verification...\n');
    let passedCount = 0;

    const { searchMajors } = await import('../src/app/actions/search');

    for (const testCase of testCases) {
        console.log(`🔍 Searching for: "${testCase.query}"`);
        try {
            const result = await searchMajors(testCase.query, { hitsPerPage: 5 });
            
            if (result.hits.length === 0) {
                console.log(`  ❌ FAILED: Returned 0 results.`);
                continue;
            }

            console.log(`  Top hits returned:`);
            result.hits.forEach((h, index) => {
                console.log(`    ${index + 1}. [CIP: ${h.cip4}] ${h.title}`);
            });

            const topHit = result.hits[0];
            const hasExpectedCip = result.hits.some(h => h.cip4 === testCase.expectedCip);

            if (hasExpectedCip) {
                const isExactTop = topHit.cip4 === testCase.expectedCip;
                console.log(`  ✅ PASSED: Found expected CIP ${testCase.expectedCip} (${testCase.expectedTitle}) ${isExactTop ? 'as the TOP match!' : 'in top hits.'}`);
                passedCount++;
            } else {
                console.log(`  ❌ FAILED: Expected CIP ${testCase.expectedCip} not found in top hits.`);
            }
        } catch (err: any) {
            console.error(`  💥 ERROR:`, err.message || err);
        }
        console.log('');
    }

    console.log(`📊 Test Summary: ${passedCount}/${testCases.length} tests passed.`);
    if (passedCount === testCases.length) {
        console.log('🎉 All semantic search tests passed successfully!');
        process.exit(0);
    } else {
        console.log('⚠️ Some tests failed. Please verify configurations.');
        process.exit(1);
    }
}

runTests();
