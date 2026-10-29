import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, run, skills, roles } from './harness.mjs';
import { stopProcessTree, processDiagnostic } from './processes.mjs';
import { validateHooks } from './hooks-validator.mjs';

function samePath(left, right) {
  if (typeof left !== 'string') return false;
  const normalize = value => process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value);
  return normalize(left) === normalize(right);
}

export function evaluateCapabilities(discovery, configuration, agentDiscovery, root = projectRoot, hookConfiguration = { presence: 'unproven', configuration: 'unproven' }) {
  const layers = configuration?.layers;
  const projectLayers = Array.isArray(layers) ? layers.filter(layer => layer.name?.type === 'project'
    && samePath(layer.name.dotCodexFolder, resolve(root, '.codex'))) : [];
  const projectLayer = projectLayers.length !== 1 ? 'unproven'
    : projectLayers[0].disabledReason ? 'disabled' : 'active';
  const discovered = Array.isArray(discovery?.data) ? discovery.data.flatMap(entry => entry.skills ?? []) : [];
  const skillStates = skills.map(name => {
    const matches = discovered.filter(skill => skill.name === name && samePath(skill.path, resolve(root, `.agents/skills/${name}/SKILL.md`)));
    const enabled = matches.length === 1 && typeof matches[0].enabled === 'boolean' ? matches[0].enabled : null;
    return { name, presence: matches.length === 1 ? 'present' : matches.length ? 'ambiguous' : 'unproven', enabled,
      configuration: matches.length === 1 && enabled === true ? 'effective' : enabled === false ? 'disabled' : 'unproven',
      operational: matches.length === 1 && enabled === true && projectLayer === 'active', execution: 'not-demonstrated' };
  });
  const agents = configuration?.config?.agents;
  const enabled = typeof agents?.enabled === 'boolean' ? agents.enabled : null;
  const concurrency = Number.isInteger(agents?.max_concurrent_threads_per_session) ? agents.max_concurrent_threads_per_session : null;
  const effective = enabled === true && concurrency === 2 && projectLayer === 'active';
  const agentStates = roles.map(name => {
    const matches = agentDiscovery.filter(agent => agent.name === name && agent.discovered === true);
    return { name, presence: matches.length === 1 ? 'present' : 'unproven', enabled,
      configuration: enabled === false ? 'disabled' : effective ? 'effective' : enabled === null || concurrency === null || projectLayer === 'unproven' ? 'unproven' : 'mismatch',
      operational: effective && matches.length === 1, execution: 'not-demonstrated' };
  });
  return { ok: projectLayer === 'active' && skillStates.every(skill => skill.operational) && agentStates.every(agent => agent.operational),
    projectLayer, effectiveAgents: { enabled, concurrency, expectedConcurrency: 2 }, skills: skillStates, agents: agentStates,
    hooks: { ...hookConfiguration, activation: 'unproven', execution: 'not-demonstrated', operational: false } };
}

function inspectHookConfiguration() {
  const path = resolve(projectRoot, '.codex/hooks.json');
  if (!existsSync(path)) return { presence: 'absent', configuration: 'unproven' };
  try { return { presence: 'present', configuration: validateHooks(JSON.parse(readFileSync(path, 'utf8'))).length ? 'invalid' : 'valid-local' }; }
  catch { return { presence: 'present', configuration: 'invalid' }; }
}

