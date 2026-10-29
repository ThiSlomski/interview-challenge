import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { doctor, validate, projectRoot } from './harness.mjs';

export function handle(input) {
  if (!input || typeof input !== 'object' || !['SessionStart', 'Stop'].includes(input.hook_event_name)
      || typeof input.cwd !== 'string' || realpathSync(input.cwd) !== realpathSync(projectRoot)) throw new Error('Invalid hook input or cwd; run manual check from repository root.');
  // Ignore transcript, tool arguments, model and session identifiers. Never log raw input.
  if (input.hook_event_name === 'Stop' && input.stop_hook_active === true) return { continue: true };
  const result = input.hook_event_name === 'SessionStart' ? doctor() : validate();
  if (input.hook_event_name === 'SessionStart') return {
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: `Harness diagnostic: ${result.ok ? 'OK' : 'FAILED'}. Read AGENTS.md and docs/harness/memory/handoff.md; run validate explicitly.` }
  };
  return { continue: true, systemMessage: `Harness lightweight validation: ${result.ok ? 'OK' : 'FAILED; run validate for details'}. Human review remains pending.` };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const input = readFileSync(0, 'utf8');
    if (Buffer.byteLength(input) > 65536) throw new Error('Hook input too large.');
    console.log(JSON.stringify(handle(JSON.parse(input))));
  } catch { console.error('Harness hook failed: invalid input or unavailable local check.'); process.exitCode = 1; }
}
