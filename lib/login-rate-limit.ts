/**
 * Basic per-email and per-IP failed-login throttling for a single Node process.
 * For multi-instance deployments, replace this store with Redis or an edge WAF.
 */
const failures = new Map<string, { count: number; expiresAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_EMAIL = 5;
const MAX_IP = 30;

function count(key: string): number {
  const entry = failures.get(key);
  if (!entry) return 0;
  if (entry.expiresAt <= Date.now()) {
    failures.delete(key);
    return 0;
  }
  return entry.count;
}

function record(key: string): void {
  const current = failures.get(key);
  const now = Date.now();
  if (!current || current.expiresAt <= now) {
    failures.set(key, { count: 1, expiresAt: now + WINDOW_MS });
  } else {
    current.count++;
  }
  if (failures.size > 20000) {
    for (const [k, v] of failures) {
      if (v.expiresAt <= now) failures.delete(k);
    }
  }
}

export function isLoginBlocked(email: string, ip: string): boolean {
  return count('email:' + email) >= MAX_EMAIL || count('ip:' + ip) >= MAX_IP;
}

export function recordFailedLogin(email: string, ip: string): void {
  record('email:' + email);
  record('ip:' + ip);
}

export function clearFailedLogins(email: string, _ip: string): void {
  failures.delete('email:' + email);
}
