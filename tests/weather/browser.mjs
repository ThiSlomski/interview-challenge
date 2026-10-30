import assert from 'node:assert/strict';
import { expect as baseExpect } from '@playwright/test';
import { watchBrowserErrors } from '../ui/console.mjs';
import { geocoding, weather, locationInput } from './fixtures.mjs';

const expect = baseExpect.configure({ timeout: 15000 });
const geoPattern = 'https://geocoding-api.open-meteo.com/v1/search?*';
const forecastPattern = 'https://api.open-meteo.com/v1/forecast?*';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

export async function weatherBrowserTests(t, browser, origin) {
  async function scenario(name, run) {
    await t.test('WEATHER browser: ' + name, async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = watchBrowserErrors(page, origin, true);
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.route('**/api/users', route => route.fulfill({ status: 201, json: { user: { id: 'synthetic' } } }));
      await page.route(geoPattern, route => route.fulfill({ json: geocoding }));
      await page.route(forecastPattern, route => route.fulfill({ json: weather }));
      async function signup(input = locationInput) {
        await page.goto(origin + '/cadastro');
        await page.locator('#name').fill('Pessoa Sintética Clima');
        await page.locator('#email').fill('weather-private@example.test');
        await page.locator('#password').fill('WeatherSecret123');
        await page.locator('#passwordConfirmation').fill('WeatherSecret123');
        await page.locator('#address').fill('Endereço privado sintético 123');
        await page.locator('#postalCode').fill('12345678');
        await page.locator('#message').fill('Mensagem privada sintética');
        for (const key of ['city', 'state', 'country']) await page.locator('#' + key).fill(input[key] ?? '');
        await page.getByRole('button', { name: 'Criar cadastro', exact: true }).click();
        await confirmed();
      }
      async function confirmed() {
        await expect(page.getByRole('heading', { name: 'Cadastro concluído', exact: true })).toBeVisible();
        await expect(page.getByText('Seu cadastro foi criado. Você ainda precisa entrar para acessar a área protegida.', { exact: true })).toBeVisible();
        await expect(page.getByText(/Este resumo fica disponível somente nesta página/)).toHaveCount(0);
        await expect(page.locator('.summary-notice')).toHaveCount(0);
        await expect(page.getByRole('region', { name: 'Resumo do cadastro' })).toContainText('weather-private@example.test');
        assert.equal((await page.locator('body').innerText()).includes('WeatherSecret123'), false);
        assert.equal(await page.locator('input[type="password"]').count(), 0);
      }
      const section = page.getByRole('region', { name: 'Previsão para amanhã' });
      const success = () => expect(section.locator('time')).toHaveAttribute('datetime', '2026-10-31');
      const retry = () => page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
      try {
        await run({ page, context, requests, signup, confirmed, section, success, retry });
        assert.equal(requests.some(request => /\/api\/weather(?:\?|$)/.test(request.url())), false);
        diagnostics.assertClean();
      } catch (error) {
        const line = error.stack?.match(/weather[\\/]browser\.mjs:(\d+):\d+/)?.[1] ?? 'unknown';
        const state = await page.evaluate(() => ({ aborts: window.weatherAborts ?? window.weatherAbortCount ?? null,
          delivered: window.weatherDelivered ?? null, time: document.querySelectorAll('.weather-card time').length,
          retry: [...document.querySelectorAll('button')].filter(b => b.textContent === 'Tentar novamente').length })).catch(() => null);
        throw new Error(`WEATHER_SCENARIO_FAILED: ${name} [${error.name}, line ${line}, state ${JSON.stringify(state)}, diagnostics ${JSON.stringify(diagnostics.counts())}]`);
      } finally {
        console.log(JSON.stringify({ weatherScenario: name, diagnostics: diagnostics.counts() }));
        diagnostics.dispose();
        await context.close();
      }
    });
  }

  await scenario('immediate confirmation, loading, tomorrow, privacy, attribution, desktop/mobile', async ({ page, context, requests, signup, confirmed, section, success }) => {
    const release = deferred(), started = deferred();
    await context.addCookies([{ name: 'private-cookie', value: 'synthetic', domain: 'geocoding-api.open-meteo.com', path: '/', secure: true, sameSite: 'None' },
      { name: 'private-cookie', value: 'synthetic', domain: 'api.open-meteo.com', path: '/', secure: true, sameSite: 'None' }]);
    await page.route(geoPattern, async route => { started.resolve(); await release.promise; await route.fulfill({ json: geocoding }); });
    await signup(); await started.promise;
    await expect(section).toHaveAttribute('aria-busy', 'true');
    await expect(section.getByRole('status')).toContainText('Consultando a previsão');
    release.resolve(); await success(); await confirmed();
    await expect(section).toContainText('Cidade Sintética, Paraná, Brasil');
    await expect(section).toContainText('Parcialmente nublado');
    const icon = section.locator('svg.weather-icon');
    await expect(icon).toHaveClass(/weather-icon--partly-cloudy/);
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await expect(icon).toHaveAttribute('focusable', 'false');
    await expect(section.getByRole('img')).toHaveCount(0);
    await expect(section).toContainText('16,5 °C'); await expect(section).toContainText('26 °C'); await expect(section).toContainText('35%');
    const link = section.getByRole('link', { name: /Dados meteorológicos: Open-Meteo/ });
    await expect(link).toHaveAttribute('href', 'https://open-meteo.com/'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
    const external = requests.filter(request => new URL(request.url()).hostname.endsWith('open-meteo.com'));
    // StrictMode may start and abort the initial geocoding in development.
    const completed = [];
    for (const request of external) if (await request.response()) completed.push(request);
    assert.equal(completed.length, 2);
    for (const request of external) {
      assert.equal(request.method(), 'GET'); assert.equal(request.resourceType(), 'fetch');
      assert.equal(request.frame(), page.mainFrame()); assert.equal(request.postData(), null);
      const headers = await request.allHeaders();
      assert.equal(headers.cookie, undefined); assert.equal(headers.authorization, undefined); assert.equal(headers.referer, undefined);
      assert.equal(/weather-private|WeatherSecret|12345678|privad|synthetic/.test(request.url()), false);
    }
    const geo = new URL(completed[0].url()), forecast = new URL(completed[1].url());
    assert.equal(geo.searchParams.get('name'), 'Cidade Sintética, Paraná'); assert.equal(geo.searchParams.get('countryCode'), 'BR');
    assert.deepEqual([...geo.searchParams.keys()].sort(), ['count', 'countryCode', 'format', 'language', 'name']);
    assert.equal(forecast.searchParams.get('latitude'), '-25.43'); assert.equal(forecast.searchParams.get('longitude'), '-49.27');
    assert.equal(forecast.searchParams.get('forecast_days'), '2'); assert.equal(forecast.searchParams.get('timezone'), 'auto');
    assert.deepEqual([...forecast.searchParams.keys()].sort(), ['daily', 'forecast_days', 'latitude', 'longitude', 'timezone']);
    const response = await page.request.get(origin + '/cadastro');
    assert.equal(response.headers()['content-security-policy'], "connect-src 'self' https://geocoding-api.open-meteo.com https://api.open-meteo.com");
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await page.setViewportSize(viewport); await expect(link).toBeVisible();
      await expect(icon).toBeVisible();
      assert.equal(await icon.evaluate(node => getComputedStyle(node).animationName), 'none');
      assert.equal(await icon.evaluate(node => node.getBoundingClientRect().width), 96);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await icon.evaluate(node => getComputedStyle(node).animationName), 'none');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.reload(); await expect(page.locator('#city')).toBeVisible();
    await expect(section).toHaveCount(0);
  });
  await scenario('missing city never requests geocoding or forecast', async ({ requests, signup, section }) => {
    await signup({ city: '', state: 'Paraná', country: 'Brasil' });
    await expect(section).toContainText('Previsão indisponível porque a cidade não foi informada.');
    assert.equal(requests.some(request => request.url().includes('open-meteo.com')), false);
  });
  for (const [name, pattern, response, message] of [
    ['geocoding HTTP failure', geoPattern, { status: 503, body: '' }, 'Não foi possível consultar'],
    ['no locations', geoPattern, { json: {} }, 'Não encontramos essa localização'],
    ['invalid geocoding', geoPattern, { json: { results: 'invalid' } }, 'retornou dados indisponíveis'],
    ['forecast HTTP failure', forecastPattern, { status: 503, body: '' }, 'Não foi possível consultar'],
    ['malformed forecast JSON', forecastPattern, { body: '{', contentType: 'application/json' }, 'retornou dados indisponíveis'],
    ['invalid forecast fields', forecastPattern, { json: { daily: { time: [] } } }, 'retornou dados indisponíveis'],
  ]) {
    await scenario(name + ' preserves summary and retries', async ({ page, signup, section, confirmed, retry, success }) => {
      const fail = route => route.fulfill(response);
      await page.route(pattern, fail); await signup(); await expect(section).toContainText(message); await confirmed();
      await page.unroute(pattern, fail); await retry(); await success(); await confirmed();
    });
  }
  await scenario('network failure is recoverable', async ({ page, signup, section, retry, success }) => {
    const fail = route => route.abort('failed');
    await page.route(geoPattern, fail); await signup(); await expect(section).toContainText('Não foi possível consultar');
    await page.unroute(geoPattern, fail); await retry(); await success();
  });
  await scenario('unknown WMO and missing rain remain usable', async ({ page, signup, section, success }) => {
    const body = structuredClone(weather); body.daily.weather_code[1] = 999; body.daily.precipitation_probability_max[1] = null;
    await page.route(forecastPattern, route => route.fulfill({ json: body })); await signup(); await success();
    await expect(section).toContainText('Condição meteorológica não disponível');
    await expect(section.locator('svg.weather-icon')).toHaveClass(/weather-icon--unknown/);
    await expect(section).not.toContainText('Probabilidade máxima de chuva');
  });
  await scenario('unmount aborts active request', async ({ page, signup, section }) => {
    await page.addInitScript(() => {
      const nativeFetch = window.fetch;
      window.weatherAbortCount = 0;
      window.fetch = (url, options) => {
        if (String(url).includes('open-meteo.com')) options.signal.addEventListener('abort', () => { window.weatherAbortCount++; });
        return nativeFetch(url, options);
      };
    });
    const started = deferred(), release = deferred();
    await page.route(geoPattern, async route => { started.resolve(); await release.promise; await route.fulfill({ json: geocoding }).catch(() => {}); });
    await signup(); await started.promise;
    const abortedBefore = await page.evaluate(() => window.weatherAbortCount);
    await page.getByRole('link', { name: 'Voltar ao início', exact: true }).click();
    await expect(section).toHaveCount(0);
    release.resolve();
    await expect.poll(() => page.evaluate(() => window.weatherAbortCount)).toBeGreaterThan(abortedBefore);
  });
  await scenario('timeout, retry and stale forecast ignoring abort cannot replace current result', async ({ page, signup, section, retry, success }) => {
    await page.addInitScript(() => {
      const nativeFetch = window.fetch;
      window.weatherAborts = 0; window.weatherDelivered = 0;
      window.fetch = async (url, options) => {
        if (String(url).includes('open-meteo.com')) {
          options.signal.addEventListener('abort', () => { window.weatherAborts++; });
          // Deliberately hostile transport ignores AbortSignal.
          const response = await nativeFetch(url, { ...options, signal: undefined });
          window.weatherDelivered++;
          return response;
        }
        return nativeFetch(url, options);
      };
    });
    const held = deferred(), release = deferred(), delivered = deferred(); let count = 0;
    await page.route(forecastPattern, async route => {
      if (++count === 1) {
        held.resolve(); await release.promise;
        const stale = structuredClone(weather); stale.daily.weather_code[1] = 95;
        await route.fulfill({ json: stale }); delivered.resolve();
      } else await route.fulfill({ json: weather });
    });
    await signup(); await held.promise;
    await expect(section).toContainText('Não foi possível consultar', { timeout: 16000 });
    await retry();
    await success();
    const deliveredBefore = await page.evaluate(() => window.weatherDelivered);
    release.resolve(); await delivered.promise;
    await expect.poll(() => page.evaluate(() => window.weatherDelivered)).toBe(deliveredBefore + 1);
    assert.equal(await page.evaluate(() => window.weatherAborts >= 1), true);
    await expect(section).toContainText('Parcialmente nublado'); await expect(section).not.toContainText('Tempestade');
  });
}
