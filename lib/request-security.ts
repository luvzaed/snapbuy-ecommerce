const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function rejectCrossSiteMutation(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return false;
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = request.headers.get('origin');
  if (!origin) return false; // CLI and internal service requests have no browser Origin.
  try {
    const expected = new URL(process.env.APP_ORIGIN || request.url);
    const host = request.headers.get('host');
    if (!process.env.APP_ORIGIN && host && LOOPBACK_HOSTS.has(expected.hostname)) {
      // Next.js may normalize the proxy URL to localhost even when the browser
      // connects to 127.0.0.1. Honor the actual Host only for the local server.
      // Forwarded headers, remote hosts and different ports cannot broaden it.
      if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/i.test(host)) return true;
      const localOrigin = new URL(`${expected.protocol}//${host}`);
      if (localOrigin.port !== expected.port) return true;
      return new URL(origin).origin !== localOrigin.origin;
    }
    return new URL(origin).origin !== expected.origin;
  } catch { return true; }
}
