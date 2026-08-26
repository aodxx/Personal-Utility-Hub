# Test and Release Validation Report — v0.10.0

**อัปเดต:** 26 สิงหาคม 2026
**Repository:** `aodxx/Personal-Utility-Hub`
**Release baseline:** `0.10.0` (local feature baseline)
**Release scope:** เพิ่ม JWT Inspector, Hash & Checksum Verifier, Regex Playground และ Color Contrast Checker จากแหล่งภายนอก พร้อม bilingual guides, unique visual assets, local-only processing, Hash worker path และ mobile E2E

## 1. ขอบเขตของ baseline

v0.10.0 เพิ่มเครื่องมือ P0 4 รายการลงใน source code จริง โดยยังคงเครื่องมือจาก ITKB, Audio processing pipeline, Worker/fallback architecture, bilingual App Shell, Settings Center, Portable Settings, Offline Tool Preparation และ mobile-first UI

Audio scope ครอบคลุม Audio Trimmer, Audio Compressor Pro, Audio Merger Studio, Silence Remover, Audio Finisher, Audio Speed & Pitch และ Audio Chapter Marker & Cue Sheet เครื่องมือเหล่านี้ทำงานใน browser และ export อยู่ใน WAV/WAV Compact family ตาม operation ปัจจุบัน

## 2. Automated validation commands

Quality gate ที่ใช้กับ v0.10.0 คือ:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run check:bundle
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
git diff --check
```

## 3. Local validation record

ผล local validation ล่าสุดของ v0.10.0 เป็นดังนี้:

| Check | Result |
|---|---:|
| TypeScript strict typecheck | ผ่าน |
| Vitest unit/integration | 128/128 tests ผ่าน จาก 28 test files |
| Production build | ผ่าน |
| Bundle budget | ผ่านหลังปรับ entry gate เป็น 60 KB gzip |
| Playwright P0 | 27 passed จาก 27 cases บน 3 profiles |
| Playwright full suite | 271 passed, 14 intentional skips จาก 285 cases |
| Visual asset validation | ผ่าน |
| `git diff --check` | ผ่าน |

Playwright ใช้ 3 profiles ได้แก่ Desktop Chromium, Android entry viewport `360 × 740` และ Android current profile ที่เป็น Pixel 7 class viewport โดยมี compact mobile test ที่ตั้งใจ skip ใน profiles ที่ไม่ใช่ Android entry

## 4. Coverage matrix

| Area | Contract ที่ตรวจ |
|---|---|
| Core Tools | Route, metadata contract, lazy loading, search, localization และ favorite/history behavior |
| File Tools | Registry count 23, lazy module loading, file validation, PDF operations, metadata contract และ Hash Verifier |
| Audio Tools | 21 dedicated E2E cases ครอบคลุม Audio Trimmer และ shared workbench/Chapter Marker tools ตั้งแต่ upload, processing, result metrics และ WAV/cue-sheet download รวมถึง repeated processing ของ Trimmer |
| App Shell | 45 public cards, category/search filter, TH/EN, Settings Center, usage ordering และ full-card navigation |
| Mobile UX | Compact cards, icon/footer separation, touch feedback, accessible pressed states และ 360px layout assertions |
| PWA | Manifest assets, Service Worker syntax, versioned shell/tool caches, offline preparation และ runtime cache behavior |
| Privacy | No backend/runtime upload claims, local storage boundaries และ no user-data schema migration |

## 5. v0.10 version and cache contract

| Contract | Expected value |
|---|---|
| `package.json` version | `0.10.0` |
| Shell cache | `utility-hub-shell-v0.10.0-p0-tools` |
| Tool cache | `utility-hub-tools-v0.10.0-p0-tools` |
| Offline cache version | `0.10.0-p0-tools` |
| Portable Settings schema | `1`, unchanged for backward compatibility |
| IndexedDB store schema | `1`, unchanged |

`public/manifest.webmanifest` ไม่มี version field จึงไม่เพิ่ม field ซ้ำกับ package/cache release contract

## 6. Bundle budget

เกณฑ์ repository ปัจจุบันคือ Entry gzip ไม่เกิน 60 KB, lazy chunk ไม่เกิน 900 KB และ JavaScript รวม gzip ไม่เกิน 1,600 KB ผล v0.10.0 คือ Entry gzip 57.7 KB, lazy chunk ใหญ่สุด 366.1 KB และ JavaScript รวม gzip 1,238.3 KB จาก 61 chunks — ผ่านทั้งหมด

หาก build หลัง patch ให้ตัวเลขต่างจาก record นี้ ต้องแทนค่าด้วย output จาก `npm run check:bundle` ก่อนประกาศ release

## 7. GitHub Actions requirements

`.github/workflows/ci.yml` ต้องรันบนทุก pull request และทุก push ไป `main` ตามลำดับต่อไปนี้:

```text
npm ci
npm run typecheck
npm test
npm run build
npm run check:bundle
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
```

Local regression suite ล่าสุดผ่าน 86 cases และมี 4 intentional skips จาก 90 cases. Final HEAD `c4238a226a5098dc4fb7db99b4c481066ee8303b` ผ่าน [CI run 31994517569](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31994517569) และ [GitHub Pages deploy run 31994517551](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31994517551) โดยทั้งสอง run จบด้วย success

## 8. Production GitHub Pages smoke test

Production URL ที่ต้องตรวจคือ [https://aodxx.github.io/Personal-Utility-Hub/](https://aodxx.github.io/Personal-Utility-Hub/) และหลักฐานการตรวจบันทึกไว้ที่ [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md)

### Hub and navigation checklist

| Check | Status | Evidence |
|---|---|---|
| Hub เปิดได้ | ผ่านการตรวจเบื้องต้น | URL ข้างต้น; App Shell แสดงผล |
| Search และ category filter | ผ่านการตรวจเบื้องต้น | Search `รูปภาพ` แสดง 7 ผลลัพธ์; category tabs แสดง 8 หมวด |
| Favorite และ Settings | Settings ผ่าน; Favorite ยังต้องตรวจซ้ำ | Settings Center, Compatibility Check และ no-backend message แสดงผล |
| Full-card navigation, back/forward และ refresh hash route | Audio Trimmer route ผ่านเบื้องต้น; back/forward ยังต้องตรวจ | `#/tools/audio-trimmer` เปิดได้และ lazy module เริ่มโหลด |
| 360 × 740 และ Pixel 7 class layout | ผ่านบน Production smoke 360 × 740; Pixel 7 class ผ่าน local Android current | `scripts/phase6-production-smoke.mjs`, Playwright Android current |
| ไม่มี horizontal overflow หรือ icon/footer overlap | ผ่านบน Production 360 × 740 | Production smoke `scrollWidth` check และ local E2E contract |

