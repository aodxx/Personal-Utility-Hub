# Phase 10: SVG Asset Studio — Evidence Report

## Executive summary

Phase 10 เพิ่ม **SVG Asset Studio** ให้กับ Personal-Utility-Hub ในรูปแบบ local-first และ client-side โดยไม่เพิ่ม backend, cloud upload หรือ runtime CDN dependency เครื่องมือประกอบด้วย curated SVG library ที่สร้างและเก็บใน repository, search/filter, sanitized preview, technical inspector, safe editor, optimizer, code-format copy, PNG/SVG export และ local ZIP pack builder

สถานะ release ของเครื่องมือคือ **beta** ไม่ใช่เพราะ static workflow ใช้งานไม่ได้ แต่เพราะ product contract ยังคงสงวนสถานะไว้จนกว่าจะมีหลักฐานการใช้งานจริงที่กว้างขึ้นและการทบทวน output ในงาน production มากขึ้น ส่วนที่มีสถานะ PASS แล้วคือ static library, sanitizer, inspector, editor, safe/balanced/aggressive optimization, SVG/PNG output, code snippets และ icon-pack ZIP

## Scope and contracts

| Area | Implemented contract | Status |
|---|---|---|
| Curated library | 120 self-created SVG assets under `public/svg-assets/`, searchable by title, keyword, category, style and license metadata | PASS |
| Metadata | Every manifest record includes source, author, license, license URL, source URL, attribution and commercial-use fields | PASS |
| Input | Local library asset or user-provided SVG up to 2 MB | PASS |
| Security | Parser validation, unsafe-tag removal, event-handler removal, unsafe href/src removal, no external runtime requests for processing | PASS |
| Inspector | viewBox, dimensions, path/group counts, fill/stroke, size, unsafe references, accessibility and technical score | PASS |
| Editor | color mode, currentColor conversion, stroke width, rotation, opacity, padding and safe preview | PASS |
| Optimizer | safe, balanced and aggressive presets with before/after byte counts | PASS |
| Export | SVG, PNG and HTML/Data URI/CSS background/CSS mask/JSX snippets | PASS |
| Pack builder | ZIP containing selected SVGs, `sprite.svg`, `icons.css`, `manifest.json` and `LICENSES.txt` | PASS |
| Local state | favorites, recent IDs and pack selections stored in localStorage only | PASS |
| Offline readiness | Library assets are static repository files and the tool has no backend dependency | PASS |
| Commercial redistribution | Exposed only through explicit metadata; users must review source/license evidence before redistribution | PASS with legal limitation |

## Library and licensing evidence

The library uses original assets generated for the repository. The governing policy is recorded in [`docs/svg-library-license-policy.md`](./svg-library-license-policy.md). The policy requires each asset to have a complete source record and causes the integrity check to fail when asset count, manifest count, metadata fields, duplicate names or unsafe markup do not satisfy the contract

The library integrity command is `npm run check:svg-library`. The final local run reported **120 assets**, approximately **38 KB raw SVG**, complete manifest parity and no unsafe markup in the curated files. The repository does not claim that this metadata is legal advice; it is an auditable record of the project’s own asset provenance

## Security and privacy model

Uploaded SVG text is parsed in the browser, checked against a 2 MB input guard, sanitized before preview, and never sent to a server. Sanitization removes script-like elements, `foreignObject`, event-handler attributes, unsafe `href`/`src` values, executable schemes and CSS URL references. The preview is populated only from the sanitized string. The ZIP builder is local and has file-count and output-size guard constants

> The tool does not promise that every possible SVG attack class is solved. It promises the documented sanitizer policy and refuses to present uploaded markup before that policy is applied.

Favorites, recent selections and pack IDs are stored in localStorage. No account, analytics call, remote conversion service or AI API is required for the workflow

## Test evidence

| Gate | Result |
|---|---:|
| SVG unit tests | 7/7 passed |
| Full Vitest suite after SVG integration | 18 files, 81 tests passed |
| SVG library integrity | 120/120 assets passed |
| Targeted SVG Playwright E2E | 6/6 passed across desktop-chromium, android-entry and android-current |
| Full Playwright E2E | 131 passed, 10 skipped, 141 total |
| Local production smoke | 20/20 passed across 360×740 and 1280×900 |
| Typecheck | PASS |
| Build and bundle check | PASS; SVG lazy chunk approximately 90 KB raw / 12.28 KB gzip in the measured build |
| Existing Phase 6–9 unit regressions | PASS through the full Vitest suite |
| Dependency audit | 0 vulnerabilities with `npm audit --omit=dev --audit-level=high` |

The local production smoke verified route load, all 120 cards, search, inspector, optimizer status, SVG download, PNG download, two-item icon-pack ZIP, uploaded malicious SVG sanitization and no horizontal overflow on both mobile-sized and desktop-sized viewports. The final full Playwright regression run completed with 131 passed and 10 skipped tests, and dependency audit reported zero vulnerabilities

## Known limitations and release policy

The technical score is a deterministic signal for the documented checks, not a guarantee of visual quality, accessibility compliance in every consuming application, or legal clearance. Aggressive optimization can remove IDs and fixed dimensions; users should inspect the preview and retain the original SVG. The current pack builder emits a valid stored ZIP and explicit license manifest, but it does not minify every possible SVG construct or guarantee compatibility with every downstream icon pipeline

The tool remains **beta** until a broader production corpus and downstream consumer checks are collected. This is a product-policy decision rather than a claim that the tested static workflow is broken

## Files added or changed

The implementation is centered in `src/tools/svg-asset-studio/logic.ts`, `src/tools/svg-asset-studio/index.ts`, `src/tools/svg-asset-studio/metadata.ts`, `src/data/svg-assets/manifest.ts`, and `public/svg-assets/`. Registry and guide integration are in `src/data/tools.ts` and `src/data/guides.ts`. Tests are in `tests/svg-asset-studio.test.ts` and `tests/e2e/svg-asset-studio.spec.ts`. Reproducible checks are in `scripts/check-svg-library.mjs` and `scripts/phase10-production-smoke.mjs`

## Final recommendation

Keep SVG Asset Studio in beta for the first production release, but expose the static workflow to users because its contracts are explicit and its local smoke evidence is complete. The next reliability increment should focus on imported real-world SVG corpus coverage, not on adding more library icons before the sanitizer and pack outputs have been observed in downstream projects
