import dotenv from 'dotenv';
// Load environment variables
dotenv.config({ path: '.env.local' });

const testCases = [
    {
        query: 'AAMU',
        expectedName: 'Alabama A & M University'
    },
    {
        query: 'UAB',
        expectedName: 'University of Alabama at Birmingham'
    },
    {
        query: 'UAH',
        expectedName: 'University of Alabama in Huntsville'
    },
    {
        query: 'AUM',
        expectedName: 'Auburn University at Montgomery'
    },
    {
        query: 'MIT',
        expectedName: 'Massachusetts Institute of Technology'
    },
    {
        query: 'NYU',
        expectedName: 'New York University'
    }
];

async function runTests() {
    console.log('🧪 Starting Institution Synonym Search Verification...\n');
    let passedCount = 0;

    const { searchInstitutions } = await import('../src/app/actions/search');

    for (const testCase of testCases) {
        console.log(`🔍 Searching for: "${testCase.query}"`);
        try {
            const result = await searchInstitutions(testCase.query, { hitsPerPage: 5 });
            
            if (result.hits.length === 0) {
                console.log(`  ❌ FAILED: Returned 0 results.`);
                continue;
            }

            console.log(`  Top hits returned:`);
            result.hits.forEach((h, index) => {
                console.log(`    ${index + 1}. [UNITID: ${h.unitid}] ${h.name} (${h.city}, ${h.state})`);
            });

            const topHit = result.hits[0];
            const hasExpectedName = result.hits.some(h => h.name.toLowerCase().includes(testCase.expectedName.toLowerCase()));

            if (hasExpectedName) {
                const isExactTop = topHit.name.toLowerCase().includes(testCase.expectedName.toLowerCase());
                console.log(`  ✅ PASSED: Found expected institution "${testCase.expectedName}" ${isExactTop ? 'as the TOP match!' : 'in top hits.'}`);
                passedCount++;
            } else {
                console.log(`  ❌ FAILED: Expected institution "${testCase.expectedName}" not found in top hits.`);
            }
        } catch (err: any) {
            console.error(`  💥 ERROR:`, err.message || err);
        }
        console.log('');
    }

    console.log(`📊 Test Summary: ${passedCount}/${testCases.length} tests passed.`);
    if (passedCount === testCases.length) {
        console.log('🎉 All institution synonym search tests passed successfully!');
        process.exit(0);
    } else {
        console.log('⚠️ Some tests failed. Please verify configurations.');
        process.exit(1);
    }
}

runTests();
