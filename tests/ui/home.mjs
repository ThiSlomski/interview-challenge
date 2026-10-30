import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer as httpsServer } from 'node:https';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { inspectFooter, productionFooterPages } from './footer.mjs';

const sizes = [
  ['desktop', 1440, 1000], ['tablet-portrait', 922, 2048],
  ['tablet-landscape', 1180, 820], ['mobile', 390, 844], ['small-mobile', 320, 740],
  // A 1440x1000 browser at 200% zoom has a 720x500 CSS layout viewport.
  ['zoom-200', 720, 500],
];
const gallery = resolve('docs/harness/evidence/ui-captures');
const safeEnv = () => Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|PATHEXT|USERPROFILE|APPDATA|LOCALAPPDATA)$/i.test(key)));

async function port() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const number = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return number;
}
async function command(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: 'ignore' });
  assert.equal((await once(child, 'exit'))[0], 0, 'HOME_COMMAND_FAILED');
}
async function matrix(t, browser, origin, mode) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const errors = { consoleError: 0, pageerror: 0 };
  page.on('console', message => {
    if (message.type() !== 'error') return;
    errors.consoleError++;
    const category = message.text().match(/(?:flushSync|hydration|status of \d+|net::[A-Z_]+|Failed to fetch RSC payload)/)?.[0] ?? 'application';
    let path = 'inline';
    try { path = new URL(message.location().url).pathname; } catch { /* no URL */ }
    console.log(JSON.stringify({ homeConsoleDiagnostic: { mode, category, path } }));
  });
  page.on('pageerror', () => errors.pageerror++);
  try {
    if (process.env.HOME_BASELINE === 'true') {
      await page.setViewportSize({ width: 922, height: 2048 });
      await page.goto(origin);
      await page.evaluate(() => document.fonts.ready);
      console.log(JSON.stringify({ homeBaseline: await page.evaluate(() => ({
        viewport: [innerWidth, innerHeight], footerBottom: document.querySelector('footer').getBoundingClientRect().bottom,
        redundantCard: !!document.querySelector('.home-card'), overflow: document.documentElement.scrollWidth > innerWidth,
      })) }));
      await page.screenshot({ path: join(process.env.HOME_EVIDENCE_DIR, 'before-tablet.png'), fullPage: true });
      return;
    }
    for (const authenticated of [false, true]) {
      if (authenticated) {
        const registration = await context.request.post(origin + '/api/users', {
          headers: { origin }, data: { name: 'Home Synthetic', email: `home-${mode}@example.test`, password: 'HomeFixture123', passwordConfirmation: 'HomeFixture123' },
        });
        assert.equal(registration.status(), 201);
        const login = await context.request.post(origin + '/api/auth/login', {
          headers: { origin }, data: { email: `home-${mode}@example.test`, password: 'HomeFixture123' },
        });
        assert.equal(login.status(), 200);
        assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 200);
      }
      for (const [name, width, height] of sizes) {
        await t.test(`home ${mode} ${authenticated ? 'authenticated' : 'public'} ${name}`, async () => {
          await page.setViewportSize({ width, height });
          await page.goto(origin);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator('h1')).toHaveText('Seus dados,em um só lugar.');
          await expect(page.getByText('Já tem uma sessão aberta?')).toHaveCount(0);
          await expect(page.locator('.home-benefits li')).toHaveCount(3);
          await inspectFooter(page);
          const metrics = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
            return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight, copy: rect('.home-copy'), panel: rect('.home-benefits'),
              footer: rect('footer'), actions: rect('.home .actions') };
          });
          assert(metrics.scrollWidth <= width, 'HOME_HORIZONTAL_OVERFLOW');
          assert(Math.abs(metrics.footer.bottom - metrics.scrollHeight) <= 1, 'HOME_FOOTER_AT_END');
          assert(metrics.footer.bottom >= height - 1, 'HOME_MIN_VIEWPORT');
          if (width < 1100) assert(metrics.panel.top >= metrics.actions.bottom, 'HOME_STACKED');
          else assert(metrics.panel.left >= metrics.copy.right, 'HOME_TWO_COLUMNS');
          if (mode === 'production' && !authenticated && process.env.HOME_UPDATE_CAPTURES === 'true') {
            if (name === 'tablet-portrait' || name === 'tablet-landscape' || name === 'zoom-200') {
              await page.screenshot({ path: join(process.env.HOME_EVIDENCE_DIR, `${name}.png`), fullPage: true });
            }
          }
          assert.deepEqual(errors, { consoleError: 0, pageerror: 0 });
        });
      }
      await t.test(`home ${mode} keyboard and real navigation ${authenticated}`, async () => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(origin);
        const links = ['.skip-link', 'header .brand', '.nav-links a:nth-child(1)', '.nav-links a:nth-child(2)', '.nav-links a:nth-child(3)', '.home .button:not(.secondary)', '.home .button.secondary', 'footer a'];
        for (const selector of links) {
          await page.keyboard.press('Tab');
          await expect(page.locator(selector)).toBeFocused();
          assert.equal(await page.locator(selector).evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
        }
        await page.goto(origin);
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(page.locator('main')).toBeFocused();
        await page.locator('.home .button:not(.secondary)').click();
        await expect(page).toHaveURL(origin + '/cadastro');
        await page.goto(origin);
        await page.locator('.home .button.secondary').click();
        await expect(page).toHaveURL(origin + '/login');
        await page.goto(origin);
        await page.getByRole('link', { name: 'Minha área', exact: true }).click();
        await expect(page).toHaveURL(origin + (authenticated ? '/area' : '/login'));
        assert.deepEqual(errors, { consoleError: 0, pageerror: 0 });
      });
      await t.test(`home ${mode} font size 200% ${authenticated}`, async () => {
        for (const width of [1440, 922, 390, 320]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(origin);
          // A stylesheet avoids changing React-owned html attributes while
          // development hydration is still completing.
          await page.addStyleTag({ content: 'html { font-size: 200%; }' });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'HOME_LARGE_FONT_OVERFLOW');
          await expect(page.locator('.home-benefits')).toBeVisible();
          await inspectFooter(page);
        }
      });
      if (mode === 'production' && !authenticated && process.env.HOME_UPDATE_CAPTURES === 'true') {
        for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
          await page.setViewportSize({ width, height });
          await page.goto(origin);
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: join(gallery, `01-home-normal-${name}.png`), fullPage: true });
          await page.keyboard.press('Tab');
          await expect(page.locator('.skip-link')).toBeFocused();
          await page.screenshot({ path: join(gallery, `01-home-focus-${name}.png`), fullPage: true });
        }
      }
    }
    console.log(JSON.stringify({ homeMode: mode, ...errors }));
  } finally { await context.close(); }
}

