export type TextTransform = 'trim-lines' | 'collapse-spaces' | 'remove-blank-lines' | 'uppercase' | 'lowercase';

export function transformText(value: string, transform: TextTransform): string {
  switch (transform) {
    case 'trim-lines':
      return value.split(/\r?\n/).map((line) => line.trim()).join('\n').trim();
    case 'collapse-spaces':
      return value.split(/\r?\n/).map((line) => line.replace(/[\t ]+/g, ' ').trim()).join('\n').trim();
    case 'remove-blank-lines':
      return value.split(/\r?\n/).filter((line) => line.trim().length > 0).join('\n');
    case 'uppercase':
      return value.toLocaleUpperCase();
    case 'lowercase':
      return value.toLocaleLowerCase();
  }
}

export function countText(value: string): { characters: number; words: number; lines: number } {
  const trimmed = value.trim();
  return {
    characters: Array.from(value).length,
    words: trimmed ? trimmed.split(/\s+/u).length : 0,
    lines: value ? value.split(/\r?\n/).length : 0,
  };
}
