import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateHooks } from './hooks-validator.mjs';
import { inspectProductTests, verifyProductTests } from './product-tests.mjs';
import { runManaged, processDiagnostic } from './processes.mjs';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const skills = ['plan-requirement', 'deliver-requirement', 'review-security', 'verify-delivery', 'record-decision', 'resume-project'];
export const roles = ['documentation', 'frontend', 'backend', 'database'];
const workflows = ['bootstrap', 'delivery', 'security-review', 'handoff-resume', 'release-readiness'];
const required = ['AGENTS.md', '.codex/config.toml', '.codex/hooks.json', '.codex/rules/harness.rules',
  'docs/HARNESS.md', 'docs/REQUIREMENTS.md', 'docs/ARCHITECTURE.md', 'docs/AI_PROMPTS.md', 'SOLUTION.md',
  'docs/harness/TOKEN_POLICY.md', 'docs/harness/commands.md', 'docs/harness/capabilities.md',
  'docs/harness/sources.md', 'docs/harness/delegation.md', 'docs/harness/BUILD_LOG.md',
  ...['index', 'project-state', 'decisions', 'lessons', 'handoff'].map(n => `docs/harness/memory/${n}.md`),
  ...workflows.map(n => `docs/harness/workflows/${n}.md`),
  ...skills.map(n => `.agents/skills/${n}/SKILL.md`), ...roles.map(n => `.codex/agents/${n}.toml`),
  'scripts/harness/hook.mjs', 'scripts/harness/native-probe.mjs', 'scripts/harness/harness.test.mjs',
  'scripts/harness/hooks-validator.mjs', 'scripts/harness/product-tests.mjs', 'scripts/harness/processes.mjs'];

export function run(command, args, cwd = projectRoot, timeout = 30000) {
  const started = performance.now();
  let result;
  try { result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, windowsHide: true, maxBuffer: 2 * 1024 * 1024 }); }
  catch (error) { result = { status: null, error: { code: error.code ?? 'SPAWN_FAILED' }, stdout: '' }; }
  const error = result.error?.code ?? null;
  const cleanup = ['ETIMEDOUT', 'ENOBUFS'].includes(error) ? 'not-confirmed' : 'not-needed';
  return { ok: !result.error && result.status === 0, code: result.status, stdout: result.stdout ?? '', error,
    diagnostic: processDiagnostic({ code: result.status, error, signal: result.signal, cleanup }), durationMs: Math.round(performance.now() - started) };
}
function git(args, root) { return run('git', args, root).stdout.trim(); }
function read(root, file) { return readFileSync(join(root, file), 'utf8'); }

export function validate(root = projectRoot) {
  const errors = [];
  for (const file of required) {
    if (!existsSync(join(root, file))) errors.push(`missing: ${file}`);
    else if (!read(root, file).trim()) errors.push(`empty: ${file}`);
  }
  for (const name of skills) {
    const file = `.agents/skills/${name}/SKILL.md`;
    if (!existsSync(join(root, file))) continue;
    const content = read(root, file);
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content)?.[1];
    if (!front || !new RegExp(`^name: ${name}$`, 'm').test(front) || !/^description: .{12,}$/m.test(front)) errors.push(`invalid skill metadata: ${file}`);
    if (/\bTODO\b|\[INSERT/i.test(content)) errors.push(`unfinished skill: ${file}`);
  }
  for (const name of roles) {
    const file = `.codex/agents/${name}.toml`;
    if (!existsSync(join(root, file))) continue;
    const content = read(root, file);
    if (!content.includes(`name = "${name}"`) || !/^description = ".+"$/m.test(content) || !/developer_instructions = """[\s\S]+"""/.test(content)) errors.push(`invalid role: ${file}`);
    if (/^(sandbox_mode|approval_policy|model_provider|mcp_servers)\s*=/m.test(content)) errors.push(`unsupported role override: ${file}`);
  }
  const config = '.codex/config.toml';
  if (existsSync(join(root, config))) {
    const content = read(root, config);
    if (!/^max_concurrent_threads_per_session = 2$/m.test(content)) errors.push('concurrency must be 2');
    if (/^\s*\[\[?hooks[.\]]/m.test(content)) errors.push('duplicate hook representations');
  }
  if (existsSync(join(root, '.codex/hooks.json'))) {
    try {
      const cfg = JSON.parse(read(root, '.codex/hooks.json'));
      errors.push(...validateHooks(cfg));
    } catch { errors.push('invalid hook configuration'); }
  }
  // Verify local Markdown links in maintained Harness artifacts; original prompt is immutable evidence.
  const documents = new Set(required.filter(f => f.endsWith('.md')));
  const collect = directory => {
    if (!existsSync(join(root, directory))) return;
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) collect(file);
      else if (entry.name.endsWith('.md')) documents.add(file);
    }
  };
  collect('docs/harness');
  for (const file of documents) {
    if (!existsSync(join(root, file))) continue;
    for (const match of read(root, file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      const path = resolve(dirname(join(root, file)), target);
      if (!existsSync(path)) errors.push(`broken link: ${file} -> ${target}`);
    }
  }
  return { command: 'validate', ok: errors.length === 0, errors, nativeSemantics: 'Run native-probe; these structural checks alone do not prove Codex loading.' };
}

