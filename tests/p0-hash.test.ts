import { describe, expect, it } from 'vitest';
import {
  assertHashFile,
  compareDigest,
  expectedDigestLength,
  hashBytes,
  hashFile,
  hashText,
  isHexDigest,
  MAX_EXPECTED_DIGEST_CHARS,
  MAX_HASH_FILE_BYTES,
  MAX_HASH_TEXT_BYTES,
  normalizeDigest,
} from '../src/core/hash';

describe('Hash & Checksum Verifier core', () => {
  it('calculates deterministic SHA-256 and SHA-512 known vectors', async () => {
    await expect(hashText('hello', 'SHA-256')).resolves.toEqual({
      algorithm: 'SHA-256',
      value: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      byteLength: 5,
    });
    await expect(hashText('hello', 'SHA-512')).resolves.toEqual({
      algorithm: 'SHA-512',
      value: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
      byteLength: 5,
    });
  });

  it('hashes binary input and reports its byte length', async () => {
    const bytes = new Uint8Array([0, 1, 2, 255]);
    await expect(hashBytes(bytes, 'SHA-256')).resolves.toBe('3d1f57c984978ef98a18378c8166c1cb8ede02c03eeb6aee7e2f121dfeee3e56');

    const file = { size: 5, arrayBuffer: async () => new TextEncoder().encode('hello') } as unknown as Blob;
    const fileResult = await hashFile(file, 'SHA-256');
    expect(fileResult).toMatchObject({
      algorithm: 'SHA-256',
      value: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      byteLength: 5,
    });
  });

  it('normalizes formatted digests and reports match, mismatch and invalid states', () => {
    const actual = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
    expect(normalizeDigest(' 2C:F2 4D ')).toBe('2cf24d');
    expect(isHexDigest(actual)).toBe(true);
    expect(isHexDigest('aa')).toBe(true);
    expect(isHexDigest('a')).toBe(false);
    expect(isHexDigest('not-hex')).toBe(false);
    expect(isHexDigest('')).toBe(false);

    expect(compareDigest(actual, actual.toUpperCase(), 'SHA-256')).toBe('match');
    expect(compareDigest(actual, '2c:f2 4d ba 5f b0 a3 0e 26 e8 3b 2a c5 b9 e2 9e 1b 16 1e 5c 1f a7 42 5e 73 04 33 62 93 8b 98 24', 'SHA-256')).toBe('match');
    expect(compareDigest(actual, 'a'.repeat(64), 'SHA-256')).toBe('mismatch');
    expect(compareDigest(actual, '', 'SHA-256')).toBe('empty-expected');
    expect(compareDigest(actual, 'not-hex', 'SHA-256')).toBe('invalid-expected');
    expect(compareDigest(actual, 'aa', 'SHA-256')).toBe('invalid-expected');
    expect(compareDigest(actual, 'a'.repeat(MAX_EXPECTED_DIGEST_CHARS + 1), 'SHA-256')).toBe('invalid-expected');
    expect(expectedDigestLength('SHA-256')).toBe(64);
    expect(expectedDigestLength('SHA-512')).toBe(128);
  });

  it('rejects empty and oversized files before Web Crypto processing', () => {
    expect(() => assertHashFile(new Blob([]))).toThrow('Empty files');
    expect(() => assertHashFile({ size: MAX_HASH_FILE_BYTES + 1 } as Blob)).toThrow('40 MB');
  });

  it('rejects text over both character and UTF-8 byte limits', async () => {
    await expect(hashText('x'.repeat(MAX_HASH_TEXT_BYTES + 1), 'SHA-256')).rejects.toThrow('4 MB');
    const unicodeText = '😀'.repeat(Math.floor(MAX_HASH_TEXT_BYTES / 4) + 1);
    expect(unicodeText.length).toBeLessThanOrEqual(MAX_HASH_TEXT_BYTES);
    await expect(hashText(unicodeText, 'SHA-256')).rejects.toThrow('UTF-8');
  });
});
