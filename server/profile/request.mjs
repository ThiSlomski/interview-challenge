import 'server-only';

// Same wire limits as registration; no new per-field policy.
export const BODY_LIMIT = 16384;
export const BODY_TIMEOUT = 5000;
export function checkProfileOrigin(request, config) {
  const site = request.headers.get('sec-fetch-site');
  const mode = request.headers.get('sec-fetch-mode');
  const destination = request.headers.get('sec-fetch-dest');
  return request.headers.get('origin') === config.origin
    && (site === null || site === 'same-origin' || site === 'none')
    && (mode === null || mode === 'cors' || mode === 'same-origin')
    && (destination === null || destination === 'empty');
}

export async function readProfileJson(request) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')
      || (request.headers.get('content-encoding') ?? 'identity') !== 'identity') throw { status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) throw { status: 413, code: 'BODY_TOO_LARGE' };
  if (!request.body) throw { status: 400, code: 'INVALID_BODY' };
  const reader = request.body.getReader();
  let timer, total = 0;
  const chunks = [];
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject({ status: 408, code: 'BODY_TIMEOUT' }), BODY_TIMEOUT); });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) throw { status: 413, code: 'BODY_TOO_LARGE' };
      chunks.push(value);
    }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, total))); }
    catch { throw { status: 400, code: 'INVALID_JSON' }; }
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