// Observed local JSON schema: tools -> function spawn_agent -> agent_type string
// description contains a framed role catalog. No origin path is supplied by it.
export function identifyAgents(stdout, expected) {
  const unknown = status => ({ status, format: 'unproven', agents: expected.map(({ name }) => ({ name, discovered: false, sourcePath: 'not-provided-by-format' })) });
  let json;
  try { json = JSON.parse(stdout); } catch { return unknown('invalid-json'); }
  if (!Array.isArray(json)) return unknown('unsupported-format');
  const candidates = [];
  const tools = list => {
    if (!Array.isArray(list)) return;
    for (const tool of list) {
      if (tool?.type === 'function' && tool.name === 'spawn_agent') candidates.push(tool);
      if (Array.isArray(tool?.tools)) tools(tool.tools);
    }
  };
  for (const block of json) tools(block?.tools);
  if (candidates.length !== 1) return unknown('unsupported-format');
  const field = candidates[0].parameters?.properties?.agent_type;
  if (field?.type !== 'string' || typeof field.description !== 'string'
      || Object.keys(field).some(key => !['type', 'description'].includes(key))) return unknown('unsupported-format');
  const text = field.description.replaceAll('\r\n', '\n');
  const start = text.indexOf('Available roles:\n');
  if (start < 0) return unknown('unsupported-format');
  const catalog = text.slice(start + 'Available roles:\n'.length);
  const entries = [...catalog.matchAll(/^([a-z][a-z0-9_-]*): \{\n([\s\S]*?)\n\}(?:\n|$)/gm)];
  if (!entries.length || catalog.replace(/^([a-z][a-z0-9_-]*): \{\n([\s\S]*?)\n\}(?:\n|$)/gm, '').trim()) return unknown('unsupported-format');
  const agents = expected.map(({ name, description }) => {
    const matches = entries.filter(entry => entry[1] === name);
    return { name, discovered: matches.length === 1 && matches[0][2] === description, sourcePath: 'not-provided-by-format' };
  });
  return { status: agents.every(agent => agent.discovered) ? 'recognized-definitions' : 'unproven', format: 'codex-spawn-role-catalog-v1', agents };
}

export function createProtocolClient(child, { maxTotalBytes = 2 * 1024 * 1024, maxMessageBytes = 256 * 1024, terminate = stopProcessTree } = {}) {
  const pending = new Map();
  let id = 0, total = 0, partial = [], partialBytes = 0, diagnostic = null, closing;
  const shutdown = () => closing ??= Promise.resolve().then(() => terminate(child)).catch(() => 'not-confirmed');
  const fail = (classification, extra = {}) => {
    if (diagnostic) return;
    diagnostic = { classification, ...extra, content: 'withheld' };
    child.stdout.pause(); child.stderr.pause(); child.stdout.destroy(); child.stderr.destroy();
    partial = []; partialBytes = 0;
    for (const request of pending.values()) request.reject(new Error('Native protocol unavailable'));
    pending.clear();
    void shutdown();
  };
  const count = chunk => {
    if (diagnostic) return false;
    total += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
    if (total > maxTotalBytes) { fail('output-limit', { limit: 'total-bytes', maximum: maxTotalBytes }); return false; }
    return true;
  };
  child.stdout.on('data', chunk => {
    if (!count(chunk)) return;
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    let start = 0;
    while (start < data.length && !diagnostic) {
      const newline = data.indexOf(10, start), end = newline < 0 ? data.length : newline;
      const size = end - start;
      if (partialBytes + size > maxMessageBytes) { fail('output-limit', { limit: 'message-bytes', maximum: maxMessageBytes }); break; }
      if (size) { partial.push(data.subarray(start, end)); partialBytes += size; }
      if (newline < 0) break;
      const line = Buffer.concat(partial, partialBytes).toString('utf8');
      partial = []; partialBytes = 0;
      if (line.trim()) {
        let message;
        try { message = JSON.parse(line); } catch { fail('invalid-protocol'); break; }
        const request = pending.get(message?.id);
        if (request) {
          pending.delete(message.id);
          if (message.error) { request.reject(new Error('Native request rejected')); }
          else request.resolve(message.result);
        }
      }
      start = newline + 1;
    }
  });
  child.stderr.on('data', chunk => { count(chunk); }); // Count bytes, never retain stderr.
  child.on('error', () => fail('start-failure'));
  child.on('exit', () => { if (!closing) fail('process-exit'); });
  child.stdin.on('error', () => fail('input-failure'));
  return {
    request(method, params) {
      if (diagnostic) return Promise.reject(new Error('Native protocol unavailable'));
      return new Promise((resolveRequest, reject) => {
        const requestId = ++id; pending.set(requestId, { resolve: resolveRequest, reject });
        try { child.stdin.write(JSON.stringify({ id: requestId, method, params }) + '\n'); }
        catch { fail('input-failure'); }
      });
    },
    fail, shutdown, get diagnostic() { return diagnostic; },
    get stats() { return { receivedBytes: total, bufferedBytes: partialBytes, pendingRequests: pending.size }; }
  };
}

