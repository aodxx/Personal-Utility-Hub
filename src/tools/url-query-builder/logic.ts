export interface QueryEntry {
  key: string;
  value: string;
}

export interface ParsedUrl {
  base: string;
  entries: QueryEntry[];
  hash: string;
}

export function parseQueryEntries(value: string): QueryEntry[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf('=');
    return separator < 0
      ? { key: line, value: '' }
      : { key: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
  }).filter(({ key }) => key.length > 0);
}

export function formatQueryEntries(entries: readonly QueryEntry[]): string {
  return entries.map(({ key, value }) => `${key}=${value}`).join('\n');
}

export function parseUrl(value: string): ParsedUrl {
  const input = value.trim();
  if (!input) throw new Error('กรุณากรอก URL');
  const hashIndex = input.indexOf('#');
  const withoutHash = hashIndex >= 0 ? input.slice(0, hashIndex) : input;
  const hash = hashIndex >= 0 ? input.slice(hashIndex + 1) : '';
  const queryIndex = withoutHash.indexOf('?');
  const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';
  if (!base) throw new Error('URL ต้องมี path หรือ origin');
  const params = new URLSearchParams(query);
  const entries: QueryEntry[] = [];
  params.forEach((entryValue, key) => entries.push({ key, value: entryValue }));
  return { base, entries, hash };
}

export function buildUrl(base: string, entriesText: string, hash = ''): string {
  const cleanBase = base.trim();
  if (!cleanBase) throw new Error('กรุณากรอก base URL หรือ path');
  const params = new URLSearchParams();
  for (const { key, value } of parseQueryEntries(entriesText)) params.append(key, value);
  const query = params.toString();
  const cleanHash = hash.trim().replace(/^#/, '');
  return `${cleanBase}${query ? `?${query}` : ''}${cleanHash ? `#${cleanHash}` : ''}`;
}