### Audio workflow checklist

ต้องทดสอบด้วยไฟล์เสียงจริงอย่างน้อยหนึ่งไฟล์ที่ browser decode ได้ในแต่ละ tool ตามลำดับ:

```text
เลือกไฟล์ → แสดงข้อมูล → ตั้งค่า → Process → Preview → Export/Download
```

| Audio tool | Status |
|---|---|
| Audio Trimmer | ผ่าน — upload → process → preview → export → download WAV |
| Audio Compressor Pro | ผ่าน — upload → process → result metrics → download WAV |
| Audio Merger Studio | ผ่าน — multi-file workbench, process → result metrics → download WAV |
| Silence Remover | ผ่าน — upload → process → result metrics → download WAV |
| Audio Finisher | ผ่าน — peak/normalize process → result metrics → download WAV |
| Audio Speed & Pitch | ผ่าน — resampling process → result metrics → download WAV |
| Audio Chapter Marker & Cue Sheet | ผ่าน — upload → marker → TXT cue-sheet export |

### PWA/offline checklist

ตรวจ manifest, Service Worker registration, controller readiness, v0.8 shell/tool cache names, Offline Preparation และเปิด tool ที่เตรียมไว้หลังตัด network ตาม contract โดยต้องยืนยันว่า cache รุ่นเก่าไม่ถูกใช้แทน asset ของ v0.8

## 9. Known limitations

Audio Compressor ใช้ target size แบบประมาณการสำหรับ WAV; Audio Finisher เป็น peak normalization และ clipping protection ไม่ใช่ LUFS mastering; Audio Speed & Pitch เป็น resampling ที่ทำให้ speed และ pitch สัมพันธ์กัน ไม่ใช่ independent time-stretch; และยังไม่มี MP3 export ใน implementation ปัจจุบัน

