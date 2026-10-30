import assert from 'node:assert/strict';

// Keep only categories/counters: React diagnostic arguments can contain private
// render data. Nothing here stores/prints raw browser messages, URLs or stacks.
export function watchBrowserErrors(page, origin, weatherFailuresExpected = false, expectedApiNotFound = false) {
  const counts = { flushSync: 0, hydration: 0, consoleError: 0, consoleWarning: 0, pageerror: 0, preloadHint: 0, navigations: 0, documents: 0 };
  function consoleMessage(message) {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;
    const text = message.text();
    if (/flushSync.*(?:lifecycle|already rendering)/i.test(text)) { counts.flushSync++; return; }
    if (/hydration|hydrated|server rendered HTML.*match/i.test(text)) { counts.hydration++; return; }
    // Chromium's unused Next preload hint is a performance notice. Track it
    // separately; it is neither a React diagnostic nor a script/resource error.
    if (type === 'warning' && (text.includes(origin + '/_next/') || text.includes(origin + '/brand/slomski-solutions-mark.svg'))
      && /^The resource .* was preloaded using link preload but not used within a few seconds/.test(text)) {
      counts.preloadHint++;
      return;
    }
    // These suites deliberately exercise failed/denied API requests. Allow only
    // Chromium's resource diagnostic at the API URL, never arbitrary app errors.
    const api = message.location().url.startsWith(origin + '/api/');
    // Opt-in only for the new DELETE404 scenario; legacy suites retain their
    // existing diagnostics contract. Never suppress React or page exceptions.
    if (api && expectedApiNotFound && /^Failed to load resource:/.test(text) && /status of 404\b/.test(text)) return;
    const weather = weatherFailuresExpected && /^https:\/\/(?:geocoding-api|api)\.open-meteo\.com\/v1\/(?:search|forecast)\?/.test(message.location().url);
    if (weather && /^Failed to load resource:/.test(text) && /(?:status of 503\b|net::ERR_FAILED|net::ERR_ABORTED)/.test(text)) return;
    if (api && /^Failed to load resource:/.test(text)
      && /(?:status of (?:400|401|403|408|409|413|415|429|500|503)\b|net::ERR_FAILED|net::ERR_ABORTED)/.test(text)) return;
    counts[type === 'warning' ? 'consoleWarning' : 'consoleError']++;
  }
  function pageError() { counts.pageerror++; }
  function navigation(frame) { if (frame === page.mainFrame()) counts.navigations++; }
  function request(request) { if (request.resourceType() === 'document') counts.documents++; }
  page.on('console', consoleMessage);
  page.on('pageerror', pageError);
  page.on('framenavigated', navigation);
  page.on('request', request);
  return {
    counts: () => ({ ...counts }),
    assertClean() {
      const errors = { ...counts };
      delete errors.preloadHint;
      delete errors.navigations;
      delete errors.documents;
      assert.deepEqual(errors, { flushSync: 0, hydration: 0, consoleError: 0, consoleWarning: 0, pageerror: 0 }, 'UNEXPECTED_BROWSER_DIAGNOSTIC');
    },
    dispose() {
      page.off('console', consoleMessage); page.off('pageerror', pageError);
      page.off('framenavigated', navigation); page.off('request', request);
    },
  };
}
