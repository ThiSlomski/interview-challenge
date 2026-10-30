import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function registrationLayoutTests(t, browser, origin) {
  const context = await browser.newContext();
  const page = await context.newPage();
  let pageErrors = 0;
  page.on('pageerror', () => pageErrors++);
  const metrics = () => page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight, heading: rect('.page-heading'),
      card: rect('form'), header: rect('header'), footer: rect('footer') };
  });
  try {
    if (process.env.UI_REGISTRATION_BASELINE === 'true') {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(origin + '/cadastro');
      console.log(JSON.stringify({ registrationBaseline: await metrics() }));
      return;
    }
    for (const [name, width, height] of [
      ['desktop', 1440, 1000], ['tall-desktop', 1440, 2400], ['tablet', 922, 2048],
      ['small-tablet', 768, 1024], ['narrow-tablet', 700, 900], ['mobile', 390, 844],
      ['small-mobile', 320, 740], ['zoom-layout-200', 720, 500], ['reduced-viewport', 390, 420],
    ]) {
      await t.test('registration layout: ' + name, async () => {
        await page.setViewportSize({ width, height });
        await page.goto(origin + '/cadastro');
        await page.evaluate(() => document.fonts.ready);
        const m = await metrics();
        assert(m.scrollWidth <= width);
        assert(Math.abs(m.card.x + m.card.width / 2 - width / 2) < 1);
        assert.equal(m.heading.x, m.card.x);
        assert.equal(m.heading.width, m.card.width);
        assert.equal(m.card.width, Math.min(920, width - (width <= 640 ? 32 : 64)));
        assert(m.heading.y >= m.header.bottom + 31 && m.heading.y <= m.header.bottom + 65);
        assert(m.footer.top >= m.card.bottom + 31);
        assert(Math.abs(m.footer.bottom - m.scrollHeight) <= 1);
        assert(m.footer.bottom >= height - 1);
        if (height > 2000) assert(m.scrollHeight <= height + 1);
        const boxes = await page.locator('.field').evaluateAll(fields => fields.map(field => field.getBoundingClientRect().toJSON()));
        if (width > 720) {
          assert.equal(boxes[0].y, boxes[1].y);
          assert.equal(boxes[0].width, boxes[1].width);
          assert(boxes[4].width > boxes[0].width);
          for (const i of [2, 5, 7]) assert.equal(boxes[i].y, boxes[i + 1].y);
        } else {
          for (let i = 1; i < boxes.length; i++) {
            assert.equal(boxes[0].width, boxes[i].width);
            assert(boxes[i].y >= boxes[i - 1].bottom);
          }
        }
        if (process.env.UI_UPDATE_CAPTURES === 'registration' && ['desktop', 'tablet', 'mobile'].includes(name)) {
          const directory = resolve('docs/harness/evidence/registration-captures');
          await mkdir(directory, { recursive: true });
          await page.screenshot({ path: resolve(directory, name + '.png'), fullPage: true, caret: 'initial',
            style: 'nextjs-portal { visibility: hidden !important; }' });
        }
        const ids = ['name', 'email', 'password', 'passwordConfirmation', 'address', 'city', 'state', 'country', 'postalCode', 'message'];
        await page.locator('#name').focus();
        for (const id of ids) {
          const field = page.locator('#' + id);
          await expect(field).toBeFocused();
          await expect(field).toBeInViewport();
          assert.equal(await field.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
          await page.keyboard.press('Tab');
        }
        const button = page.getByRole('button', { name: 'Criar cadastro', exact: true });
        await expect(button).toBeFocused();
        await expect(button).toBeInViewport();
        assert((await button.boundingBox()).height >= 48);
        if (width <= 640) assert.equal((await button.boundingBox()).width, boxes[0].width);
      });
    }
    for (const width of [1280, 390]) {
      await t.test('essential signup fields, errors, focus and retained values: ' + width, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin + '/cadastro');
        const values = { name: 'Pessoa Sintética', email: 'essential-ui@example.test', password: 'Synthetic123',
          passwordConfirmation: 'Synthetic123', city: 'Curitiba', state: 'Paraná', country: 'Brasil' };
        for (const [key, value] of Object.entries(values)) await page.locator('#' + key).fill(value);
        assert.equal(await page.locator('form [required]').count(), 7);
        await expect(page.locator('.required-note')).toHaveText('Nome, e-mail, senha, confirmação de senha, cidade, estado e país são obrigatórios. Endereço, CEP e mensagem são opcionais.');
        let requests = 0;
        const watch = request => { if (request.method() === 'POST' && request.url().endsWith('/api/users')) requests++; };
        page.on('request', watch);
        try {
          const messages = { name: 'Informe seu nome.', city: 'Informe uma cidade.', state: 'Informe um estado.', country: 'Informe um país.' };
          for (const [field, message] of Object.entries(messages)) {
            await page.locator('#' + field).fill(' \t\u00a0 ');
            await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
            await expect(page.locator('#' + field)).toBeFocused();
            await expect(page.locator('#' + field + '-error')).toHaveText(message);
            const link = page.locator('main [role="alert"] a[href="#' + field + '"]');
            await expect(link).toHaveText(message);
            await link.click(); await expect(page.locator('#' + field)).toBeFocused();
            await expect(page.locator('#password')).toHaveValue(values.password);
            await expect(page.locator('#email')).toHaveValue(values.email);
            assert.equal(requests, 0, 'INVALID_CLIENT_INPUT_NOT_SENT');
            await page.locator('#' + field).fill(values[field]);
          }
          for (const field of Object.keys(messages)) await page.locator('#' + field).fill(' ');
          await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
          await expect(page.locator('#name')).toBeFocused();
          assert.equal(await page.locator('main [role="alert"] a').count(), 4);
          assert.equal(requests, 0);
        } finally { page.off('request', watch); }
      });
      await t.test('registration errors, Enter and duplicate guard: ' + width, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(origin + '/cadastro');
        await page.locator('#name').fill('Pessoa Sintética');
        for (const [key, value] of Object.entries({ city: 'Curitiba', state: 'Paraná', country: 'Brasil' })) await page.locator('#' + key).fill(value);
        await page.locator('#email').fill('layout@example.test');
        await page.locator('#password').fill('Synthetic123');
        await page.locator('#passwordConfirmation').fill('Synthetic123');
        const before = await metrics();
        for (const status of [400, 409, 503]) {
          let release, requests = 0;
          const gate = new Promise(resolve => { release = resolve; });
          await page.route('**/api/users', async route => {
            requests++;
            await gate;
            await route.fulfill({ status, json: { error: 'CONTROLLED_UI_STATE', fields: { email: 'INVALID_EMAIL' } } });
          });
          try {
            await page.locator('#email').focus();
            await page.keyboard.press('Enter');
            await expect(page.getByRole('button', { name: 'Cadastrando…' })).toBeDisabled();
            assert.equal(await page.locator('form input:disabled, form textarea:disabled').count(), 10);
            await page.locator('form').evaluate(form => form.requestSubmit());
            await expect.poll(() => requests).toBe(1);
          } finally { release(); }
          await expect(status === 400 ? page.locator('#email') : page.locator('main [role="alert"]')).toBeFocused();
          await expect(page.locator('#name')).toHaveValue('Pessoa Sintética');
          await expect(page.locator('#email')).toHaveValue('layout@example.test');
          if (status === 400) {
            await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
            await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email-error');
          }
          if (status === 409) await expect(page.locator('main [role="alert"]')).toContainText('Não foi possível cadastrar este e-mail.');
          const after = await metrics();
          assert.equal(after.card.width, before.card.width);
          assert.equal(after.card.x, before.card.x);
          assert(after.scrollWidth <= width);
          assert.equal(requests, 1);
          await page.unroute('**/api/users');
        }
      });
    }
    assert.equal(pageErrors, 0);
  } finally { await context.close(); }
}
