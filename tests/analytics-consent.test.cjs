const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// These are component lifecycle regressions, not browser layout/accessibility tests.
// Compile the real component and consent library; only React, navigation and SDK
// children are mocked. A fresh module graph models a new browser page per harness.
const consentKey = 'rmd-analytics-consent-v1';
const dismissalKey = 'rmd-analytics-banner-dismissed-v1';
const anonymousKey = 'rmd-posthog-anonymous-session-v1';
const gaDisableKey = 'ga-disable-G-N6LJN2TRCF';
const fragment = Symbol('Fragment');
const sdkTypes = { GoogleAnalytics: Symbol('GoogleAnalytics'), PostHogInitializer: Symbol('PostHogInitializer') };
const originalWindow = global.window;
const originalDocument = global.document;
test.afterEach(() => {
    if (originalWindow === undefined) delete global.window; else global.window = originalWindow;
    if (originalDocument === undefined) delete global.document; else global.document = originalDocument;
});

function contents(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (Array.isArray(node)) return node.map(contents).join('');
    if (typeof node !== 'object') return String(node);
    return contents(node.props?.children);
}
function allNodes(node, output = []) {
    if (Array.isArray(node)) node.forEach(child => allNodes(child, output));
    else if (node && typeof node === 'object') {
        output.push(node);
        allNodes(node.props?.children, output);
    }
    return output;
}
function makeStorage(values) {
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key),
        clear: () => values.clear(),
    };
}
function createHarness({ saved = null, localValues, sessionValues = new Map(), available = true, signedIn = false, pathname = '/', hydrate = true, storageBlocked = false } = {}) {
    localValues ??= new Map(saved === null ? [] : [[consentKey, saved]]);
    const localStorage = makeStorage(localValues);
    const sessionStorage = makeStorage(sessionValues);
    if (storageBlocked) {
        localStorage.getItem = () => { throw Error('Storage blocked'); };
        localStorage.setItem = () => { throw Error('Storage blocked'); };
    }
    const listeners = new Map();
    const focusHistory = [];
    const externalFocus = { name: 'page content' };
    const state = { cursor: 0, hooks: [], effects: [], dirty: false, tree: null, reloads: 0, events: [], pathname };
    global.document = { activeElement: externalFocus };
    global.window = {
        localStorage, sessionStorage,
        crypto: { randomUUID: () => '12345678-1234-4123-8123-123456789abc' },
        location: { reload: () => { state.reloads++; } },
        addEventListener(name, listener) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
        removeEventListener(name, listener) { listeners.get(name)?.delete(listener); },
    };
    const react = {
        useState(initial) {
            const index = state.cursor++;
            if (!(index in state.hooks)) state.hooks[index] = { value: typeof initial === 'function' ? initial() : initial };
            return [state.hooks[index].value, next => {
                const value = typeof next === 'function' ? next(state.hooks[index].value) : next;
                if (!Object.is(value, state.hooks[index].value)) { state.hooks[index].value = value; state.dirty = true; }
            }];
        },
        useRef(initial) {
            const index = state.cursor++;
            if (!(index in state.hooks)) state.hooks[index] = { current: initial };
            return state.hooks[index];
        },
        useEffect(effect, dependencies) {
            const index = state.cursor++;
            const previous = state.hooks[index];
            if (!previous || !dependencies || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
                state.hooks[index] = { dependencies, cleanup: previous?.cleanup };
                state.effects.push(() => {
                    state.hooks[index].cleanup?.();
                    state.hooks[index].cleanup = effect();
                });
            }
        },
    };
    const jsx = (type, props) => ({ type, props: props ?? {}, focus() { global.document.activeElement = this; focusHistory.push(contents(this)); }, contains(other) { return allNodes(this).includes(other); } });
    const modules = new Map();
    let analytics;
    function load(file) {
        if (modules.has(file)) return modules.get(file).exports;
        const module = { exports: {} };
        modules.set(file, module);
        const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            fileName: file,
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
        }).outputText;
        function mockedRequire(request) {
            if (request === 'react') return react;
            if (request === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: fragment };
            if (request === 'next/navigation') return { usePathname: () => state.pathname };
            if (request === './GoogleAnalytics') return { __esModule: true, default: sdkTypes.GoogleAnalytics };
            if (request === './PostHogInitializer') return { __esModule: true, default: sdkTypes.PostHogInitializer };
            if (request === '@/lib/product-analytics') return {
                ...analytics,
                trackProductEvent: async (event, properties) => { state.events.push({ event, properties }); return analytics.hasAnalyticsConsent(); },
                trackProductEventOnce: async (key, event, properties) => { state.events.push({ key, event, properties }); return analytics.hasAnalyticsConsent(); },
            };
            if (request === '@/lib/google-auth-analytics') return { consumeRecentGoogleSignIn: () => null };
            const target = request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : path.resolve(path.dirname(file), request);
            const resolved = [target, target + '.ts', target + '.tsx'].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
            if (!resolved) throw Error('Unexpected component dependency: ' + request);
            return load(resolved);
        }
        new Function('require', 'module', 'exports', output)(mockedRequire, module, module.exports);
        return module.exports;
    }
    analytics = load(path.resolve(__dirname, '../src/lib/product-analytics.ts'));
    const Component = load(path.resolve(__dirname, '../src/components/AnalyticsConsent.tsx')).default;
    function render() {
        state.cursor = 0;
        state.dirty = false;
        state.tree = Component({ available, signedIn });
        for (const hook of state.hooks) if (hook && 'current' in hook && hook.current && typeof hook.current === 'object' && 'type' in hook.current) hook.current = null;
        for (const node of allNodes(state.tree)) if (node.props.ref) node.props.ref.current = node;
    }
    function flush() {
        for (let pass = 0; pass < 20; pass++) {
            const effects = state.effects.splice(0);
            effects.forEach(effect => effect());
            if (state.dirty) render();
            else if (!state.effects.length) return;
        }
        throw Error('Component did not settle');
    }
    const harness = {
        state, analytics, localValues, sessionValues, localStorage, sessionStorage, focusHistory, externalFocus,
        flush,
        nodes: () => allNodes(state.tree),
        text: () => contents(state.tree),
        region: () => allNodes(state.tree).find(node => node.props.role === 'region'),
        button: label => {
            const node = allNodes(state.tree).find(node => node.type === 'button' && contents(node) === label);
            assert.ok(node, 'Missing button: ' + label);
            return node;
        },
        click(label) { this.button(label).props.onClick(); flush(); },
        sdkCount: () => allNodes(state.tree).filter(node => Object.values(sdkTypes).includes(node.type)).length,
        key(key) { let prevented = false; this.region().props.onKeyDown({ key, preventDefault() { prevented = true; } }); flush(); return prevented; },
        storage(event = {}) { for (const listener of listeners.get('storage') ?? []) listener({ key: consentKey, storageArea: localStorage, ...event }); flush(); },
        navigate(next) { state.pathname = next; render(); flush(); },
        unmount() { for (const hook of state.hooks) hook?.cleanup?.(); },
        listenerCount: () => listeners.get('storage')?.size ?? 0,
    };
    render();
    if (hydrate) flush();
    return harness;
}

