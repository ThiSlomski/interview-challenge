export const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function mayRead(actor, target) {
  if (!validId(actor?.id)) return false;
  if (actor.role === 'admin') return true;
  return actor.role === 'user' && validId(target) && actor.id.toLowerCase() === target.toLowerCase();
}
