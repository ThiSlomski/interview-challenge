import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { validate, projectRoot, run } from './harness.mjs';
import { checkpoint, skills, roles } from './harness.mjs';
import { handle } from './hook.mjs';
import { validateHooks } from './hooks-validator.mjs';
import { evaluateCapabilities } from './native-probe.mjs';
import { inspectProductTests, verifyProductTests } from './product-tests.mjs';
import { runManaged } from './processes.mjs';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import { probe, createProtocolClient, identifyAgents } from './native-probe.mjs';
import { verify, verificationReport } from './harness.mjs';

function observedCatalog() {
  const description = 'Available roles:\n' + roles.map(name => {
    const text = /^description = "(.+)"$/m.exec(readFileSync(join(projectRoot, `.codex/agents/${name}.toml`), 'utf8'))[1];
    return `${name}: {\n${text}\n}`;
  }).join('\n');
  return [{ tools: [{ type: 'function', name: 'spawn_agent', parameters: { type: 'object', properties: { agent_type: { type: 'string', description } } } }] }];
}

async function controlledNative({ rendered = observedCatalog(), overflow = null, ruleResult = null, ruleExit = 0 } = {}, action) {
  const spawn = childProcess.spawn, spawnSync = childProcess.spawnSync, timeout = globalThis.setTimeout;
  childProcess.spawnSync = (_command, args) => ({ status: args.includes('execpolicy') ? ruleExit : 0, stdout: JSON.stringify(args.includes('prompt-input') ? rendered
    : args.includes('execpolicy') ? ruleResult ?? (args.at(-1) === 'status' ? { matchedRules: [] } : { decision: 'forbidden' }) : {}), stderr: '' });
  childProcess.spawn = command => {
    const child = new EventEmitter();
    child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => true; child.unref = () => {};
    child.stdin = new Writable({ write(chunk, _encoding, callback) {
      const request = JSON.parse(chunk.toString());
      if (request.id) queueMicrotask(() => {
        if (child.stdout.destroyed) return;
        if (overflow) { child.stdout.write(overflow); return; }
        const fixture = nativeFixture();
        const result = request.method === 'skills/list' ? fixture.discovery : request.method === 'config/read' ? fixture.configuration : {};
        child.stdout.write(JSON.stringify({ id: request.id, result }) + '\n');
      });
      callback();
    } });
    if (command !== 'codex') queueMicrotask(() => { child.stdout.end(); child.stderr.end(); child.emit('close', 0, null); });
    return child;
  };
  globalThis.setTimeout = (callback, milliseconds, ...args) => timeout(callback, milliseconds >= 5000 ? 30 : milliseconds, ...args);
  syncBuiltinESMExports();
  try { return await action(); }
  finally { childProcess.spawn = spawn; childProcess.spawnSync = spawnSync; globalThis.setTimeout = timeout; syncBuiltinESMExports(); }
}

test('H006-1 checkpoint has no inferred historical context', () => {
  const git = (_command, args) => ({ ok: true, code: 0, stdout: args[0] === 'branch' ? 'main' : args[0] === 'rev-parse' ? 'fixture-revision' : '' });
  const result = checkpoint(projectRoot, undefined, git);
  assert.equal(result.task, null);
  assert.equal(result.next, null);
  assert.equal(result.openDecisions, null);
  assert.equal(result.files, null);
});

test('H006-2 product mode reports only partial verification', () => controlledNative({}, async () => {
  const result = await verify(projectRoot, true);
  assert.equal(result.scope, 'harness-and-product-tests');
  assert.equal(result.readiness, 'not-assessed');
}));

test('H006-3 subprocess diagnostics classify nonzero without private stderr', async () => {
  const source = "console.error('H006_PRIVATE_STDERR'); process.exit(23);";
  for (const result of [run(process.execPath, ['-e', source]), await runManaged(process.execPath, ['-e', source])]) {
    assert.equal(result.code, 23);
    assert.equal(result.diagnostic?.classification, 'nonzero-exit');
    assert.equal(JSON.stringify(result).includes('H006_PRIVATE_STDERR'), false);
  }
});

