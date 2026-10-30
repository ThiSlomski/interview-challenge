import assert from 'node:assert/strict';
import { chromium, expect as baseExpect } from '@playwright/test';
import { registrationHttpTests } from '../registration/http-postgres.mjs';
import { watchBrowserErrors } from '../ui/console.mjs';
import { inspectDeleteAppearance } from './appearance.mjs';

const expect = baseExpect.configure({ timeout: 15000 });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function bounded(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('ADMIN_DELETE_TEST_TIMEOUT')), 15000); })]); }
  finally { clearTimeout(timer); }
}

export function adminDeleteBrowserTests(t, config, admin) {
  return registrationHttpTests(t, config, admin, 'admin-delete-ui', async origin => {
    const browser = await chromium.launch({ args: ['--disable-extensions'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage(), diagnostics = watchBrowserErrors(page, origin, false, true);
    const ids = [], releases = [], routeErrors = [];
    const email = 'delete-ui-admin@example.test', password = 'DeleteUi123';
    let actor, sequence = 0;
    // Hold real replies despite abort to prove the component's generation gate.
    await page.addInitScript(() => {
      const fetch = window.fetch.bind(window), interval = window.setInterval.bind(window);
      window.__deletePolls = [];
      window.fetch = (input, options = {}) => { const copy = { ...options }; delete copy.signal; return fetch(input, copy); };
      window.setInterval = (callback, timeout, ...args) => {
        if (timeout === 30000) window.__deletePolls.push(callback);
        return interval(callback, timeout, ...args);
      };
    });
    const dialog = () => page.getByRole('dialog', { name: 'Excluir usuário?', exact: true });
    const article = target => page.getByRole('article', { name: 'Cadastro de ' + target.name, exact: true });
    async function account(role = 'user', id) {
      const suffix = ++sequence, name = 'Alvo Sintético ' + suffix, email = `delete-ui-${suffix}@example.test`;
      const { rows: [row] } = await admin.query(`INSERT INTO imobilead.users(id,name,email,password_hash,role)
        SELECT COALESCE($1::uuid,gen_random_uuid()),$2,$3,password_hash,$4 FROM imobilead.users WHERE id=$5 RETURNING id`, [id ?? null, name, email, role, actor]);
      ids.push(row.id); return { id: row.id, name, email };
    }
    async function load(url = '/area') {
      await page.goto(origin + url);
      await expect(page.getByRole('heading', { name: 'Painel administrativo', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Usuários cadastrados', exact: true })).toBeVisible();
    }
    async function open(target) {
      const source = article(target).getByRole('button', { name: 'Excluir usuário', exact: true });
      await source.click();
      await expect(dialog()).toBeVisible();
      await expect(dialog().getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
      return source;
    }
    async function confirm() { await dialog().getByRole('button', { name: 'Excluir definitivamente', exact: true }).click(); }
    async function intercept(pattern, callback) {
      // Playwright dispatches route callbacks outside the awaited test body.
      // Capture transport errors here; assertions stay in the scenario itself.
      await page.route(pattern, async route => {
        try { await callback(route); }
        catch (error) { routeErrors.push(error.name); await route.abort('failed').catch(() => {}); }
      });
    }
    async function scenario(name, run) {
      let failed = false;
      const releaseStart = releases.length, errorStart = routeErrors.length;
      await t.test('admin delete UI Chromium/Next/PG: ' + name, async () => {
        try { await run(); assert.equal(routeErrors.length, errorStart, 'UNEXPECTED_ROUTE_HANDLER_ERROR'); diagnostics.assertClean(); }
        catch (error) {
          failed = true;
          const line = error.stack?.match(/browser\.mjs:(\d+):\d+/)?.[1] ?? 'unknown';
          throw new Error('ADMIN_DELETE_UI_FAILED: ' + name + ' [' + error.name + ', line ' + line + ']');
        } finally {
          // A failed assertion must not retain a request into the next case or
          // let the parent finish while callbacks still use the PG fixture.
          for (const release of releases.splice(releaseStart)) release();
          await page.unrouteAll({ behavior: 'wait' });
        }
      });
      if (failed) throw new Error('ADMIN_DELETE_SUITE_STOPPED_AFTER_FAILURE');
    }
    try {
      const signup = await context.request.post(origin + '/api/users', { headers: { origin }, data: { name: 'Administrador Sintético', email, password, passwordConfirmation: password } });
      assert.equal(signup.status(), 201); actor = (await signup.json()).user.id; ids.push(actor);
      await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [actor]);
      const login = await context.request.post(origin + '/api/auth/login', { headers: { origin }, data: { email, password } }); assert.equal(login.status(), 200);
      await scenario('danger buttons maintain contrast, pointer and keyboard states on desktop and mobile', async () => {
        // Keep the original screenshot order: own record, then this target.
        const target = await account('user', 'ffffffff-ffff-ffff-ffff-ffffffffffff'); await load();
        await inspectDeleteAppearance({ page, open, dialog, article, target });
      });
      await scenario('only user accounts expose delete; own and other admins are protected', async () => {
        const target = await account(), otherAdmin = await account('admin');
        await load();
        await expect(article(target).getByRole('button', { name: 'Excluir usuário', exact: true })).toBeVisible();
        await expect(article(otherAdmin).getByRole('button', { name: 'Excluir usuário', exact: true })).toHaveCount(0);
        await expect(page.getByRole('article', { name: 'Cadastro de Administrador Sintético', exact: true }).getByRole('button', { name: 'Excluir usuário', exact: true })).toHaveCount(0);
      });
      await scenario('confirmation, Cancel focus, Escape, keyboard trap and mobile layout', async () => {
        const target = await account();
        for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
          await page.setViewportSize(viewport); await load();
          const source = await open(target);
          await expect(dialog()).toContainText(target.name); await expect(dialog()).toContainText(target.email);
          await expect(dialog()).toContainText('todas as sessões'); await expect(dialog()).toContainText('definitivamente');
          await page.keyboard.press('Shift+Tab'); await expect(dialog().getByRole('button', { name: 'Excluir definitivamente', exact: true })).toBeFocused();
          await page.keyboard.press('Tab'); await expect(dialog().getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          await page.keyboard.press('Escape'); await expect(dialog()).toHaveCount(0); await expect(source).toBeFocused();
          await open(target); await dialog().getByRole('button', { name: 'Cancelar', exact: true }).click(); await expect(source).toBeFocused();
        }
        await page.setViewportSize({ width: 1280, height: 900 });
      });
      await scenario('single pending DELETE, no optimistic removal, cascade and remaining accounts preserved', async () => {
        const target = await account();
        for (let n = 0; n < 2; n++) {
          const response = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email: target.email, password }) });
          assert.equal(response.status, 200);
        }
        await load(); await open(target);
        const held = deferred(), received = deferred(); releases.push(held.resolve); let sends = 0;
        await intercept('**/api/users/' + target.id, async route => {
          if (route.request().method() !== 'DELETE') { await route.continue(); return; }
          sends++; const response = await route.fetch(); received.resolve(response.status()); await held.promise;
          await route.fulfill({ response }).catch(() => {});
        });
        await dialog().getByRole('button', { name: 'Excluir definitivamente', exact: true }).evaluate(button => { button.click(); button.click(); });
        assert.equal(await bounded(received.promise), 204);
        await expect(dialog().getByRole('button', { name: 'Excluindo…', exact: true })).toBeDisabled();
        await expect(article(target)).toHaveCount(1); assert.equal(sends, 1);
        assert.equal((await admin.query('SELECT count(*)::integer AS n FROM imobilead.sessions WHERE user_id=$1', [target.id])).rows[0].n, 0);
        held.resolve();
        await expect(article(target)).toHaveCount(0); await expect(page.getByRole('status')).toContainText('Usuário excluído');
        assert.equal((await admin.query('SELECT count(*)::integer AS n FROM imobilead.users WHERE id=$1', [actor])).rows[0].n, 1);
        await page.unroute('**/api/users/' + target.id);
      });
      await scenario('404 refetches and closes a confirmation for an already deleted account', async () => {
        const target = await account(); await load(); await open(target);
        await admin.query('DELETE FROM imobilead.users WHERE id=$1', [target.id]);
        await confirm();
        await expect(dialog()).toHaveCount(0); await expect(article(target)).toHaveCount(0);
        await expect(page.getByRole('status')).toContainText('já não está cadastrado');
      });
      await scenario('promotion after opening confirmation is refused and refresh hides the action', async () => {
        const target = await account(); await load(); await open(target);
        await admin.query("UPDATE imobilead.users SET role='admin' WHERE id=$1", [target.id]);
        await confirm(); await expect(dialog()).toHaveCount(0);
        await expect(page.locator('main [role="alert"]')).toContainText('não pode ser excluída');
        await expect(article(target).getByRole('button', { name: 'Excluir usuário', exact: true })).toHaveCount(0);
        assert.equal((await admin.query('SELECT role FROM imobilead.users WHERE id=$1', [target.id])).rows[0].role, 'admin');
      });
      await scenario('network loss after commit refetches without asserting definitive failure', async () => {
        const target = await account(); await load(); await open(target);
        const received = deferred();
        await intercept('**/api/users/' + target.id, async route => {
          if (route.request().method() !== 'DELETE') { await route.continue(); return; }
          const response = await route.fetch(); await route.abort('failed'); received.resolve(response.status());
        });
        await confirm(); assert.equal(await bounded(received.promise), 204);
        await expect(dialog()).toHaveCount(0); await expect(article(target)).toHaveCount(0);
        await expect(page.locator('main [role="alert"]')).toContainText('Não foi possível confirmar o resultado');
        await page.unroute('**/api/users/' + target.id);
      });
      await scenario('timeout refetches and a late DELETE response cannot change the new generation', async () => {
        const target = await account(); await load(); await open(target);
        const held = deferred(), received = deferred(), delivered = deferred(); releases.push(held.resolve);
        await intercept('**/api/users/' + target.id, async route => {
          if (route.request().method() !== 'DELETE') { await route.continue(); return; }
          const response = await route.fetch(); received.resolve(response.status()); await held.promise;
          await route.fulfill({ response }).catch(() => {}); delivered.resolve();
        });
        await confirm(); assert.equal(await bounded(received.promise), 204);
        await expect(dialog()).toHaveCount(0); await expect(article(target)).toHaveCount(0);
        await expect(page.locator('main [role="alert"]')).toContainText('Não foi possível confirmar o resultado');
        held.resolve(); await bounded(delivered.promise);
        await expect(article(target)).toHaveCount(0); await page.unroute('**/api/users/' + target.id);
      });
      await scenario('Escape during pending DELETE dismisses only confirmation and keeps one operation', async () => {
        const target = await account(); await load(); await open(target);
        const held = deferred(), received = deferred(); releases.push(held.resolve); let sends = 0;
        await intercept('**/api/users/' + target.id, async route => {
          if (route.request().method() !== 'DELETE') { await route.continue(); return; }
          sends++; const response = await route.fetch(); received.resolve(response.status()); await held.promise;
          await route.fulfill({ response }).catch(() => {});
        });
        await confirm(); assert.equal(await bounded(received.promise), 204); await page.keyboard.press('Escape');
        await expect(dialog()).toHaveCount(0); await expect(page.getByRole('status')).toContainText('continua em processamento');
        await expect(article(target)).toHaveCount(1); await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeEnabled();
        assert.equal(sends, 1); held.resolve(); await expect(article(target)).toHaveCount(0);
        await expect(page.getByRole('status')).toContainText('Usuário excluído'); assert.equal(sends, 1);
        await page.unroute('**/api/users/' + target.id);
      });
      await scenario('permission reply produced before deletion cannot restore the deleted record', async () => {
        const target = await account(); await load();
        const held = deferred(), received = deferred(), delivered = deferred(); releases.push(held.resolve); let captured = false;
        await intercept('**/api/users', async route => {
          if (captured) { await route.continue(); return; }
          captured = true; const response = await route.fetch(); received.resolve(); await held.promise;
          await route.fulfill({ response }).catch(() => {}); delivered.resolve();
        });
        await page.evaluate(() => window.__deletePolls.at(-1)()); await bounded(received.promise);
        await open(target); await confirm(); await expect(article(target)).toHaveCount(0);
        held.resolve(); await bounded(delivered.promise);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(article(target)).toHaveCount(0); await page.unroute('**/api/users');
      });
      await scenario('pagination replenishes page and resets an emptied final page to the first', async () => {
        await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[]) AND id<>$2', [ids, actor]);
        const first = await account('user', '00000000-0000-4000-8000-000000000001');
        const fillers = [];
        for (let n = 2; n <= 100; n++) fillers.push(await account('user', `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`));
        const last = await account('user', 'ffffffff-ffff-4fff-8fff-fffffffffff1');
        await load();
        await expect(page.getByRole('article')).toHaveCount(100); await expect(page.getByRole('link', { name: 'Próxima página', exact: true })).toBeVisible();
        await open(first); await confirm();
        await expect(page.getByRole('article')).toHaveCount(100); await expect(article(first)).toHaveCount(0);
        await page.getByRole('link', { name: 'Próxima página', exact: true }).click(); await expect(article(last)).toBeVisible();
        await open(last); await confirm();
        await expect(page).toHaveURL(origin + '/area'); await expect(page.getByRole('article')).toHaveCount(100);
        await expect(page.getByRole('link', { name: 'Próxima página', exact: true })).toHaveCount(0);
        await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[]) AND id<>$2', [ids, actor]);
      });
      await scenario('logout during a pending DELETE conceals private content and ignores the response', async () => {
        const target = await account(); await load(); await open(target);
        const held = deferred(), received = deferred(), delivered = deferred(); releases.push(held.resolve);
        await intercept('**/api/users/' + target.id, async route => {
          if (route.request().method() !== 'DELETE') { await route.continue(); return; }
          const response = await route.fetch(); received.resolve(response.status()); await held.promise;
          await route.fulfill({ response }).catch(() => {}); delivered.resolve();
        });
        await confirm(); assert.equal(await bounded(received.promise), 204);
        await dialog().getByRole('button', { name: 'Sair da conta', exact: true }).click();
        await expect(page).toHaveURL(origin + '/login'); held.resolve(); await bounded(delivered.promise);
        await expect(dialog()).toHaveCount(0); await expect(page.getByRole('article')).toHaveCount(0);
        assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 401);
        await page.unroute('**/api/users/' + target.id);
      });
    } finally {
      for (const release of releases) release();
      await page.unrouteAll({ behavior: 'wait' }); diagnostics.dispose();
      await context.close(); await browser.close();
      if (ids.length) await admin.query('DELETE FROM imobilead.users WHERE id=ANY($1::uuid[])', [ids]);
    }
  });
}
