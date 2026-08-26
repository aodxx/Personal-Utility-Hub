export const HASH_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512'] as const;
export const MAX_HASH_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_EXPECTED_DIGEST_CHARS = 256;
export const MAX_HASH_TEXT_BYTES = 4 * 1024 * 1024;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export interface HashResult {
  algorithm: HashAlgorithm;
  value: string;
  byteLength: number;
}

export function normalizeDigest(value: string): string {
  return value.replace(/[\s:]/g, '').toLowerCase();
}

export function isHexDigest(value: string): boolean {
  const normalized = normalizeDigest(value);
  return normalized.length > 0 && normalized.length % 2 === 0 && /^[0-9a-f]+$/.test(normalized);
}

export function expectedDigestLength(algorithm: HashAlgorithm): number {
  return algorithm === 'SHA-256' ? 64 : 128;
}

export function compareDigest(actual: string, expected: string, algorithm: HashAlgorithm): 'match' | 'mismatch' | 'invalid-expected' | 'empty-expected' {
  if (expected.length > MAX_EXPECTED_DIGEST_CHARS) return 'invalid-expected';
  const normalizedExpected = normalizeDigest(expected);
  if (!normalizedExpected) return 'empty-expected';
  if (!isHexDigest(normalizedExpected) || normalizedExpected.length !== expectedDigestLength(algorithm)) return 'invalid-expected';
  return normalizeDigest(actual) === normalizedExpected ? 'match' : 'mismatch';
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashBytes(data: BufferSource, algorithm: HashAlgorithm): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto ไม่พร้อมใช้งาน / Web Crypto is unavailable');
  const digest = await globalThis.crypto.subtle.digest(algorithm, data);
  return bytesToHex(digest);
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<HashResult> {
  if (text.length > MAX_HASH_TEXT_BYTES) throw new Error('ข้อความยาวเกิน 4 MB / Text exceeds 4 MB');
  const bytes = new TextEncoder().encode(text);
  if (bytes.byteLength > MAX_HASH_TEXT_BYTES) throw new Error('ข้อความ UTF-8 ยาวเกิน 4 MB / UTF-8 text exceeds 4 MB');
  return { algorithm, value: await hashBytes(bytes, algorithm), byteLength: bytes.byteLength };
}

export function assertHashFile(file: Blob): void {
  if (file.size <= 0) throw new Error('ไม่รองรับไฟล์ว่างเปล่า / Empty files are not supported');
  if (file.size > MAX_HASH_FILE_BYTES) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 40 MB / File must be 40 MB or smaller');
}

export async function hashFile(file: Blob, algorithm: HashAlgorithm): Promise<HashResult> {
  assertHashFile(file);
  const bytes = await file.arrayBuffer();
  return { algorithm, value: await hashBytes(bytes, algorithm), byteLength: bytes.byteLength };
}
