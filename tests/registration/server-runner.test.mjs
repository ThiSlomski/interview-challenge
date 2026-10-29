import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

// React's server-only export requires the react-server resolution condition.
// Keep the top-level Node command compatible with the existing Harness adapter.
test('server registration suite under react-server condition (8 controlled cases)', async () => {
  const child=spawn(process.execPath,['--conditions=react-server','--test','--test-reporter=tap',resolve('tests/registration/server.test.mjs')],{
    windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:20000,
    env: { ...process.env, NODE_TEST_CONTEXT: undefined },
  });
  let output='',bytes=0;
  for(const stream of [child.stdout,child.stderr]) stream.on('data',chunk=>{
    bytes+=chunk.length; if(bytes>512*1024) child.kill(); else output+=chunk.toString();
  });
  const [code,signal]=await once(child,'exit');
  assert.equal(signal,null,'SERVER_SUITE_TERMINATED');
  assert.equal(code,0,'SERVER_SUITE_FAILED');
  for(const [field,value] of [['tests',8],['pass',8],['fail',0],['skipped',0],['cancelled',0],['todo',0]]) {
    assert.equal(new RegExp(`^# ${field} ${value}$`,'m').test(output),true,'SERVER_SUITE_INCOMPLETE');
  }
});