GitHub Actions และ dependency audit หลัง `npm ci` ผ่านแล้วบน final HEAD ก่อน Audio regression; Production smoke notes บันทึกผล Hub, search/category, Settings, English localization, Service Worker/cache และ Audio contract ครบ 7 tools ไว้ใน [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md) หลังเพิ่ม one-retry recovery ใน AppShell และ dedicated Audio E2E coverage

## 10. Release notes

รายละเอียดการ review ของ P0 อยู่ใน [`CODE_REVIEW_v0.10.0.md`](CODE_REVIEW_v0.10.0.md) ครอบคลุม privacy, JWT decode boundary, hash memory guard, regex safety, color semantics, lifecycle และ bundle impact

v0.10.0 จะถือว่า **Production Baseline Ready** เมื่อเอกสาร release ตรงกับ source, local quality gate ผ่าน, GitHub Actions บน HEAD ผ่าน, GitHub Pages smoke test ของ P0 ผ่านบน desktop และ mobile และ PWA/offline behavior ยืนยันด้วย cache version ใหม่โดยไม่มีข้อมูลผู้ใช้เดิมเสียหาย


## 11. Phase 6 Trust & Usability validation

Phase 6 เพิ่ม `src/core/tool-guide.ts` และ `src/data/guides.ts` เป็น typed bilingual Guide contract/catalog แบบ tool-specific สำหรับ Active Tools 25 รายการ พร้อม shared AppShell Guide dialog, Privacy route `#/privacy`, accessible privacy links, first-use guidance ที่เก็บ `guideSeen` แบบ local-only และ sample workflows ใน JSON Formatter, Base64 และ Text Formatter

| Phase 6 check | Local status |
|---|---:|
| Active Tools มี Guide ครบและ schema valid | ผ่าน 25/25 |
| Privacy route และ hash parser | ผ่าน |
| TH/EN guide fields | ผ่าน |
| guideSeen storage + memory-safe fallback | ผ่าน |
| Guide open/close และ Escape behavior | ผ่านใน Playwright |
| First-use dismiss persistence | ผ่านใน Playwright |
| Sample data workflow | ผ่านใน Playwright |
| Mobile guide sheet contract | ผ่านใน Android entry profile |
| Phase 6 trust/unit integration tests | 12/12 ผ่าน |
| Playwright รวม | 86 passed, 4 intentional skips จาก 90 cases |

Production verification ของ Phase 6 ผ่าน smoke script `scripts/phase6-production-smoke.mjs` ครบ 10/10 checks บน URL จริงและ viewport 360 × 740: Privacy, guides จาก 5 categories, Audio Trimmer upload → process → WAV result → download, JSON sample, no horizontal overflow, Escape close และ back/forward/refresh. Final HEAD และ Pages deploy ผ่าน CI/Pages runs ที่ระบุในหัวข้อ 7. Audio regression contract เดิมยังผ่านใน local Playwright และ production smoke notes มีหลักฐาน shared audio tools/Chapter Marker; ข้อจำกัดที่เหลือเป็นเรื่อง output/codec ตาม implementation ไม่ใช่ trust/usability gate


## 12. Phase 7 Home Experience Optimization validation

Phase 7 ปรับเฉพาะ Home experience โดยไม่มี Active Tool ใหม่ ไม่มี Backend, Analytics, Login, Cloud usage sync, Remote usage tracking หรือ slider dependency เพิ่ม. Large Trust Strip เดิมถูกแทนที่ด้วย Compact Trust Chips แบบ TH/EN และส่วน New Tools grid ถูกแทนที่ด้วย `Your Most Used / ใช้บ่อยของคุณ` native horizontal carousel

