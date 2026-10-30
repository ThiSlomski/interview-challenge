process.env.UI_BROWSER_TEST = 'true';
process.env.UI_RACE_TEST = 'true';
process.env.DB_DISPOSABLE_TEST_AUTHORIZED = 'true';
await import('../database/integration.test.mjs');
