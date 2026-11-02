import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'products');
const MAX_BYTES = 5 * 1024 * 1024;
export class ImageValidationError extends Error {}

export function validateImageReference(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) throw new ImageValidationError('Invalid image reference');
  if (/^\/images\/products\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(value)) return value;
  try {
    const url = new URL(value);
    const hosts = (process.env.ALLOWED_IMAGE_HOSTS || 'images.unsplash.com,images.pexels.com,cdn.dsmcdn.com').split(',').map(host => host.trim().toLowerCase());
    if (url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && hosts.includes(url.hostname.toLowerCase())) return url.href;
  } catch { /* Report only a generic validation error, never an entered URL. */ }
  throw new ImageValidationError('Use an uploaded image or an approved HTTPS image host');
}

export async function saveUploadedImage(file: File): Promise<string> {
  if (!file.size || file.size > MAX_BYTES) throw new ImageValidationError('Images must be at most 5 MB');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) throw new ImageValidationError('Images must be at most 5 MB');
  let image: Buffer;
  try {
    const decoder = sharp(buffer, { limitInputPixels: 20_000_000, failOn: 'error' });
    const metadata = await decoder.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error();
    // Decoding and re-encoding removes SVG/script payloads, filenames and EXIF metadata.
    image = await decoder.rotate().jpeg({ quality: 90 }).toBuffer();
  } catch { throw new ImageValidationError('Upload a valid JPEG, PNG or WebP image'); }
  await mkdir(IMAGE_DIR, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(IMAGE_DIR, filename), image, { flag: 'wx' });
  return `/images/products/${filename}`;
}

export async function deleteLocalImage(value: string): Promise<void> {
  // Never let a stored URL or traversal path select an arbitrary file for deletion.
  if (!/^\/images\/products\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(value)) return;
  await unlink(path.join(IMAGE_DIR, path.basename(value))).catch(() => {});
}
