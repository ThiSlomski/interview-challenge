import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { watchBrowserErrors } from './console.mjs';

export async function inspectFooterLink(page, origin) {
  const destination = 'https://www.slomskisolutions.com.br';
  const externalRoute = route => route.fulfill({ contentType: 'text/html', body: '<title>Local destination fixture</title>' });
  async function activate(targetPage, action) {
    const opened = targetPage.waitForEvent('popup');
    await action();
    const popup = await opened;
    try {
      await popup.waitForLoadState();
      assert.equal(popup.url(), destination + '/');
      assert.equal(await popup.evaluate(() => window.opener === null), true);
      await expect(targetPage).toHaveURL(origin + '/');
    } finally { await popup.close(); }
  }
  await page.goto(origin);
  const context = page.context();
  await context.route(destination + '/**', externalRoute);
  try {
    const brand = page.locator('.footer-brand');
    await brand.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.evaluate(() => document.fonts.ready);
    const before = await brand.boundingBox();
    const normal = await brand.evaluate(element => getComputedStyle(element).color);
    await brand.hover();
    assert.equal(await brand.evaluate(element => getComputedStyle(element).cursor), 'pointer');
    assert.notEqual(await brand.evaluate(element => getComputedStyle(element).color), normal);
    assert.deepEqual(await brand.boundingBox(), before, 'HOVER_PRESERVES_GEOMETRY');
    await activate(page, () => brand.locator('img').click());
    await activate(page, () => brand.locator('.brand-name').click());
    // Reach the complete brand through the native tab order.
    await page.mouse.move(0, 0);
    await brand.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(brand).toBeFocused();
    const focus = await brand.evaluate(element => {
      const style = getComputedStyle(element);
      return { visible: element.matches(':focus-visible'), outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth), color: style.color };
    });
    assert(focus.visible && focus.outline === 'solid' && focus.width >= 3);
    assert.notEqual(focus.color, normal);
    assert.deepEqual(await brand.boundingBox(), before, 'FOCUS_PRESERVES_GEOMETRY');
    await activate(page, () => page.keyboard.press('Enter'));
  } finally { await context.unroute(destination + '/**', externalRoute); }

  const touchContext = await context.browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    await touchContext.route(destination + '/**', externalRoute);
    const mobile = await touchContext.newPage();
    await mobile.goto(origin);
    await inspectFooter(mobile);
    await activate(mobile, () => mobile.locator('.footer-brand img').tap());
    await activate(mobile, () => mobile.locator('.footer-brand .brand-name').tap());
  } finally { await touchContext.close(); }
}

export async function inspectFooter(page) {
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('footer a')).toHaveAccessibleName('Acessar o site da Slomski Solutions');
  await expect(page.locator('footer a')).toHaveAttribute('href', 'https://www.slomskisolutions.com.br');
  await expect(page.locator('footer a')).toHaveAttribute('target', '_blank');
  await expect(page.locator('footer a')).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('footer a img')).toHaveCount(1);
  await expect(page.locator('footer a .brand-name')).toHaveText('SLOMSKISOLUTIONS');
  await expect(page.locator('footer img')).toHaveAttribute('alt', '');
  await expect(page.locator('.footer-slogan')).toHaveText('Engenharia digital para um futuro real.');
  await expect(page.locator('.footer-copyright')).toHaveText('© 2026 SLOMSKI SOLUTIONS');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const metrics = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { width: innerWidth, height: innerHeight, y: scrollY,
      scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
      main: rect('main'), footer: rect('footer'), content: rect('.footer-content'),
      brand: rect('.footer-brand'), slogan: rect('.footer-slogan'), copyright: rect('.footer-copyright'),
      position: getComputedStyle(document.querySelector('footer')).position,
      logoLoaded: document.querySelector('footer img').naturalWidth > 0 };
  });
  assert(metrics.logoLoaded, 'FOOTER_LOCAL_LOGO_LOADED');
  assert(metrics.scrollWidth <= metrics.width, 'FOOTER_NO_HORIZONTAL_OVERFLOW');
  assert(Math.abs(metrics.footer.bottom + metrics.y - metrics.scrollHeight) <= 1, 'FOOTER_AT_DOCUMENT_END');
  assert(metrics.footer.bottom + metrics.y >= metrics.height - 1, 'FOOTER_MIN_VIEWPORT');
  assert(metrics.footer.top >= metrics.main.bottom - 1, 'FOOTER_AFTER_MAIN');
  assert(!['fixed', 'absolute'].includes(metrics.position), 'FOOTER_NORMAL_FLOW');
  const center = rect => rect.x + rect.width / 2;
  if (metrics.width > 768) {
    assert(metrics.brand.right <= metrics.slogan.left, 'FOOTER_BRAND_BEFORE_SLOGAN');
    assert(metrics.slogan.right <= metrics.copyright.left, 'FOOTER_COPYRIGHT_AFTER_SLOGAN');
    assert(Math.abs(center(metrics.slogan) - center(metrics.content)) <= 1, 'FOOTER_SLOGAN_CENTERED');
  } else {
    assert(metrics.brand.bottom <= metrics.slogan.top, 'FOOTER_STACK_BRAND_FIRST');
    assert(metrics.slogan.bottom <= metrics.copyright.top, 'FOOTER_STACK_COPYRIGHT_LAST');
    assert(Math.abs(center(metrics.brand) - center(metrics.content)) <= 1, 'FOOTER_BRAND_CENTERED');
  }
  return { long: metrics.scrollHeight > metrics.height + 1 };
}

