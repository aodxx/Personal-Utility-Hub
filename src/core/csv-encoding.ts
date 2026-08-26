export type CsvEncoding = 'utf-8' | 'windows-874' | 'windows-1252';

const ENCODINGS: readonly CsvEncoding[] = ['utf-8', 'windows-874', 'windows-1252'];

export function decodeCsvBytes(bytes: Uint8Array, encoding: CsvEncoding): string {
  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(bytes).replace(/^\uFEFF/, '');
}

function scoreText(text: string): number {
  const replacement = (text.match(/�/g) ?? []).length;
  const thai = (text.match(/[ก-๙]/g) ?? []).length;
  const controls = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) ?? []).length;
  const separators = (text.match(/[,;\t\n]/g) ?? []).length;
  return thai * 5 + separators * 0.2 - replacement * 12 - controls * 4;
}

export function detectCsvEncoding(bytes: Uint8Array): { encoding: CsvEncoding; text: string; scores: Record<CsvEncoding, number> } {
  const scores = Object.fromEntries(ENCODINGS.map((encoding) => {
    const text = decodeCsvBytes(bytes, encoding);
    return [encoding, scoreText(text)];
  })) as Record<CsvEncoding, number>;
  let encoding: CsvEncoding;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    encoding = 'utf-8';
  } catch {
    encoding = ENCODINGS.reduce<CsvEncoding>((best, current) => scores[current] > scores[best] ? current : best, 'windows-874');
  }
  return { encoding, text: decodeCsvBytes(bytes, encoding), scores };
}

export function encodeUtf8Bom(text: string): Blob {
  return new Blob([`\uFEFF${text}`], { type: 'text/csv;charset=utf-8' });
}

export function csvPreviewRows(text: string, maxRows = 8, maxColumns = 8): string[][] {
  return text.split(/\r?\n/).filter((line) => line.length > 0).slice(0, maxRows).map((line) => line.split(/[;,\t]/).slice(0, maxColumns));
}
