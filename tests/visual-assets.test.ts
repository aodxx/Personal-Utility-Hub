import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { visualAssetIds } from '../src/components/asset-icon';
import { categoryVisuals } from '../src/data/visual-assets';
import { coreTools } from '../src/data/core-tools';
import { fileTools } from '../src/data/file-tools';
import { toolCatalog } from '../src/data/tools';

const declaredHasSymbol = (sprite: string, id: string): boolean => sprite.includes(`<symbol id="${id}"`);

const normalizedSymbolBodies = (sprite: string): Array<{ id: string; body: string }> => {
  const symbols: Array<{ id: string; body: string }> = [];
  const pattern = /<symbol\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sprite)) !== null) {
    const id = match[1];
    const body = match[2];
    if (!id || body === undefined) continue;

    symbols.push({
      id,
      body: body.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim(),
    });
  }

  return symbols;
};

describe('3D visual asset system', () => {
  const sprite = readFileSync('public/icons/utility-3d-icons.svg', 'utf8');

  it('contains every declared asset exactly once', () => {
    for (const id of visualAssetIds) {
      expect(sprite.match(new RegExp(`<symbol id="${id}"`, 'g'))).toHaveLength(1);
    }
  });

  it('maps every category, Phase 2 tool and Phase 3 tool to a declared asset', () => {
    const declared = new Set<string>(visualAssetIds);
    expect(Object.values(categoryVisuals).every((id) => declared.has(id))).toBe(true);
    expect(coreTools.every((tool) => tool.icon && declared.has(tool.icon))).toBe(true);
    expect(fileTools.every((tool) => tool.icon && declared.has(tool.icon))).toBe(true);
  });

  it('gives every catalog tool a unique declared icon', () => {
    const icons = toolCatalog.map((tool) => tool.icon).filter((icon): icon is string => Boolean(icon));
    expect(new Set(icons).size).toBe(toolCatalog.length);
    expect(icons.every((icon) => declaredHasSymbol(sprite, icon))).toBe(true);
  });

  it('keeps every visual asset illustration distinct', () => {
    const seen = new Map<string, string>();

    for (const { id, body } of normalizedSymbolBodies(sprite)) {
      expect(seen.get(body), `${id} duplicates ${seen.get(body) ?? 'another asset'}`).toBeUndefined();
      seen.set(body, id);
    }
  });

  it('keeps the sprite self-hosted and free of executable content', () => {
    expect(sprite).not.toMatch(/<script|(?:href|src)=["']https?:\/\/|onload=|onclick=/i);
    expect(sprite).toContain('viewBox="0 0 128 128"');
  });
});