// Reuses real public/authenticated page states, never synthesizes product markup.
export async function inspectFooterMatrix(page, state) {
  const viewport = page.viewportSize();
  const scroll = await page.evaluate(() => [scrollX, scrollY]);
  const results = [];
  try {
    for (const [width, height] of [[1440, 1000], [922, 2048], [1180, 820], [390, 844], [320, 740], [720, 500]]) {
      await page.setViewportSize({ width, height });
      results.push({ width, height, ...await inspectFooter(page) });
    }
    for (const width of [922, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      // Resize footer text independently: global rem changes would also test
      // unrelated form/button/skip-link styles outside this footer task.
      const style = await page.addStyleTag({ content: '.footer-slogan { font-size: 2rem; } .footer-copyright { font-size: 1.4rem; } .footer-brand .brand-name { font-size: 1.5rem; }' });
      try { await inspectFooter(page); } finally { await style.evaluate(element => element.remove()); }
    }
    console.log(JSON.stringify({ footerState: state, layouts: results, font200: true }));
  } catch (error) {
    console.log(JSON.stringify({ footerCheckFailure: { state, viewport: page.viewportSize(),
      invariant: /^[A-Z_]+$/.test(error.message) ? error.message : error.name } }));
    throw error;
  } finally {
    await page.setViewportSize(viewport);
    await page.evaluate(([x, y]) => scrollTo(x, y), scroll);
  }
}

export async function productionFooterPages(t, browser, origin, admin) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const diagnostics = watchBrowserErrors(page, origin);
  const email = 'footer-production@example.test';
  try {
    assert.match((await admin.query('SELECT current_database() AS name')).rows[0].name, /^imobilead_test_[a-f0-9]{12}$/);
    for (const path of ['/', '/cadastro', '/login']) {
      await t.test(`production footer public ${path}`, async () => {
        await page.goto(origin + path);
        await inspectFooterMatrix(page, 'production:' + path);
        diagnostics.assertClean();
      });
    }
    await t.test('production footer completed registration and long content', async () => {
      await page.goto(origin + '/cadastro');
      for (const [field, value] of Object.entries({ name: 'Footer Synthetic', email,
        password: 'FooterFixture123', passwordConfirmation: 'FooterFixture123',
        city: 'Curitiba', state: 'Paraná', country: 'Brasil',
        message: Array.from({ length: 30 }, (_, i) => `Linha ${i + 1}: fixture visual.`).join('\n') })) {
        await page.locator('#' + field).fill(value);
      }
      await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeVisible();
      await inspectFooterMatrix(page, 'production:registration-success');
      diagnostics.assertClean();
    });
    await t.test('production footer user area and keyboard', async () => {
      await page.goto(origin + '/login');
      await page.getByLabel(/^E-mail$/).fill(email);
      await page.getByLabel(/^Senha$/).fill('FooterFixture123');
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Minha área', exact: true })).toBeVisible();
      await inspectFooterMatrix(page, 'production:user-area');
      await page.locator('footer a').focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(page.locator('footer a')).toBeFocused();
      assert(await page.locator('footer a').evaluate(element => element.matches(':focus-visible')));
      diagnostics.assertClean();
    });
    await t.test('production footer administrative area', async () => {
      await admin.query("UPDATE imobilead.users SET role='admin' WHERE email=$1", [email]);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Painel administrativo', exact: true })).toBeVisible();
      await inspectFooterMatrix(page, 'production:admin-area');
      diagnostics.assertClean();
    });
    console.log(JSON.stringify({ productionFooterDiagnostics: diagnostics.counts() }));
  } finally {
    diagnostics.dispose(); await context.close();
    await admin.query('DELETE FROM imobilead.users WHERE email=$1', [email]);
  }
}
