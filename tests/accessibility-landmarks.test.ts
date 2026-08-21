import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tool landmark accessibility', () => {
  it('does not create nested main landmarks inside Community Mapping or SVG Asset Studio', () => {
    for (const path of ['src/tools/community-mapping/index.ts', 'src/tools/svg-asset-studio/index.ts']) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/<main\b|<\/main>/);
    }
  });
});