test('H006-4 native protocol rejects overlong received message', async () => {
  const payload = Buffer.from('H006_PRIVATE_PROTOCOL' + 'x'.repeat(300 * 1024));
  await controlledNative({ overflow: payload }, async () => {
    const result = await probe();
    assert.equal(result.diagnostic?.classification, 'output-limit');
    assert.equal(JSON.stringify(result).includes('H006_PRIVATE_PROTOCOL'), false);
  });
});

test('H006-5 descriptions outside the tool schema do not prove identity', () => {
  const rendered = { notes: roles.map(name => /^description = "(.+)"$/m.exec(readFileSync(join(projectRoot, `.codex/agents/${name}.toml`), 'utf8'))[1]) };
  return controlledNative({ rendered }, async () => { assert.equal((await probe()).ok, false); });
});

test('H006-6 actual case names ending in extensions are valid tests', () => temporary('harness-product-', async fixture => {
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node --test check.test.mjs' } }));
  writeFileSync(join(fixture, 'check.test.mjs'), "import test from 'node:test'; test('validates utils.js',()=>{});");
  assert.equal((await verifyProductTests(fixture)).status, 'passed');
}));

test('H006-1 updated checkpoint context is explicit, with missing fields not informed', () => {
  const git = (_command, args) => ({ ok: true, code: 0, stdout: args[0] === 'branch' ? 'main' : args[0] === 'rev-parse' ? 'fixture-revision' : ' M fixture.txt\n' });
  const context = { task: 'H006 current review', files: ['docs/current-evidence.md'], openDecisions: [], next: 'Review the six corrections', results: 'Controlled fixture only' };
  const result = checkpoint(projectRoot, context, git);
  for (const [key, value] of Object.entries(context)) assert.deepEqual(result[key], value);
  assert.equal(result.authorization, 'not-inferred'); assert.equal(result.state, 'dirty');
  assert.ok(Object.values(result.contextStatus).every(status => status === 'provided'));
  const incomplete = checkpoint(projectRoot, { task: 'current' }, git);
  assert.equal(incomplete.contextStatus.next, 'not-informed'); assert.equal(incomplete.next, null);
});

test('H006-2 successful partial checks do not imply full readiness and product failures stay failures', () => {
  const excluded = { name: 'build', status: 'not-executed', reason: 'Deliberately excluded.' };
  const passed = verificationReport([{ name: 'product-tests', ok: true, status: 'passed' }, excluded], true);
  assert.equal(passed.ok, true); assert.equal(passed.partial, true); assert.equal(passed.readiness, 'not-assessed');
  assert.deepEqual(passed.notExecuted, [{ name: 'build', reason: 'Deliberately excluded.' }]);
  for (const status of ['absent', 'placeholder', 'failed', 'unproven']) assert.equal(verificationReport([{ name: 'product-tests', status, ok: false }, excluded], true).ok, false);
});

test('H006-3 diagnostic categories cover start, timeout, output limit and unconfirmed cleanup', async () => {
  const privateMarker = 'H006_PRIVATE_DIAGNOSTIC';
  for (const command of ['harness-missing-binary', `bad\0${privateMarker}`]) {
    for (const result of [run(command, []), await runManaged(command, [])]) {
      assert.equal(result.ok, false); assert.equal(result.diagnostic.classification, 'start-failure');
      assert.equal(JSON.stringify(result).includes(privateMarker), false);
    }
  }
  const waiting = ['-e', 'setInterval(()=>{},1000)'];
  const timed = run(process.execPath, waiting, projectRoot, 50);
  assert.equal(timed.diagnostic.classification, 'timeout'); assert.equal(timed.diagnostic.termination, 'not-confirmed');
  const excessive = ['-e', `process.stderr.write('${privateMarker}'+ 'x'.repeat(3*1024*1024));setInterval(()=>{},1000);`];
  const sync = run(process.execPath, excessive, projectRoot, 3000);
  assert.equal(sync.diagnostic.classification, 'output-limit'); assert.equal(JSON.stringify(sync).includes(privateMarker), false);
  const managed = await runManaged(process.execPath, excessive, { timeout: 3000, maxBuffer: 128 });
  assert.equal(managed.diagnostic.classification, 'output-limit'); assert.equal(JSON.stringify(managed).includes(privateMarker), false);
  const unconfirmed = await runManaged(process.execPath, waiting, { timeout: 100, terminate: async child => { child.kill(); return 'not-confirmed'; } });
  assert.equal(unconfirmed.ok, false); assert.equal(unconfirmed.diagnostic.classification, 'timeout'); assert.equal(unconfirmed.diagnostic.termination, 'not-confirmed');
});

