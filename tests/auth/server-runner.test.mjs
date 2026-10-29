import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

test('auth server suite under react-server condition (11 controlled cases)', async () => {
  const child = spawn(process.execPath, ['--conditions=react-server', '--test', '--test-reporter=tap', resolve('tests/auth/server.test.mjs')], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000,
    env: { ...process.env, NODE_TEST_CONTEXT: undefined },
  });
  let output = '', bytes = 0;
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
    bytes += chunk.length; if (bytes > 512 * 1024) child.kill(); else output += chunk.toString();
  });
  const [code, signal] = await once(child, 'exit');
  assert.equal(signal, null, 'AUTH_SUITE_TERMINATED'); assert.equal(code, 0, 'AUTH_SUITE_FAILED');
  for (const [field, value] of [['tests', 11], ['pass', 11], ['fail', 0], ['skipped', 0], ['cancelled', 0], ['todo', 0]])
    assert.equal(new RegExp(`^# ${field} ${value}$`, 'm').test(output), true, 'AUTH_SUITE_INCOMPLETE');
});
