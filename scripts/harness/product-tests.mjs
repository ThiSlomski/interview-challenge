import { existsSync, readFileSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { runManaged } from './processes.mjs';

export function inspectProductTests(root) {
  let manifest;
  try { manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); }
  catch { return { status: 'unproven', reason: 'Package configuration unreadable or invalid.' }; }
  const script = manifest.scripts?.test;
  if (typeof script !== 'string' || !script.trim()) return { status: 'absent', reason: 'No test script configured.' };
  const noOp = /^(?:echo(?:\s+(?:"[^"\r\n]*"|'[^'\r\n]*'|[^&|;<>\r\n]+))?(?:\s*&&\s*exit\s+[01])?|exit\s+[01])\s*$/i;
  if (noOp.test(script.trim())) return { status: 'placeholder', reason: 'Complete test command only prints instructions or exits; no runner invoked.' };
  if (['pretest', 'posttest'].some(name => typeof manifest.scripts[name] === 'string' && manifest.scripts[name].trim())) return { status: 'configured', proofSupported: false, reason: 'npm lifecycle requires a separate report/scope adapter.' };
  // Automatic proof is scoped to an explicit Node test command. Other runners can
  // execute, but need a report adapter before their exit code can imply test proof.
  const match = /^node(?:\.exe)?\s+--test\s+(.+)$/.exec(script.trim());
  if (!match || /[&|;<>`$]/.test(match[1])) return { status: 'configured', proofSupported: false, reason: 'Runner/scope has no supported report adapter.' };
  const tokens = match[1].match(/"[^"]+"|'[^']+'|\S+/g) ?? [];
  const files = tokens.map(token => token.replace(/^["']|["']$/g, ''));
  const scopeValid = process.versions.node === '22.13.1' && files.length > 0 && files.every(file => {
    const local = relative(resolve(root), resolve(root, file));
    return !isAbsolute(local) && local !== '..' && !local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
      && !local.replaceAll('\\', '/').startsWith('scripts/harness/') && !file.startsWith('-')
      && /\.(?:mjs|cjs|js)$/.test(file) && existsSync(resolve(root, file));
  });
  return { status: 'configured', proofSupported: scopeValid, files: scopeValid ? files : [],
    reason: scopeValid ? 'Explicit Node test files outside Harness; runtime evidence still required.' : 'Test scope is missing, unsupported, or includes Harness files.' };
}

export function nodeTestReport(serialized, files) {
  const unknown = { proven: false, reason: 'Incomplete or unsupported structured event report.' };
  let report;
  try { report = JSON.parse(serialized); } catch { return unknown; }
  if (report?.adapter !== 'node22-test-summary-v1' || report.node !== '22.13.1' || report.completed !== true
      || report.unexpectedFile !== false || !Array.isArray(report.summaries) || report.summaries.length !== files.length) return unknown;
  const seen = new Set(), totals = { tests: 0, passed: 0, failed: 0, cancelled: 0, skipped: 0, todo: 0 };
  for (const summary of report.summaries) {
    if (!Number.isInteger(summary.index) || summary.index < 0 || summary.index >= files.length || seen.has(summary.index)
      || summary.success !== true || !summary.counts || summary.counts.tests <= 0) return unknown;
    seen.add(summary.index);
    for (const key of Object.keys(totals)) {
      if (!Number.isSafeInteger(summary.counts[key]) || summary.counts[key] < 0) return unknown;
      totals[key] += summary.counts[key];
    }
  }
  return { proven: totals.tests > 0 && totals.passed > 0 && totals.failed === 0 && totals.cancelled === 0
      && totals.passed + totals.skipped + totals.todo === totals.tests,
    tests: totals.tests, pass: totals.passed, fail: totals.failed, skipped: totals.skipped, todo: totals.todo, source: 'node-test-summary-events' };
}

// Custom Node 22.13.1 reporter, fed runner events rather than printed TAP.
// Per-file summaries are emitted for registered test cases; a bare file's
// synthetic success appears only in the root summary and is deliberately ignored.
export default async function* testReporter(events) {
  let expected = [];
  try { expected = JSON.parse(process.env.HARNESS_NODE_TEST_FILES ?? '[]'); } catch { /* No proof without scope. */ }
  const normalize = path => process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);
  const files = Array.isArray(expected) && expected.every(path => typeof path === 'string') ? expected.map(normalize) : [];
  const summaries = [];
  let unexpectedFile = false;
  for await (const event of events) {
    if (event.type !== 'test:summary' || typeof event.data?.file !== 'string') continue;
    const index = files.indexOf(normalize(event.data.file));
    if (index < 0) { unexpectedFile = true; continue; }
    const counts = Object.fromEntries(['tests', 'passed', 'failed', 'cancelled', 'skipped', 'todo'].map(key => [key, event.data.counts?.[key] ?? null]));
    summaries.push({ index, success: event.data.success === true, counts });
  }
  yield JSON.stringify({ adapter: 'node22-test-summary-v1', node: process.versions.node, completed: true, unexpectedFile, summaries });
}

export async function verifyProductTests(root, execute = runManaged) {
  const configuration = inspectProductTests(root);
  if (configuration.status !== 'configured') return { name: 'product-tests', ok: false, status: configuration.status, execution: 'not-executed', reason: configuration.reason };
  const npmCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (!existsSync(npmCli)) return { name: 'product-tests', ok: false, status: 'unproven', execution: 'not-executed', reason: 'Local npm CLI unavailable.' };
  let directory, report = null, result;
  try {
    if (configuration.proofSupported) {
      directory = mkdtempSync(join(tmpdir(), 'harness-event-report-'));
      const destination = join(directory, 'summary.json');
      result = await execute(process.execPath, ['--test', `--test-reporter=${import.meta.url}`, `--test-reporter-destination=${destination}`, ...configuration.files],
        { cwd: root, timeout: 60000, env: { HARNESS_NODE_TEST_FILES: JSON.stringify(configuration.files.map(file => resolve(root, file))) } });
      if (result.ok && existsSync(destination) && statSync(destination).size <= 64 * 1024) report = nodeTestReport(readFileSync(destination, 'utf8'), configuration.files);
    } else result = await execute(process.execPath, [npmCli, 'test'], { cwd: root, timeout: 60000 });
  } finally {
    if (directory) {
      const local = relative(resolve(tmpdir()), resolve(directory));
      if (isAbsolute(local) || local.startsWith('..') || !local.startsWith('harness-event-report-')) throw new Error('Report cleanup boundary invalid.');
      rmSync(directory, { recursive: true, force: true });
    }
  }
  if (!result.ok) return { name: 'product-tests', ok: false, status: 'failed', execution: 'executed', code: result.code, error: result.error, cleanup: result.cleanup, diagnostic: result.diagnostic };
  return { name: 'product-tests', ok: report?.proven === true, status: report?.proven ? 'passed' : 'unproven', execution: 'executed', code: result.code,
    report, reason: report?.proven ? 'Structured per-file runner summaries prove nonzero passing cases in declared scope.' : 'Exit zero or printed text alone does not prove real tests; inspect scope/report or add a runner adapter.' };
}
