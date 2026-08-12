function bytesToBinary(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return binary;
}

export function encodeBase64(value: string): string {
  if (!value) throw new Error('กรุณากรอกข้อความที่ต้องการเข้ารหัส');
  return btoa(bytesToBinary(new TextEncoder().encode(value)));
}

export function decodeBase64(value: string): string {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) throw new Error('กรุณากรอก Base64 ที่ต้องการถอดรหัส');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 !== 0) {
    throw new Error('ข้อมูล Base64 ไม่ถูกต้อง');
  }
  try {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('ข้อมูล Base64 ไม่ถูกต้องหรือไม่ใช่ข้อความ UTF-8');
  }
}
