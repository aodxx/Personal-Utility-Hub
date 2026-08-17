# Phase 10.1 — SVG Asset Studio Recovery & Closure

## Scope and release policy

Phase 10.1 ปิดปัญหา curated SVG library โดยไม่เพิ่ม Tool ใหม่และไม่เปลี่ยน engine หลักเกินความจำเป็น งานนี้แก้ที่ asset source, manifest evidence, integrity gate, offline preparation และ production smoke เท่านั้น

สถานะของ SVG Asset Studio ยังคงเป็น **beta** ในรอบนี้เพื่อ soft launch อย่างรับผิดชอบ สถานะ beta ไม่ได้ใช้เพื่อซ่อน defect ที่ทราบแล้ว: library semantic audit, sanitizer, inspector, editor, optimizer, export, pack builder และ production workflows มีหลักฐานผ่านตามตารางด้านล่าง ส่วน beta policy สงวนไว้สำหรับการเก็บ real-world corpus และ downstream consumer feedback เพิ่มเติม

## Library before and after

| Evidence item | Before Phase 10.1 | After Phase 10.1 |
|---|---:|---:|
| SVG assets | 120 | 120 |
| Assets visually reviewed | 0 explicit review record | 120/120 |
| Assets replaced | 120 semantic redraws | 120 current semantic assets |
| Assets renamed | 0 | 0 |
| Exact duplicate groups | 8 groups / 120 files | 0 |
| Geometry duplicate groups | 8 groups / 120 files | 0 |
| Near-duplicate warnings | Not measured | 0 |
| Review records | Missing | `reviewed: true`, `reviewedAt: 2026-08-17` on all assets |
| Style metadata | Generated index-based styles could disagree with stroke-only SVG | 120 assets normalized to `outline` |
| Category metadata | 15 documented categories | 15 categories retained; no artificial redistribution |

The before numbers were calculated against final implementation commit `97dc341`. The old generator reused eight primitive shape families across the full catalog, which produced eight geometry groups containing all 120 files. The new generator gives each named concept a dedicated semantic path/shape composition. The post-change integrity checker reports zero exact duplicates, zero geometry duplicates and zero near-duplicate warnings

## Visual and semantic review

The complete review artifact is [`docs/svg-library-contact-sheet.png`](./svg-library-contact-sheet.png), with a reproducible HTML version at [`docs/svg-library-contact-sheet.html`](./svg-library-contact-sheet.html). The full row-level audit is [`docs/svg-library-visual-audit.md`](./svg-library-visual-audit.md). The contact sheet was rendered from repository SVG source in a consistent 24×24 viewBox, with title, ID, category, style and PASS state shown for every card

The audit explicitly checked the previously known failure examples. `camera.svg` now renders a camera body and lens, `archive.svg` renders an archive box with drawer detail, and `bell.svg` renders a bell silhouette with clapper line. The same review was applied to all 120 assets rather than treating those three examples as isolated fixes

## Integrity gate

`scripts/check-svg-library.mjs` now checks the following release conditions: minimum count, manifest parity, duplicate IDs and filenames, required metadata, missing/orphan files, broken `assetUrl`, viewBox parity, unsafe markup, missing/mismatched titles, semantic review records, style mismatch, exact canonical SVG duplicates, geometry duplicates and near-duplicate warnings. It writes machine-readable evidence to [`docs/svg-library-integrity-report.json`](./svg-library-integrity-report.json)

The negative fixture test in [`tests/svg-library-integrity.test.ts`](../tests/svg-library-integrity.test.ts) creates two temporary files with different names but identical geometry and proves that the checker fails. The bad fixture is never placed in `public/svg-assets/`

The GitHub Actions workflow now runs `npm run check:svg-library` after the unit suite and before build. A library integrity failure therefore fails CI rather than remaining a local-only check

## Offline and engine regression

SVG Asset Studio remains local-first. Its registry entry now exposes `prepareOffline`, derived directly from the 120 manifest `assetUrl` values. The tool contract test verifies 120 unique offline URLs. Uploaded SVGs remain local and receive the same sanitizer policy as before. The optimizer now preserves `<title>` accessibility metadata while still removing comments, metadata blocks and unnecessary IDs according to preset

| Engine area | Result |
|---|---|
| Sanitizer | PASS; script, event handlers, executable URLs, remote references and foreignObject policy preserved |
| Inspector | PASS |
| Editor/currentColor | PASS |
| Optimizer | PASS; title preserved |
| SVG export | PASS |
| PNG export | PASS |
| Copy formats | PASS |
| Pack Builder/sprite/CSS | PASS |
| LICENSES.txt and manifest | PASS |
| Uploaded SVG workflow | PASS |

## Local evidence before final deploy

| Gate | Result |
|---|---:|
| Full Vitest | 19 files, 83 tests passed |
| Targeted SVG and integrity tests | 12 tests passed |
| Full Playwright | 131 passed, 10 skipped, 141 total |
| SVG integrity | 120 assets; exact 0; geometry 0; near-duplicate warnings 0 |
| Production smoke harness on local preview | 54/54 passed across 360×740, 412×915 and 1280×900 |
| Typecheck | PASS on final local gate |
| Build and bundle | PASS on final local gate |
| Dependency audit | 0 vulnerabilities on final local gate |
| Service worker syntax | PASS on final local gate |
| Diff check | PASS on final local gate |

The production smoke now checks route, library count, semantic search for camera/bell/archive, title and geometry distinction, light/dark 16/24px preview, inspector, optimizer, SVG download validity and title, PNG export, ZIP contents, upload sanitization and horizontal overflow at all three required viewports

## Required final evidence

The final release report must be updated with the implementation HEAD SHA, CI run ID and conclusion, Pages deployment run ID and conclusion, and the live `node scripts/phase10-production-smoke.mjs` result from that same final HEAD. Until those three final-HEAD items are recorded, Phase 10.1 remains **NOT VERIFIED** rather than being declared closed
