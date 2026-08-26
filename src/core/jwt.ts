export type JwtExpiryStatus = 'none' | 'valid' | 'expired' | 'invalid';

export interface JwtClaim {
  key: string;
  value: unknown;
  readable?: string;
}

export interface JwtInspection {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  segments: 3;
  algorithm: string;
  tokenType: string;
  expiryStatus: JwtExpiryStatus;
  expiresAt?: string;
  notBefore?: string;
  claims: JwtClaim[];
  warnings: string[];
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('JWT มี Base64URL ไม่ถูกต้อง / Invalid Base64URL segment');
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('ไม่สามารถถอดข้อความ JWT ได้ / Unable to decode JWT text');
  }
}

function parseJsonObject(segment: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(segment));
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT มี Base64URL')) throw error;
    throw new Error(`${label} ของ JWT ไม่ใช่ JSON ที่ถูกต้อง / Invalid JWT ${label} JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} ของ JWT ต้องเป็น JSON object / JWT ${label} must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

function readableTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });
}

export function formatJwtClaimValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function inspectJwt(token: string, nowSeconds = Math.floor(Date.now() / 1000)): JwtInspection {
  const trimmed = token.trim();
  if (!trimmed) throw new Error('กรุณาวาง JWT ก่อนตรวจสอบ / Paste a JWT to inspect');
  const segments = trimmed.split('.');
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    throw new Error('JWT ต้องมี 3 ส่วนคั่นด้วยจุด / JWT must contain 3 dot-separated segments');
  }

  const header = parseJsonObject(segments[0]!, 'Header');
  const payload = parseJsonObject(segments[1]!, 'Payload');
  const warnings: string[] = [];
  const algorithm = typeof header.alg === 'string' ? header.alg : 'ไม่ระบุ / Unknown';
  const tokenType = typeof header.typ === 'string' ? header.typ : 'ไม่ระบุ / Unknown';
  const exp = payload.exp;
  const nbf = payload.nbf;
  let expiryStatus: JwtExpiryStatus = 'none';
  let expiresAt: string | undefined;
  let notBefore: string | undefined;

  if (typeof exp === 'number' && Number.isFinite(exp)) {
    expiresAt = readableTimestamp(exp);
    expiryStatus = expiresAt ? (exp <= nowSeconds ? 'expired' : 'valid') : 'invalid';
  } else if (Object.prototype.hasOwnProperty.call(payload, 'exp')) {
    expiryStatus = 'invalid';
    warnings.push('ค่า exp ไม่ใช่ Unix timestamp ที่ถูกต้อง / exp is not a valid Unix timestamp');
  }

  if (typeof nbf === 'number' && Number.isFinite(nbf)) {
    notBefore = readableTimestamp(nbf);
    if (nbf > nowSeconds) warnings.push('Token ยังไม่ถึงเวลาใช้งานตาม nbf / Token is not active yet according to nbf');
  } else if (Object.prototype.hasOwnProperty.call(payload, 'nbf')) {
    warnings.push('ค่า nbf ไม่ใช่ Unix timestamp ที่ถูกต้อง / nbf is not a valid Unix timestamp');
  }

  if (algorithm.toLowerCase() === 'none') warnings.push('alg เป็น none: ห้ามถือว่า token นี้ผ่านการยืนยันลายเซ็น / alg is none; do not treat this token as signature-verified');
  warnings.push('การ decode ไม่ใช่การยืนยันลายเซ็น / Decoding is not signature verification');

  const claims = Object.entries(payload).map(([key, value]) => ({ key, value, readable: ['iat', 'nbf', 'exp'].includes(key) ? readableTimestamp(value) : undefined }));
  return {
    header,
    payload,
    signature: segments[2]!,
    segments: 3,
    algorithm,
    tokenType,
    expiryStatus,
    expiresAt,
    notBefore,
    claims,
    warnings,
  };
}