test('H006-4 byte budgets reject all pending requests, with/without newline and on stderr', async () => {
  for (const [stream, payload, limit] of [
    ['stdout', 'H006_PRIVATE_PROTOCOL' + 'x'.repeat(65), 'message-bytes'],
    ['stdout', JSON.stringify({ private: 'H006_PRIVATE_PROTOCOL' + 'x'.repeat(65) }) + '\n', 'message-bytes'],
    ['stdout', '{}\n'.repeat(50), 'total-bytes'],
    ['stderr', 'H006_PRIVATE_PROTOCOL' + 'x'.repeat(129), 'total-bytes']
  ]) {
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.stdin = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    let terminated = 0;
    const client = createProtocolClient(child, { maxTotalBytes: 128, maxMessageBytes: 64, terminate: async () => { terminated++; return 'controlled-stop'; } });
    const results = Promise.allSettled([client.request('one', {}), client.request('two', {})]);
    child[stream].write(payload);
    assert.ok((await results).every(result => result.status === 'rejected'));
    assert.equal(client.diagnostic.classification, 'output-limit'); assert.equal(client.diagnostic.limit, limit);
    assert.deepEqual({ pending: client.stats.pendingRequests, bytes: client.stats.bufferedBytes }, { pending: 0, bytes: 0 });
    assert.equal(JSON.stringify(client.diagnostic).includes('H006_PRIVATE_PROTOCOL'), false);
    assert.equal(child.stdout.destroyed, true); assert.equal(child.stderr.destroyed, true);
    assert.equal(await client.shutdown(), 'controlled-stop'); assert.equal(terminated, 1);
  }
});

test('H006-4 protocol accepts UTF8 split across controlled byte chunks', async () => {
  const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.stdin = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const client = createProtocolClient(child, { terminate: async () => 'controlled-stop' });
  const response = client.request('fixture', {}), bytes = Buffer.from(JSON.stringify({ id: 1, result: 'é' }) + '\n');
  const split = bytes.indexOf(0xc3) + 1;
  child.stdout.write(bytes.subarray(0, split)); child.stdout.write(bytes.subarray(split));
  assert.equal(await response, 'é'); assert.equal(client.diagnostic, null); await client.shutdown();
  child.stdout.destroy(); child.stderr.destroy();
});

test('H006-5 identity requires the observed tool structure, exact association and unique name', () => {
  const expected = roles.map(name => ({ name, description: /^description = "(.+)"$/m.exec(readFileSync(join(projectRoot, `.codex/agents/${name}.toml`), 'utf8'))[1] }));
  const identify = json => identifyAgents(JSON.stringify(json), expected);
  assert.equal(identify(observedCatalog()).status, 'recognized-definitions');
  const field = json => json[0].tools[0].parameters.properties.agent_type;
  for (const mutate of [
    json => { field(json).description = field(json).description.replace('backend: {', 'wrong_name: {'); },
    json => { field(json).description = field(json).description.replace(expected.find(item => item.name === 'frontend').description, expected.find(item => item.name === 'backend').description); },
    json => { field(json).description += '\nbackend: {\n' + expected.find(item => item.name === 'backend').description + '\n}'; },
    json => { delete json[0].tools[0].name; },
    json => { field(json).source = 'unrecognized-origin-format'; }
  ]) { const json = observedCatalog(); mutate(json); assert.notEqual(identify(json).status, 'recognized-definitions'); }
  for (const json of [{ notes: expected }, [], [{ text: JSON.stringify(observedCatalog()) }]]) assert.notEqual(identify(json).status, 'recognized-definitions');
  assert.equal(identifyAgents('not-json H006_PRIVATE_PROTOCOL', expected).status, 'invalid-json');
  assert.ok(identify(observedCatalog()).agents.every(agent => agent.sourcePath === 'not-provided-by-format'));
});

