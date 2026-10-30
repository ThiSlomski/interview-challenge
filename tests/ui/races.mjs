import { chromium, expect as baseExpect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { watchBrowserErrors } from './console.mjs';

const expect = baseExpect.configure({ timeout: 15000 });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// Chromium executes the real component. pagehide/focus below are explicitly
// synthetic lifecycle events. route.fetch retains a real, already-produced reply.
export function uiRaceTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'ui-races', async origin => {
    const browser = await chromium.launch({ args: ['--disable-extensions'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    const diagnostics = watchBrowserErrors(page, origin);
    const email = 'ui-race@example.test';
    let id;
    const releases = [];
    try {
      const password = 'RaceFixture123';
      const signup = await context.request.post(origin + '/api/users', {
        headers: { origin }, data: { name: 'Pessoa Sintética Corrida', email, password, passwordConfirmation: password },
      });
      assert.equal(signup.status(), 201);
      id = (await signup.json()).user.id;
      const login = await context.request.post(origin + '/api/auth/login', { headers: { origin }, data: { email, password } });
      assert.equal(login.status(), 200);
      if (process.env.UI_REACT_BASELINE === 'true') {
        await t.test('baseline observation: lifecycle warning in clean browser', async () => {
          await page.goto(origin + '/area');
          await expect(page.getByText(email, { exact: true })).toBeVisible();
          await page.reload();
          await expect(page.getByText(email, { exact: true })).toBeVisible();
          const observed = diagnostics.counts();
          assert(observed.flushSync > 0, 'BASELINE_WARNING_NOT_REPRODUCED');
          assert.equal(observed.hydration, 0);
          assert.equal(await page.evaluate(() => document.body.hasAttribute('cz-shortcut-listen')), false);
          console.log(JSON.stringify({ reactBaseline: observed, extensionFreeBodyAttribute: false }));
        });
        return;
      }
      await t.test('React clean profile: entry, synchronous gate, refresh, logout and history', async () => {
        async function history(method) {
          try { await page[method]({ waitUntil: 'commit' }); }
          catch (error) {
            // A protected history navigation can be cancelled by the login
            // redirect. The URL/content assertions below must still pass.
            if (!error.message.includes('net::ERR_ABORTED')) throw error;
          }
          if (new URL(page.url()).pathname === '/area') await expect(page).toHaveURL(origin + '/login');
          await page.waitForLoadState('load');
        }
        const html = await (await context.request.get(origin + '/login')).text();
        assert.equal(html.includes('cz-shortcut-listen'), false);
        await page.goto(origin + '/login');
        await page.getByLabel('E-mail', { exact: true }).fill(email);
        await page.getByLabel('Senha', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page).toHaveURL(origin + '/area');
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        assert.equal(await page.evaluate(email => {
          const value = [...document.querySelectorAll('.record dd')].find(element => element.textContent === email);
          window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
          return Boolean(value?.closest('[hidden]'));
        }, email), true, 'GATE_MUST_CLOSE_IN_THE_SAME_EVENT_STACK');
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        await page.reload();
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        assert.equal(await page.evaluate(() => document.body.hasAttribute('cz-shortcut-listen')), false);
        await page.locator('header a.brand').click();
        await page.getByRole('link', { name: /Acessar minha/ }).click();
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Sair', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login');
        assert.equal((await context.request.get(origin + '/api/users/' + id)).status(), 401);
        await history('goBack');
        await history('goBack');
        assert.equal(await page.getByText(email, { exact: true }).isVisible(), false);
        await expect(page).toHaveURL(origin + '/login');
        await history('goForward');
        assert.equal(await page.getByText(email, { exact: true }).isVisible(), false);
        await page.getByRole('link', { name: 'Minha área', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login');
        await page.reload();
        await expect(page).toHaveURL(origin + '/login');
        diagnostics.assertClean();
      });
      const resetLogin = await context.request.post(origin + '/api/auth/login', { headers: { origin }, data: { email, password } });
      assert.equal(resetLogin.status(), 200);
      await t.test('hydration differential: controlled foreign body mutation reproduces warning', async () => {
        const injectedContext = await browser.newContext();
        await injectedContext.addInitScript(() => {
          const inject = () => {
            if (!document.body) return false;
            document.body.setAttribute('cz-shortcut-listen', 'true');
            return true;
          };
          if (!inject()) {
            const observer = new MutationObserver(() => { if (inject()) observer.disconnect(); });
            observer.observe(document, { childList: true, subtree: true });
          }
        });
        const injectedPage = await injectedContext.newPage();
        const injected = watchBrowserErrors(injectedPage, origin);
        try {
          await injectedPage.goto(origin + '/login');
          await expect.poll(() => injected.counts().hydration).toBeGreaterThan(0);
          assert.equal(await injectedPage.evaluate(() => document.body.getAttribute('cz-shortcut-listen')), 'true');
          const observed = injected.counts();
          assert.equal(observed.flushSync + observed.consoleError + observed.consoleWarning + observed.pageerror, 0);
          console.log(JSON.stringify({ controlledBodyMutation: true, diagnostics: observed, provesUserExtensionIdentity: false }));
        } finally { injected.dispose(); await injectedContext.close(); }
      });
      await t.test('race: already-produced permission delivered after synthetic pagehide', async () => {
        const captured = deferred(), release = deferred(), delivered = deferred();
        releases.push(release);
        await page.route('**/api/users/' + id, async route => {
          const response = await route.fetch();
          assert.equal(response.status(), 200);
          captured.resolve();
          await release.promise;
          try { await route.fulfill({ response }); } catch { /* cancelled current request */ }
          delivered.resolve();
        });
        await page.goto(origin + '/area');
        await bounded(captured.promise);
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
        assert.equal(await page.getByText(email, { exact: true }).isVisible(), false);
        release.resolve();
        await bounded(delivered.promise);
        if (process.env.UI_RACE_EXPECT_OLD === 'true') {
          await expect(page.getByText(email, { exact: true })).toBeVisible();
          console.log(JSON.stringify({ regression: 'pagehide-stale-reply', observedOldReveal: true, browser: 'Chromium', event: 'synthetic-pagehide', response: 'retained-real-permission-200' }));
        } else {
          // Let the browser process delivery; this bounded interval is not a new
          // network request or a claim that the server checked after invalidation.
          await page.waitForTimeout(250);
          assert.equal(await page.getByText(email, { exact: true }).isVisible(), false);
        }
      });
      if (process.env.UI_RACE_EXPECT_OLD !== 'true') await extendedRaces(t, browser, origin, admin, id);
      diagnostics.assertClean();
    } finally {
      for (const release of releases) release.resolve();
      diagnostics.dispose();
      await context.close();
      await browser.close();
      if (id) await admin.query('DELETE FROM imobilead.users WHERE id=$1', [id]);
    }
  }, async directory => {
    // Test-only React context harness in the disposable Next copy. No route or
    // test control is installed in the application's production source.
    await mkdir(join(directory, 'app', 'race-context'), { recursive: true });
    await writeFile(join(directory, 'app', 'race-context', 'page.tsx'), `
import { cookies } from 'next/headers';
import { loadArea } from '@/server/ui/area';
import Context from '@/components/ui/RaceContext';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const result = await loadArea((await cookies()).toString(), undefined);
  if (result.status !== 'ok') throw new Error('FIXTURE_AUTH_REQUIRED');
  return <main><Context data={result.data}/></main>;
}`);
    await writeFile(join(directory, 'components', 'ui', 'RaceContext.tsx'), `
'use client';
import {useState} from 'react';
import Area from './Area';
import type {AreaData} from '@/server/ui/area';
export default function Context({data}:{data:AreaData}) {
  const [value,setValue]=useState(data);
  return <><button onClick={()=>setValue({...value,own:{...value.own,name:'Contexto atualizado'}})}>Atualizar contexto</button><button onClick={()=>setValue({...value,own:{...value.own,id:'00000000-0000-4000-8000-000000000001'}})}>Trocar identidade</button><Area data={value}/></>;
}`);
  });
}

async function bounded(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('RACE_FIXTURE_TIMEOUT')), 15000); })]); }
  finally { clearTimeout(timer); }
}

