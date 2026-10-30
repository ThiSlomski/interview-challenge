import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { geocoding, weather } from '../weather/fixtures.mjs';

test('Compose production: Chromium registration, client REST weather, Secure session and logout', async () => {
  assert.match(process.env.COMPOSE_PROJECT_NAME ?? '', /^ic-smoke-[a-z0-9-]+$/);
  const origin = `https://localhost:${Number(process.env.COMPOSE_HTTP_PORT || 3000)}`;
  const browser = await chromium.launch({ channel: 'chromium' });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  try {
    const page = await context.newPage();
    const calls = [];
    await page.route('https://geocoding-api.open-meteo.com/v1/search?*', route => {
      calls.push(route.request()); return route.fulfill({ json: geocoding });
    });
    await page.route('https://api.open-meteo.com/v1/forecast?*', route => {
      calls.push(route.request()); return route.fulfill({ json: weather });
    });
    const email = `browser-${randomBytes(6).toString('hex')}@example.test`, password = 'ContainerBrowser123';
    await page.goto(origin + '/cadastro');
    for (const [field, value] of Object.entries({ name: 'Container Browser', email, password,
      passwordConfirmation: password, city: 'Cidade Sintética', state: 'Paraná', country: 'Brasil' })) {
      await page.locator('#' + field).fill(value);
    }
    await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeVisible();
    await expect(page.locator('svg.weather-icon--partly-cloudy')).toBeVisible();
    await expect(page.getByText('31 de outubro de 2026', { exact: true })).toBeVisible();
    assert.equal(calls.length, 2);
    assert.ok(calls.every(request => !request.headers().cookie));
    await page.goto(origin + '/login');
    await page.getByLabel(/^E-mail(?: \*)?$/).fill(email);
    await page.getByLabel(/^Senha(?: \*)?$/).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Minha área', exact: true })).toBeVisible();
    const session = (await context.cookies()).find(cookie => cookie.name === '__Host-imobilead_session');
    assert.equal(session.secure, true); assert.equal(session.httpOnly, true);
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page).toHaveURL(origin + '/login');
    assert.equal((await context.request.get(origin + '/api/auth/session')).status(), 401);
  } finally { await context.close(); await browser.close(); }
});