test('H006-6 structured reports distinguish cases from files independently of case name', () => temporary('harness-product-', async fixture => {
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node --test check.test.mjs' } }));
  for (const name of ['validates module.js', 'validates module.mjs', 'validates module.cjs', 'check.test.mjs']) {
    writeFileSync(join(fixture, 'check.test.mjs'), `import test from 'node:test';test(${JSON.stringify(name)},()=>{});`);
    const result = await verifyProductTests(fixture);
    assert.equal(result.status, 'passed'); assert.equal(result.report.tests, 1);
  }
  for (const source of ["console.log('# tests 1\\n# pass 1\\n# fail 0');", "console.log(JSON.stringify({adapter:'node22-test-summary-v1',completed:true}));"]) {
    writeFileSync(join(fixture, 'check.test.mjs'), source);
    assert.equal((await verifyProductTests(fixture)).status, 'unproven');
  }
}));

test('H006-3 native rule diagnostics never echo unexpected received decisions', async () => {
  for (const [ruleResult, ruleExit] of [[{ decision: { private: 'H006_PRIVATE_DECISION' } }, 0], [{ decision: 'H006_PRIVATE_DECISION' }, 0], [{ decision: 'forbidden', private: 'H006_PRIVATE_DECISION' }, 23]]) {
    await controlledNative({ ruleResult, ruleExit }, async () => {
      const result = await probe();
      assert.equal(result.ok, false);
      assert.equal(JSON.stringify(result).includes('H006_PRIVATE_DECISION'), false);
      assert.ok(result.ruleCases.every(item => item.diagnostic?.classification === (ruleExit ? 'nonzero-exit' : 'invalid-output')));
    });
  }
});

test('H006-4 probe terminates while stdin is open and never approves unconfirmed cleanup', () => controlledNative({}, async () => {
  const confirmed = await probe({ terminate: async child => child.stdin.writableEnded ? 'not-confirmed' : 'controlled-stop' });
  assert.equal(confirmed.ok, true); assert.equal(confirmed.cleanup, 'controlled-stop');
  const unknown = await probe({ terminate: async () => 'not-confirmed' });
  assert.equal(unknown.ok, false); assert.equal(unknown.terminationDiagnostic.classification, 'termination-unconfirmed');
}));

