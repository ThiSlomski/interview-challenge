import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Geometry and UI states only; real credentials/session regressions stay in browser.mjs.
export async function loginLayoutTests(t, browser, origin) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let pageErrors = 0;
  page.on('pageerror', () => pageErrors++);
  const metrics = () => page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight, main: rect('main'), header: rect('header'),
      footer: rect('footer'), card: rect('.login-card'), heading: rect('.page-heading'),
      block: rect('.login-content') };
  });
  try {
    if (process.env.UI_LOGIN_BASELINE === 'true') {
      await page.setViewportSize({ width: 922, height: 2048 });
      await page.goto(origin + '/login');
      console.log(JSON.stringify({ loginBaseline: await page.evaluate(() => {
        const card = document.querySelector('.login-card').getBoundingClientRect();
        return { width: innerWidth, height: innerHeight, cardX: card.x, cardWidth: card.width,
          cardTop: card.top, headerBottom: document.querySelector('header').getBoundingClientRect().bottom };
      }) }));
      return;
    }
    for (const [name, width, height] of [
      ['desktop', 1440, 1000], ['tall-desktop', 1440, 2400], ['tablet-portrait', 922, 2048],
      ['tablet-landscape', 1180, 820], ['mobile', 390, 844], ['small-mobile', 320, 740],
      ['zoom-200-layout', 720, 500], ['keyboard-reduced-viewport', 390, 420],
    ]) {
      await t.test('login layout: ' + name, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(origin + '/login');
        await page.evaluate(() => document.fonts.ready);
        const m = await metrics();
        assert(m.scrollWidth <= width, 'LOGIN_HORIZONTAL_OVERFLOW');
        assert(Math.abs(m.card.x + m.card.width / 2 - width / 2) < 1, 'LOGIN_CENTERED');
        assert(m.block.width <= 520 && m.block.width >= Math.min(480, width - 64));
        assert.equal(m.heading.x, m.card.x, 'LOGIN_HEADING_ALIGNED');
        assert.equal(m.heading.width, m.card.width);
        assert(m.heading.y >= m.header.bottom + 31, 'LOGIN_HEADER_SPACE');
        assert(m.footer.top >= m.card.bottom, 'LOGIN_FOOTER_NO_OVERLAP');
        assert(Math.abs(m.footer.bottom - m.scrollHeight) <= 1, 'LOGIN_FOOTER_AT_END');
        assert(m.footer.bottom >= height - 1);
        if (height >= 1000) {
          const center = (m.header.bottom + m.footer.top) / 2;
          const blockCenter = m.block.y + m.block.height / 2;
          assert(blockCenter <= center && center - blockCenter <= 65, 'LOGIN_VERTICAL_BALANCE');
          assert(m.scrollHeight <= height + 1, 'LOGIN_UNNECESSARY_SCROLL');
        }
        if (process.env.UI_UPDATE_CAPTURES === 'login' && ['desktop', 'tablet-portrait', 'mobile'].includes(name)) {
          const directory = resolve('docs/harness/evidence/login-captures');
          await mkdir(directory, { recursive: true });
          await page.screenshot({ path: resolve(directory, name + '.png'), fullPage: true,
            style: 'nextjs-portal { visibility: hidden !important; }' });
          console.log(JSON.stringify({ loginGeometry: { name, card: m.card, block: m.block,
            footer: m.footer, viewport: [width, height], scrollHeight: m.scrollHeight } }));
        }
        const button = page.getByRole('button', { name: 'Entrar', exact: true });
        const link = page.getByRole('link', { name: 'Criar cadastro', exact: true });
        for (const target of [page.locator('#login-email'), page.locator('#login-password'), button, link]) {
          await target.focus();
          await expect(target).toBeFocused();
          await expect(target).toBeInViewport();
          assert.equal(await target.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
        }
        const b = await button.boundingBox(), a = await link.boundingBox();
        assert(b.height >= 48 && a.height >= 48, 'LOGIN_TOUCH_TARGETS');
        if (width <= 480) {
          assert(a.y >= b.y + b.height, 'LOGIN_MOBILE_STACKED');
          assert.equal(a.width, b.width);
        } else assert(Math.abs(a.y + a.height / 2 - b.y - b.height / 2) <= 1, 'LOGIN_DESKTOP_ACTIONS');
        await page.locator('#login-email').focus();
        await page.keyboard.press('Tab');
        await expect(page.locator('#login-password')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(button).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(link).toBeFocused();
      });
    }
    for (const width of [1280, 390]) {
      await t.test('login stable width, Enter, busy and errors: ' + width, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin + '/login');
        await page.locator('#login-email').fill('layout-only@example.test');
        await page.locator('#login-password').fill('SyntheticOnly123');
        const before = await metrics();
        for (const status of [401, 503, 429]) {
          let release, requests = 0;
          const gate = new Promise(resolve => { release = resolve; });
          await page.route('**/api/auth/login', async route => {
            requests++;
            await gate;
            await route.fulfill({ status, json: { error: 'CONTROLLED_UI_STATE' } });
          });
          try {
            await page.locator('#login-password').focus();
            await page.keyboard.press('Enter');
            await expect(page.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
            await expect(page.locator('#login-email')).toBeDisabled();
            await expect(page.locator('#login-password')).toBeDisabled();
            await page.keyboard.press('Enter');
            // Dispatch duplicate submit while the response is held by this test.
            await page.locator('form').evaluate(form => form.requestSubmit());
            await expect.poll(() => requests).toBe(1);
          } finally { release(); }
          // Exercise the alert's existing keyboard focus target. Its async
          // autofocus timing belongs to the unchanged LoginForm implementation.
          await expect(page.locator('main [role="alert"]')).toBeVisible();
          await page.locator('main [role="alert"]').focus();
          await expect(page.locator('main [role="alert"]')).toBeFocused();
          await expect(page.locator('main [role="alert"]')).toContainText(
            status === 401 ? 'E-mail ou senha incorretos.' : status === 503 ? /indisponível/ : /tentativas|aguarde/i);
          await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
          const after = await metrics();
          assert.equal(after.card.width, before.card.width);
          assert.equal(after.card.x, before.card.x);
          assert(after.scrollWidth <= width);
          assert.equal(requests, 1, 'LOGIN_DUPLICATE_SUBMISSION');
          await page.unroute('**/api/auth/login');
        }
      });
    }
    assert.equal(pageErrors, 0);
  } finally { await context.close(); }
}
