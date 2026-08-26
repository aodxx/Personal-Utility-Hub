import { describe, expect, it } from 'vitest';
import { evaluateContrast, formatContrastRatio, parseColor, toHex } from '../src/core/color-contrast';
import { assertHashFile, compareDigest, hashText, MAX_HASH_TEXT_BYTES } from '../src/core/hash';
import { inspectJwt, MAX_JWT_CHARS } from '../src/core/jwt';
import { regexLiteral, replaceRegex, runRegex } from '../src/core/regex';

const sampleJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dGlsaXR5LWh1YiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoidmlld2VyIn0.demo-signature';

describe('P0 tool primitives', () => {
  it('decodes JWT structure without claiming signature verification', () => {
    const result = inspectJwt(sampleJwt, 1_700_000_000);
    expect(result.algorithm).toBe('HS256');
    expect(result.payload).toMatchObject({ sub: 'utility-hub', role: 'viewer' });
    expect(result.expiryStatus).toBe('valid');
    expect(result.warnings.some((warning) => warning.includes('ไม่ใช่การยืนยันลายเซ็น'))).toBe(true);
    expect(() => inspectJwt('not-a-jwt')).toThrow('3 ส่วน');
    expect(() => inspectJwt('__8.eyJmb28iOiJiYXIifQ.sig')).toThrow('Unable to decode JWT text');
    expect(() => inspectJwt(`${sampleJwt}${'x'.repeat(MAX_JWT_CHARS)}`)).toThrow('exceeds');
  });

  it('hashes UTF-8 text and compares normalized digests', async () => {
    const result = await hashText('hello', 'SHA-256');
    expect(result.value).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    expect(compareDigest(result.value, '2C:F2 4D BA 5F B0 A3 0E 26 E8 3B 2A C5 B9 E2 9E 1B 16 1E 5C 1F A7 42 5E 73 04 33 62 93 8B 98 24', 'SHA-256')).toBe('match');
    expect(compareDigest(result.value, 'not-hex', 'SHA-256')).toBe('invalid-expected');
    expect(compareDigest(result.value, 'aa', 'SHA-256')).toBe('invalid-expected');
    expect(compareDigest(result.value, 'a'.repeat(257), 'SHA-256')).toBe('invalid-expected');
    expect(() => assertHashFile({ size: 0 } as Blob)).toThrow('Empty files');
    expect(() => assertHashFile({ size: 40 * 1024 * 1024 + 1 } as Blob)).toThrow('40 MB');
    await expect(hashText('x'.repeat(MAX_HASH_TEXT_BYTES + 1), 'SHA-256')).rejects.toThrow('4 MB');
  });

  it('runs regex matches safely and previews replacements', () => {
    const result = runRegex(String.raw`(?<name>[A-Za-z]+)@(?<domain>[A-Za-z.]+)`, 'gi', 'Send A@EXAMPLE.COM and b@test.local');
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]?.namedGroups).toMatchObject({ name: 'A', domain: 'EXAMPLE.COM' });
    expect(replaceRegex('foo', 'g', 'foo foo', 'bar')).toBe('bar bar');
    expect(regexLiteral('a/b', 'gi')).toBe('/a\\/b/gi');
    expect(() => runRegex('[', 'g', 'text')).toThrow('Invalid pattern');
  });

  it('calculates WCAG contrast thresholds and color parsing', () => {
    const result = evaluateContrast('#000000', '#ffffff');
    expect(formatContrastRatio(result.ratio)).toBe('21.00:1');
    expect(result.normalAa).toBe(true);
    expect(result.normalAaa).toBe(true);
    expect(evaluateContrast('#777777', '#ffffff').normalAa).toBe(false);
    expect(evaluateContrast('#777777', '#ffffff').largeAa).toBe(true);
    expect(toHex(parseColor('rgb(31, 41, 59)'))).toBe('#1F293B');
    expect(() => evaluateContrast('#ffffff80', '#000000')).toThrow('สีทึบ');
  });
});
