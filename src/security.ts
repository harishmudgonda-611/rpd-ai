import { createHash } from 'node:crypto';

const WINDOW_MS = 60_000;
const LIMIT = 60;
const MAX_BODY_BYTES = 1024 * 1024;
const hits = new Map<string, { count: number; reset: number }>();

export function clientKey(req: any): string {
  const forwarded = String(req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || String(req.socket?.remoteAddress ?? 'unknown');
}

export function rateLimit(req: any): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset <= now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= LIMIT;
}

export function requestId(): string {
  return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex').slice(0, 16);
}

export function requireAdmin(req: any): boolean {
  const configured = process.env.RPD_ADMIN_TOKEN;
  if (!configured) return process.env.NODE_ENV !== 'production';
  const auth = String(req.headers?.authorization ?? '');
  return auth === `Bearer ${configured}`;
}

export async function readBody(req: any, maxBytes = MAX_BODY_BYTES): Promise<string> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw new Error('REQUEST_TOO_LARGE');
  }
  return raw;
}