export function doctor(root = projectRoot) {
  const tools = {};
  for (const [name, cmd, args] of [['node', process.execPath, ['--version']], ['git', 'git', ['--version']], ['codex', 'codex', ['--version']]]) {
    const r = run(cmd, args, root); tools[name] = { available: r.ok, version: r.ok ? r.stdout.trim() : null, diagnostic: r.diagnostic };
  }
  const npmCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const npm = existsSync(npmCli) ? run(process.execPath, [npmCli, '--version'], root) : { ok: false };
  tools.npm = { available: npm.ok, version: npm.ok ? npm.stdout.trim() : null };
  const missing = required.filter(f => !existsSync(join(root, f)));
  return { command: 'doctor', ok: tools.node.available && tools.git.available && existsSync(join(root, 'README.md')) && missing.length === 0,
    platform: process.platform, tools, branch: git(['branch', '--show-current'], root) || null,
    revision: git(['rev-parse', '--verify', 'HEAD'], root) || null,
    missing,
    limits: ['No credential/config value inspection.', 'Native availability is not proof of active loading.', 'Windows tested; other systems unverified.'] };
}

export function checkpoint(root = projectRoot, context = {}, execute = run) {
  // File names may contain private information: caller reviews this proposal before consolidation.
  const requests = [
    ['branch', ['branch', '--show-current']], ['revision', ['rev-parse', '--verify', 'HEAD']],
    ['changes', ['status', '--short', '--untracked-files=all']]
  ];
  const values = {}, errors = [];
  for (const [field, args] of requests) {
    const result = execute('git', args, root);
    if (!result.ok) errors.push({ field, code: result.code, error: result.error ?? 'GIT_QUERY_FAILED', diagnostic: result.diagnostic ?? processDiagnostic(result) });
    else values[field] = result.stdout.trimEnd();
  }
  if (errors.length) return { command: 'checkpoint', ok: false, kind: 'invalid-git-state', errors,
    state: 'unavailable', reason: 'Git queries failed; no valid checkpoint proposal generated.' };
  const changes = values.changes.split(/\r?\n/).filter(Boolean);
  if (typeof context === 'string') context = { task: context };
  context ??= {};
  const supplied = Object.fromEntries(['task', 'files', 'results', 'openDecisions', 'next'].map(field => [field, context[field] ?? null]));
  return { command: 'checkpoint', ok: true, kind: 'proposal-human-review-required', date: new Date().toISOString(),
    branch: values.branch || null, revision: values.revision, state: changes.length ? 'dirty' : 'clean', changes,
    ...supplied, contextStatus: Object.fromEntries(Object.entries(supplied).map(([field, value]) => [field, value === null ? 'not-informed' : 'provided'])),
    authorization: 'not-inferred', verification: 'not-executed-by-checkpoint' };
}

