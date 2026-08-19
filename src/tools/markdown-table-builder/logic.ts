export type TableData = { headers: string[]; rows: string[][] };

function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!;
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; } else quoted = !quoted;
    } else if (character === delimiter && !quoted) { cells.push(current.trim()); current = ''; } else current += character;
  }
  cells.push(current.trim());
  return cells;
}

export function parseTable(input: string, delimiter = ','): TableData {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error('กรุณาใส่ข้อมูลตาราง / Enter table data');
  const rows = lines.map((line) => splitLine(line, delimiter));
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array.from({ length: width - row.length }, () => '')]);
  return { headers: normalized[0]!, rows: normalized.slice(1) };
}

function escapeCell(value: string): string { return value.replaceAll('|', '\\|').replace(/\r?\n/g, ' '); }

export function buildMarkdownTable(data: TableData): string {
  const widths = data.headers.map((header, index) => Math.max(3, header.length, ...data.rows.map((row) => row[index]?.length ?? 0)));
  const line = (cells: string[]): string => `| ${cells.map((cell, index) => escapeCell(cell).padEnd(widths[index]!)).join(' | ')} |`;
  return [line(data.headers), line(widths.map((width) => '-'.repeat(width))), ...data.rows.map(line)].join('\n');
}

export function buildTable(input: string, delimiter = ','): string { return buildMarkdownTable(parseTable(input, delimiter)); }