test('hydration opens a first-visit nonmodal banner without loading analytics or stealing focus', () => {
    const h = createHarness({ hydrate: false });
    assert.equal(h.region(), undefined);
    assert.equal(h.sdkCount(), 0);
    h.flush();
    const panel = h.region();
    assert.ok(panel);
    assert.equal(panel.props['aria-modal'], undefined);
    assert.equal(panel.props['aria-labelledby'], 'analytics-preferences-title');
    assert.equal(panel.props['aria-describedby'], 'analytics-preferences-description');
    assert.match(panel.props.className, /fixed.*bottom-0/);
    assert.match(panel.props.className, /overflow-y-auto/);
    assert.match(panel.props.style.maxHeight, /dvh/);
    const spacer = h.nodes().find(node => node.props['aria-hidden'] === 'true');
    assert.ok(spacer);
    assert.match(spacer.props.className, /h-\[60vh\]/);
    assert.equal(spacer.props.tabIndex, undefined);
    assert.equal(h.button('Allow analytics').props.className, h.button('Decline').props.className);
    assert.match(h.button('Allow analytics').props.className, /min-h-\[44px\]/);
    assert.equal(h.sdkCount(), 0);
    assert.deepEqual(h.state.events, []);
    assert.equal(global.document.activeElement, h.externalFocus);
});

test('both valid saved choices skip the automatic banner, including across navigation', () => {
    for (const saved of ['granted', 'denied']) {
        const h = createHarness({ saved });
        assert.equal(h.region(), undefined);
        assert.equal(h.sdkCount(), saved === 'granted' ? 2 : 0);
        h.navigate('/majors/11.07');
        assert.equal(h.region(), undefined);
        assert.equal(h.localValues.get(consentKey), saved);
        h.unmount();
    }
});

