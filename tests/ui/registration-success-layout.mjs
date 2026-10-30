import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { geocoding, weather, locationInput } from '../weather/fixtures.mjs';
import { watchBrowserErrors } from './console.mjs';

export async function registrationSuccessLayoutTests(t, browser, origin) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const diagnostics = watchBrowserErrors(page, origin);
  await page.route('**/api/users', route => route.fulfill({ status: 201, json: {} }));
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', route => route.fulfill({ json: geocoding }));
  await page.route('https://api.open-meteo.com/v1/forecast?*', route => route.fulfill({ json: weather }));
  try {
    for (const [name, width, height] of [
      ['desktop', 1440, 1000], ['tall-desktop', 1440, 2400], ['tablet', 922, 2048],
      ['small-tablet', 768, 1024], ['narrow-tablet', 700, 900], ['mobile', 390, 844],
      ['small-mobile', 320, 740], ['zoom-layout-200', 720, 500], ['reduced-viewport', 390, 420],
    ]) {
      await t.test('registration success layout: ' + name, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(origin + '/cadastro');
        await page.evaluate(() => document.fonts.ready);
        const form = await page.locator('form').boundingBox();
        for (const [key, value] of Object.entries({ name: 'Pessoa Sintética', email: 'success-layout@example.test',
          password: 'LayoutSecret123', passwordConfirmation: 'LayoutSecret123', ...locationInput })) {
          await page.locator('#' + key).fill(value);
        }
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).focus();
        await page.keyboard.press('Enter');
        const heading = page.getByRole('heading', { name: 'Cadastro concluído', exact: true });
        await expect(heading).toBeFocused();
        await expect(page.locator('.weather-card time')).toBeVisible();
        await page.evaluate(() => scrollTo(0, 0));
        const m = await page.evaluate(() => {
          const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
          return { heading: rect('h1'), intro: rect('.page-heading'), eyebrow: rect('.eyebrow'), description: rect('.page-heading > p:last-child'),
            summary: rect('[aria-label="Resumo do cadastro"]'), weather: rect('.weather-card'), footer: rect('footer'),
            scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
            outline: getComputedStyle(document.querySelector('h1')).outlineStyle };
        });
        if (process.env.UI_SUCCESS_BASELINE === 'true') {
          console.log(JSON.stringify({ successBaseline: { width, form, ...m } }));
          return;
        }
        for (const box of [m.heading, m.intro, m.eyebrow, m.description, m.summary, m.weather]) {
          assert.equal(box.x, form.x);
          assert.equal(box.width, form.width);
        }
        assert.equal(m.summary.width, Math.min(920, width - (width <= 640 ? 32 : 64)));
        assert(m.scrollWidth <= width);
        assert.equal(m.outline, 'none');
        assert(m.footer.top >= m.weather.bottom + 31);
        assert(Math.abs(m.footer.bottom - m.scrollHeight) <= 1);
        assert(m.footer.bottom >= height - 1);
        if (height > 2000) assert(m.scrollHeight <= height + 1);
        await expect(page.locator('main')).not.toContainText('LayoutSecret123');
        await expect(page.locator('input[type="password"]')).toHaveCount(0);
        await expect(page.locator('.weather-icon')).toBeVisible();
        if (width <= 640) {
          const rows = await page.locator('.record > div').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().toJSON()));
          assert(rows.every(box => box.x === rows[0].x && box.width === rows[0].width));
        }
        if (process.env.UI_UPDATE_CAPTURES === 'success' && ['desktop', 'tablet', 'mobile'].includes(name)) {
          const directory = resolve('docs/harness/evidence/registration-success-captures');
          await mkdir(directory, { recursive: true });
          await page.screenshot({ path: resolve(directory, name + '.png'), fullPage: true, caret: 'initial',
            style: 'nextjs-portal { visibility: hidden !important; }' });
        }
        await page.keyboard.press('Tab');
        const login = page.getByRole('link', { name: 'Entrar na minha conta', exact: true });
        await expect(login).toBeFocused();
        assert.notEqual(await login.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
        await expect(login).toHaveAttribute('href', '/login');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Voltar ao início', exact: true })).toBeFocused();
        diagnostics.assertClean();
      });
      if (process.env.UI_SUCCESS_BASELINE === 'true') break;
    }
  } finally {
    diagnostics.dispose();
    await context.close();
  }
}
