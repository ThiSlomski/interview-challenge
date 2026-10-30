import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocation, geocodingUrl, parseLocations, selectLocation, parseForecast, forecastUrl,
  weatherDescription, formatWeatherDate, formatTemperature, formatRain, loadWeather } from '../../shared/weather.mjs';
import { locationInput, geocoding, weather } from './fixtures.mjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the actual declarative component using installed TypeScript/React.
// Compile in memory; no generated files or dependency are needed for Node22.
const require = createRequire(import.meta.url);
const compiledIcon = ts.transpileModule(readFileSync(new URL('../../components/ui/WeatherIcon.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const iconModule = 'import React from ' + JSON.stringify(pathToFileURL(require.resolve('react')).href) + ';\n' + compiledIcon;
const { default: WeatherIcon } = await import('data:text/javascript;base64,' + Buffer.from(iconModule).toString('base64'));
const iconMarkup = code => renderToStaticMarkup(React.createElement(WeatherIcon, { code }));

for (const [kind, codes, parts] of [
  ['clear', [0], ['sun']], ['partly-cloudy', [1, 2], ['sun', 'cloud']], ['cloudy', [3], ['cloud']],
  ['fog', [45, 48], ['cloud', 'water']], ['drizzle', [51, 52, 53, 54, 55, 56, 57], ['cloud', 'water']],
  ['rain', [61, 62, 63, 64, 65, 66, 67], ['cloud', 'water']], ['snow', [71, 72, 73, 74, 75, 76, 77], ['cloud', 'snow']],
  ['showers', [80, 81, 82], ['cloud', 'water']], ['snow-showers', [85, 86], ['cloud', 'snow']],
  ['storm', [95, 96, 99], ['cloud', 'sun', 'water']], ['unknown', [999, -1], ['cloud']],
]) {
  test('SVG weather icon: ' + kind, () => {
    for (const code of codes) {
      const markup = iconMarkup(code);
      assert(markup.includes('weather-icon--' + kind));
      for (const part of parts) assert(markup.includes('class="weather-icon-' + part + '"'));
      assert.equal(/<image|<use|href=|<script/.test(markup), false);
    }
  });
}
test('SVG is decorative, not focusable, and visual groups have distinct shapes', () => {
  for (const code of [0, 2, 3, 45, 51, 61, 71, 80, 85, 95, 999]) {
    const markup = iconMarkup(code);
    assert(markup.includes('aria-hidden="true"')); assert(markup.includes('focusable="false"'));
    assert.equal(/<title|<desc|aria-label|role="img"/.test(markup), false);
    assert(markup.includes('viewBox="0 0 96 96"'));
  }
  assert(iconMarkup(51).includes('stroke-dasharray="1 6"'));
  assert(!iconMarkup(61).includes('stroke-dasharray'));
  assert(iconMarkup(3).match(/weather-icon-cloud/g).length === 2);
  assert(iconMarkup(999).match(/weather-icon-cloud/g).length === 1);
  assert.notEqual(iconMarkup(71).replace('weather-icon--snow', ''), iconMarkup(85).replace('weather-icon--snow-showers', ''));
});

const copy = value => structuredClone(value);
test('normalizes accents, whitespace, case and missing location', () => {
  assert.equal(normalizeLocation('  SÃO   paulo '), 'sao paulo');
  assert.equal(normalizeLocation(null), '');
});
test('geocoding URL qualifies state, country, then city; Brazil aliases only', () => {
  assert.equal(geocodingUrl(locationInput).searchParams.get('name'), 'Cidade Sintética, Paraná');
  assert.equal(geocodingUrl({ ...locationInput, state: '' }).searchParams.get('name'), 'Cidade Sintética, Brasil');
  assert.equal(geocodingUrl({ ...locationInput, state: '', country: '' }).searchParams.get('name'), 'Cidade Sintética');
  for (const country of ['BR', 'Brazil', 'brasil']) assert.equal(geocodingUrl({ ...locationInput, country }).searchParams.get('countryCode'), 'BR');
  assert.equal(geocodingUrl({ ...locationInput, country: 'Portugal' }).searchParams.has('countryCode'), false);
});
test('evaluates normalized city, region and country instead of first result', () => {
  const result = selectLocation(parseLocations(geocoding), { ...locationInput, city: 'cidade sintetica', state: 'PARANA' });
  assert.equal(result.latitude, -25.43);
  const foreign = { ...geocoding.results[0], country_code: 'PT', country: 'Portugal' };
  assert.equal(selectLocation([foreign, ...geocoding.results], locationInput).latitude, -25.43);
  assert.equal(selectLocation([foreign, ...geocoding.results], { ...locationInput, state: null, country: 'Portugal' }).country_code, 'PT');
  assert.equal(selectLocation([geocoding.results[0], geocoding.results[0]], locationInput).latitude, -20);
});
test('absent results and unrelated names mean location not found', () => {
  assert.deepEqual(parseLocations({}), []);
  assert.equal(selectLocation([], locationInput), null);
  assert.equal(selectLocation([{ ...geocoding.results[0], name: 'Outro Lugar' }], locationInput), null);
});
test('rejects malformed geocoding structures, coordinates and labels', () => {
  for (const body of [null, [], { error: true }, { results: {} }, { results: [null] },
    { results: [{ ...geocoding.results[0], latitude: 91 }] }, { results: [{ ...geocoding.results[0], longitude: '1' }] },
    { results: [{ ...geocoding.results[0], admin1: {} }] }]) assert.throws(() => parseLocations(body), { code: 'invalid' });
});
test('selects second local calendar day, including month/year and leap boundaries', () => {
  assert.deepEqual(parseForecast(weather), { date: '2026-10-31', code: 2, min: 16.5, max: 26, rain: 35 });
  for (const time of [['2026-12-31', '2027-01-01'], ['2028-02-28', '2028-02-29']]) {
    assert.equal(parseForecast({ ...weather, timezone: 'Pacific/Kiritimati', daily: { ...weather.daily, time } }).date, time[1]);
  }
});
test('rejects invalid daily shapes, dates, units, code, temperatures and rain', () => {
  const changes = [b => { b.daily = null; }, b => { b.daily.time = ['2026-10-30']; },
    b => { b.daily.time[1] = '2026-11-02'; }, b => { b.daily.time = ['2026-02-28', '2026-02-29']; },
    b => { b.daily.weather_code[1] = null; }, b => { b.daily.temperature_2m_min[1] = '16'; },
    b => { b.daily.temperature_2m_min[1] = 30; }, b => { b.daily.temperature_2m_max[1] = Infinity; },
    b => { b.daily.precipitation_probability_max[1] = 101; }, b => { b.daily_units.temperature_2m_min = '°F'; },
    b => { b.timezone = 'invalid/timezone'; }, b => { delete b.daily_units; }];
  for (const change of changes) { const body = copy(weather); change(body); assert.throws(() => parseForecast(body), { code: 'invalid' }); }
});
test('rain is optional, accepts zero and null, and formats decimal temperatures', () => {
  const body = copy(weather); delete body.daily.precipitation_probability_max;
  assert.equal(parseForecast(body).rain, null);
  body.daily.precipitation_probability_max = [null, 0]; assert.equal(parseForecast(body).rain, 0);
  body.daily.precipitation_probability_max[1] = null; assert.equal(parseForecast(body).rain, null);
  assert.equal(formatTemperature(-2.5), '-2,5 °C'); assert.equal(formatTemperature(26), '26 °C');
  assert.equal(formatRain(0), '0%'); assert.equal(formatRain(35.5), '35,5%');
});
test('formats date without browser timezone day shift', () => {
  assert.equal(formatWeatherDate('2026-10-31'), '31 de outubro de 2026');
  assert.throws(() => formatWeatherDate('2026-02-30'), { code: 'invalid' });
});
test('maps all WMO groups and unknown codes', () => {
  for (const [codes, expected] of [[[0], 'Céu limpo'], [[1, 2], 'Parcialmente nublado'], [[3], 'Nublado'],
    [[45, 48], 'Neblina'], [[51, 53, 55, 56, 57], 'Garoa'], [[61, 63, 65, 66, 67], 'Chuva'],
    [[71, 73, 75, 77, 85, 86], 'Neve'], [[80, 81, 82], 'Pancadas de chuva'], [[95, 96, 99], 'Tempestade']]) {
    for (const code of codes) assert.equal(weatherDescription(code), expected);
  }
  assert.equal(weatherDescription(999), 'Condição meteorológica não disponível');
});
test('URL encodes input without permitting query injection or extra personal fields', () => {
  const url = geocodingUrl({ city: 'A&B?name=<script>#é', state: 'R / 1', country: 'BR', email: 'private@example.test', password: 'SECRET' });
  assert.equal(url.searchParams.get('name'), 'A&B?name=<script>#é, R / 1');
  assert.equal(url.hash, ''); assert.equal(url.searchParams.has('email'), false);
  assert.equal([...url.searchParams].length, 5);
  const forecast = forecastUrl(geocoding.results[1]);
  assert.equal(forecast.searchParams.get('timezone'), 'auto'); assert.equal(forecast.searchParams.get('forecast_days'), '2');
  assert.equal([...forecast.searchParams].length, 5);
});
test('missing city never calls transport', async () => {
  assert.equal(geocodingUrl({ city: ' ', state: 'PR', country: 'BR' }), null);
  await assert.rejects(loadWeather({ city: '', state: '', country: '' }, new AbortController().signal,
    () => { assert.fail('must not request'); }), { code: 'missing-city' });
});
test('two REST requests omit credentials, referrer and redirect, and validate HTTP', async () => {
  const calls = [];
  const result = await loadWeather(locationInput, new AbortController().signal, async (url, options) => {
    calls.push(url); assert.equal(options.credentials, 'omit'); assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.redirect, 'error');
    return Response.json(calls.length === 1 ? geocoding : weather);
  });
  assert.equal(calls.length, 2); assert.equal(result.forecast.date, '2026-10-31');
  for (const transport of [async () => new Response('', { status: 503 }), async () => { throw new TypeError(); }]) {
    await assert.rejects(loadWeather(locationInput, new AbortController().signal, transport), { code: 'network' });
  }
  await assert.rejects(loadWeather(locationInput, new AbortController().signal, async () => new Response('{')), { code: 'invalid' });
  await assert.rejects(loadWeather(locationInput, new AbortController().signal, async () => Response.json({})), { code: 'not-found' });
});
test('aborted transport ignoring signal cannot continue to forecast', async () => {
  const controller = new AbortController(); let calls = 0;
  await assert.rejects(loadWeather(locationInput, controller.signal, async () => {
    calls++; controller.abort(); return Response.json(geocoding);
  }), { name: 'AbortError' });
  assert.equal(calls, 1);
});
