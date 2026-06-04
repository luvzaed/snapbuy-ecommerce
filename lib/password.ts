import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// True if the stored value looks like a bcrypt hash ($2a$ / $2b$ / $2y$).
export function isHashed(value: string | null | undefined): boolean {
  return !!value && /^\$2[aby]\$/.test(value);
}

// Hash a plaintext password for storage.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// Verify a plaintext password against a stored value.
// Accepts bcrypt hashes, and falls back to a direct compare for legacy
// plaintext accounts that haven't been migrated yet.
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  if (isHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  // Legacy plaintext fallback (pre-hashing accounts).
  return plain === stored;
}
