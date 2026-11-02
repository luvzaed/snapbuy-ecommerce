const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function rejectCrossSiteMutation(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return false;
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = request.headers.get('origin');
  if (!origin) return false; // CLI and internal service requests have no browser Origin.
  try {
    const expected = new URL(process.env.APP_ORIGIN || request.url).origin;
    return new URL(origin).origin !== expected;
  } catch { return true; }
}