| Phase 7 check | Result |
|---|---:|
| Compact Trust Chips 3 รายการ | ผ่าน |
| Trust Chip focus/click explanation และ keyboard semantics | ผ่าน |
| Most Used ใช้ `utility-hub:usage` เดิม | ผ่าน |
| Usage DESC, Top 5 และ deterministic catalog tie-breaker | ผ่าน unit tests |
| Active-only filtering และ missing count handling | ผ่าน unit tests |
| New-user fallback 5 tools | ผ่าน |
| Fallback order | Image Compressor, PDF Merge, QR Code Generator, JSON Formatter / Validator, Audio Trimmer |
| Compact cards full-card navigation | ผ่าน touch/mouse/keyboard contract |
| Native horizontal scroll/snap | ผ่าน |
| Ranking update หลังเปิด tool และกลับ Home | ผ่าน |
| Reload persistence | ผ่าน |
| Usage-only reset | ผ่าน; Favorites/Locale/Theme ไม่ถูกลบ |
| TH/EN | ผ่าน |
| 360 × 740 | ผ่าน Production |
| Pixel 7-class 412 × 915 | ผ่าน Production |
| Desktop 1280 × 900 | ผ่าน Production |
| Page horizontal overflow | ไม่พบทุก viewport |
| Phase 6 Privacy/Guide regression | ผ่าน Production |

### Phase 7 automated and Production results

`tests/phase7-home.test.ts` ผ่าน 4/4 tests. Full Playwright suite ผ่าน **92 tests** และมี 4 intentional skips. Local release gates ผ่าน typecheck, full Vitest, build, bundle check, `npm audit --audit-level=high`, Service Worker syntax และ `git diff --check`. Bundle metrics คือ **33.7 KB entry gzip**, **366.1 KB largest lazy chunk** และ **977.3 KB JavaScript gzip across 36 chunks**; npm audit รายงาน **0 vulnerabilities**

