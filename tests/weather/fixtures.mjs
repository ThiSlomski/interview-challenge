export const locationInput = { city: 'Cidade Sintética', state: 'Paraná', country: 'Brasil' };
export const geocoding = { results: [
  { name: 'Cidade Sintética', admin1: 'Outra Região', country: 'Brasil', country_code: 'BR', latitude: -20, longitude: -40 },
  { name: 'Cidade Sintética', admin1: 'Paraná', country: 'Brasil', country_code: 'BR', latitude: -25.43, longitude: -49.27 },
] };
export const weather = {
  timezone: 'America/Sao_Paulo',
  daily_units: { time: 'iso8601', weather_code: 'wmo code', temperature_2m_min: '°C', temperature_2m_max: '°C', precipitation_probability_max: '%' },
  daily: { time: ['2026-10-30', '2026-10-31'], weather_code: [95, 2],
    temperature_2m_min: [1, 16.5], temperature_2m_max: [2, 26], precipitation_probability_max: [99, 35] },
};
