export function parseJson(source: string): unknown {
  if (!source.trim()) throw new Error('กรุณาวาง JSON ที่ต้องการตรวจสอบ');
  try {
    return JSON.parse(source) as unknown;
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : 'รูปแบบไม่ถูกต้อง';
    throw new Error(`JSON ไม่ถูกต้อง: ${detail}`);
  }
}

export function formatJson(source: string, spaces: 2 | 4 = 2): string {
  return JSON.stringify(parseJson(source), null, spaces);
}

export function minifyJson(source: string): string {
  return JSON.stringify(parseJson(source));
}