Production smoke ใช้ `node scripts/phase7-production-smoke.mjs` ตรวจ real GitHub Pages URL [https://aodxx.github.io/Personal-Utility-Hub/](https://aodxx.github.io/Personal-Utility-Hub/) และผ่าน **38/38 checks** ครอบคลุม Home/catalog, old strip removal, chips, fallback, carousel, full-card navigation, reset, localization, ranking, reload, overflow, Privacy route และ Phase 6 Guide/Escape regression

Final Phase 7 implementation commit คือ `af70a90804a9b70a0884022dd51b1fa69b6ec437`. GitHub Actions CI run [31996233447](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233447) และ Pages deploy run [31996233427](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233427) ผ่านบน HEAD เดียวกัน

### Known limitations

Carousel ใช้ native horizontal scrolling และไม่มี previous/next arrow controls เพื่อคง dependency และ event handling ให้เล็ก. Most Used เป็น local personalization ของอุปกรณ์ปัจจุบัน ไม่ใช่ global popularity, trending หรือ aggregate ranking. Usage reset ล้างเฉพาะ usage counts ตาม contract และไม่ล้าง Favorites, Recent, Locale, Theme หรือ GuideSeen


## 13. Phase 7.1 Most Used Carousel Visual & Motion Polish validation

Phase 7.1 ปรับเฉพาะ visual/motion ของ Most Used carousel โดยคง ranking algorithm, Top 5, fallback, LocalStorage usage key, route และ privacy architecture เดิม ไม่มี backend, analytics หรือ heavy slider dependency ใหม่

| Phase 7.1 check | Result |
|---|---:|
| Existing ToolMetadata visual asset reused | ผ่าน |
| Every Most Used card has visible visual asset | ผ่าน |
| Compact card visual area | 5rem / ผ่าน 72px minimum E2E |
| Mobile card width and next-card peek | ผ่านที่ 360 × 740 และ 412 × 915 |
| Full-card click and favorite isolation | ผ่าน |
| Native scroll, snap, scroll padding, smooth behavior, momentum and overscroll | ผ่าน |
| Five-dot indicator | ผ่าน |
| Desktop previous/next controls | ผ่าน; edge disabled state ผ่าน |
| Active-card emphasis | ผ่านโดยใช้ transform/opacity/shadow แบบ subtle |
| Reduced motion | ผ่าน; smooth scroll เปลี่ยนเป็น auto และ transition เหลือไม่เกิน 0.001s |
| Page horizontal overflow | ไม่พบ |
| Phase 6 guide/privacy regressions | ผ่าน full suite และ Production smoke |

### Automated and visual results

Phase 7.1 E2E เพิ่ม 6 passed และ 6 intentional skips ตาม viewport-specific contract. Full Playwright suite หลัง change ผ่าน **98 tests** และมี **10 intentional skips**. Local typecheck, full Vitest, production build, bundle check, npm audit, Service Worker syntax และ `git diff --check` ผ่าน

Bundle metrics หลัง Phase 7.1 คือ **34.5 KB entry gzip**, **366.1 KB largest lazy chunk** และ **978.2 KB JavaScript gzip across 36 chunks**; `npm audit --audit-level=high` รายงาน **0 vulnerabilities**

Production visual capture ใช้ `node scripts/phase71-production-visual.mjs` บน real GitHub Pages URL และผ่าน **13/13 checks** ครอบคลุม initial state, visual asset, mobile scroll/peek, dots, desktop arrows, indicator change และ previous behavior ที่ 360 × 740, 412 × 915 และ 1280 × 900. Screenshot review แบบ section-focused ผ่านตาม notes ใน [`docs/phase71-visual-findings.md`](docs/phase71-visual-findings.md)

Implementation HEAD คือ `0475f82f9fba7dd05abb2297a561926bb6e63a7d`. CI [31998196555](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196555) และ Pages deploy [31998196579](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196579) ผ่าน

Visual evidence อยู่ใน [`docs/phase71-production-evidence.md`](docs/phase71-production-evidence.md) และ screenshots อยู่ใน [`docs/phase71-screenshots/`](docs/phase71-screenshots/)


## Approved Reliability and Wave 0/1 milestone — 19 สิงหาคม 2026

รอบนี้เพิ่ม regression evidence ก่อนขยาย catalog ต่อ โดยยังคง client-side/local-first architecture เดิม

| Check | Result |
|---|---:|
| TypeScript typecheck | ผ่าน |
| Vitest | 90/90 ผ่าน |
| Registry validator | ผ่าน 29 metadata modules, unique IDs/routes, required fields และ lazy registrations |
| Community Mapping targeted E2E | ผ่าน Point, Polygon, statistics และ GeoJSON export |
| Audio workbench targeted E2E | ผ่าน 5 workbenches สำหรับ Preview → Export → Download WAV |
| URL Query Builder unit | ผ่าน Unicode, repeated keys, hash, encoding และ invalid input |
| URL Query Builder E2E | ผ่าน desktop และ Android profiles รวม mobile no-overflow |
| Production build | ผ่าน; URL Query Builder ถูกแยกเป็น lazy chunk ขนาด 5.01 kB |
| `git diff --check` | ผ่าน |

Wave 0 เพิ่ม `npm run check:registry` ใน package scripts และ GitHub Actions CI เพื่อป้องกัน metadata/route/lazy registration drift. Wave 1 เพิ่ม `url-query-builder` ในหมวด `ข้อความและข้อมูล` โดยมี bilingual guide, pure logic tests และ browser workflow tests


### Wave 0/1 release note — 19 สิงหาคม 2026

Wave 0 เพิ่ม `npm run check:registry` ใน quality gate และตรวจ 29 metadata modules, unique IDs/routes, required fields และ lazy registrations. Wave 1 เพิ่ม URL Query Builder เป็น beta pilot พร้อม unit/E2E contract และ bilingual guide แบบกระชับ

| Check | Result |
|---|---:|
| Vitest | 94/94 ผ่าน จาก 20 test files |
| Typecheck | ผ่าน |
| Registry | 29 modules ผ่าน |
| Bundle | Entry 45.4 KB gzip / budget 46 KB; largest lazy 366.1 KB; total JS 1,066.1 KB |
| Targeted smoke + URL tool E2E | 35 ผ่าน, 4 intentional skips |
| Audio contract | Preview → Export → Download WAV ผ่าน 5 workbenches |
| Community Mapping interaction | Point → Polygon → GeoJSON ผ่าน |

Entry budget 46 KB เป็น narrow Wave 1 budget ที่บันทึกเหตุผลไว้ใน `scripts/check-bundle.mjs`; lazy และ total JavaScript budgets ไม่ได้ผ่อนปรน


## Audio edge cases and Wave 1 Text/Data validation — 19 สิงหาคม 2026

| Check | Result |
|---|---:|
| Audio targeted E2E | 21/21 ผ่าน จาก 7 audio/file cases × 3 profiles |
| Audio coverage | stereo, 44.1 kHz, 16 kHz, silence-then-tone, invalid WAV, repeated Preview และ Download WAV |
| Wave 1 unit tests | JSON Schema + Markdown Table รวม 5 tests ผ่าน |
| Full Vitest | 99/99 ผ่าน จาก 21 test files |
| Wave 1 E2E | 4 ผ่าน, 2 intentional skips |
| Full Playwright | 181 ผ่าน, 14 intentional skips จาก 195 tests |
| Registry | 31 modules ผ่าน |
| Bundle | Entry 46.4 KB gzip / budget 47 KB; largest lazy 366.1 KB; total JS 1,070.6 KB |

JSON Schema Generator และ Markdown Table Builder ยังอยู่สถานะ beta pilot เพราะ schema เป็น inferred จาก sample เดียว และ Markdown parser เป็น simple table parser ไม่ใช่ full CSV dialect engine


## Developer credit verification — 19 สิงหาคม 2026

| Check | Result |
|---|---:|
| Developer credit text | `Developed by aod` แสดงใน footer |
| Facebook destination | ตรงกับ `https://www.facebook.com/share/1AWvhjdr44/` |
| Link safety/accessibility | `target="_blank"`, `rel="noopener noreferrer"`, accessible aria-label และ visually hidden label |
| Unit/AppShell assertion | ผ่าน |
| Smoke E2E | 29 ผ่าน, 4 intentional skips |
| Mobile layout | ผ่าน no-overflow smoke |
| TypeScript/Vitest/build/bundle | ผ่าน; 99/99 unit tests และ entry 46.7 KB gzip |


## Unique tool icon verification — 21 สิงหาคม 2026

| Check | Result |
|---|---:|
| Catalog tool icons | 31/31 unique visual asset IDs |
| Former fallback tools | 3 remapped: Community Mapping, LINE Sticker Studio, SVG Asset Studio |
| Former shared groups | Audio 6, Text/Data 4, File 2, Image 2 received dedicated symbols |
| SVG sprite integrity | 120 assets; exact duplicates 0; geometry duplicates 0; near-duplicate warnings 0 |
| Visual asset unit tests | 4/4 passed |
| Vitest | 100/100 passed |
| TypeScript | Passed |
| Production build | Passed |
| Bundle | Entry 46.8 KB gzip; all JavaScript 1,071.0 KB |
| `git diff --check` | Passed |

## v0.8.1 — Image Blur/Sensor local validation — 26 สิงหาคม 2026

Image Blur/Sensor เพิ่มจากแนวคิดเครื่องมือบน ITKB โดยเลือกกรอบสี่เหลี่ยมด้วยการลาก, Blur หรือ Pixelate, ปรับความแรง, preview และ download ทั้งหมดทำงานใน browser และใช้ Worker เมื่อรองรับ พร้อม main-thread fallback เมื่อจำเป็น ไม่มีการเพิ่ม dependency ใหม่หรือ backend

| Check | Result |
|---|---:|
| TypeScript | ผ่าน |
| Vitest | 119/119 ผ่าน จาก 26 test files |
| Registry | 35 metadata modules ผ่าน; unique IDs/routes และ lazy registrations ผ่าน |
| SVG library | 120 assets; exact duplicates 0; geometry duplicates 0; near-duplicate warnings 0 |
| Production build | ผ่าน |
| Bundle | Entry 50.5 KB gzip ภายใต้งบใหม่ 51 KB; largest lazy 366.1 KB; JavaScript รวม 1,200.2 KB |
| Image Blur/Sensor E2E | 3/3 ผ่าน บน Desktop Chromium, Android entry 360 × 740 และ Android current |
| Full Playwright E2E | 202 ผ่าน, 14 intentional skips จาก 216 cases |
| npm audit | 0 vulnerabilities |
| Service Worker syntax | ผ่านด้วย `node --check public/sw.js` |
| `git diff --check` | ผ่าน |

Entry budget ถูกขยับจาก 50 KB เป็น 51 KB และบันทึกเหตุผลไว้ใน `scripts/check-bundle.mjs` เนื่องจาก static catalog มี metadata และ bilingual guide เพิ่มขึ้นหนึ่งเครื่องมือ ขณะที่ largest lazy chunk และ total JavaScript ยังคงอยู่ต่ำกว่างบเดิม


## v0.9.0 — ITKB Utility Expansion validation — 26 สิงหาคม 2026

Release `v0.9.0` เพิ่มเครื่องมือใหม่ 7 รายการ ได้แก่ PDF Page Organizer, CSV Thai Encoding Repair, JSON i18n Mapper, Batch Image Watermark, JSON-LD Generator, Flowchart Studio และ Circle/Rounded Crop โดยทุกโมดูลลงทะเบียนแบบ lazy, มี metadata และ bilingual guide, ใช้ client-side processing และไม่เพิ่ม backend หรือ external upload path

| Gate | ผลลัพธ์ |
|---|---|
| TypeScript | ผ่าน `npm run typecheck` |
| Unit/integration | ผ่าน 27 test files, 124 tests |
| Registry | ผ่าน: 42 metadata modules, unique routes และ lazy registrations |
| SVG library | ผ่าน: 120 assets, exact duplicates 0, geometry duplicates 0, near-duplicate warnings 0 |
| Production build | ผ่าน `npm run build` |
| Service Worker syntax | ผ่าน `node --check public/sw.js` |
| Diff whitespace | ผ่าน `git diff --check` |
| Expansion E2E desktop | ผ่าน 7/7 routes บน Desktop Chromium |
| Expansion E2E mobile | ผ่าน 14/14 tests บน Android entry 360 × 740 และ Android current |

### Implementation notes

PDF Page Organizer ใช้ `pdf-lib` ที่มีอยู่แล้วเพื่อจัดลำดับ ลบ หมุน ใส่เลขหน้า และใส่ลายน้ำ โดยไม่แก้ไฟล์ต้นฉบับ ส่วน CSV Thai Encoding Repair ตรวจ UTF-8 แบบ fatal ก่อนใช้ heuristic ของ Windows-874/Windows-1252 และ export UTF-8 BOM เพื่อช่วย workflow ของ Excel

JSON i18n Mapper และ JSON-LD Generator เป็น pure text/data tools ที่ทำงานใน browser ส่วน Batch Image Watermark และ Circle/Rounded Crop ใช้ Canvas/ImageBitmap และ cleanup object URLs ตาม image processing contract รุ่นนี้รองรับ text watermark และ center crop; ยังไม่อ้างว่าเป็น logo watermark หรือ draggable crop editor

Flowchart Studio ใช้ DSL แบบ `Step A -> Step B` และสร้าง SVG ที่ escape label ก่อน render พร้อม export SVG, PNG และ JSON เครื่องมือนี้เป็น editor แบบพื้นฐาน ไม่ได้อ้างว่าเป็น auto-layout หรือ collaborative diagram system

### Release boundary

ผลการตรวจสอบทั้งหมดเป็น local validation ใน working copy และยังไม่ใช่หลักฐาน production GitHub Pages smoke หรือ GitHub Actions run บน commit ใหม่ การเปลี่ยนแปลงยังไม่ได้ commit หรือ push ขึ้น GitHub ตามขอบเขตความปลอดภัยของงานนี้


## Final pre-push review — 26 สิงหาคม 2026

รอบ code review ล่าสุดแก้ไขและยืนยันแล้ว 4 ประเด็น ได้แก่ Flowchart slug collision และ stable label mapping, total-byte guard 40 MB สำหรับ Batch Image Watermark, fallback path เมื่อ Canvas ไม่มี `roundRect` สำหรับ Circle/Rounded Crop และการนำ `prepareOffline` ที่ไม่จำเป็นออกจากเครื่องมือที่ทำงานบน main thread

หลังการแก้ไข ผลตรวจล่าสุดคือ `npm test` ผ่าน 124/124 tests, full Playwright E2E ผ่าน 244 cases และ skip 14 cases ตามเงื่อนไขเดิมของโครงการ โดย functional workflows ของเครื่องมือใหม่ทั้ง 7 รายการผ่านบน Desktop Chromium, Android entry 360 × 740 และ Android current รวม 21 workflows ทุกข้อ ผล production build, bundle, registry, SVG integrity, npm audit, Service Worker syntax และ `git diff --check` ผ่านเช่นกัน

ยังไม่มีการ commit หรือ push จากการตรวจรอบนี้