function temporary(prefix, action) {
  const fixture = mkdtempSync(join(tmpdir(), prefix));
  const cleanup = () => {
    const local = resolve(fixture);
    assert.ok(local.startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')) && local.includes(prefix));
    rmSync(local, { recursive: true, force: true });
  };
  try {
    const result = action(fixture);
    if (result?.then) return result.finally(cleanup);
    cleanup(); return result;
  } catch (error) { cleanup(); throw error; }
}

test('validate rejects broken skill metadata in isolated fixture and CLI exits nonzero', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'harness-invalid-'));
  try {
    for (const name of ['AGENTS.md', '.codex', '.agents', 'docs', 'scripts', 'SOLUTION.md', 'README.md', '.env.example']) cpSync(join(projectRoot, name), join(fixture, name), { recursive: true });
    assert.deepEqual(validate(fixture).errors, []);
    assert.equal(validate(fixture).ok, true);
    const file = join(fixture, '.agents/skills/resume-project/SKILL.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('name: resume-project', 'name: invalid'));
    const result = validate(fixture);
    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, ['invalid skill metadata: .agents/skills/resume-project/SKILL.md']);
    const cli = run(process.execPath, ['scripts/harness/harness.mjs', 'validate', '--root', fixture]);
    assert.equal(cli.code, 1);
    assert.deepEqual(JSON.parse(cli.stdout).errors, result.errors);
    assert.equal(validate(projectRoot).ok, true);
  } finally {
    // Remove only the exact directory created above, after checking its boundary.
    assert.equal(resolve(fixture).startsWith(resolve(tmpdir()) + '\\') || resolve(fixture).startsWith(resolve(tmpdir()) + '/'), true);
    assert.equal(fixture.includes('harness-invalid-'), true);
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('checkpoint distinguishes clean/dirty and every required Git failure', () => {
  const successful = changes => (_command, args) => ({ ok: true, code: 0, stdout: args[0] === 'branch' ? 'main\n' : args[0] === 'rev-parse' ? 'fixture-revision\n' : changes });
  assert.equal(checkpoint(projectRoot, 'fixture', successful('')).state, 'clean');
  const dirty = checkpoint(projectRoot, 'fixture', successful(' M file.txt\n?? new.txt\n'));
  assert.equal(dirty.state, 'dirty');
  assert.deepEqual(dirty.changes, [' M file.txt', '?? new.txt']);
  for (const command of ['branch', 'rev-parse', 'status']) {
    const result = checkpoint(projectRoot, 'fixture', (name, args) => args[0] === command
      ? { ok: false, code: 128, stdout: 'fixture-private-error', error: null } : successful('')(name, args));
    assert.equal(result.ok, false);
    assert.equal(result.kind, 'invalid-git-state');
    assert.equal(result.errors[0].code, 128);
    assert.equal('changes' in result, false);
    assert.equal(JSON.stringify(result).includes('fixture-private-error'), false);
  }
});

test('checkpoint CLI fails outside Git, without a valid proposal', () => temporary('harness-no-git-', fixture => {
  const result = run(process.execPath, ['scripts/harness/harness.mjs', 'checkpoint', '--root', fixture]);
  assert.equal(result.code, 1);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, false);
  assert.equal(output.kind, 'invalid-git-state');
  assert.equal('changes' in output, false);
}));

test('hook schema accepts supported command fields and rejects each incomplete/invalid condition', () => {
  const valid = JSON.parse(readFileSync(join(projectRoot, '.codex/hooks.json'), 'utf8'));
  assert.deepEqual(validateHooks(valid), []);
  const invalidCases = [
    config => { config.hooks.SessionStart = []; },
    config => { config.hooks.SessionStart = [null]; },
    config => { delete config.hooks.SessionStart[0].hooks; },
    config => { config.hooks.SessionStart[0].hooks = []; },
    config => { config.hooks.SessionStart[0].hooks = {}; },
    config => { config.hooks.SessionStart[0].hooks = [null]; },
    config => { config.hooks.SessionStart[0].matcher = 42; },
    config => { config.hooks.MadeUp = []; },
    ...['type', 'command', 'timeout'].map(field => config => { delete config.hooks.SessionStart[0].hooks[0][field]; }),
    ...['prompt', null].map(value => config => { config.hooks.SessionStart[0].hooks[0].type = value; }),
    ...['', 42].map(value => config => { config.hooks.SessionStart[0].hooks[0].command = value; }),
    ...[null, '10', NaN, Infinity, -Infinity, 0, -1, 11].map(value => config => { config.hooks.SessionStart[0].hooks[0].timeout = value; }),
    ...['', 42].map(value => config => { config.hooks.SessionStart[0].hooks[0].commandWindows = value; }),
    config => { config.hooks.SessionStart[0].hooks[0].async = 'true'; },
    config => { config.hooks.SessionStart[0].hooks[0].statusMessage = 42; },
    config => { config.hooks.SessionStart[0].hooks[0].additionalContextLimit = -1; }
  ];
  for (const mutate of invalidCases) {
    const config = structuredClone(valid); mutate(config);
    assert.ok(validateHooks(config).length > 0);
  }
  for (const config of [null, [], {}, { hooks: [] }]) assert.ok(validateHooks(config).length);
  const optional = structuredClone(valid);
  delete optional.hooks.SessionStart[0].hooks[0].commandWindows;
  optional.hooks.SessionStart[0].hooks[0].timeout = 0.5;
  assert.deepEqual(validateHooks(optional), []);
});

