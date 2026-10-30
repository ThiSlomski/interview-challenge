import { chromium, expect as baseExpect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { roleIdentifier } from '../../scripts/database/provision.mjs';
import { inspectFields } from './fields.mjs';
import { watchBrowserErrors } from './console.mjs';

const expect = baseExpect.configure({ timeout: 15000 });

// Real Chromium, real Next and disposable PG. No traces, cookies or raw errors logged.
export function uiBrowserTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'ui', async origin => {
    const browser = await chromium.launch({ channel: 'chromium' });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const diagnostics = watchBrowserErrors(page, origin);
    const screenshots = resolve('docs/harness/evidence/ui-captures');
    await mkdir(screenshots, { recursive: true });
    const password = 'UiFixture123';
    const email = 'ui-flow@example.test';
    let id;
    // Only hide Next's development chrome, never application content.
    async function shot(name) {
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
          await page.getByRole('heading', { name: 'Usuários cadastrados' }).evaluate(heading => heading.scrollIntoView({ block: 'start' }));
          await expect(page.locator('.record-card').first()).toBeInViewport();
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: resolve(screenshots, name + '-' + device + '.png'), fullPage: name !== '06-area-admin', style: 'nextjs-portal { visibility: hidden !important; }' });
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
      await expect(page.getByRole('heading', { name: 'Minha área', exact: true })).toBeVisible();
    }
    async function cleanBrowserState() {
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
      assert.equal(new URL(page.url()).search, '');
      assert.equal(await page.evaluate(() => document.cookie.includes('imobilead_session')), false);
    }
    try {
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
        await expect(footer).toHaveAttribute('href', 'https://www.slomskisolutions.com.br');
        await expect(footer).toHaveAttribute('target', '_blank');
        await expect(footer).toHaveAttribute('rel', 'noopener noreferrer');
        await expect(footer).toHaveAccessibleName(/Slomski Solutions.*abre em nova aba/);
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
        await page.getByLabel(/^Mensagem(?: \*)?$/).fill('<script>window.uiXss=1</script>');
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeVisible();
        id = (await admin.query('SELECT id FROM imobilead.users WHERE email=$1', [email])).rows[0].id;
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeFocused();
        assert.equal((await page.locator('body').innerText()).includes(password), false);
        assert.equal(await page.locator('input[type="password"]').count(), 0);
        assert.equal(await page.evaluate(() => window.uiXss === undefined), true);
        await expect(page.getByText('<script>window.uiXss=1</script>', { exact: true })).toBeVisible();
        await cleanBrowserState();
        assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 401);
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeFocused();
        assert.equal(await page.locator('.skip-link').evaluate(link => link.matches(':focus')), false);
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
        await page.getByRole('link', { name: /Acessar minha/ }).click();
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
      await scenario('admin fresh role and real cursor pagination; user cannot get listing', async () => {
        await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [id]);
        await admin.query("INSERT INTO imobilead.users(name,email,password_hash) SELECT 'Pessoa Sintética '||n,'ui-page-'||n||'@example.test',password_hash FROM imobilead.users CROSS JOIN generate_series(1,101) n WHERE id=$1", [id]);
        await login();
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toBeVisible();
        await page.getByRole('heading', { name: 'Usuários cadastrados' }).scrollIntoViewIfNeeded();
        await shot('06-area-admin');
        await page.getByRole('link', { name: 'Próxima página', exact: true }).click();
        await expect(page).toHaveURL(/after=/);
        await expect(page.getByRole('heading', { name: 'Usuários cadastrados' })).toBeVisible();
        await page.goto(origin + '/area?after=ffffffff-ffff-ffff-ffff-ffffffffffff');
        await expect(page.getByText('Nenhum cadastro nesta página.', { exact: true })).toBeVisible();
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
    } finally {
      console.log(JSON.stringify({ uiBrowserDiagnostics: diagnostics.counts() }));
      diagnostics.dispose();
      await context.close(); await browser.close();
      await admin.query("DELETE FROM imobilead.users WHERE email=ANY($1) OR email LIKE 'ui-page-%@example.test'", [[email,'ui-snapshot@example.test']]);
    }
  });
}
