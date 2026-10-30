import assert from 'node:assert/strict';
import { expect } from '@playwright/test';

// Behavioral visual regression: keyboard access, stable layout, unclipped rings,
// native autofill and pending submissions. No assertions mirror CSS declarations.
export async function inspectFields(page, context, origin, capture) {
  const checks = { keyboardCases: 0, nativeAutofill: false, controlledAutofill: false };
  const client = await context.newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  await client.send('Autofill.enable');
  async function node(selector) {
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { node } = await client.send('DOM.describeNode', { nodeId });
    return { nodeId, backendNodeId: node.backendNodeId };
  }
  async function keyboard(selector) {
    const field = page.locator(selector);
    await field.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const geometry = () => field.evaluate(element => {
      const box = element.getBoundingClientRect();
      return [box.x + scrollX, box.y + scrollY, box.width, box.height];
    });
    const before = await geometry();
    await field.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(field).toBeFocused();
    assert.equal(await field.evaluate(element => element.matches(':focus-visible')), true);
    assert.deepEqual(await geometry(), before, 'FOCUS_MUST_NOT_MOVE_LAYOUT');
    assert.equal(await field.evaluate(element => {
      const style = getComputedStyle(element);
      const gap = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      if (style.outlineStyle === 'none' || gap <= 0) return false;
      const box = element.getBoundingClientRect();
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const css = getComputedStyle(parent), rect = parent.getBoundingClientRect();
        if (['hidden', 'clip', 'scroll', 'auto'].includes(css.overflowX) && (box.left - gap < rect.left || box.right + gap > rect.right)) return false;
        if (['hidden', 'clip', 'scroll', 'auto'].includes(css.overflowY) && (box.top - gap < rect.top || box.bottom + gap > rect.bottom)) return false;
      }
      return true;
    }), true, 'FOCUS_RING_MUST_NOT_BE_CLIPPED');
    checks.keyboardCases++;
  }
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(origin + '/cadastro');
    await keyboard('#name');
    await page.locator('#name').fill('Pessoa Sintética Campos');
    await keyboard('#message');
    await page.locator('#message').fill('Texto sintético selecionável');
    await page.locator('#message').selectText();
    assert.equal(await page.locator('#message').evaluate(element => element.selectionEnd > element.selectionStart), true);
    await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
    await expect(page.locator('#email')).toBeFocused();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await keyboard('#password');
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
    assert.equal(await page.locator('#password').evaluate(element => getComputedStyle(element).borderTopColor !== getComputedStyle(element).outlineColor), true);
    await page.goto(origin + '/login');
    await keyboard('#login-email');
    await page.locator('#login-email').fill('visual@example.test');
    await keyboard('#login-password');
  }
  await page.goto(origin + '/cadastro');
  const name = await node('#name');
  try {
    await client.send('Autofill.trigger', { fieldId: name.backendNodeId, address: { fields: [
      { name: 'NAME_FULL', value: 'Pessoa Sintética Autofill' },
      { name: 'EMAIL_ADDRESS', value: 'autofill@example.test' },
      { name: 'ADDRESS_HOME_LINE1', value: 'Rua Sintética' },
      { name: 'ADDRESS_HOME_CITY', value: 'Cidade Sintética' },
      { name: 'ADDRESS_HOME_STATE', value: 'SP' },
      { name: 'ADDRESS_HOME_COUNTRY', value: 'BR' },
      { name: 'ADDRESS_HOME_ZIP', value: '01001000' },
    ] } });
    checks.nativeAutofill = await page.locator('#name').evaluate(element => element.matches(':autofill'));
  } catch { /* Native protocol may refuse unsupported field classification. */ }
  if (!checks.nativeAutofill) {
    await page.locator('#name').fill('Pessoa Sintética Autofill');
    await client.send('CSS.forcePseudoState', { nodeId: name.nodeId, forcedPseudoClasses: ['autofill'] });
    checks.controlledAutofill = true;
  }
  await keyboard('#name');
  await expect(page.locator('#name')).not.toHaveValue('');
  checks.autofillPaint = await page.locator('#name').evaluate(element => {
    const style = getComputedStyle(element);
    return { text: style.webkitTextFillColor, caret: style.caretColor, shadow: style.boxShadow };
  });
  // Login password-manager integration is not seeded; exercise Blink's autofill
  // rendering directly without saving passwords or introducing a browser profile.
  await page.goto(origin + '/login');
  await page.locator('#login-email').fill('autofill@example.test');
  await page.locator('#login-password').fill('VisualFixture123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('main [role="alert"]')).toContainText(/indisponível/);
  const email = await node('#login-email');
  await client.send('CSS.forcePseudoState', { nodeId: email.nodeId, forcedPseudoClasses: ['autofill'] });
  await keyboard('#login-email');
  checks.controlledAutofill = true;
  await capture('08-login');
  await page.goto(origin + '/cadastro');
  await page.locator('#name').fill('Pessoa Sintética');
  for (const [key, value] of Object.entries({ city: 'Curitiba', state: 'Paraná', country: 'Brasil' })) await page.locator('#' + key).fill(value);
  await page.locator('#email').fill('pending-visual@example.test');
  await page.locator('#password').fill('VisualFixture123');
  await page.locator('#passwordConfirmation').fill('VisualFixture123');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/users', async route => { await gate; await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"REGISTRATION_FAILED"}' }); });
  try {
    await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
    await expect(page.locator('#name')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cadastrando…', exact: true })).toBeDisabled();
  } finally { release(); }
  await expect(page.getByRole('button', { name: 'Criar cadastro', exact: true })).toBeEnabled();
  await page.unroute('**/api/users');
  await client.detach();
  console.log(JSON.stringify({ fieldInspection: checks, pendingResponse: 'simulated-503', passwordManagerProfile: 'not-seeded' }));
}
