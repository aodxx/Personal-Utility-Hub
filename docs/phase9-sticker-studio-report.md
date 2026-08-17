# Phase 9 — LINE Sticker Studio Reliability Report

**วันที่ตรวจสอบ:** 17 สิงหาคม 2026 (GMT+7)  
**Repository:** `aodxx/Personal-Utility-Hub`  
**สถานะ release:** Beta tool candidate; static workflow production-ready candidate, animated APNG export intentionally partial

## Executive summary

LINE Sticker Studio ถูกเพิ่มเป็นเครื่องมือ client-side แบบ local-first ในหมวด **รูปภาพ** และโหลดแบบ lazy route ที่ `#/tools/line-sticker-studio` เครื่องมือรองรับการนำเข้า PNG, JPEG และ WebP, การแยก sticker sheet ด้วย grid, การปรับเส้น grid, การลบพื้นหลังสีคีย์, การจัดวางอัตโนมัติ, การหมุน/พลิก/ซูม, stroke และ safe-margin overlay, technical inspector, bilingual Prompt Studio และการ export PNG/ZIP พร้อมรายงาน validation

เครื่องมือไม่อัปโหลดภาพ ไม่เรียก backend ไม่เรียก AI API และไม่ประกาศว่า technical validation เท่ากับการอนุมัติจาก LINE ข้อกำหนดที่ใช้ใน preset มาจากเอกสาร LINE Creators Market ทางการที่บันทึกไว้ใน [requirements research](./line-sticker-requirements-research.md) [1] [2] [3]

## Verified product contract

| Area | Verified behavior |
|---|---|
| Static input | PNG, JPEG, WebP; single sheet, multiple images, or one image |
| Static set | Grid split, adjustable boundaries, cleanup, Auto Fit, rotate, flip, zoom, stroke, safe margin, inspector |
| Animated input | Up to 20 local frames; frame rail, playback, loop/timing/size/transparency validation |
| Static output | Individual PNG, current PNG download, ZIP, `main.png`, `tab.png`, `validation-report.json`, JSON/TXT summary |
| Animated output | Frame preparation and validation only; APNG export remains **PARTIAL** |
| Privacy | Browser-only processing; no upload, backend, account, CDN runtime dependency, or AI call |
| Failure policy | Decode/size/format/validation failures report actionable status; no false “LINE approved” claim |

The ZIP naming convention is an application output contract rather than an assertion that LINE requires those exact internal names. Main image and chat thumbnail dimensions are generated from centralized presets. The central definitions live in `src/data/line-sticker-presets.ts`, so future guideline changes can be reviewed and updated from one place.

## Implementation evidence

The registry entry is lazy-loaded and uses the existing offline preparation contract. The module exports the repository-standard `ToolModule` shape and cleans canvas, source image, timers, and panel state on unmount. Image operations remain in the browser and the hand-built ZIP writer stores uncompressed local files with the expected ZIP signature.

Static grid splitting now uses a retained source canvas, so changing rows and columns and selecting **Apply grid** actually regenerates the sticker cells rather than changing only the visual overlay. Review refreshes the complete set, and **Fix next issue** focuses the first sticker that is not PASS. Prompt Studio produces Thai and English copyable text and does not make a network request.

## Test evidence

| Gate | Result |
|---|---:|
| Sticker Studio unit tests | **5/5 passed** |
| Full Vitest suite | **17 files / 74 tests passed** |
| Sticker Studio Playwright, desktop | **2/2 passed** |
| Sticker Studio Playwright, Android profiles | **4/4 passed** |
| Smoke E2E, desktop and Android profiles | **29 passed / 4 skipped** |
| Full Playwright suite | **125 passed / 10 skipped** across 135 tests |
| Typecheck | Passed |
| Build | Passed |
| Bundle check | Passed; entry gzip 36.4 KB, all JavaScript 993.9 KB across 39 chunks |
| Dependency audit | **0 high-or-worse vulnerabilities** |
| Production smoke, GitHub Pages | **14/14 passed** on 360×740 and 1280×900; static PNG/ZIP/TXT, animated partial workflow, and no horizontal overflow |
| Final deployment | CI and Pages deployment **success** for follow-up commit `ae3144d` |

The full E2E suite continues to cover existing audio workflows, including the Phase 8 real-media decoder corpus. The new fixture corpus under `tests/fixtures/line-sticker/` consists of generated geometric PNGs with no external copyrighted assets.

## Official guideline alignment

The presets are technical checks derived from LINE’s official static and animated sticker documentation. Static presets cover official set counts of 8, 16, 24, 32, and 40; the main image preset is 240 × 240; the chat thumbnail preset is 96 × 74; and the sticker canvas preset is 370 × 320. Animated presets cover 8, 16, and 24 frames, 320 × 270 maximum canvas, 1–4 loops, and a combined playback limit of four seconds. These checks are reported as technical guidance only. They do not evaluate content suitability, variety, advertising, personal-data requests, or other human-review criteria [1] [2] [3]

> “Technical validation cannot determine whether content passes human review.” — Product policy derived from LINE’s separate review guidelines [3]

## Known limitations and honest claims

Animated mode is deliberately labelled as frame preparation and validation. The current release does not include a verified client-side APNG encoder, APNG round-trip decoder test, or APNG download contract; therefore the UI and guide do not advertise APNG export as ready. Static ZIP export verifies PNG encoding and writes the report, but the report is technical and does not guarantee acceptance by LINE.

The current tool status remains **beta** until a later release adds verified APNG round-trip support and broader content-review guidance. The final published commit has already passed the production smoke; beta is an intentional conservative policy rather than a reliability failure in the static workflow.

## Release decision

Phase 9 implementation is deployed and verified on GitHub Pages as a **beta** feature. The static local workflow has passed unit, desktop, Android, output-integrity, registry, build, bundle, and dependency gates. Phase 7.1 and Phase 8 regression coverage remains green. The final production smoke passed **14/14 checks** after the mobile overflow fix. APNG remains clearly labelled partial, and no AI, cloud, lossless, or LINE-approval claim is made.

## References

[1]: https://creator.line.me/en/guideline/sticker/ "LINE Creators Market — Creation Guidelines for Stickers"

[2]: https://creator.line.me/en/guideline/animationsticker/ "LINE Creators Market — Creation Guidelines for Animated Stickers"

[3]: https://creator.line.me/en/review_guideline/ "LINE Creators Market — Review Guidelines"
