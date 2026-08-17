import { describe, expect, it } from 'vitest';
import { svgAssetManifest } from '../src/data/svg-assets/manifest';
import { buildCssPack, buildLicensesTxt, buildManifestJson, buildSprite, convertToCurrentColor, createZip, inspectSvgMarkup, optimizeSvgMarkup, sanitizeSvgMarkup, svgToDataUri, cssMaskSnippet, jsxSnippet } from '../src/tools/svg-asset-studio/logic';

const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Home</title><path fill="none" stroke="#111" d="M4 12 12 4l8 8v8H4z"/></svg>';

describe('SVG Asset Studio logic', () => {
  it('keeps a complete curated manifest with unique source records', () => {
    expect(svgAssetManifest.length).toBeGreaterThanOrEqual(100);
    expect(new Set(svgAssetManifest.map((asset) => asset.id)).size).toBe(svgAssetManifest.length);
    for (const asset of svgAssetManifest) expect(asset.license && asset.sourceUrl && asset.licenseUrl && asset.author).toBeTruthy();
  });

  it('sanitizes malicious SVG fixtures before inspection', () => {
    const malicious = '<svg viewBox="0 0 24 24" onload="alert(1)"><script>alert(1)</script><foreignObject><iframe src="https://evil.example"></iframe></foreignObject><path onclick="go()" d="M0 0"/></svg>';
    const result = sanitizeSvgMarkup(malicious);
    expect(result.svg).not.toMatch(/script|foreignObject|iframe|onload|onclick|https:/i);
    expect(result.removed.length).toBeGreaterThan(0);
    expect(inspectSvgMarkup(result.svg).status).not.toBe('FAIL');
  });

  it('removes javascript and external references', () => {
    const javascriptUrl = sanitizeSvgMarkup('<svg viewBox="0 0 1 1"><image href="javascript:alert(1)" /></svg>').svg;
    const externalUrl = sanitizeSvgMarkup('<svg viewBox="0 0 1 1"><image href="https://evil.example/a.svg" /></svg>').svg;
    expect(javascriptUrl).not.toMatch(/javascript:/i);
    expect(externalUrl).not.toMatch(/https:\/\/evil/i);
  });

  it('reports inspector metrics and PASS/WARNING/FAIL states', () => {
    const result = inspectSvgMarkup(validSvg);
    expect(result.viewBox).toBe('0 0 24 24');
    expect(result.pathCount).toBe(1);
    expect(result.hasFixedDimensions).toBe(true);
    expect(result.status).toBe('WARNING');
    expect(inspectSvgMarkup('<not-svg />').status).toBe('FAIL');
  });

  it('converts only monochrome SVGs to currentColor', () => {
    expect(convertToCurrentColor(validSvg, 'stroke').converted).toBe(true);
    expect(convertToCurrentColor(validSvg, 'stroke').svg).toContain('currentColor');
    const multicolor = '<svg viewBox="0 0 1 1"><path fill="#111" d="M0 0"/><path fill="#222" d="M0 0"/></svg>';
    expect(convertToCurrentColor(multicolor).converted).toBe(false);
  });

  it('optimizes safely and produces deterministic code formats', () => {
    const result = optimizeSvgMarkup(`${validSvg}<!-- comment -->`, 'safe');
    expect(result.svg).toMatch(/^<svg/);
    expect(result.svg).not.toContain('comment');
    expect(result.afterBytes).toBeLessThanOrEqual(result.beforeBytes);
    expect(svgToDataUri(result.svg)).toMatch(/^data:image\/svg\+xml/);
    expect(cssMaskSnippet(result.svg, '.icon-home')).toContain('currentColor');
    expect(jsxSnippet(result.svg)).not.toContain('stroke-width=');
  });

  it('builds sprite, css, manifest, licenses and a ZIP signature', () => {
    const assets = svgAssetManifest.slice(0, 2);
    const sprite = buildSprite(assets.map((asset) => ({ id: asset.id, svg: validSvg, viewBox: asset.viewBox })));
    expect(sprite).toContain('<symbol id="icon-');
    expect(buildCssPack(assets)).toContain('.icon-');
    expect(buildManifestJson(assets)).toContain('license');
    expect(buildLicensesTxt(assets)).toContain('License: Original — Utility Hub');
    const blob = createZip([{ name: 'sprite.svg', bytes: new TextEncoder().encode(sprite) }]);
    return blob.arrayBuffer().then((buffer) => expect(new Uint8Array(buffer).slice(0, 4)).toEqual(new Uint8Array([0x50, 0x4b, 0x03, 0x04])));
  });
});