export function verificationReport(checks, product = false) {
  return { command: 'verify', scope: product ? 'harness-and-product-tests' : 'harness', partial: true, readiness: 'not-assessed',
    ok: checks.every(check => check.ok !== false), checks,
    notExecuted: checks.filter(check => check.status === 'not-executed' || check.execution === 'not-executed').map(check => ({ name: check.name, reason: check.reason ?? check.note ?? 'Outside this command scope.' })) };
}

export async function verify(root = projectRoot, product = false) {
  const checks = [{ name: 'validate', ...validate(root) }];
  const tests = await runManaged(process.execPath, ['--test', 'scripts/harness/harness.test.mjs'], { cwd: root, timeout: 60000 });
  checks.push({ name: 'harness-tests', ok: tests.ok, code: tests.code, diagnostic: tests.diagnostic });
  const native = await runManaged(process.execPath, ['scripts/harness/native-probe.mjs'], { cwd: root, timeout: 45000 });
  checks.push({ name: 'native-probe', ok: native.ok, code: native.code, diagnostic: native.diagnostic });
  const npmCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  if (existsSync(npmCli) && existsSync(join(root, 'node_modules/eslint/bin/eslint.js'))) {
    const lint = await runManaged(process.execPath, [npmCli, 'run', 'lint'], { cwd: root, timeout: 180000 });
    checks.push({ name: 'lint', ok: lint.ok, code: lint.code, error: lint.error, diagnostic: lint.diagnostic, durationMs: lint.durationMs });
  } else checks.push({ name: 'lint', ok: false, status: 'not-executed', reason: 'Local npm/dependencies unavailable.' });
  if (existsSync(join(root, 'node_modules/typescript/bin/tsc'))) {
    const tsc = await runManaged(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false'], { cwd: root, timeout: 60000 });
    checks.push({ name: 'typecheck-no-generated-output', ok: tsc.ok, code: tsc.code, error: tsc.error, diagnostic: tsc.diagnostic, durationMs: tsc.durationMs });
  } else checks.push({ name: 'typecheck', ok: false, status: 'not-executed', reason: 'TypeScript unavailable.' });
  checks.push(product ? await verifyProductTests(root) : { name: 'product-tests', ...inspectProductTests(root), execution: 'not-executed', note: 'Use --product for runtime verification; configuration alone is not proof.' });
  checks.push({ name: 'build', status: 'not-executed', reason: 'Build is outside this partial verification command.' });
  checks.push({ name: 'full-product-assessment', status: 'not-executed', reason: 'No end-to-end, remote CI or comprehensive security/readiness assessment in this command.' });
  return verificationReport(checks, product);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  try {
    let result;
    if (command === 'doctor') result = doctor();
    else if (command === 'validate') {
      if (args.length && (args[0] !== '--root' || args.length !== 2)) throw new Error('usage: validate [--root PATH]');
      result = validate(args[0] ? resolve(args[1]) : projectRoot);
    } else if (command === 'verify' && args.every(a => a === '--product')) result = await verify(projectRoot, args.includes('--product'));
    else if (command === 'checkpoint') {
      let root = projectRoot;
      const context = {};
      const fields = { '--task': 'task', '--evidence': 'files', '--results': 'results', '--decision': 'openDecisions', '--next': 'next' };
      for (let i = 0; i < args.length; i += 2) {
        const flag = args[i], value = args[i + 1];
        if (!value || (flag !== '--root' && !fields[flag])) throw new Error('checkpoint: expected --root/--task/--evidence/--results/--decision/--next VALUE');
        if (flag === '--root') root = resolve(value);
        else if (['files', 'openDecisions'].includes(fields[flag])) (context[fields[flag]] ??= []).push(value);
        else context[fields[flag]] = value;
      }
      result = checkpoint(root, context);
    }
    else throw new Error('usage: node scripts/harness/harness.mjs doctor|validate [--root PATH]|verify [--product]|checkpoint');
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok === false ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
