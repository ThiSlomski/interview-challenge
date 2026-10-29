import { spawn, execFile } from 'node:child_process';

export function processDiagnostic({ code = null, error = null, signal = null, cleanup = 'not-needed' } = {}) {
  const classification = error === 'ETIMEDOUT' ? 'timeout'
    : ['OUTPUT_LIMIT', 'ENOBUFS'].includes(error) ? 'output-limit'
      : error ? 'start-failure' : signal ? 'signalled-exit' : cleanup === 'not-confirmed' && code === null ? 'termination-unconfirmed' : code === 0 ? 'success' : 'nonzero-exit';
  return { classification, code: Number.isInteger(code) ? code : null,
    termination: cleanup, stderr: 'withheld', investigation: classification === 'success' ? null : 'Inspect this command locally without publishing private output.' };
}

// Only pass a ChildProcess created by this module/caller; never accept an arbitrary PID.
export async function stopProcessTree(child, timeout = 5000) {
  if (!Number.isInteger(child.pid) || child.pid <= 0) return 'not-started';
  if (process.platform === 'win32') {
    return await new Promise(resolve => {
      execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'],
        { windowsHide: true, timeout: Math.max(1, Math.min(5000, Math.floor(timeout))) }, error => resolve(error ? 'not-confirmed' : 'tree-terminated'));
    });
  }
  try { process.kill(-child.pid, 'SIGKILL'); return 'group-terminated-unverified-platform'; }
  catch { return 'not-confirmed'; }
}

export async function runManaged(command, args, { cwd, timeout = 30000, maxBuffer = 2 * 1024 * 1024, env = {}, terminate = stopProcessTree } = {}) {
  const started = performance.now();
  const environment = { ...process.env, ...env };
  delete environment.NODE_TEST_CONTEXT;
  return await new Promise(resolve => {
    let child;
    try { child = spawn(command, args, { cwd, env: environment, windowsHide: true,
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) {
      const code = error.code ?? 'SPAWN_FAILED';
      resolve({ ok: false, code: null, stdout: '', error: code, cleanup: 'not-started',
        diagnostic: processDiagnostic({ error: code, cleanup: 'not-started' }), durationMs: Math.round(performance.now() - started) });
      return;
    }
    let stdout = '', bytes = 0, failure = null, cleanup = 'not-needed', stopping = null, settled = false, grace;
    const finish = async (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer); clearTimeout(grace);
      if (stopping) await stopping;
      resolve({ ok: !failure && code === 0, code, signal, stdout, error: failure,
        cleanup, diagnostic: processDiagnostic({ code, error: failure, signal, cleanup }), durationMs: Math.round(performance.now() - started) });
    };
    const abort = code => {
      if (stopping) return;
      failure = code;
      stopping = Promise.resolve().then(() => terminate(child)).catch(() => 'not-confirmed').then(result => {
        cleanup = result;
        if (settled) return;
        // A failed kill or a descendant holding pipes must not leave verification waiting forever.
        grace = setTimeout(() => {
          child.kill('SIGKILL'); child.stdout.destroy(); child.stderr.destroy(); child.unref();
          void finish(null, null);
        }, 1000);
      });
    };
    const collect = (chunk, keep) => {
      bytes += chunk.length;
      if (bytes > maxBuffer) abort('OUTPUT_LIMIT');
      else if (keep) stdout += chunk.toString();
    };
    child.stdout.on('data', chunk => collect(chunk, true));
    child.stderr.on('data', chunk => collect(chunk, false)); // Never expose raw stderr.
    child.on('error', error => { failure ??= error.code ?? 'SPAWN_FAILED'; });
    const timer = setTimeout(() => abort('ETIMEDOUT'), timeout);
    child.on('close', (code, signal) => { void finish(code, signal); });
  });
}