test('invalid or unavailable storage is treated as no consent', () => {
    for (const options of [{ saved: 'unexpected' }, { storageBlocked: true }]) {
        const h = createHarness(options);
        assert.ok(h.region());
        assert.equal(h.sdkCount(), 0);
        assert.equal(h.analytics.hasAnalyticsConsent(), false);
        h.unmount();
    }
});

test('Allow persists a verified grant, closes the banner and enables configured SDKs', () => {
    const h = createHarness();
    h.click('Allow analytics');
    assert.equal(h.localValues.get(consentKey), 'granted');
    assert.equal(h.region(), undefined);
    assert.equal(h.sdkCount(), 2);
    assert.equal(h.analytics.hasAnalyticsConsent(), true);
    assert.equal(global.window[gaDisableKey], false);
    assert.deepEqual(h.state.events, [{ event: 'page_viewed', properties: { route: 'home' } }]);
    assert.equal(h.state.reloads, 0);
});

test('Decline persists denial and never initializes analytics on a first visit', () => {
    const h = createHarness();
    h.click('Decline');
    assert.equal(h.localValues.get(consentKey), 'denied');
    assert.equal(h.region(), undefined);
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(h.state.reloads, 0);
    assert.deepEqual(h.state.events, []);
});

test('dismissal is session-only, survives navigation/reload, and footer preferences can reopen it', () => {
    const sessionValues = new Map();
    let h = createHarness({ sessionValues });
    h.click('Dismiss for now (keep analytics off)');
    assert.equal(h.localValues.has(consentKey), false);
    assert.equal(sessionValues.get(dismissalKey), '1');
    assert.equal(h.sdkCount(), 0);
    h.navigate('/majors/11.07');
    assert.equal(h.region(), undefined);
    h.click('Analytics preferences');
    assert.ok(h.region());
    assert.equal(h.focusHistory.at(-1), 'Optional analytics');
    h.click('Dismiss for now (keep analytics off)');
    assert.equal(h.focusHistory.at(-1), 'Analytics preferences');
    h.unmount();
    h = createHarness({ sessionValues });
    assert.equal(h.region(), undefined);
    h.unmount();
    h = createHarness();
    assert.ok(h.region(), 'A new tab session prompts again if no lasting choice exists');
});

test('Escape closes footer-opened preferences, restores focus, and preserves a prior grant', () => {
    const h = createHarness({ saved: 'granted' });
    h.click('Analytics preferences');
    assert.equal(h.focusHistory.at(-1), 'Optional analytics');
    assert.match(h.text(), /Declining reloads this page/);
    assert.equal(h.key('Tab'), false);
    assert.ok(h.region());
    assert.equal(h.key('Escape'), true);
    assert.equal(h.region(), undefined);
    assert.equal(h.focusHistory.at(-1), 'Analytics preferences');
    assert.equal(h.localValues.get(consentKey), 'granted');
    assert.equal(h.sdkCount(), 2);
    assert.equal(h.state.reloads, 0);
});

test('withdrawing a loaded grant disables transmission, clears the anonymous ID and reloads', () => {
    const h = createHarness({ saved: 'granted', sessionValues: new Map([[anonymousKey, '12345678-1234-4123-8123-123456789abc']]) });
    h.click('Analytics preferences');
    h.click('Decline');
    assert.equal(h.localValues.get(consentKey), 'denied');
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(global.window[gaDisableKey], true);
    assert.equal(h.sessionValues.has(anonymousKey), false);
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.state.reloads, 1);
});

test('an unavailable analytics environment stays off even after a saved or newly allowed choice', () => {
    const h = createHarness({ available: false });
    h.click('Allow analytics');
    assert.equal(h.localValues.get(consentKey), 'granted');
    assert.equal(h.sdkCount(), 0);
    assert.match(h.text(), /off in this environment/);
    assert.deepEqual(h.state.events, []);
});

test('failed Allow stays open and off; a successful explicit retry recovers', () => {
    const h = createHarness();
    const setItem = h.localStorage.setItem;
    h.localStorage.setItem = () => { throw Error('Quota exceeded'); };
    h.click('Allow analytics');
    assert.ok(h.region());
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(global.window[gaDisableKey], true);
    assert.match(h.text(), /Your choice could not be saved/);
    assert.ok(h.nodes().some(node => node.props.role === 'alert'));
    h.localStorage.setItem = setItem;
    h.click('Allow analytics');
    assert.equal(h.region(), undefined);
    assert.equal(h.analytics.hasAnalyticsConsent(), true);
    assert.equal(h.sdkCount(), 2);
});

