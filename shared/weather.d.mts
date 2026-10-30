export type LocationInput = { city: string | null; state: string | null; country: string | null };
export type GeoLocation = { name: string; latitude: number; longitude: number; admin1?: string; admin2?: string; admin3?: string; admin4?: string; country?: string; country_code?: string };
export type Forecast = { date: string; code: number; min: number; max: number; rain: number | null };
export type WeatherResult = { location: GeoLocation; forecast: Forecast };
export class WeatherError extends Error { code: string; constructor(code: string); }
export function normalizeLocation(value: unknown): string;
export function geocodingUrl(input: LocationInput): URL | null;
export function parseLocations(body: unknown): GeoLocation[];
export function selectLocation(results: GeoLocation[], input: LocationInput): GeoLocation | null;
export function forecastUrl(location: GeoLocation): URL;
export function parseForecast(body: unknown): Forecast;
export function weatherDescription(code: number): string;
export function formatWeatherDate(value: string): string;
export function formatTemperature(value: number): string;
export function formatRain(value: number): string;
export function locationLabel(location: GeoLocation): string;
export function loadWeather(input: LocationInput, signal: AbortSignal, transport?: typeof fetch): Promise<WeatherResult>;
