const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);
const sdk = { initCalls: 0, captures: [], exceptions: [], init(key, options) { this.initCalls++; this.options = options; }, capture(event, properties) { this.captures.push({ event, properties }); }, captureException(error, properties) { this.exceptions.push({ error, properties }); } };
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'posthog-js') return { __esModule: true, default: sdk };
    if (request.startsWith('@/')) return originalLoad.call(this, path.resolve(__dirname, '../src', request.slice(2)), parent, isMain);
    return originalLoad.call(this, request, parent, isMain);
};
const policy = require('../src/lib/product-analytics-policy.ts');
const analytics = require('../src/lib/product-analytics.ts');
const anonymous = require('../src/lib/anonymous-analytics-session.ts');
const journey = require('../src/lib/analytics-journey.ts');

const values = new Map();
const sessionValues = new Map();
global.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    sessionStorage: { getItem: key => sessionValues.get(key) ?? null, setItem: (key, value) => sessionValues.set(key, value), removeItem: key => sessionValues.delete(key) },
    crypto: { randomUUID: () => '12345678-1234-4123-8123-123456789abc' } };
const oldEnv = { node: process.env.NODE_ENV, enabled: process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED, key: process.env.NEXT_PUBLIC_POSTHOG_KEY, host: process.env.NEXT_PUBLIC_POSTHOG_HOST };
test.after(() => {
    Module._load = originalLoad;
    process.env.NODE_ENV = oldEnv.node;
    process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = oldEnv.enabled;
    process.env.NEXT_PUBLIC_POSTHOG_KEY = oldEnv.key;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = oldEnv.host;
    delete global.window;
});
test.beforeEach(() => { values.clear(); sessionValues.clear(); sdk.captures = []; sdk.exceptions = []; sdk.initCalls = 0; process.env.NODE_ENV = 'production'; process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = '0'; process.env.NEXT_PUBLIC_POSTHOG_KEY = ''; process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com'; });

test('no config, no consent, and development mode cannot send or initialize', async () => {
    assert.equal(await analytics.trackProductEvent('review_started', { major_id: '11.07' }), false);
    process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = '1'; process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    assert.equal(await analytics.trackProductEvent('review_started', { major_id: '11.07' }), false);
    values.set('rmd-analytics-consent-v1', 'granted'); process.env.NODE_ENV = 'development';
    assert.equal(await analytics.trackProductEvent('review_started', { major_id: '11.07' }), false);
    assert.equal(sdk.initCalls, 0);
    assert.equal(sessionValues.size, 0);
});

test('consented anonymous ID survives full-page redirect in the same tab and clears on decline', () => {
    const first = anonymous.getOrCreateAnonymousSessionId(global.window.sessionStorage, global.window.crypto.randomUUID);
    const second = anonymous.getOrCreateAnonymousSessionId(global.window.sessionStorage, () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    assert.equal(first, second);
    assert.equal(first, '12345678-1234-4123-8123-123456789abc');
    values.set('rmd-analytics-consent-v1', 'granted');
    assert.equal(analytics.saveAnalyticsChoice('denied'), true);
    assert.equal(sessionValues.size, 0);
});

test('unavailable consent storage leaves tracking off', async () => {
    const originalStorage = global.window.localStorage;
    global.window.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
    try {
        process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = '1'; process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
        assert.equal(analytics.saveAnalyticsChoice('granted'), false);
        assert.equal(analytics.hasAnalyticsConsent(), false);
        assert.equal(await analytics.trackProductEvent('review_started', {}), false);
        assert.equal(sdk.initCalls, 0);
    } finally { global.window.localStorage = originalStorage; }
});

test('event allowlist removes review text, email, OTP, tokens, full URLs and arbitrary fields', () => {
    const event = policy.sanitizeProductEvent('review_submitted', { major_id: '11.07', institution_id: '134130', status: 'pending', fit: 'private writing', email: 'a@example.com', otp: '123456', access_token: 'secret', url: 'https://example.com/?code=secret' });
    assert.deepEqual(event, { event: 'review_submitted', properties: { major_id: '11.07', institution_id: '134130', status: 'pending' } });
    assert.equal(policy.sanitizeProductEvent('review_submitted', { status: 'failed' }), null);
    assert.equal(policy.sanitizeProductEvent('other_event', {}), null);
});

test('journey paths and search outcomes use only fixed labels, valid IDs, and counts', () => {
    assert.deepEqual(journey.classifyJourneyPath('/'), { route: 'home' });
    assert.deepEqual(journey.classifyJourneyPath('/majors/11.07/134130'), { route: 'program_detail', detail: { detail_type: 'program', major_id: '11.07', institution_id: '134130' } });
    assert.equal(journey.classifyJourneyPath('/majors/evil@example.com'), null);
    assert.equal(journey.classifyJourneyPath('/auth/callback'), null);
    assert.deepEqual(policy.sanitizeProductEvent('page_viewed', { route: 'degree_detail', url: '/majors/11.07?q=secret' }).properties, { route: 'degree_detail' });
    assert.equal(policy.sanitizeProductEvent('page_viewed', { route: '/private?q=secret' }), null);
    assert.deepEqual(policy.sanitizeProductEvent('detail_viewed', { detail_type: 'degree', major_id: '11.07', email: 'private@example.com' }).properties, { major_id: '11.07', detail_type: 'degree' });
    assert.equal(policy.sanitizeProductEvent('detail_viewed', { detail_type: 'program', major_id: '11.07', institution_id: 'bad' }), null);
    assert.deepEqual(policy.sanitizeProductEvent('search_results', { search_type: 'schools', result_state: 'no_results', result_count: 0, query: 'private search' }).properties, { search_type: 'schools', result_state: 'no_results', result_count: 0 });
    assert.equal(policy.sanitizeProductEvent('search_results', { search_type: 'schools', result_state: 'results', result_count: -1 }), null);
    assert.deepEqual(policy.sanitizeProductEvent('review_cta_clicked', { source: 'home', href: '/write-review?token=private' }).properties, { source: 'home' });
    assert.deepEqual(policy.sanitizeProductEvent('share_action_success', { mode: 'copied', url: 'private' }).properties, { mode: 'copied' });
});

test('approved and pending submissions, auth methods and error categories are bounded', () => {
    assert.equal(policy.sanitizeProductEvent('review_submitted', { status: 'approved' }).properties.status, 'approved');
    assert.deepEqual(policy.sanitizeProductEvent('sign_in_completed', { method: 'email', email: 'private@example.com' }).properties, { method: 'email' });
    assert.deepEqual(policy.sanitizeProductEvent('product_error', { stage: 'auth_verify', category: 'provider', message: 'private' }).properties, { stage: 'auth_verify', category: 'provider' });
    assert.equal(policy.sanitizeProductEvent('product_error', { stage: 'auth_verify', category: 'private error details' }), null);
    assert.equal(policy.reviewErrorCategory(Error('You already have a review')), 'duplicate');
    assert.equal(policy.reviewErrorCategory(Error('Must be signed in')), 'auth');
    assert.deepEqual(policy.sanitizeExceptionProperties({ stage: 'review_submit', category: 'duplicate', message: 'private', stack: 'private' }), {
        stage: 'review_submit', category: 'duplicate', $exception_level: 'error',
        $exception_list: [{ type: 'RateMyDegreesProductError', value: 'review_submit:duplicate', mechanism: { type: 'generic', handled: true } }],
    });
});

test('consented events initialize once, dedupe retries, and redact SDK-added URL properties', async () => {
    process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = '1'; process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'; values.set('rmd-analytics-consent-v1', 'granted');
    const props = { method: 'google', email: 'private@example.com' };
    const results = await Promise.all([
        analytics.trackProductEventOnce('google-start', 'sign_in_started', props),
        analytics.trackProductEventOnce('google-start', 'sign_in_started', props),
    ]);
    assert.deepEqual(results, [true, false]);
    assert.equal(sdk.initCalls, 1);
    assert.deepEqual(sdk.captures, [{ event: 'sign_in_started', properties: { method: 'google' } }]);
    assert.equal(sdk.options.autocapture, false);
    assert.equal(sdk.options.disable_session_recording, true);
    assert.equal(sdk.options.person_profiles, 'never');
    assert.deepEqual(sdk.options.bootstrap, { distinctID: '12345678-1234-4123-8123-123456789abc', isIdentifiedID: false });
    assert.equal(sdk.options.disable_persistence, true);
    const payload = sdk.options.before_send({ uuid: 'random', event: 'sign_in_started', $set: { email: 'private@example.com' }, properties: { method: 'google', distinct_id: 'anonymous', token: 'phc_test', $current_url: 'https://example.com/?code=private', email: 'private@example.com' } });
    assert.deepEqual(payload.properties, { method: 'google', distinct_id: 'anonymous', token: 'phc_test' });
    assert.equal(payload.$set, undefined);
    values.set('rmd-analytics-consent-v1', 'denied');
    assert.equal(await analytics.trackProductEvent('sign_in_completed', { method: 'google' }), false);
    assert.equal(sdk.captures.length, 1);
});

test('manual Error Tracking uses only normalized exception type and category without raw stacks', async () => {
    process.env.NEXT_PUBLIC_RMD_ANALYTICS_ENABLED = '1'; process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'; values.set('rmd-analytics-consent-v1', 'granted');
    assert.equal(await analytics.trackProductErrorOnce('duplicate-issue', 'review_submit', 'duplicate'), true);
    assert.equal(await analytics.trackProductErrorOnce('duplicate-issue', 'review_submit', 'duplicate'), false);
    assert.deepEqual(sdk.captures, [{ event: 'product_error', properties: { stage: 'review_submit', category: 'duplicate' } }]);
    assert.equal(sdk.exceptions.length, 1);
    assert.equal(sdk.exceptions[0].error.message, 'review_submit:duplicate');
    const filtered = sdk.options.before_send({ uuid: 'random', event: '$exception', properties: { stage: 'review_submit', category: 'duplicate', distinct_id: 'anonymous', token: 'phc_test', $current_url: 'https://example.com/?code=private', $exception_list: [{ type: 'Error', value: 'private', stacktrace: { frames: [{ filename: 'private' }] } }] } });
    assert.deepEqual(filtered.properties, { ...policy.sanitizeExceptionProperties({ stage: 'review_submit', category: 'duplicate' }), distinct_id: 'anonymous', token: 'phc_test' });
    assert.equal(JSON.stringify(filtered).includes('private'), false);
});
