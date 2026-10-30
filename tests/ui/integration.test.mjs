// Executes separately from Harness proof. Shares SQL fixture/cleanup checks;
// existing HTTP regressions remain in test:db:integration.
process.env.UI_BROWSER_TEST = 'true';
process.env.DB_DISPOSABLE_TEST_AUTHORIZED = 'true';
await import('../database/integration.test.mjs');
