'use client';
import { useEffect, useRef, useState } from 'react';
import { loadWeather, WeatherError, normalizeLocation, weatherDescription, formatWeatherDate,
  formatTemperature, formatRain, locationLabel, type LocationInput, type WeatherResult } from '@/shared/weather.mjs';
import WeatherIcon from './WeatherIcon';

type State = { kind: 'loading' } | { kind: 'success'; data: WeatherResult } | { kind: 'error'; code: string };
const messages: Record<string, string> = {
  'not-found': 'Não encontramos essa localização. A previsão está indisponível no momento.',
  invalid: 'O serviço de previsão retornou dados indisponíveis. Tente novamente.',
  network: 'Não foi possível consultar a previsão agora. Tente novamente.',
};

// Mounted only after registration succeeds. No personal fields or session data
// are accepted by this component, and no forecast is persisted.
export default function Weather({ city, state, country }: LocationInput) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<State>({ kind: 'loading' });
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const hasCity = Boolean(normalizeLocation(city));
  useEffect(() => {
    if (!hasCity) return;
    const controller = new AbortController();
    active.current = controller;
    const current = ++generation.current;
    // Bound unresponsive networks as well as explicit failures.
    const timer = setTimeout(() => {
      if (generation.current !== current) return;
      ++generation.current;
      controller.abort();
      setResult({ kind: 'error', code: 'network' });
    }, 12000);
    void loadWeather({ city, state, country }, controller.signal).then(data => {
      if (!controller.signal.aborted && generation.current === current) setResult({ kind: 'success', data });
    }).catch(error => {
      if (!controller.signal.aborted && generation.current === current) {
        setResult({ kind: 'error', code: error instanceof WeatherError ? error.code : 'network' });
      }
    }).finally(() => clearTimeout(timer));
    return () => { controller.abort(); clearTimeout(timer); };
  }, [city, state, country, hasCity, attempt]);

  function retry() {
    ++generation.current;
    active.current?.abort();
    setResult({ kind: 'loading' });
    setAttempt(value => value + 1);
  }
  return <section className="card form-card weather-card" aria-labelledby="weather-title" aria-busy={hasCity && result.kind === 'loading'}>
    <h2 id="weather-title">Previsão para amanhã</h2>
    <div role="status" aria-live="polite" aria-atomic="true">
      {!hasCity ? <p>Previsão indisponível porque a cidade não foi informada.</p>
        : result.kind === 'loading' ? <p className="busy">Consultando a previsão…</p>
          : result.kind === 'error' ? <p>{messages[result.code] ?? messages.network}</p>
            : <>
              <div className="weather-condition">
                <WeatherIcon code={result.data.forecast.code} />
                <div className="weather-condition-copy">
                  <p>{locationLabel(result.data.location)}</p>
                  <p><time dateTime={result.data.forecast.date}>{formatWeatherDate(result.data.forecast.date)}</time></p>
                  <p className="weather-description">{weatherDescription(result.data.forecast.code)}</p>
                </div>
              </div>
              <dl className="record">
                <div><dt>Temperatura mínima</dt><dd>{formatTemperature(result.data.forecast.min)}</dd></div>
                <div><dt>Temperatura máxima</dt><dd>{formatTemperature(result.data.forecast.max)}</dd></div>
                {result.data.forecast.rain !== null && <div><dt>Probabilidade máxima de chuva</dt><dd>{formatRain(result.data.forecast.rain)}</dd></div>}
              </dl>
            </>}
    </div>
    {hasCity && result.kind === 'error' && <button type="button" onClick={retry}>Tentar novamente</button>}
    <p className="hint weather-attribution"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Dados meteorológicos: Open-Meteo<span className="sr-only"> (abre em nova aba)</span></a></p>
  </section>;
}