// Browser-level zoom through a temporary local extension, independently of the
// CSS viewport simulation above. Chromium reports the actual zoom factor.
async function realZoom(t, origin, directory, mode) {
  const extension = join(directory, `home-zoom-extension-${mode}`);
  await mkdir(extension);
  await writeFile(join(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3,
    name: 'Local home zoom verification', version: '1.0', permissions: ['tabs'],
    background: { service_worker: 'worker.js' } }));
  await writeFile(join(extension, 'worker.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
  const context = await chromium.launchPersistentContext(join(directory, `home-zoom-profile-${mode}`), {
    channel: 'chromium', headless: true, ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 1000 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const page = await context.newPage();
    const errors = { consoleError: 0, pageerror: 0 };
    page.on('console', message => { if (message.type() === 'error') errors.consoleError++; });
    page.on('pageerror', () => errors.pageerror++);
    await page.goto(origin);
    await t.test(`home ${mode} actual Chromium zoom 200% public and authenticated`, async () => {
      const factor = await worker.evaluate(async origin => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(tab => tab.url?.startsWith(origin));
        await chrome.tabs.setZoom(tab.id, 2);
        return chrome.tabs.getZoom(tab.id);
      }, origin);
      assert.equal(factor, 2);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(720);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await inspectFooter(page);
      const panel = await page.locator('.home-benefits').boundingBox();
      const actions = await page.locator('.home .actions').boundingBox();
      assert(panel.y >= actions.y + actions.height);
      if (mode === 'production' && process.env.HOME_UPDATE_CAPTURES === 'true') await page.screenshot({ path: join(process.env.HOME_EVIDENCE_DIR, 'actual-zoom-200.png'), fullPage: true });
      const login = await context.request.post(origin + '/api/auth/login', {
        headers: { origin }, data: { email: `home-${mode}@example.test`, password: 'HomeFixture123' },
      });
      assert.equal(login.status(), 200);
      assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 200);
      await page.reload();
      assert.equal(await page.evaluate(() => innerWidth), 720);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await inspectFooter(page);
      assert.deepEqual(errors, { consoleError: 0, pageerror: 0 });
    });
  } finally { await context.close(); }
}

