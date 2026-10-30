// Same canonical local disposable fixture and guards, scoped to weather UI.
process.env.UI_WEATHER_ONLY = 'true';
await import('../ui/integration.test.mjs');
