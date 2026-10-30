// Browser-safe boundary: only the explicit location fields enter URL builders.
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export class WeatherError extends Error {
  constructor(code) { super(code); this.name = 'WeatherError'; this.code = code; }
}
const invalid = () => { throw new WeatherError('invalid'); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 250;
const number = value => typeof value === 'number' && Number.isFinite(value);
export const normalizeLocation = value => typeof value === 'string'
  ? value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase() : '';
const brazil = value => ['br', 'brasil', 'brazil'].includes(normalizeLocation(value));

export function geocodingUrl({ city, state, country }) {
  if (!normalizeLocation(city)) return null;
  const qualifier = state?.trim() || country?.trim();
  const url = new URL(GEOCODING_ENDPOINT);
  url.search = new URLSearchParams({ name: [city.trim(), qualifier].filter(Boolean).join(', '), count: '5', language: 'pt', format: 'json' }).toString();
  if (brazil(country)) url.searchParams.set('countryCode', 'BR');
  return url;
}

export function parseLocations(body) {
  if (!object(body) || body.error || (body.results !== undefined && !Array.isArray(body.results))) invalid();
  // Open-Meteo omits results when a search has no matches.
  const results = body.results ?? [];
  if (results.length > 5) invalid();
  return results.map(item => {
    if (!object(item) || !text(item.name) || !number(item.latitude) || Math.abs(item.latitude) > 90
      || !number(item.longitude) || Math.abs(item.longitude) > 180) invalid();
    for (const field of ['admin1', 'admin2', 'admin3', 'admin4', 'country', 'country_code']) {
      if (item[field] !== undefined && !text(item[field])) invalid();
    }
    return { name: item.name, latitude: item.latitude, longitude: item.longitude,
      admin1: item.admin1, admin2: item.admin2, admin3: item.admin3, admin4: item.admin4,
      country: item.country, country_code: item.country_code };
  });
}

export function selectLocation(results, input) {
  const city = normalizeLocation(input.city), state = normalizeLocation(input.state), country = normalizeLocation(input.country);
  if (!city) return null;
  const candidates = results.map((item, index) => {
    const name = normalizeLocation(item.name);
    const exact = name === city;
    const regions = [item.admin1, item.admin2, item.admin3, item.admin4].map(normalizeLocation);
    const countryMatch = country && (normalizeLocation(item.country) === country
      || normalizeLocation(item.country_code) === country || (brazil(country) && item.country_code === 'BR'));
    // Reject unrelated names and known country contradictions. Prefix matches
    // remain possible because the service supports fuzzy/prefix name matching.
    if ((!exact && !name.startsWith(city)) || (brazil(country) && item.country_code !== 'BR')) return null;
    return { item, index, score: (exact ? 100 : 0) + (state && regions.includes(state) ? 20 : 0) + (countryMatch ? 10 : 0) };
  }).filter(Boolean);
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  return candidates[0]?.item ?? null;
}

export function forecastUrl(location) {
  const url = new URL(FORECAST_ENDPOINT);
  url.search = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', timezone: 'auto', forecast_days: '2' }).toString();
  return url;
}

function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid();
  const date = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid();
  return date;
}

export function parseForecast(body) {
  if (!object(body) || body.error || !text(body.timezone) || !object(body.daily) || !object(body.daily_units)) invalid();
  try { new Intl.DateTimeFormat('pt-BR', { timeZone: body.timezone }); } catch { invalid(); }
  const daily = body.daily, units = body.daily_units;
  if (units.time !== 'iso8601' || units.weather_code !== 'wmo code'
    || units.temperature_2m_min !== '°C' || units.temperature_2m_max !== '°C') invalid();
  for (const key of ['time', 'weather_code', 'temperature_2m_max', 'temperature_2m_min']) {
    if (!Array.isArray(daily[key]) || daily[key].length !== 2) invalid();
  }
  const first = dateValue(daily.time[0]), second = dateValue(daily.time[1]);
  if (second.getTime() - first.getTime() !== 86400000) invalid();
  for (let i = 0; i < 2; i++) {
    if (!Number.isInteger(daily.weather_code[i]) || daily.weather_code[i] < 0
      || !number(daily.temperature_2m_min[i]) || !number(daily.temperature_2m_max[i])
      || daily.temperature_2m_min[i] < -100 || daily.temperature_2m_max[i] > 70
      || daily.temperature_2m_min[i] > daily.temperature_2m_max[i]) invalid();
  }
  const rain = daily.precipitation_probability_max;
  if (rain !== undefined && (!Array.isArray(rain) || rain.length !== 2 || units.precipitation_probability_max !== '%'
    || rain.some(value => value !== null && (!number(value) || value < 0 || value > 100)))) invalid();
  return { date: daily.time[1], code: daily.weather_code[1], min: daily.temperature_2m_min[1],
    max: daily.temperature_2m_max[1], rain: rain?.[1] ?? null };
}

export function weatherDescription(code) {
  if (code === 0) return 'Céu limpo';
  if ([1, 2].includes(code)) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if ([45, 48].includes(code)) return 'Neblina';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Chuva';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neve';
  if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
  if ([95, 96, 99].includes(code)) return 'Tempestade';
  return 'Condição meteorológica não disponível';
}
export const formatWeatherDate = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(dateValue(value));
export const formatTemperature = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value) + ' °C';
export const formatRain = value => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value) + '%';
export const locationLabel = location => [location.name, location.admin1, location.country].filter(Boolean).join(', ');

export async function loadWeather(input, signal, transport = fetch) {
  const url = geocodingUrl(input);
  if (!url) throw new WeatherError('missing-city');
  async function json(target) {
    signal.throwIfAborted();
    let response;
    try {
      response = await transport(target, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error' });
    } catch {
      signal.throwIfAborted();
      throw new WeatherError('network');
    }
    signal.throwIfAborted();
    if (!response.ok) throw new WeatherError('network');
    try { const body = await response.json(); signal.throwIfAborted(); return body; }
    catch { signal.throwIfAborted(); throw new WeatherError('invalid'); }
  }
  const location = selectLocation(parseLocations(await json(url)), input);
  if (!location) throw new WeatherError('not-found');
  const forecast = parseForecast(await json(forecastUrl(location)));
  signal.throwIfAborted();
  return { location, forecast };
}
