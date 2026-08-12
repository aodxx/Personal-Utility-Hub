import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { visualAssetIds } from '../src/components/asset-icon';
import { categoryVisuals } from '../src/data/visual-assets';
import { coreTools } from '../src/data/core-tools';

describe('3D visual asset system', () => {
  const sprite = readFileSync('public/icons/utility-3d-icons.svg', 'utf8');

  it('contains every declared asset exactly once', () => {
    for (const id of visualAssetIds) {
      expect(sprite.match(new RegExp(`<symbol id="${id}"`, 'g'))).toHaveLength(1);
    }
  });

  it('maps every category and Phase 2 tool to a declared asset', () => {
    const declared = new Set<string>(visualAssetIds);
    expect(Object.values(categoryVisuals).every((id) => declared.has(id))).toBe(true);
    expect(coreTools.every((tool) => tool.icon && declared.has(tool.icon))).toBe(true);
  });

  it('keeps the sprite self-hosted and free of executable content', () => {
    expect(sprite).not.toMatch(/<script|(?:href|src)=["']https?:\/\/|onload=|onclick=/i);
    expect(sprite).toContain('viewBox="0 0 128 128"');
  });
});
