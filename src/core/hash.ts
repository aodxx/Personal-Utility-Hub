export const HASH_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512'] as const;
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

export function compareDigest(actual: string, expected: string): 'match' | 'mismatch' | 'invalid-expected' | 'empty-expected' {
  const normalizedExpected = normalizeDigest(expected);
  if (!normalizedExpected) return 'empty-expected';
  if (!isHexDigest(normalizedExpected)) return 'invalid-expected';
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
  const bytes = new TextEncoder().encode(text);
  return { algorithm, value: await hashBytes(bytes, algorithm), byteLength: bytes.byteLength };
}

export async function hashFile(file: Blob, algorithm: HashAlgorithm): Promise<HashResult> {
  const bytes = await file.arrayBuffer();
  return { algorithm, value: await hashBytes(bytes, algorithm), byteLength: bytes.byteLength };
}