async function extendedRaces(t, browser, origin, admin, sourceId) {
  let sequence = 0;
  async function scenario(name, run) {
    if (process.env.UI_RACE_CASE && !name.includes(process.env.UI_RACE_CASE)) return;
    await t.test('race controlled transport/real Chromium+HTTP: ' + name, async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const diagnostics = watchBrowserErrors(page, origin);
      const pending = [], ids = [];
      const password = 'RaceFixture123';
      const email = `ui-race-${++sequence}@example.test`;
      // A controlled transport deliberately ignores abort. Every fetch still
      // uses HTTP/Next/PG; this proves generation guards, not just cancellation.
      await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.__raceFetchGates = [];
        window.navigation.addEventListener('navigate', event => {
          const gate = document.querySelector('.record')?.closest('main > div:not([class])');
          window.name = JSON.stringify({ hiddenBeforeNavigation: gate?.hidden ?? true, target: new URL(event.destination.url).pathname });
          // Optional test-only cancellation lets a denial be observed in the
          // originating document, without a second session check from its target.
          if (window.__raceBlockNavigation) event.preventDefault();
        });
        window.fetch = (input, options = {}) => {
          const gate = document.querySelector('.record')?.closest('main > div:not([class])');
          window.__raceFetchGates.push({ path: String(input), hidden: gate?.hidden ?? true });
          const copy = { ...options };
          delete copy.signal;
          return original(input, copy);
        };
        window.__racePoll = [];
        const originalInterval = window.setInterval.bind(window);
        window.setInterval = (callback, delay, ...args) => {
          if (delay === 30000) window.__racePoll.push(callback);
          return originalInterval(callback, delay, ...args);
        };
        // Controlled callback delivery tests a timer already queued at cleanup.
        window.__raceExpiry = [];
        const originalTimeout = window.setTimeout.bind(window);
        window.setTimeout = (callback, delay, ...args) => {
          if (delay > 300000 && typeof callback === 'function' && callback.name === 'expired') window.__raceExpiry.push(callback);
          return originalTimeout(callback, delay, ...args);
        };
      });
      async function account(address) {
        const { rows: [row] } = await admin.query('INSERT INTO imobilead.users(name,email,password_hash) SELECT name,$1,password_hash FROM imobilead.users WHERE id=$2 RETURNING id', [address, sourceId]);
        ids.push(row.id);
        const response = await context.request.post(origin + '/api/auth/login', { headers: { origin }, data: { email: address, password } });
        assert.equal(response.status(), 200);
        return row.id;
      }
      const id = await account(email);
      async function hold(path, count = 1) {
        const holds = Array.from({ length: count }, () => ({ captured: deferred(), release: deferred(), delivered: deferred() }));
        pending.push(...holds);
        let index = 0;
        await page.route('**' + path, async route => {
          const held = holds[index++];
          if (!held) { await route.continue(); return; }
          const response = await route.fetch();
          held.payload = await response.json();
          held.captured.resolve(response.status());
          await held.release.promise;
          try { await route.fulfill(held.override ?? { response }); } catch { /* document may have navigated */ }
          held.delivered.resolve();
        });
        return holds;
      }
      const hidden = async value => page.evaluate(value => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value ? 'hidden' : 'visible' });
        document.dispatchEvent(new Event('visibilitychange'));
      }, value);
      const focus = () => page.evaluate(() => window.dispatchEvent(new Event('focus')));
      const poll = () => page.evaluate(() => {
        if (!window.__racePoll.length) throw new Error('FIXTURE_POLL_CALLBACK_REQUIRED');
        window.__racePoll.at(-1)();
      });
      const deliver = async held => { held.release.resolve(); await bounded(held.delivered.promise); await page.waitForTimeout(100); };
      // evaluate does not auto-wait for a paused navigation like a locator does.
      const concealed = async () => assert.equal(await page.evaluate(email => {
        const node = [...document.querySelectorAll('.record dd')].find(node => node.textContent === email);
        return Boolean(node && !node.closest('[hidden]'));
      }, email), false);
      try {
        await page.goto(origin + '/area');
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        await run({ page, context, id, email, hold, hidden, focus, poll, deliver, concealed, account });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        diagnostics.assertClean();
      } catch (error) {
        const line = error.stack?.match(/races\.mjs:(\d+):\d+/)?.[1] ?? 'unknown';
        throw new Error('RACE_SCENARIO_FAILED: ' + name + ' [' + error.name + ', line ' + line + ']');
      } finally {
        for (const held of pending) held.release.resolve();
        // Drain retained HTTP replies before disposing their request context.
        await page.unrouteAll({ behavior: 'wait' });
        console.log(JSON.stringify({ raceBrowserDiagnostics: diagnostics.counts() }));
        diagnostics.dispose();
        await context.close();
        await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[])', [ids]);
      }
    });
  }

  await scenario('periodic success keeps gate, focus, scroll and geometry stable through all three replies', async ({ page, id, email, hold, poll, deliver }) => {
    const documents = [], navigations = [], requests = [];
    page.on('request', request => {
      if (request.resourceType() === 'document') documents.push(true);
      if (request.url().includes('/api/')) requests.push(new URL(request.url()).pathname);
    });
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(true); });
    const sessions = await hold('/api/auth/session', 2);
    const [user] = await hold('/api/users/' + id);
    await page.getByRole('button', { name: 'Sair', exact: true }).focus();
    await page.evaluate(email => {
      const value = [...document.querySelectorAll('.record dd')].find(element => element.textContent === email);
      const gate = value.closest('main > div[hidden], main > div:not([class])');
      if (!gate || gate.hidden) throw new Error('VISIBLE_GATE_REQUIRED');
      // Add test-only page height so a meaningful nonzero scroll is exercised.
      document.body.style.minHeight = '2400px';
      window.scrollTo(0, 100);
      const geometry = () => JSON.stringify([...gate.querySelectorAll('section, h2, dl')].map(node => {
        const rect = node.getBoundingClientRect();
        return [rect.x, rect.y, rect.width, rect.height];
      }));
      const initial = { geometry: geometry(), focus: document.activeElement, x: scrollX, y: scrollY };
      window.__stability = { mutations: 0, changed: false, samples: 0, stop: false };
      new MutationObserver(records => { window.__stability.mutations += records.length; }).observe(gate, { attributes: true, attributeFilter: ['hidden'] });
      function sample() {
        window.__stability.samples++;
        if (gate.hidden || geometry() !== initial.geometry || document.activeElement !== initial.focus || scrollX !== initial.x || scrollY !== initial.y) window.__stability.changed = true;
        if (!window.__stability.stop) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }, email);
    await poll();
    await bounded(sessions[0].captured.promise);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await deliver(sessions[0]); await bounded(user.captured.promise);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await deliver(user); await bounded(sessions[1].captured.promise);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await deliver(sessions[1]);
    const stability = await page.evaluate(() => { window.__stability.stop = true; return window.__stability; });
    assert.equal(stability.changed, false);
    assert.equal(stability.mutations, 0);
    assert(stability.samples > 0);
    assert.deepEqual(requests, ['/api/auth/session', '/api/users/' + id, '/api/auth/session']);
    assert.equal(documents.length, 0);
    assert.equal(navigations.length, 0);
    console.log(JSON.stringify({ periodicStability: true, hiddenMutations: 0, navigations: 0, documents: 0, focusScrollLayoutChanged: false }));
  });

  const otherId = '00000000-0000-4000-8000-000000000001';
  const future = new Date(Date.now() + 7200000).toISOString();
  const faults = [
    { name: 'initial session 401', stage: 0, status: 401, redirect: '/login' },
    { name: 'initial session 403', stage: 0, status: 403 },
    { name: 'missing session', stage: 0, body: {} },
    { name: 'invalid session', stage: 0, body: { user: { id: otherId }, expiresAt: 'invalid' } },
    { name: 'different identity', stage: 0, body: { user: { id: otherId }, expiresAt: future }, redirect: '/area' },
    { name: 'user 401', stage: 1, status: 401, redirect: '/login' },
    { name: 'user 403', stage: 1, status: 403, redirect: '/area' },
    { name: 'different returned user', stage: 1, body: { user: { id: otherId } } },
    { name: 'inconsistent user reply', stage: 1, body: {} },
    { name: 'invalid JSON', stage: 1, raw: '{' },
    { name: 'final session failure', stage: 2, status: 503 },
    { name: 'final identity divergence', stage: 2, body: { user: { id: otherId }, expiresAt: future }, redirect: '/area' },
    { name: 'final session expired', stage: 2, expired: true, redirect: '/login' },
    { name: 'final session deadline changed', stage: 2, changedDeadline: true },
  ];
  for (const fault of faults) await scenario('periodic rejects ' + fault.name, async ({ page, id, email, hold, poll, deliver, concealed }) => {
    const sessions = await hold('/api/auth/session', 2);
    const [user] = await hold('/api/users/' + id);
    if (fault.redirect) await page.evaluate(() => { window.__raceBlockNavigation = true; });
    await poll();
    const stages = [sessions[0], user, sessions[1]];
    for (let index = 0; index <= fault.stage; index++) {
      const held = stages[index];
      assert.equal(await bounded(held.captured.promise), 200);
      await expect(page.getByText(email, { exact: true })).toBeVisible();
      if (index === fault.stage) {
        const ownSession = { user: { id }, expiresAt: fault.expired ? new Date(0).toISOString() : future };
        const body = fault.stage === 1 && fault.body?.user
          ? { user: { ...held.payload.user, ...fault.body.user } }
          : fault.body ?? (fault.expired || fault.changedDeadline ? ownSession : { error: 'CONTROLLED_DENIAL' });
        held.override = { status: fault.status ?? 200, contentType: 'application/json', body: fault.raw ?? JSON.stringify(body) };
      }
      await deliver(held);
    }
    if (fault.redirect) {
      assert.deepEqual(await page.evaluate(() => JSON.parse(window.name)), { hiddenBeforeNavigation: true, target: fault.redirect });
      await concealed();
    } else {
      await expect(page.locator('main [role="alert"]')).toBeVisible();
      await concealed();
    }
  });

  await scenario('periodic expiry timer conceals pending request and stale response cannot reveal', async ({ page, context, id, hold, poll, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await poll(); await bounded(old.captured.promise);
    const deadline = Date.parse((await (await context.request.get(origin + '/api/auth/session')).json()).expiresAt);
    // Deliver the actual local expiry callback at the exact absolute deadline.
    // Pending transport ignores abort, so cancellation alone cannot pass.
    await page.evaluate(deadline => {
      window.__raceBlockNavigation = true;
      Date.now = () => deadline;
      window.__raceExpiry.at(-1)();
    }, deadline);
    assert.deepEqual(await page.evaluate(() => JSON.parse(window.name)), { hiddenBeforeNavigation: true, target: '/login' });
    await concealed();
    await deliver(old); await concealed();
  });

  for (const event of ['focus', 'pageshow', 'visibilitychange']) await scenario('restrictive ' + event + ' conceals before fetch and invalidates pending periodic response', async ({ page, id, email, hold, poll, deliver, concealed, hidden }) => {
    const [old, fresh] = await hold('/api/users/' + id, 2);
    await poll(); await bounded(old.captured.promise);
    const [session] = await hold('/api/auth/session');
    if (event === 'visibilitychange') { await hidden(true); await hidden(false); }
    else await page.evaluate(event => window.dispatchEvent(event === 'pageshow' ? new PageTransitionEvent(event, { persisted: true }) : new Event(event)), event);
    await bounded(session.captured.promise); await concealed();
    assert.equal(await page.evaluate(() => window.__raceFetchGates.at(-1).hidden), true, 'RESTRICTIVE_HIDES_BEFORE_FETCH');
    await deliver(old); await concealed();
    await deliver(session); await bounded(fresh.captured.promise);
    await deliver(fresh); await expect(page.getByText(email, { exact: true })).toBeVisible();
  });

  await scenario('identity props change conceals before fetch and invalidates periodic generation', async ({ page, id, email, hold, poll, deliver, concealed }) => {
    await page.goto(origin + '/race-context');
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    const [old] = await hold('/api/users/' + id);
    await poll(); await bounded(old.captured.promise);
    const [fresh] = await hold('/api/auth/session');
    await page.getByRole('button', { name: 'Trocar identidade', exact: true }).click();
    await bounded(fresh.captured.promise); await concealed();
    assert.equal(await page.evaluate(() => window.__raceFetchGates.at(-1).hidden), true, 'IDENTITY_HIDES_BEFORE_FETCH');
    await deliver(old); await concealed();
    // Remaining response is released by scenario cleanup; it cannot reopen
    // the old generation, including when the component has unmounted.
  });

  await scenario('logout during periodic revalidation conceals before POST and redirect', async ({ page, id, hold, poll, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await poll(); await bounded(old.captured.promise);
    const [logout] = await hold('/api/auth/logout');
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    assert.equal(await bounded(logout.captured.promise), 200); await concealed();
    assert.equal(await page.evaluate(() => window.__raceFetchGates.at(-1).hidden), true, 'LOGOUT_HIDES_BEFORE_POST');
    await deliver(old); await concealed();
    await page.evaluate(() => { window.__raceBlockNavigation = true; });
    await deliver(logout);
    assert.deepEqual(await page.evaluate(() => JSON.parse(window.name)), { hiddenBeforeNavigation: true, target: '/login' });
    await concealed();
  });

  await scenario('late permission after synthetic visibility hidden ignores abort', async ({ id, hold, hidden, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); assert.equal(await bounded(old.captured.promise), 200);
    await hidden(true); await deliver(old); await concealed();
  });
  await scenario('return starts new check, old response cannot reveal or release newer operation', async ({ page, id, email, hold, hidden, focus, deliver, concealed }) => {
    const [old, fresh] = await hold('/api/users/' + id, 2);
    await focus(); await bounded(old.captured.promise);
    await hidden(true); await hidden(false); await bounded(fresh.captured.promise);
    await deliver(old); await concealed();
    await deliver(fresh); await expect(page.getByText(email, { exact: true })).toBeVisible();
  });
  await scenario('revocation after retained real 200, new check is actually unauthenticated', async ({ page, context, id, hold, hidden, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); assert.equal(await bounded(old.captured.promise), 200);
    await admin.query('UPDATE imobilead.sessions SET revoked_at=now() WHERE user_id=$1', [id]);
    await hidden(true); await hidden(false);
    await expect(page).toHaveURL(origin + '/login');
    assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 401);
    await deliver(old); await concealed();
  });
  await scenario('out of order: newer simulated failure wins over earlier real 200 delivered last', async ({ page, id, hold, hidden, focus, deliver, concealed }) => {
    const [old, fresh] = await hold('/api/users/' + id, 2);
    await focus(); await bounded(old.captured.promise);
    await hidden(true); await hidden(false); await bounded(fresh.captured.promise);
    fresh.override = { status: 503, contentType: 'application/json', body: '{"error":"USERS_FAILED"}' };
    await deliver(fresh);
    await expect(page.locator('main [role="alert"]')).toContainText(/verificar/);
    await deliver(old); await concealed();
    await expect(page.locator('main [role="alert"]')).toContainText(/verificar/);
  });
  await scenario('logout success with permission pending cannot reveal', async ({ page, id, hold, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); await bounded(old.captured.promise);
    const [logout] = await hold('/api/auth/logout');
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    assert.equal(await bounded(logout.captured.promise), 200);
    await deliver(old); await concealed();
    await deliver(logout); await expect(page).toHaveURL(origin + '/login');
  });
  await scenario('simulated logout 503 ignores old query and valid retry recovers', async ({ page, id, email, hold, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); await bounded(old.captured.promise);
    await page.route('**/api/auth/logout', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"AUTH_FAILED"}' }));
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page.locator('main [role="alert"]')).toContainText(/encerrar/);
    await deliver(old); await concealed();
    await page.getByRole('button', { name: 'Verificar acesso novamente', exact: true }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  });
  await scenario('identity changes during permission await and reload discards old owner', async ({ page, id, email, hold, focus, deliver, account }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); await bounded(old.captured.promise);
    const other = 'ui-race-other@example.test';
    await account(other);
    await deliver(old);
    await expect(page.getByText(other, { exact: true })).toBeVisible();
    await expect(page.getByText(email, { exact: true })).toHaveCount(0);
  });
  await scenario('timeout keeps data hidden; new valid check recovers despite late delivery', async ({ page, id, email, hold, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); await bounded(old.captured.promise);
    await expect(page.locator('main [role="alert"]')).toContainText(/demorou/, { timeout: 10000 });
    await concealed();
    await page.getByRole('button', { name: 'Verificar acesso novamente', exact: true }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await deliver(old);
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  });
  await scenario('React context update with same identity invalidates previous response before paint', async ({ page, id, email, hold, focus, deliver, concealed }) => {
    await page.goto(origin + '/race-context');
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    const [old, fresh] = await hold('/api/users/' + id, 2);
    await focus(); await bounded(old.captured.promise);
    // The area now refreshes actual field values, not only identity. Advance
    // the disposable record with the props so the next real API reply is new;
    // keep the already-produced old reply to exercise the original race.
    await admin.query("UPDATE imobilead.users SET name='Contexto atualizado',profile_version=profile_version+1 WHERE id=$1", [id]);
    await page.getByRole('button', { name: 'Atualizar contexto', exact: true }).click();
    await bounded(fresh.captured.promise);
    await page.evaluate(() => {
      if (window.__raceExpiry.length < 2) throw new Error('FIXTURE_EXPIRY_CALLBACKS_REQUIRED');
      window.__raceExpiry[0]();
    });
    await expect(page).toHaveURL(origin + '/race-context');
    await deliver(old); await concealed();
    await deliver(fresh); await expect(page.getByText('Contexto atualizado', { exact: true })).toBeVisible();
  });
  await scenario('client unmount cannot apply an old permission response', async ({ page, id, hold, focus, deliver, concealed }) => {
    const [old] = await hold('/api/users/' + id);
    await focus(); await bounded(old.captured.promise);
    await page.getByRole('link', { name: 'Cadastro', exact: true }).click();
    await expect(page).toHaveURL(origin + '/cadastro');
    await deliver(old); await concealed();
    await expect(page).toHaveURL(origin + '/cadastro');
  });
}
