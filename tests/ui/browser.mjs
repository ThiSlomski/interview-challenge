import { chromium, expect as baseExpect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';
import { inspectFields } from './fields.mjs';
import { watchBrowserErrors } from './console.mjs';
import { geocoding, weather } from '../weather/fixtures.mjs';
import { weatherBrowserTests } from '../weather/browser.mjs';
import { inspectFooterMatrix } from './footer.mjs';

const expect = baseExpect.configure({ timeout: 15000 });

// Real Chromium, real Next and disposable PG. No traces, cookies or raw errors logged.
export function uiBrowserTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'ui', async origin => {
    const browser = await chromium.launch({ channel: 'chromium' });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    // All external weather traffic is deterministic, including the real signup.
    await page.route('https://geocoding-api.open-meteo.com/v1/search?*', route => route.fulfill({ json: geocoding }));
    await page.route('https://api.open-meteo.com/v1/forecast?*', route => route.fulfill({ json: weather }));
    const diagnostics = watchBrowserErrors(page, origin);
    const screenshots = resolve('docs/harness/evidence/ui-captures');
    await mkdir(screenshots, { recursive: true });
    const password = 'UiFixture123';
    const email = 'ui-flow@example.test';
    let id;
    // Only hide Next's development chrome, never application content.
    async function shot(name) {
      if (process.env.FOOTER_BROWSER_TEST === 'true') await inspectFooterMatrix(page, name);
      if (process.env.UI_UPDATE_CAPTURES === 'false') return;
      if (process.env.UI_UPDATE_CAPTURES === 'profile') {
        if (name !== '04-area-user') return;
      } else
      // This requirement only changes the signup success pair. Other evidence
      // stays byte-identical while the full functional suite still executes.
      if (process.env.UI_UPDATE_CAPTURES !== 'all' && name !== '03-cadastro-sucesso') return;
      // Keep the administrative pair with its original dedicated fixture.
      if (process.env.FOOTER_BROWSER_TEST === 'true' && name === '06-area-admin') return;
      const original = page.viewportSize();
      for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => document.fonts.ready);
        const focusTarget = name === '02-cadastro-erros' ? '#password' : name === '08-login' ? '#login-email' : null;
        if (focusTarget) {
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await page.locator(focusTarget).focus();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await expect(page.locator(focusTarget)).toBeFocused();
        }
        if (name === '06-area-admin') {
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeInViewport();
          await expect(page.getByText('Você · Administrador', { exact: true })).toBeInViewport();
          await expect(page.locator('.record-card').first()).toBeInViewport();
        }
        if (name === '03-cadastro-sucesso') {
          const spacing = await page.getByRole('region', { name: 'Resumo do cadastro' }).evaluate(section =>
            section.querySelector('.registration-success-actions').getBoundingClientRect().top - section.querySelector('dl').getBoundingClientRect().bottom);
          assert(spacing >= 24, 'SUCCESS_ACTIONS_SPACING');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: resolve(screenshots, name + '-' + device + '.png'), fullPage: true, style: 'nextjs-portal { visibility: hidden !important; }' });
      }
      await page.setViewportSize(original);
    }
    async function scenario(name, run) {
      await t.test('UI real Chromium/Next/PG: ' + name, async () => {
        try {
          await run();
          await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/brand/slomski-solutions-mark.svg');
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          diagnostics.assertClean();
        }
        catch (error) {
          await page.unrouteAll({ behavior: 'wait' });
          const line = error.stack?.match(/browser\.mjs:(\d+):\d+/)?.[1] ?? 'unknown';
          throw new Error('UI_SCENARIO_FAILED: ' + name + ' [' + error.name + ', line ' + line + ', diagnostics ' + JSON.stringify(diagnostics.counts()) + ']');
        }
      });
    }
    async function signup() {
      await page.getByLabel(/^Nome(?: \*)?$/).fill('Pessoa Sintética UI');
      await page.getByLabel(/^E-mail(?: \*)?$/).fill(email);
      await page.getByLabel(/^Senha(?: \*)?$/).fill(password);
      await page.getByLabel(/^Confirmação de senha(?: \*)?$/).fill(password);
    }
    async function login(address = email) {
      await page.goto(origin + '/login');
      await page.getByLabel(/^E-mail(?: \*)?$/).fill(address);
      await page.getByLabel(/^Senha(?: \*)?$/).fill(password);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page).toHaveURL(origin + '/area');
      await expect(page.getByRole('heading', { name: /^(Minha área|Painel administrativo)$/ })).toBeVisible();
    }
    async function cleanBrowserState() {
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
      assert.equal(new URL(page.url()).search, '');
      assert.equal(await page.evaluate(() => document.cookie.includes('imobilead_session')), false);
    }
    try {
      if (process.env.UI_WEATHER_ONLY === 'true') {
        await weatherBrowserTests(t, browser, origin);
        return;
      }
      // Verify the icon resource rather than ignoring unrelated console 404s.
      assert.equal((await context.request.get(origin + '/brand/slomski-solutions-mark.svg')).status(), 200);
      await scenario('public navigation, direct protected redirect and keyboard', async () => {
        await page.goto(origin + '/area');
        await expect(page).toHaveURL(origin + '/login');
        await page.goto(origin);
        await expect(page.getByRole('link', { name: /cadastro/i }).first()).toBeVisible();
        assert.equal((await context.request.get(origin + '/brand/slomski-solutions-mark.svg')).status(), 200);
        await expect(page.locator('header img')).toBeVisible();
        assert.equal(await page.locator('header img').evaluate(image => image.naturalWidth > 0), true);
        const footer = page.locator('footer a');
        await expect(footer).toHaveAttribute('href', '/');
        await expect(footer).toHaveAccessibleName('Slomski Solutions — início');
        await expect(page.locator('.footer-slogan')).toHaveText('Engenharia digital para um futuro real.');
        await expect(page.locator('.footer-copyright')).toHaveText('© 2026 SLOMSKI SOLUTIONS');
        await shot('01-home-normal');
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement?.tagName === 'A'), true);
        const skip = await page.locator('.skip-link').boundingBox();
        const brand = await page.locator('header a.brand').boundingBox();
        assert.equal(skip.y + skip.height <= brand.y, true);
        await shot('01-home-focus');
        await page.keyboard.press('Enter');
        await expect(page.locator('main#conteudo')).toBeFocused();
      });
      await scenario('invalid signup, shared limits and associated errors', async () => {
        await page.goto(origin + '/cadastro');
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
        await expect(page.locator('main [role="alert"]')).toBeFocused();
        assert.equal(await page.locator('[aria-invalid="true"]').first().getAttribute('aria-describedby') !== null, true);
        await signup();
        await page.getByLabel(/^Confirmação de senha(?: \*)?$/).fill('Divergente123');
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByLabel(/^Confirmação de senha(?: \*)?$/)).toHaveAttribute('aria-invalid', 'true');
        await page.getByLabel(/^Nome(?: \*)?$/).fill('\u{1F600}'.repeat(151));
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByLabel(/^Nome(?: \*)?$/)).toHaveAttribute('aria-invalid', 'true');
        await page.getByLabel(/^Nome(?: \*)?$/).fill('\u{1F600}'.repeat(150));
        await page.getByLabel(/^Senha(?: \*)?$/).evaluate(input => input.removeAttribute('maxlength'));
        await page.getByLabel(/^Senha(?: \*)?$/).fill('a'.repeat(36));
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByLabel(/^Nome(?: \*)?$/)).not.toHaveAttribute('aria-invalid', 'true');
        await expect(page.getByLabel(/^Senha(?: \*)?$/)).toHaveAttribute('aria-invalid', 'true');
        await page.getByLabel(/^Senha(?: \*)?$/).fill('a'.repeat(7));
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByLabel(/^Senha(?: \*)?$/)).toHaveAttribute('aria-invalid', 'true');
        await shot('02-cadastro-erros');
      });
      await scenario('successful signup, escaped text, memory-only summary and no session', async () => {
        await signup();
        await page.getByLabel(/^Cidade(?: \*)?$/).fill('Cidade Sintética');
        await page.getByLabel(/^Estado(?: \*)?$/).fill('Paraná');
        await page.getByLabel(/^País(?: \*)?$/).fill('Brasil');
        await page.getByLabel(/^Mensagem(?: \*)?$/).fill('<script>window.uiXss=1</script>');
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeVisible();
        id = (await admin.query('SELECT id FROM imobilead.users WHERE email=$1', [email])).rows[0].id;
        // Read only this synthetic row in the disposable fixture: removing the
        // notice must not change real registration persistence.
        const persisted = (await admin.query('SELECT name,city,state,country FROM imobilead.users WHERE id=$1', [id])).rows[0];
        assert.deepEqual(persisted, { name: 'Pessoa Sintética UI', city: 'Cidade Sintética', state: 'Paraná', country: 'Brasil' });
        await expect(page.getByText('Seu cadastro foi criado. Você ainda precisa entrar para acessar a área protegida.', { exact: true })).toBeVisible();
        await expect(page.getByText(/Este resumo fica disponível somente nesta página/)).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeFocused();
        assert.equal((await page.locator('body').innerText()).includes(password), false);
        assert.equal(await page.locator('input[type="password"]').count(), 0);
        assert.equal(await page.evaluate(() => window.uiXss === undefined), true);
        await expect(page.getByText('<script>window.uiXss=1</script>', { exact: true })).toBeVisible();
        await cleanBrowserState();
        assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 401);
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeFocused();
        assert.equal(await page.locator('.skip-link').evaluate(link => link.matches(':focus')), false);
        await expect(page.getByText('31 de outubro de 2026', { exact: true })).toBeVisible();
        await expect(page.locator('svg.weather-icon--partly-cloudy')).toBeVisible();
        await expect(page.getByRole('link', { name: /Dados meteorológicos: Open-Meteo/ })).toBeVisible();
        await shot('03-cadastro-sucesso');
        await page.reload();
        await expect(page.getByRole('button', { name: 'Criar cadastro', exact: true })).toBeVisible();
        await expect(page.getByText('Pessoa Sintética UI', { exact: true })).toHaveCount(0);
      });
      await scenario('conflict, uncertain POST not retried and safe API feedback', async () => {
        await page.goto(origin + '/cadastro');
        await signup();
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toContainText(/cadastrad|e-mail/i);
        let requests = 0;
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/users', async route => { requests++; await gate; return route.abort(); });
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Cadastrando…', exact: true })).toBeDisabled();
        await page.keyboard.press('Enter');
        await expect.poll(() => requests).toBe(1);
        release();
        await expect(page.locator('main [role="alert"]')).toContainText(/resultado|confirmar/i);
        assert.equal(requests, 1);
        await page.unroute('**/api/users');
        await page.route('**/api/users', route => route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"RATE_LIMITED"}' }));
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toContainText(/tentativas|aguarde/i);
        await page.unroute('**/api/users');
      });
      await scenario('login generic error, exact password and real authenticated own record', async () => {
        await page.goto(origin + '/login?next=https://evil.example');
        await page.getByLabel(/^E-mail(?: \*)?$/).fill(email);
        await page.getByLabel(/^Senha(?: \*)?$/).fill(password + ' ');
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toContainText('E-mail ou senha incorretos.');
        await page.getByLabel(/^Senha(?: \*)?$/).fill(password);
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page).toHaveURL(origin + '/area');
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Meu cadastro', exact: true })).toBeVisible();
        await expect(page.getByText('ACESSO PROTEGIDO', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toHaveCount(0);
        await expect(page.getByText('Você · Administrador', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toHaveCount(0);
        assert.equal((await context.request.get(origin + '/api/users')).status(), 403);
        assert.equal((await page.content()).includes('password_hash'), false);
        await cleanBrowserState();
        await shot('04-area-user');
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.setViewportSize({ width: 1280, height: 900 });
      });
      await scenario('failed logout stays protected; success and back/forward/direct navigation deny', async () => {
        // Keep a protected history entry before a client-side round trip.
        await page.locator('header a.brand').click();
        await expect(page).toHaveURL(origin + '/');
        await page.getByRole('link', { name: 'Minha área', exact: true }).click();
        await expect(page).toHaveURL(origin + '/area');
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        await page.route('**/api/auth/logout', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"AUTH_FAILED"}' }));
        await page.getByRole('button', { name: 'Sair', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toBeVisible();
        await expect(page).toHaveURL(origin + '/area');
        await page.unroute('**/api/auth/logout');
        await page.getByRole('button', { name: 'Sair', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login');
        await page.goBack();
        await page.goBack();
        await expect(page.getByText(email, { exact: true })).toHaveCount(0);
        await page.goForward();
        await expect(page.getByText(email, { exact: true })).toHaveCount(0);
        await page.getByRole('link', { name: 'Minha área', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login');
        await page.goto(origin + '/area');
        await expect(page).toHaveURL(origin + '/login');
        await page.reload();
        await expect(page).toHaveURL(origin + '/login');
      });
      await scenario('revocation while using page removes private data; absolute session not renewed', async () => {
        await login();
        const before = (await admin.query('SELECT expires_at FROM imobilead.sessions WHERE user_id=$1 AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1', [id])).rows[0].expires_at;
        await page.reload();
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        assert.equal((await admin.query('SELECT expires_at FROM imobilead.sessions WHERE user_id=$1 AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1', [id])).rows[0].expires_at.getTime(), before.getTime());
        await admin.query('UPDATE imobilead.sessions SET revoked_at=now() WHERE user_id=$1', [id]);
        await expect(page.getByText(email, { exact: true })).toHaveCount(0, { timeout: 35000 });
        await expect(page).toHaveURL(origin + '/login');
      });
      await scenario('expired session direct URL denies without renewal', async () => {
        await login();
        await admin.query("UPDATE imobilead.sessions SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE user_id=$1 AND revoked_at IS NULL", [id]);
        await page.reload();
        await expect(page).toHaveURL(origin + '/login');
      });
      await scenario('client navigation snapshot stays hidden after revocation while away', async () => {
        const address = 'ui-snapshot@example.test';
        const { rows: [snapshot] } = await admin.query('INSERT INTO imobilead.users(name,email,password_hash) SELECT name,$1,password_hash FROM imobilead.users WHERE id=$2 RETURNING id', [address,id]);
        await login(address);
        await expect(page.getByText(address, { exact: true })).toBeVisible();
        await page.getByRole('link', { name: 'Cadastro', exact: true }).click();
        await expect(page).toHaveURL(origin + '/cadastro');
        await admin.query('UPDATE imobilead.sessions SET revoked_at=now() WHERE user_id=$1', [snapshot.id]);
        await page.goBack();
        assert.equal(await page.getByText(address, { exact: true }).isVisible(), false);
        await expect(page).toHaveURL(origin + '/login');
      });
      await scenario('distinct admin presentation, self identity, postal display and responsive evidence', async () => {
        await admin.query("UPDATE imobilead.users SET role='admin',postal_code='12345678' WHERE id=$1", [id]);
        await login();
        await expect(page.getByText('ACESSO ADMINISTRATIVO', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Painel administrativo', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Meu cadastro', exact: true })).toHaveCount(0);
        await expect(page.getByText('Gerencie os usuários cadastrados e mantenha seus dados administrativos atualizados.', { exact: true })).toHaveCount(1);
        await expect(page.getByText(email, { exact: true })).toHaveCount(1);
        await expect(page.getByText('Você · Administrador', { exact: true })).toHaveCount(1);
        const own = page.getByRole('article', { name: 'Cadastro de Pessoa Sintética UI', exact: true });
        await expect(own.getByText('Você · Administrador', { exact: true })).toBeVisible();
        await expect(own.getByText('12345-678', { exact: true })).toBeVisible();
        await expect(own.getByText('Não informado', { exact: true }).first()).toBeVisible();
        const listing = await (await context.request.get(origin + '/api/users')).json();
        assert.equal(await page.locator('.record-card').count(), listing.users.length);
        for (const user of listing.users) {
          await expect(page.getByText(user.email, { exact: true })).toHaveCount(1);
          if (user.id !== id && user.role === 'user') await expect(page.locator('.record-card').filter({ hasText: user.email }).locator('.record-badge')).toHaveCount(0);
        }
        assert.equal(listing.users.find(user => user.id === id).postalCode, '12345678');
        assert.equal((await admin.query('SELECT postal_code FROM imobilead.users WHERE id=$1', [id])).rows[0].postal_code, '12345678');
        await expect(page.getByRole('navigation', { name: 'Paginação de usuários' })).toHaveCount(0);
        // A syntactically valid cursor before this identity places it first,
        // retaining the real list/record without filtering or response stubs.
        const previous = (BigInt('0x' + id.replaceAll('-', '')) - 1n).toString(16).padStart(32, '0').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
        await page.goto(origin + '/area?after=' + previous);
        await expect(page.getByText('Você · Administrador', { exact: true })).toBeVisible();
        await shot('06-area-admin');
        const first = page.getByRole('link', { name: 'Primeira página', exact: true });
        await first.focus();
        await expect(first).toBeFocused();
        assert.equal(await first.evaluate(link => getComputedStyle(link).outlineStyle !== 'none'), true);
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(origin + '/area');
        for (const postal of ['A1 Test', '12345-678', '123456789', '<b>safe</b>', '12345678\n']) {
          await admin.query('UPDATE imobilead.users SET postal_code=$1 WHERE id=$2', [postal,id]);
          await page.reload();
          const postalField = page.locator('.record-card').filter({ hasText: email }).locator('dd').nth(6);
          await expect(postalField).toBeVisible();
          assert.equal(await postalField.textContent(), postal);
        }
      });
      await scenario('admin periodic validation preserves gate, focus, scroll, layout and request count', async () => {
        await admin.query('UPDATE imobilead.users SET message=$1 WHERE id=$2', ['Texto sintético extenso '.repeat(120), id]);
        await page.reload();
        await expect(page.getByText('Você · Administrador', { exact: true })).toBeVisible();
        for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
          await page.setViewportSize(viewport);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        }
        await page.getByRole('button', { name: 'Sair', exact: true }).focus();
        await page.evaluate(() => {
          const gate = document.querySelector('.area-section').parentElement;
          window.scrollTo(0, 100);
          const geometry = () => JSON.stringify([...gate.querySelectorAll('section, article, h2, dl')].map(node => {
            const rect = node.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height];
          }));
          const initial = { geometry: geometry(), focus: document.activeElement, scroll: scrollY };
          window.__adminStability = { mutations: 0, changed: false, stop: false, samples: 0 };
          const observer = new MutationObserver(records => { window.__adminStability.mutations += records.length; });
          observer.observe(gate, { attributes: true, attributeFilter: ['hidden'] });
          const sample = () => {
            const state = window.__adminStability; state.samples++;
            if (gate.hidden || geometry() !== initial.geometry || document.activeElement !== initial.focus || scrollY !== initial.scroll) state.changed = true;
            if (state.stop) observer.disconnect(); else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        const requests = [], documents = [];
        const completed = request => {
          const path = new URL(request.url()).pathname;
          if (path === '/api/auth/session' || path === '/api/users' || path === '/api/users/' + id) requests.push(path);
          if (request.resourceType() === 'document') documents.push(path);
        };
        page.on('requestfinished', completed);
        try {
          await expect.poll(() => requests.length, { timeout: 35000 }).toBe(4);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const state = await page.evaluate(() => { window.__adminStability.stop = true; return window.__adminStability; });
          assert.equal(state.mutations, 0); assert.equal(state.changed, false); assert(state.samples > 0);
          assert.deepEqual(requests, ['/api/auth/session', '/api/users', '/api/users/' + id, '/api/auth/session']);
          assert.deepEqual(documents, []);
          console.log(JSON.stringify({ adminPeriodicStability: true, hiddenMutations: 0, documents: 0, sessionCalls: 2, focusScrollLayoutChanged: false }));
        } finally {
          page.off('requestfinished', completed);
          await page.evaluate(() => { window.__adminStability.stop = true; });
        }
      });
      await scenario('admin fresh role and real cursor pagination; user cannot get listing', async () => {
        await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [id]);
        await admin.query("INSERT INTO imobilead.users(name,email,password_hash) SELECT 'Pessoa Sintética '||n,'ui-page-'||n||'@example.test',password_hash FROM imobilead.users CROSS JOIN generate_series(1,101) n WHERE id=$1", [id]);
        await login();
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Primeira página', exact: true })).toHaveCount(0);
        const seen = new Set();
        async function collect() {
          const records = await page.locator('.record-card:not(.own-admin-card) .record dd:nth-child(2)').allTextContents();
          assert(records.length > 0);
          for (const record of await page.locator('.record-card:not(.own-admin-card)').all()) {
            const address = await record.locator('dd').nth(1).innerText();
            assert.equal(seen.has(address), false); seen.add(address);
          }
        }
        await collect();
        await page.getByRole('link', { name: 'Próxima página', exact: true }).click();
        await expect(page).toHaveURL(/after=/);
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Primeira página', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Próxima página', exact: true })).toHaveCount(0);
        await collect();
        const all = (await admin.query('SELECT email FROM imobilead.users')).rows.map(row => row.email);
        assert.deepEqual([...seen].sort(), all.filter(address => address !== email).sort());
        assert.equal([...seen].filter(address => address === email).length, 0);
        await page.goto(origin + '/area?after=ffffffff-ffff-ffff-ffff-ffffffffffff');
        await expect(page.getByText('Nenhum cadastro nesta página.', { exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Primeira página', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Próxima página', exact: true })).toHaveCount(0);
        await page.goto(origin + '/area?after=invalid');
        await expect(page.getByRole('alert')).toContainText('Esta página de resultados não está disponível.');
        await expect(page.locator('.record-card')).toHaveCount(0);
        await page.goto(origin + '/area');
        await admin.query("UPDATE imobilead.users SET role='user' WHERE id=$1", [id]);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toHaveCount(0);
        assert.equal((await context.request.get(origin + '/api/users')).status(), 403);
      });
      await scenario('database failure renders safe unavailability and restores access', async () => {
        try {
          await admin.query(`REVOKE SELECT ON imobilead.sessions FROM ${roleIdentifier(config.user)}`);
          await page.reload();
          await expect(page.getByText(/indisponível/i).first()).toBeVisible();
          await expect(page.getByText(email, { exact: true })).toHaveCount(0);
          await shot('07-area-indisponivel');
        } finally { await admin.query(`GRANT SELECT ON imobilead.sessions TO ${roleIdentifier(config.user)}`); }
      });
      await scenario('login rate limit and unavailable messages, mobile form and no overflow', async () => {
        await page.goto(origin + '/login');
        await page.route('**/api/auth/login', route => route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"RATE_LIMITED"}' }));
        await page.getByLabel(/^E-mail(?: \*)?$/).fill(email);
        await page.getByLabel(/^Senha(?: \*)?$/).fill(password);
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toContainText(/tentativas|aguarde/i);
        await page.unroute('**/api/auth/login');
        await page.route('**/api/auth/login', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"AUTH_FAILED"}' }));
        await page.getByRole('button', { name: 'Entrar', exact: true }).click();
        await expect(page.locator('main [role="alert"]')).toContainText(/indisponível|tente/i);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(origin + '/cadastro');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await shot('09-cadastro');
      });
      await scenario('field keyboard focus, layout, autofill and pending state', () => inspectFields(page, context, origin, shot));
      await weatherBrowserTests(t, browser, origin);
    } finally {
      console.log(JSON.stringify({ uiBrowserDiagnostics: diagnostics.counts() }));
      diagnostics.dispose();
      await context.close(); await browser.close();
      await admin.query("DELETE FROM imobilead.users WHERE email=ANY($1) OR email LIKE 'ui-page-%@example.test'", [[email,'ui-snapshot@example.test']]);
    }
  });
}
