import { parse } from 'dotenv';

// Add generated defaults without discarding the owner's custom configuration.
export function prepareLocalEnv(existing, defaults) {
  const values = parse(existing);
  if (Object.hasOwn(values, 'DATABASE_URL') && values.DATABASE_URL !== defaults.DATABASE_URL) {
    throw new Error('The existing .env does not match this local database. Refusing to overwrite it.');
  }
  const missing = Object.entries(defaults)
    .filter(([key]) => !Object.hasOwn(values, key))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`);
  return existing + (existing && !existing.endsWith('\n') ? '\n' : '') +
    (missing.length ? missing.join('\n') + '\n' : '');
}