// Read-only app-server protocol: no thread/start, turn/start, model call or trust write.
export async function probe({ terminate = stopProcessTree } = {}) {
  // One total budget across sequential CLI checks, RPC, and bounded cleanup.
  const deadline = performance.now() + 35000;
  const operationDeadline = deadline - 6000;
  const local = args => run('codex', args, projectRoot, Math.max(1, Math.min(5000, Math.floor(operationDeadline - performance.now()))));
  const strict = local(['--strict-config', 'app-server', '--print-startup-config']);
  if (!strict.ok) return { ok: false, strictConfig: 'failed-or-unavailable', diagnostic: strict.diagnostic, note: 'No active-loading claim.' };
  // Local prompt rendering loads custom agent definitions; never expose raw personal context.
  const rendered = local(['debug', 'prompt-input', 'Harness diagnostic only; no execution.']);
  const expectedAgents = roles.map(name => {
    const definition = readFileSync(resolve(projectRoot, `.codex/agents/${name}.toml`), 'utf8');
    const description = /^description = "(.+)"$/m.exec(definition)?.[1];
    return { name, description };
  });
  const identity = identifyAgents(rendered.ok ? rendered.stdout : '', expectedAgents);
  const ruleCases = [
    ['git', 'push', 'origin', 'main'], ['git', 'reset', '--hard', 'HEAD'], ['git', 'clean', '-fdx'],
    ['npm', 'publish'], ['vercel', 'deploy', '--prod'], ['git', 'status']
  ].map((command, index) => {
    const result = local(['execpolicy', 'check', '--rules', '.codex/rules/harness.rules', '--', ...command]);
    if (!result.ok) return { case: index + 1, ok: false, status: 'native-check-unavailable', diagnostic: result.diagnostic };
    try {
      const parsed = JSON.parse(result.stdout);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Unsupported check output');
      const decision = parsed.decision === undefined && Array.isArray(parsed.matchedRules) && parsed.matchedRules.length === 0 ? 'no-match' : parsed.decision;
      if (!['forbidden', 'prompt', 'allow', 'no-match'].includes(decision)) throw new Error('Unsupported check decision');
      return { case: index + 1, decision, ok: result.ok && decision === (index === 5 ? 'no-match' : 'forbidden') };
    } catch { return { case: index + 1, ok: false, status: 'native-check-unavailable', diagnostic: result.ok ? { classification: 'invalid-output' } : result.diagnostic }; }
  });
  if (performance.now() >= operationDeadline) return { ok: false, status: 'unproven', diagnostic: { classification: 'timeout' }, reason: 'Native check time budget exhausted.' };
  const child = spawn('codex', ['--strict-config', 'app-server', '--stdio'], { cwd: projectRoot, windowsHide: true, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] });
  const client = createProtocolClient(child, { terminate: childProcess => terminate(childProcess, Math.max(1, Math.floor(deadline - performance.now()))) });
  let result;
  const timer = setTimeout(() => client.fail('timeout'), Math.min(15000, Math.max(1, operationDeadline - performance.now())));
  try {
      await client.request('initialize', { clientInfo: { name: 'harness-readonly-probe', version: '1.0.0' } });
      child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
      const discovery = await client.request('skills/list', { cwds: [projectRoot], forceReload: true });
      const configuration = await client.request('config/read', { cwd: projectRoot, includeLayers: true });
      const capabilities = evaluateCapabilities(discovery, configuration, identity.agents, projectRoot, inspectHookConfiguration());
      result = { ok: capabilities.ok && ruleCases.every(c => c.ok), strictConfig: 'accepted', capabilities, identity, ruleCases,
        limits: ['No model turns or trust changes.', 'Strict config only validates layers actually loaded.', 'Custom role selection and real hook dispatch are not proved by this probe.'] };
  } catch { result = { ok: false, strictConfig: 'accepted', discovery: 'not-confirmed', diagnostic: client.diagnostic ?? { classification: 'request-failure', content: 'withheld' } }; }
  finally { clearTimeout(timer); }
  const cleanup = await client.shutdown();
  child.stdin.end();
  child.stdout.destroy(); child.stderr.destroy();
  if (cleanup === 'not-confirmed') result.ok = false;
  return { ...result, cleanup, protocol: client.stats, ...(cleanup === 'not-confirmed' ? { terminationDiagnostic: processDiagnostic({ cleanup }) } : {}) };
}

if (process.argv[1]?.endsWith('native-probe.mjs')) {
  const result = await probe(); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.ok ? 0 : 1;
}
