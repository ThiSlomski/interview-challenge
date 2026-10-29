const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// Deliberately supports this project's command hooks, not every native event/handler.
// Native timeout unit is seconds; this project's lightweight policy caps it at 10s.
export function validateHooks(config) {
  const errors = [];
  if (!object(config) || !object(config.hooks)) return ['hooks: expected object'];
  if (config.description !== undefined && typeof config.description !== 'string') errors.push('hooks.description: expected string');
  for (const event of ['SessionStart', 'Stop']) {
    const groups = config.hooks[event];
    if (!Array.isArray(groups) || groups.length === 0) { errors.push(`hooks.${event}: expected nonempty groups`); continue; }
    for (const [index, group] of groups.entries()) {
      const location = `hooks.${event}[${index}]`;
      if (!object(group)) { errors.push(`${location}: expected object`); continue; }
      if (group.matcher !== undefined && typeof group.matcher !== 'string') errors.push(`${location}.matcher: expected string`);
      if (!Array.isArray(group.hooks) || group.hooks.length === 0) { errors.push(`${location}.hooks: expected nonempty handlers`); continue; }
      for (const [i, hook] of group.hooks.entries()) {
        const path = `${location}.hooks[${i}]`;
        if (!object(hook)) { errors.push(`${path}: expected object`); continue; }
        if (hook.type !== 'command') errors.push(`${path}.type: only command supported by this Harness`);
        if (!nonempty(hook.command)) errors.push(`${path}.command: expected nonempty string`);
        if (hook.commandWindows !== undefined && !nonempty(hook.commandWindows)) errors.push(`${path}.commandWindows: expected nonempty string`);
        if (typeof hook.timeout !== 'number' || !Number.isFinite(hook.timeout) || hook.timeout <= 0 || hook.timeout > 10) errors.push(`${path}.timeout: explicit finite seconds in (0, 10] required`);
        for (const field of ['async']) if (hook[field] !== undefined && typeof hook[field] !== 'boolean') errors.push(`${path}.${field}: expected boolean`);
        if (hook.statusMessage !== undefined && typeof hook.statusMessage !== 'string') errors.push(`${path}.statusMessage: expected string`);
        if (hook.additionalContextLimit !== undefined && (!Number.isInteger(hook.additionalContextLimit) || hook.additionalContextLimit <= 0)) errors.push(`${path}.additionalContextLimit: expected positive integer`);
      }
    }
  }
  for (const event of Object.keys(config.hooks)) if (!['SessionStart', 'Stop'].includes(event)) errors.push(`hooks.${event}: event outside project policy`);
  return errors;
}
