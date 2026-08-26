import { describe, expect, it } from 'vitest';
import { formatJwtClaimValue, inspectJwt, MAX_JWT_CHARS } from '../src/core/jwt';

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function makeJwt(header: Record<string, unknown>, payload: Record<string, unknown>, signature = 'demo-signature'): string {
  return [header, payload].map((part) => encodeBase64Url(JSON.stringify(part))).concat(signature).join('.');
}

describe('JWT Inspector core', () => {
  const now = 1_700_000_000;

  it('decodes header, payload, signature metadata and readable claims', () => {
    const token = makeJwt(
      { alg: 'HS256', typ: 'JWT', kid: 'demo-key' },
      { sub: 'utility-hub', role: 'viewer', iat: 1_600_000_000, exp: 1_800_000_000 },
    );

    const result = inspectJwt(`  ${token}  `, now);

    expect(result).toMatchObject({
      algorithm: 'HS256',
      tokenType: 'JWT',
      signature: 'demo-signature',
      segments: 3,
      expiryStatus: 'valid',
      payload: { sub: 'utility-hub', role: 'viewer' },
    });
    expect(result.expiresAt).toEqual(expect.any(String));
    expect(result.claims).toEqual(expect.arrayContaining([
      { key: 'sub', value: 'utility-hub', readable: undefined },
      expect.objectContaining({ key: 'exp', value: 1_800_000_000, readable: expect.any(String) }),
    ]));
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('ไม่ใช่การยืนยันลายเซ็น'),
    ]));
  });

  it('reports expiry, not-before and alg=none security semantics', () => {
    const expired = inspectJwt(makeJwt({ alg: 'none' }, { exp: 1_600_000_000, nbf: 1_800_000_000 }), now);
    expect(expired.expiryStatus).toBe('expired');
    expect(expired.expiresAt).toEqual(expect.any(String));
    expect(expired.notBefore).toEqual(expect.any(String));
    expect(expired.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('alg เป็น none'),
      expect.stringContaining('ยังไม่ถึงเวลาใช้งาน'),
    ]));

    const withoutExpiry = inspectJwt(makeJwt({ alg: 'RS256' }, { sub: 'no-exp' }), now);
    expect(withoutExpiry.expiryStatus).toBe('none');
    expect(withoutExpiry.expiresAt).toBeUndefined();

    const invalidClaims = inspectJwt(makeJwt({ alg: 'RS256' }, { exp: 'soon', nbf: null }), now);
    expect(invalidClaims.expiryStatus).toBe('invalid');
    expect(invalidClaims.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('exp ไม่ใช่ Unix timestamp'),
      expect.stringContaining('nbf ไม่ใช่ Unix timestamp'),
    ]));
  });

  it('rejects empty, malformed and oversized tokens with actionable errors', () => {
    expect(() => inspectJwt('')).toThrow('กรุณาวาง JWT');
    expect(() => inspectJwt('one.two')).toThrow('3 ส่วน');
    expect(() => inspectJwt('one..three')).toThrow('3 ส่วน');
    expect(() => inspectJwt('%%% .%%% .sig')).toThrow(/Base64URL|JSON/);
    expect(() => inspectJwt(`${makeJwt({ alg: 'HS256' }, { ok: true })}${'x'.repeat(MAX_JWT_CHARS)}`)).toThrow('exceeds');
  });

  it('requires header and payload segments to decode as JSON objects', () => {
    const arraySegment = encodeBase64Url(JSON.stringify(['not', 'an', 'object']));
    const objectSegment = encodeBase64Url(JSON.stringify({ alg: 'HS256' }));

    expect(() => inspectJwt(`${arraySegment}.${objectSegment}.sig`)).toThrow('Header ของ JWT ต้องเป็น JSON object');
    expect(() => inspectJwt(`${objectSegment}.${encodeBase64Url('not-json')}.sig`)).toThrow('Payload ของ JWT ไม่ใช่ JSON');
  });

  it('rejects invalid UTF-8 instead of silently replacing malformed bytes', () => {
    const malformedUtf8 = Buffer.from([0xc3, 0x28]).toString('base64url');
    const validPayload = encodeBase64Url(JSON.stringify({ ok: true }));

    expect(() => inspectJwt(`${malformedUtf8}.${validPayload}.sig`)).toThrow('Unable to decode JWT text');
  });

  it('formats claim values without losing primitive or structured meaning', () => {
    expect(formatJwtClaimValue('text')).toBe('text');
    expect(formatJwtClaimValue(null)).toBe('null');
    expect(formatJwtClaimValue(undefined)).toBe('undefined');
    expect(formatJwtClaimValue(false)).toBe('false');
    expect(formatJwtClaimValue({ nested: [1, 2] })).toBe('{"nested":[1,2]}');
  });
});
