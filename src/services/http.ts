// Thin HTTP client for the TravelMateVR API gateway. Auth uses an httpOnly session cookie
// issued by the backend, so no tokens are stored in or readable from browser JavaScript.

export type AppErrorCode = 'offline' | 'not_found' | 'unauthorized' | 'forbidden' | 'rate_limited' | 'server' | 'validation' | 'unknown';

export class AppError extends Error {
  constructor(public code: AppErrorCode, public status?: number, public details?: unknown) {
    super(code);
    this.name = 'AppError';
  }
}

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function http<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AppError('offline');
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      credentials: 'include',
      ...rest,
      headers: { Accept: 'application/json', ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body
    });
  } catch {
    throw new AppError('offline');
  }
  if (!res.ok) {
    const code: AppErrorCode =
      res.status === 404 ? 'not_found' : res.status === 401 ? 'unauthorized' : res.status === 403 ? 'forbidden'
        : res.status === 429 ? 'rate_limited' : res.status === 422 || res.status === 400 ? 'validation'
          : res.status >= 500 ? 'server' : 'unknown';
    throw new AppError(code, res.status, await res.json().catch(() => undefined));
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const DATA_SOURCE: 'mock' | 'http' = import.meta.env.VITE_DATA_SOURCE === 'http' && BASE ? 'http' : 'mock';

/** Simulated network latency for the demo data layer, so loading states are exercised. */
export function demoLatency(min = 180, max = 520): Promise<void> {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}