function nativeFixture() {
  return {
    discovery: { data: [{ skills: skills.map(name => ({ name, enabled: true, path: join(projectRoot, `.agents/skills/${name}/SKILL.md`) })) }] },
    configuration: { layers: [{ name: { type: 'project', dotCodexFolder: join(projectRoot, '.codex') }, disabledReason: null }], config: { agents: { enabled: true, max_concurrent_threads_per_session: 2 } } },
    agents: roles.map(name => ({ name, discovered: true }))
  };
}

test('native capability state requires enabled unique skills and effective project settings', () => {
  const evaluate = fixture => evaluateCapabilities(fixture.discovery, fixture.configuration, fixture.agents);
  assert.equal(evaluate(nativeFixture()).ok, true);
  const cases = [
    fixture => { fixture.discovery.data[0].skills[0].enabled = false; },
    fixture => { delete fixture.discovery.data[0].skills[0].enabled; },
    fixture => { fixture.discovery.data[0].skills.pop(); },
    fixture => { fixture.discovery.data[0].skills.push(fixture.discovery.data[0].skills[0]); },
    fixture => { fixture.discovery.data[0].skills[0].path += '.other'; },
    fixture => { fixture.configuration.layers[0].disabledReason = 'fixture-untrusted'; },
    fixture => { fixture.configuration.layers[0].name.dotCodexFolder = tmpdir(); },
    fixture => { delete fixture.configuration.layers; },
    fixture => { fixture.configuration.config.agents.enabled = false; },
    fixture => { delete fixture.configuration.config.agents.enabled; },
    fixture => { fixture.configuration.config.agents.max_concurrent_threads_per_session = 4; },
    fixture => { delete fixture.configuration.config.agents.max_concurrent_threads_per_session; },
    fixture => { fixture.agents.pop(); }
  ];
  for (const mutate of cases) { const fixture = nativeFixture(); mutate(fixture); assert.equal(evaluate(fixture).ok, false); }
  const disabled = nativeFixture(); disabled.discovery.data[0].skills[0].enabled = false;
  assert.equal(evaluate(disabled).skills[0].configuration, 'disabled');
  assert.equal(evaluate(disabled).skills[0].operational, false);
  const unknown = nativeFixture(); delete unknown.configuration.layers;
  assert.equal(evaluate(unknown).projectLayer, 'unproven');
  assert.ok(evaluate(nativeFixture()).agents.every(agent => agent.execution === 'not-demonstrated'));
  assert.equal(evaluate(nativeFixture()).hooks.operational, false);
});

test('product tests: absent and placeholder never execute', async () => temporary('harness-product-', async fixture => {
  const execute = () => { throw new Error('Must not execute missing/placeholder tests'); };
  for (const [scripts, expected] of [[{}, 'absent'], [{ test: 'echo "Substitua por seu runner" && exit 0' }, 'placeholder']]) {
    writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts }));
    assert.equal(inspectProductTests(fixture).status, expected);
    const result = await verifyProductTests(fixture, execute);
    assert.equal(result.status, expected); assert.equal(result.ok, false); assert.equal(result.execution, 'not-executed');
  }
}));

