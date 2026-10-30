type IconKind = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'showers' | 'snow-showers' | 'storm' | 'unknown';

function iconKind(code: number): IconKind {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code === 85 || code === 86) return 'snow-showers';
  if ([95, 96, 99].includes(code)) return 'storm';
  return 'unknown';
}

function Sun({ behind = false }: { behind?: boolean }) {
  return <g className="weather-icon-sun" transform={behind ? 'translate(-8 -5) scale(.75)' : undefined}>
    <circle cx="48" cy="43" r="16" />
    <path d="M48 16v-6m0 66v-6M21 43h-6m66 0h-6M29 24l-5-5m48 48-5-5M29 62l-5 5m48-48-5 5" />
  </g>;
}

function Cloud({ back = false }: { back?: boolean }) {
  return <path className="weather-icon-cloud" transform={back ? 'translate(6 -9) scale(.88)' : undefined}
    d="M25 61a13 13 0 0 1-1-26 22 22 0 0 1 42-6 16 16 0 0 1 4 32Z" />;
}

function Drops({ drizzle = false, showers = false }: { drizzle?: boolean; showers?: boolean }) {
  return <g className="weather-icon-water" strokeDasharray={drizzle ? '1 6' : undefined}>
    <path d={showers ? 'M31 70l-6 10m24-10-6 10m24-10-6 10M34 85l-3 5m24-5-3 5' : 'M30 70l-4 9m23-9-4 9m23-9-4 9'} />
  </g>;
}

function Snow({ showers = false }: { showers?: boolean }) {
  return <g className="weather-icon-snow">
    {[30, 51, 72].map(x => <path key={x} d={`M${x} 71v12m-5-9 10 6m-10 0 10-6`} />)}
    {showers && <path d="M39 87v6m-3-4.5 6 3m-6 0 6-3m17-1.5v6m-3-4.5 6 3m-6 0 6-3" />}
  </g>;
}

// The adjacent text supplies the condition. This SVG never enters the
// accessibility tree or keyboard order and requires no external asset.
export default function WeatherIcon({ code }: { code: number }) {
  const kind = iconKind(code);
  return <svg className={'weather-icon weather-icon--' + kind} width="96" height="96" viewBox="0 0 96 96"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {(kind === 'clear' || kind === 'partly-cloudy') && <Sun behind={kind === 'partly-cloudy'} />}
    {kind === 'cloudy' && <Cloud back />}
    {kind !== 'clear' && <Cloud />}
    {(kind === 'drizzle' || kind === 'rain' || kind === 'showers') && <Drops drizzle={kind === 'drizzle'} showers={kind === 'showers'} />}
    {(kind === 'snow' || kind === 'snow-showers') && <Snow showers={kind === 'snow-showers'} />}
    {kind === 'fog' && <path className="weather-icon-water" d="M15 69h50m-37 9h50m-63 9h39" />}
    {kind === 'storm' && <>
      <path className="weather-icon-sun" d="M49 65l-9 14h10l-5 12 17-19H51l6-7" />
      <path className="weather-icon-water" d="M27 70l-4 9m49-9-4 9" />
    </>}
  </svg>;
}
