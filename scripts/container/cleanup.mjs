import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Refuse normal development projects; inspect exact ownership before destruction.
const project = process.env.COMPOSE_PROJECT_NAME;
assert.match(project ?? '', /^ic-smoke-[a-z0-9-]+$/);
function docker(...args) {
  const result = spawnSync('docker', args, { encoding: 'utf8', timeout: 120000 });
  assert.equal(result.status, 0, `Docker ${args[0]} failed (diagnostics withheld)`);
  return result.stdout.trim();
}
function inventory() {
  const label = `label=com.docker.compose.project=${project}`;
  return {
    containers: docker('ps', '-aq', '--filter', label).split('\n').filter(Boolean),
    volumes: docker('volume', 'ls', '-q', '--filter', label).split('\n').filter(Boolean),
    networks: docker('network', 'ls', '-q', '--filter', label).split('\n').filter(Boolean),
  };
}
const owned = inventory();
for (const [kind, names] of Object.entries(owned)) {
  for (const name of names) {
    const prefix = kind === 'containers' ? [] : [kind === 'volumes' ? 'volume' : 'network'];
    const [info] = JSON.parse(docker(...prefix, 'inspect', name));
    const labels = kind === 'containers' ? info.Config.Labels : info.Labels;
    assert.equal(labels['com.docker.compose.project'], project);
    if (kind !== 'containers') assert.ok(info.Name.startsWith(project + '_'));
  }
}
docker('compose', '-p', project, 'down', '-v', '--rmi', 'local');
const remaining = inventory();
assert.ok(Object.values(remaining).every(items => items.length === 0));
console.log(JSON.stringify({ project, removed: Object.fromEntries(Object.entries(owned).map(([k, v]) => [k, v.length])), remaining }));