test('product tests require real executed cases; distinguish failure/success/empty/skip/unsupported reports', async () => temporary('harness-product-', async fixture => {
  const file = join(fixture, 'check.test.mjs');
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node --test check.test.mjs' } }));
  assert.equal(inspectProductTests(fixture).status, 'configured');
  for (const [body, expected] of [
    ["import test from 'node:test'; import assert from 'node:assert/strict'; test('fixture case',()=>assert.equal(1,1));", 'passed'],
    ["import test from 'node:test'; import assert from 'node:assert/strict'; test('fixture failure',()=>assert.equal(1,2));", 'failed'],
    ["console.log('no actual tests');", 'unproven'],
    ["import test from 'node:test'; test.skip('fixture skipped',()=>{});", 'unproven']
  ]) {
    writeFileSync(file, body);
    const result = await verifyProductTests(fixture);
    assert.equal(result.status, expected, JSON.stringify(result));
    assert.equal(result.ok, expected === 'passed');
    assert.equal(result.execution, 'executed');
  }
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "process.exit(0)"' } }));
  assert.equal((await verifyProductTests(fixture)).status, 'unproven');
  writeFileSync(file, "import test from 'node:test'; test('fixture wrapper case',()=>{});");
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'echo "Running tests" && node --test check.test.mjs' } }));
  assert.equal(inspectProductTests(fixture).status, 'configured');
  const wrapped = await verifyProductTests(fixture);
  assert.equal(wrapped.execution, 'executed'); assert.equal(wrapped.status, 'unproven');
  writeFileSync(join(fixture, 'todo.test.mjs'), "import test from 'node:test'; test('fixture named todo file',()=>{});");
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node --test todo.test.mjs' } }));
  assert.equal(inspectProductTests(fixture).status, 'configured');
  assert.equal((await verifyProductTests(fixture)).status, 'passed');
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { test: 'node --test scripts/harness/harness.test.mjs' } }));
  assert.equal(inspectProductTests(fixture).proofSupported, false);
}));

test('managed timeout terminates a real QA parent and descendant on Windows', { skip: process.platform !== 'win32' }, async () => {
  const source = "const {spawn}=require('node:child_process'); const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore',windowsHide:true}); console.log(JSON.stringify({parent:process.pid,child:child.pid})); setInterval(()=>{},1000);";
  const result = await runManaged(process.execPath, ['-e', source], { cwd: projectRoot, timeout: 3000 });
  const pids = JSON.parse(result.stdout.trim());
  const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
  try {
    assert.equal(result.ok, false); assert.equal(result.error, 'ETIMEDOUT');
    assert.equal(result.cleanup, 'tree-terminated');
    assert.equal(alive(pids.parent), false); assert.equal(alive(pids.child), false);
  } finally { for (const pid of Object.values(pids)) if (alive(pid)) process.kill(pid); }
});

test('managed process reports launch failure', async () => {
  const result = await runManaged('harness-nonexistent-executable', [], { cwd: projectRoot, timeout: 1000 });
  assert.equal(result.ok, false); assert.equal(result.error, 'ENOENT');
});

test('hooks reject unrecognized event and do not expose sensitive extra fields', () => {
  assert.throws(() => handle({ hook_event_name: 'MadeUp', cwd: projectRoot }));
  assert.throws(() => handle({ hook_event_name: 'Stop', cwd: tmpdir() }));
  const output = handle({ hook_event_name: 'Stop', cwd: projectRoot, tool_input: { secret: 'fixture-private-marker' } });
  assert.equal(output.continue, true);
  assert.equal(JSON.stringify(output).includes('fixture-private-marker'), false);
  assert.deepEqual(handle({ hook_event_name: 'Stop', cwd: projectRoot, stop_hook_active: true }), { continue: true });
});

test('SessionStart handler returns documented advisory envelope', () => {
  const output = handle({ hook_event_name: 'SessionStart', cwd: projectRoot, source: 'startup' });
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(output.hookSpecificOutput.additionalContext, /Harness diagnostic/);
});

test('invalid hook stdin exits nonzero without echoing input', () => {
  const result = run(process.execPath, ['scripts/harness/hook.mjs']);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, '');
});
