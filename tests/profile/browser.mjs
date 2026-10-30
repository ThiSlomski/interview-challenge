import assert from 'node:assert/strict';
import { chromium, expect as baseExpect } from '@playwright/test';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { watchBrowserErrors } from '../ui/console.mjs';

const expect = baseExpect.configure({ timeout: 15000 });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

// Real browser/Next/PostgreSQL, synthetic accounts only. No versioned captures
// or raw browser output. Controlled delayed replies exercise generation gates.
export function profileBrowserTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'profile-ui', async origin => {
    const browser = await chromium.launch({ args: ['--disable-extensions'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const diagnostics = watchBrowserErrors(page, origin);
    const releases = [];
    const email = 'profile-ui@example.test', password = 'ProfileUi123';
    let id;
    async function enter() {
      const login = await context.request.post(origin + '/api/auth/login', { headers: { origin }, data: { email, password } });
      assert.equal(login.status(), 200);
      await page.goto(origin + '/area');
      await expect(page.getByRole('button', { name: 'Editar meu cadastro', exact: true })).toBeVisible();
    }
    async function edit() {
      await page.getByRole('button', { name: 'Editar meu cadastro', exact: true }).click();
      await expect(page.getByRole('form', { name: 'Editar meu cadastro' })).toBeVisible();
      await expect(page.getByLabel('Nome', { exact: true })).toBeFocused();
    }
    async function scenario(name, run) {
      await t.test('profile UI Chromium/Next/PG: ' + name, async () => {
        try { await run(); diagnostics.assertClean(); }
        catch (error) {
          const line = error.stack?.match(/browser\.mjs:(\d+):\d+/)?.[1] ?? 'unknown';
          throw new Error('PROFILE_UI_FAILED: ' + name + ' [' + error.name + ', line ' + line + ']');
        }
      });
    }
    try {
      const signup = await context.request.post(origin + '/api/users', { headers: { origin }, data: { name: 'Perfil Sintético', email, password, passwordConfirmation: password, city: 'Cidade inicial' } });
      assert.equal(signup.status(), 201); id = (await signup.json()).user.id;
      await enter();
      await scenario('edit own fields, immutable email, no password and server-confirmed display', async () => {
        await edit();
        await expect(page.getByLabel('E-mail', { exact: true })).toHaveAttribute('readonly', '');
        await expect(page.locator('input[type="password"]')).toHaveCount(0);
        await page.getByLabel('Nome', { exact: true }).fill('Perfil atualizado');
        await page.getByLabel('Cidade', { exact: true }).fill('Cidade atualizada');
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText('Cadastro atualizado com sucesso.');
        await expect(page.locator('dd').filter({ hasText: /^Perfil atualizado$/ })).toBeVisible();
        await expect(page.locator('dd').filter({ hasText: /^Cidade atualizada$/ })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Editar meu cadastro', exact: true })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Editar meu cadastro', exact: true })).toBeFocused();
        const row = (await admin.query('SELECT name,email,city,profile_version FROM imobilead.users WHERE id=$1', [id])).rows[0];
        assert.deepEqual(row, { name: 'Perfil atualizado', email, city: 'Cidade atualizada', profile_version: 2 });
        assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
      });
      await scenario('cancel, shared Unicode limit and mobile keyboard use', async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await edit();
        await page.getByLabel('Nome', { exact: true }).fill('😀'.repeat(151));
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await expect(page.getByRole('form', { name: 'Editar meu cadastro' }).getByRole('alert')).toBeFocused();
        await expect(page.getByLabel('Nome', { exact: true })).toHaveAttribute('aria-invalid', 'true');
        await page.getByRole('button', { name: 'Cancelar edição', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('button', { name: 'Editar meu cadastro', exact: true })).toBeFocused();
        await expect(page.locator('dd').filter({ hasText: /^Perfil atualizado$/ })).toBeVisible();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.setViewportSize({ width: 1280, height: 900 });
      });
      await scenario('conflict retains draft and explicit reload discards it', async () => {
        await edit();
        await page.getByLabel('Nome', { exact: true }).fill('Rascunho concorrente');
        const current = await context.request.get(origin + '/api/profile');
        const profile = await current.json();
        const changed = await context.request.patch(origin + '/api/profile', { headers: { origin, 'If-Match': current.headers().etag }, data: { expectedVersion: profile.profileVersion, name: 'Outra aba' } });
        assert.equal(changed.status(), 200);
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await expect(page.getByRole('form', { name: 'Editar meu cadastro' }).getByRole('alert')).toContainText('alterado em outra operação');
        await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Rascunho concorrente');
        await expect(page.getByRole('button', { name: 'Salvar alterações', exact: true })).toBeDisabled();
        await page.getByRole('button', { name: 'Recarregar cadastro', exact: true }).click();
        await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Outra aba');
        await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
      });
      await scenario('background checks update display without overwriting draft', async () => {
        // Shorten only the production polling interval in this isolated page;
        // expiry/deadline and all server responses retain their real semantics.
        await page.addInitScript(() => {
          const interval = window.setInterval.bind(window);
          window.setInterval = ((handler, timeout, ...args) => interval(handler, timeout === 30000 ? 100 : timeout, ...args));
        });
        await page.reload();
        await edit();
        await page.getByLabel('Cidade', { exact: true }).fill('Rascunho preservado');
        await admin.query("UPDATE imobilead.users SET city='Cidade externa',profile_version=profile_version+1 WHERE id=$1", [id]);
        await expect(page.locator('dd').filter({ hasText: /^Cidade externa$/ })).toBeVisible();
        await expect(page.getByLabel('Cidade', { exact: true })).toHaveValue('Rascunho preservado');
        await page.getByRole('button', { name: 'Cancelar edição', exact: true }).click();
      });
      await scenario('pending save is sent once and shows only server-confirmed data', async () => {
        await edit();
        const gate = deferred(), received = deferred(); releases.push(gate.resolve);
        let saves = 0;
        await page.route('**/api/profile', async route => {
          if (route.request().method() !== 'PATCH') { await route.continue(); return; }
          saves++;
          const response = await route.fetch();
          received.resolve(); await gate.promise;
          await route.fulfill({ response });
        });
        await page.getByLabel('Nome', { exact: true }).fill('Salvo uma vez');
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await received.promise;
        await expect(page.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled();
        await expect(page.getByLabel('Nome', { exact: true })).toBeDisabled();
        gate.resolve();
        await expect(page.locator('dd').filter({ hasText: /^Salvo uma vez$/ })).toBeVisible();
        assert.equal(saves, 1);
        await page.unroute('**/api/profile');
      });
      await scenario('permission response produced before save cannot overwrite new fields', async () => {
        const gate = deferred(), received = deferred(), delivered = deferred(); releases.push(gate.resolve);
        let captured = false;
        await page.route('**/api/users/' + id, async route => {
          if (captured) { await route.continue(); return; }
          captured = true;
          const response = await route.fetch(); received.resolve(); await gate.promise;
          await route.fulfill({ response }).catch(() => {}); delivered.resolve();
        });
        await received.promise;
        await edit();
        await page.getByLabel('Nome', { exact: true }).fill('Versão depois da resposta antiga');
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await expect(page.locator('dd').filter({ hasText: /^Versão depois da resposta antiga$/ })).toBeVisible();
        gate.resolve(); await delivered.promise;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(page.locator('dd').filter({ hasText: /^Versão depois da resposta antiga$/ })).toBeVisible();
        await page.unroute('**/api/users/' + id);
      });
      await scenario('hidden discards pending draft and late save response cannot reopen it', async () => {
        await edit();
        const gate = deferred(), received = deferred(); releases.push(gate.resolve);
        await page.route('**/api/profile', async route => {
          if (route.request().method() !== 'PATCH') { await route.continue(); return; }
          const response = await route.fetch(); received.resolve(); await gate.promise;
          await route.fulfill({ response }).catch(() => {});
        });
        await page.getByLabel('Nome', { exact: true }).fill('Salvo antes de ocultar');
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await received.promise;
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
        gate.resolve();
        await expect(page.getByRole('form', { name: 'Editar meu cadastro' })).toHaveCount(0);
        await expect(page.locator('main [hidden]')).toHaveCount(1);
        await page.unroute('**/api/profile');
        await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
        await expect(page.locator('dd').filter({ hasText: /^Salvo antes de ocultar$/ })).toBeVisible();
      });
      await scenario('admin can edit own profile outside the current listing page', async () => {
        await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [id]);
        await page.goto(origin + '/area?after=ffffffff-ffff-ffff-ffff-ffffffffffff');
        await expect(page.getByRole('heading', { name: 'Painel administrativo' })).toBeVisible();
        await expect(page.getByText('Nenhum cadastro nesta página.', { exact: true })).toBeVisible();
        await edit();
        await page.getByLabel('Nome', { exact: true }).fill('Administrador atualizado');
        await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText('Cadastro atualizado com sucesso.');
        assert.equal((await admin.query('SELECT name,role FROM imobilead.users WHERE id=$1', [id])).rows[0].name, 'Administrador atualizado');
      });
      await scenario('logout discards editor and revokes session', async () => {
        await edit();
        await page.getByLabel('Nome', { exact: true }).fill('Rascunho descartado');
        await page.getByRole('button', { name: 'Sair', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login');
        await expect(page.getByRole('form', { name: 'Editar meu cadastro' })).toHaveCount(0);
        const session = await context.request.get(origin + '/api/auth/session');
        assert.equal(session.status(), 401);
      });
    } finally {
      for (const release of releases) release();
      await page.unrouteAll({ behavior: 'wait' });
      diagnostics.dispose();
      await context.close(); await browser.close();
      if (id) await admin.query('DELETE FROM imobilead.users WHERE id=$1', [id]);
    }
  });
}
