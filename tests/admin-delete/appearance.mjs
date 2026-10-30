import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect as baseExpect } from '@playwright/test';
import { inspectFooterMatrix, inspectFooter } from '../ui/footer.mjs';

const expect = baseExpect.configure({ timeout: 15000 });
const linear = value => value / 255 <= .04045 ? value / 255 / 12.92 : ((value / 255 + .055) / 1.055) ** 2.4;
const luminance = rgb => rgb.slice(0, 3).map(linear).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

async function paint(button) {
  const values = await button.evaluate(element => {
    const style = getComputedStyle(element), canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => { context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1); return [...context.getImageData(0, 0, 1, 1).data]; };
    return { text: rgba(style.color), background: rgba(style.backgroundColor), border: rgba(style.borderTopColor),
      outline: rgba(style.outlineColor), outlineWidth: parseFloat(style.outlineWidth), outlineStyle: style.outlineStyle,
      opacity: style.opacity, cursor: style.cursor, disabled: element.disabled, focusVisible: element.matches(':focus-visible') };
  });
  return { ...values, contrast: contrast(values.text, values.background) };
}

async function pointerAndKeyboard(page, button) {
  await button.scrollIntoViewIfNeeded(); await page.mouse.move(1, 1); await button.evaluate(element => element.blur());
  const normal = await paint(button);
  await button.hover(); const hover = await paint(button);
  await page.mouse.down();
  let active;
  try { active = await paint(button); }
  finally { await page.mouse.move(1, 1); await page.mouse.up(); }
  // Keyboard delivery, not a forced CSS pseudo-class. Leave by Tab and return.
  await button.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(button).toBeFocused(); const focus = await paint(button);
  return { normal, hover, active, focus };
}