test('failed withdrawal is fail-closed even when the old grant is still readable', () => {
    const h = createHarness({ saved: 'granted' });
    h.click('Analytics preferences');
    h.localStorage.setItem = () => { throw Error('Quota exceeded'); };
    h.click('Decline');
    assert.equal(h.localValues.get(consentKey), 'granted');
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(global.window[gaDisableKey], true);
    assert.equal(h.state.reloads, 0, 'Do not reload into a grant that could not be replaced');
    assert.match(h.text(), /previous saved choice may return after reloading/);
    h.click('Dismiss for now (keep analytics off)');
    assert.ok(h.nodes().some(node => node.props.role === 'alert'));
    assert.match(h.text(), /off for this page/);
});

test('a write overwritten before verification does not enable analytics', () => {
    const h = createHarness();
    h.localStorage.setItem = (key, value) => h.localValues.set(key, value === 'granted' ? 'denied' : 'granted');
    h.click('Allow analytics');
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.ok(h.region());
    assert.match(h.text(), /Your choice could not be saved/);
});

test('storage events re-read current consent instead of trusting a stale granted payload', () => {
    const h = createHarness({ saved: 'granted' });
    h.localValues.set(consentKey, 'denied');
    h.storage({ oldValue: 'denied', newValue: 'granted' });
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(global.window[gaDisableKey], true);
    assert.equal(h.state.reloads, 1);
});

test('a cross-tab grant uses current storage without an unnecessary reload', () => {
    const h = createHarness({ saved: 'denied' });
    h.localValues.set(consentKey, 'granted');
    h.storage({ oldValue: 'granted', newValue: 'denied' });
    assert.equal(h.region(), undefined);
    assert.equal(h.state.reloads, 0);
    assert.equal(h.sdkCount(), 2);
    assert.equal(h.analytics.hasAnalyticsConsent(), true);
});

test('clearing consent in another tab withdraws a loaded grant; unrelated keys are ignored', () => {
    const h = createHarness({ saved: 'granted' });
    h.storage({ key: 'unrelated', newValue: 'denied' });
    assert.equal(h.state.reloads, 0);
    h.localValues.clear();
    h.storage({ key: null, newValue: null });
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(h.state.reloads, 1);
});

test('session storage failure still dismisses for this page and reports the reload limitation', () => {
    const h = createHarness();
    h.sessionStorage.setItem = () => { throw Error('Storage blocked'); };
    h.click('Dismiss for now (keep analytics off)');
    assert.equal(h.region(), undefined);
    assert.equal(h.localValues.has(consentKey), false);
    assert.equal(h.sdkCount(), 0);
    assert.match(h.text(), /banner may appear again on your next page load/);
    h.storage({ key: consentKey });
    assert.equal(h.region(), undefined);
});

test('component cleanup removes its storage listener', () => {
    const h = createHarness();
    assert.equal(h.listenerCount(), 1);
    h.unmount();
    assert.equal(h.listenerCount(), 0);
});

test('closing an automatically shown banner returns focus when its focused control is removed', () => {
    for (const action of ['Escape', 'Decline', 'Dismiss for now (keep analytics off)']) {
        const h = createHarness();
        h.button('Decline').focus();
        if (action === 'Escape') h.key('Escape'); else h.click(action);
        assert.equal(h.region(), undefined);
        assert.equal(h.focusHistory.at(-1), 'Analytics preferences');
        h.unmount();
    }
});


test('a queued grant event cannot restart analytics after withdrawal failed to save', () => {
    const h = createHarness({ saved: 'granted' });
    h.click('Analytics preferences');
    h.localStorage.setItem = () => { throw Error('Quota exceeded'); };
    h.click('Decline');
    h.storage({ oldValue: null, newValue: 'granted' });
    assert.equal(h.state.reloads, 0, 'Do not reload into the old grant after failed withdrawal');
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.match(h.text(), /off for this page/);
});


test('an external grant does not undo a local decline until an explicit successful local Allow', () => {
    const h = createHarness();
    h.click('Decline');
    h.localValues.set(consentKey, 'granted');
    h.storage({ oldValue: 'denied', newValue: 'granted' });
    assert.equal(h.sdkCount(), 0);
    assert.equal(h.analytics.hasAnalyticsConsent(), false);
    assert.equal(h.state.reloads, 0);
    h.click('Analytics preferences');
    h.click('Allow analytics');
    assert.equal(h.sdkCount(), 2);
    assert.equal(h.analytics.hasAnalyticsConsent(), true);
    assert.equal(global.window[gaDisableKey], false);
});