// Production runs the same copied routes/provider, a real build and local TLS.
// No project env files are copied; only the disposable runtime credential is passed.
async function production(t, browser, directory, config, admin) {
  const appPort = await port();
  const env = { ...safeEnv(), NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
    APP_ORIGIN: 'https://localhost', SESSION_TTL_SECONDS: '3600', REGISTRATION_TEST_PG: JSON.stringify(config) };
  await command([resolve('node_modules/next/dist/bin/next'), 'build', directory, '--webpack'], directory, env);
  const openssl = process.platform === 'win32' ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl';
  const certificate = spawn(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, 'home-key.pem'), '-out', join(directory, 'home-cert.pem'), '-days', '1', '-subj', '/CN=localhost'], { windowsHide: true, stdio: 'ignore' });
  assert.equal((await once(certificate, 'exit'))[0], 0, 'HOME_TLS_CERTIFICATE');
  const proxy = httpsServer({ key: await readFile(join(directory, 'home-key.pem')), cert: await readFile(join(directory, 'home-cert.pem')) }, (req, res) => {
    const upstream = request({ hostname: '127.0.0.1', port: appPort, path: req.url, method: req.method,
      headers: { ...req.headers, 'x-forwarded-proto': 'https', 'x-forwarded-host': req.headers.host } }, incoming => {
      res.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(res);
    });
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  });
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening');
  const origin = `https://localhost:${proxy.address().port}`;
  env.APP_ORIGIN = origin;
  const child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', directory, '--hostname', '127.0.0.1', '--port', String(appPort)], { cwd: directory, env, windowsHide: true, stdio: 'ignore' });
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${appPort}`)).ok; } catch { /* bounded startup */ }
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert(ready, 'HOME_PRODUCTION_READY');
    await matrix(t, browser, origin, 'production');
    await realZoom(t, origin, directory, 'production');
    await productionFooterPages(t, browser, origin, admin);
  } finally {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      await once(killer, 'exit');
    } else { child.kill(); await once(child, 'exit'); }
    proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve));
  }
}

export async function homeBrowserTests(t, config, admin) {
  let directory;
  return registrationHttpTests(t, config, admin, 'home', async origin => {
    const browser = await chromium.launch({ channel: 'chromium' });
    try {
      await matrix(t, browser, origin, 'development');
      if (process.env.HOME_BASELINE !== 'true') {
        await realZoom(t, origin, directory, 'development');
        await production(t, browser, directory, config, admin);
      }
    } finally {
      await browser.close();
      await admin.query('DELETE FROM imobilead.users WHERE email = ANY($1)',
        [['home-development@example.test', 'home-production@example.test']]);
    }
  }, async path => { directory = path; });
}