export async function inspectDeleteAppearance({ page, open, dialog, article, target }) {
  const readings = [], directory = process.env.ADMIN_DELETE_VISUAL_REPORT_DIR;
  if (directory) {
    const local = relative(resolve(tmpdir()), resolve(directory));
    assert.ok(!isAbsolute(local) && !local.startsWith('..') && local.startsWith('admin-delete-visual-'), 'VISUAL_REPORT_TARGET_REFUSED');
  }
  let deletes = 0;
  const watch = request => { if (request.method() === 'DELETE') deletes++; };
  page.on('request', watch);
  try {
    for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      await page.setViewportSize(viewport); await page.mouse.move(1, 1);
      const card = article(target).getByRole('button', { name: 'Excluir usuário', exact: true });
      const cardStates = await pointerAndKeyboard(page, card);
      await open(target);
      const cancel = dialog().getByRole('button', { name: 'Cancelar', exact: true });
      await expect(cancel).toBeFocused(); const cancelPaint = await paint(cancel);
      const confirm = dialog().getByRole('button', { name: 'Excluir definitivamente', exact: true });
      const dialogStates = await pointerAndKeyboard(page, confirm);
      assert.equal(deletes, readings.length, 'POINTER_STATE_CHECK_MUST_NOT_SUBMIT');
      // Intercept a pending request before it reaches the server: exercise real
      // disabled UI without deleting even the disposable screenshot account.
      let release, received;
      const held = new Promise(done => { release = done; });
      const arrival = new Promise(done => { received = done; });
      await page.route('**/api/users/' + target.id, async route => {
        if (route.request().method() !== 'DELETE') { await route.continue(); return; }
        received(); await held;
        await route.fulfill({ status: 503, json: { error: 'USER_DELETE_FAILED' } }).catch(() => {});
      });
      try {
        await confirm.click(); await arrival;
        const disabledConfirm = dialog().getByRole('button', { name: 'Excluindo…', exact: true });
        await expect(disabledConfirm).toBeDisabled(); await expect(card).toBeDisabled();
        // Card is inert behind the native modal. Reading computed colors is
        // sufficient; actual pointer behavior is tested after closing below.
        dialogStates.disabled = await paint(disabledConfirm);
        cardStates.disabled = await paint(card);
      } finally { release(); }
      await expect(dialog()).toHaveCount(0); await page.unroute('**/api/users/' + target.id);
      await expect(card).toBeEnabled();
      readings.push({ device, card: cardStates, dialog: dialogStates, cancel: cancelPaint });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'NO_HORIZONTAL_OVERFLOW');
    }
    if (directory) await writeFile(join(directory, 'appearance.json'), JSON.stringify(readings, null, 2));
    console.log(JSON.stringify({ dangerContrast: readings.map(({ device, card, dialog }) => ({ device,
      card: Object.fromEntries(Object.entries(card).map(([state, value]) => [state, value.contrast])),
      dialog: Object.fromEntries(Object.entries(dialog).map(([state, value]) => [state, value.contrast])) })) }));
    for (const { card, dialog } of readings) for (const states of [card, dialog]) {
      for (const value of Object.values(states)) assert.ok(value.contrast >= 4.5, 'DANGER_TEXT_CONTRAST_BELOW_AA');
      for (const [state, value] of Object.entries(states)) {
        assert.deepEqual(value.text, readings[0].dialog[state].text, 'DANGER_BUTTONS_SHARE_TEXT_PALETTE');
        assert.deepEqual(value.background, readings[0].dialog[state].background, 'DANGER_BUTTONS_SHARE_BACKGROUND_PALETTE');
      }
      assert.notDeepEqual(states.normal.background, states.hover.background, 'DANGER_HOVER_IS_VISIBLE');
      assert.notDeepEqual(states.hover.background, states.active.background, 'DANGER_ACTIVE_IS_VISIBLE');
      assert.equal(states.focus.focusVisible, true); assert.equal(states.focus.outlineStyle, 'solid');
      assert.ok(states.focus.outlineWidth >= 3); assert.deepEqual(states.focus.outline.slice(0, 3), [255, 218, 98]);
      assert.equal(states.disabled.disabled, true); assert.equal(states.disabled.opacity, '1');
      assert.equal(states.disabled.cursor, 'not-allowed');
    }
    if (process.env.ADMIN_DELETE_VISUAL_CAPTURE === 'true') {
      const captures = resolve('docs/harness/evidence/ui-captures'); await mkdir(captures, { recursive: true });
      for (const [device, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
        await page.setViewportSize(viewport); await page.mouse.move(1, 1);
        // A real reload clears the preceding simulated503 feedback. Capture
        // the normal administrative page, never hide product notices with CSS.
        await page.reload();
        const source = article(target).getByRole('button', { name: 'Excluir usuário', exact: true });
        await expect(source).toBeVisible();
        if (process.env.FOOTER_BROWSER_TEST === 'true') await inspectFooterMatrix(page, 'admin-delete-footer');
        await page.evaluate(async () => { document.activeElement?.blur(); window.scrollTo(0, 0); await document.fonts.ready; });
        await page.screenshot({ path: join(captures, '06-area-admin-' + device + '.png'), fullPage: true, style: 'nextjs-portal { visibility: hidden !important; }' });
        // Match the original viewport capture at the document end, so the
        // shared footer remains visible behind the modal at both sizes.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await source.focus(); await page.keyboard.press('Enter');
        const cancel = dialog().getByRole('button', { name: 'Cancelar', exact: true });
        await expect(cancel).toBeFocused(); assert.equal(await cancel.evaluate(element => element.matches(':focus-visible')), true);
        await page.mouse.move(1, 1);
        if (process.env.FOOTER_BROWSER_TEST === 'true') await inspectFooter(page);
        await page.screenshot({ path: join(captures, '10-exclusao-confirmacao-' + device + '.png'), style: 'nextjs-portal { visibility: hidden !important; }' });
        await page.keyboard.press('Escape'); await expect(dialog()).toHaveCount(0);
      }
    }
  } finally { page.off('request', watch); await page.setViewportSize({ width: 1280, height: 900 }); }
}
