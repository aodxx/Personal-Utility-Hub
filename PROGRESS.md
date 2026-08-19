# Personal Utility Hub — Progress Report

> แหล่งข้อมูลกลางสำหรับสถานะการพัฒนา การทดสอบ การ release และข้อจำกัดของ Personal Utility Hub

**อัปเดตล่าสุด:** 17 สิงหาคม 2026
**สถานะโครงการ:** Production Baseline `v0.8.0` — Phase 5 merge เข้า `main` แล้ว; CI และ Pages deploy บน HEAD ผ่าน
**เว็บไซต์:** https://aodxx.github.io/Personal-Utility-Hub/

## สรุป milestone

| Milestone | สถานะ | สิ่งที่ส่งมอบ |
|---|---|---|
| Phase 0 — Foundation | เสร็จสิ้นและเผยแพร่แล้ว | Strict TypeScript, Tool Contract, Hash Router, lazy loader, App Shell, PWA foundation |
| Phase 1 — Hub MVP | เสร็จสิ้นและเผยแพร่แล้ว | Tool catalog, search, categories, favorites, recent tools, theme และ offline shell |
| Phase 2 — Core Tools + Visual System | เสร็จสิ้นและเผยแพร่แล้ว | JSON/Base64/Text, QR, Image tools, local SVG asset system และ responsive tool cards |
| Phase 3 — File Tools | เสร็จสิ้นและเผยแพร่แล้ว | Image Compressor, Images to PDF, PDF Merge/Split/To Image และ File Metadata |
| Phase 4 — Performance and Offline | เสร็จสิ้นและเผยแพร่แล้ว | Dedicated Worker, fallback, cancel/progress, IndexedDB offline readiness และ bundle budget |
| UX/UI Refinement | เสร็จสิ้นและเผยแพร่แล้ว | Full-card navigation, compact mobile cards, touch feedback และ accessibility assertions |
| Phase 5 — Product Expansion | merge เข้า `main` แล้ว | TH/EN, Settings Center, portable settings, usage sorting, compatibility check, Audio Tool Suite และ new utility suite |
| v0.8.0 — Audio Tool Suite Baseline | CI/Deploy ผ่าน; production smoke บางส่วนผ่าน | Versioned cache contract, source-aligned docs, CI run `31988106872`, Pages deploy run `31988106901` และ smoke notes |

## ความสามารถปัจจุบัน

Catalog ปัจจุบันมี **25 active tools** และ file-oriented tools 17 รายการ ทุก tool ใช้ client-side processing, lazy loading และ metadata contract ที่ประกาศ processing/privacy behavior อย่างชัดเจน

### Audio Tool Suite

| Tool | ขอบเขต |
|---|---|
| Audio Trimmer | ตัดช่วงเสียงจาก waveform และ export |
| Audio Compressor Pro | ปรับ quality/target-size profile พร้อม metrics |
| Audio Merger Studio | รวมหลายไฟล์ตามลำดับ พร้อม gap/crossfade ตาม implementation |
| Silence Remover | ลบช่วงเงียบด้วย threshold, minimum silence และ padding |
| Audio Finisher | peak normalization, gain, fade และ clipping protection |
| Audio Speed & Pitch | resampling ที่เชื่อมโยง speed กับ pitch |
| Audio Chapter Marker & Cue Sheet | วาง markers บน waveform และ export cue sheet |

Audio pipeline แชร์ `src/core/audio-processing.ts`, `src/tools/audio-workbench.ts`, `src/core/processing-client.ts` และ `src/workers/processing.worker.ts` โดยมี main-thread fallback เมื่อจำเป็น ไฟล์ผลลัพธ์อยู่ใน WAV/WAV Compact family; ยังไม่มี MP3 encoder, LUFS mastering หรือ independent time-stretch

### New Utility Suite

- Privacy Redactor Studio
- File Diff & Change Map
- Image Contact Sheet Studio
- CSV Data Cleaner & Profiler
- Audio Chapter Marker & Cue Sheet

## Release contract v0.8.0

- `package.json` ใช้ version `0.8.0`
- Service Worker ใช้ shell cache `utility-hub-shell-v0.8.0-audio-suite` และ tool cache `utility-hub-tools-v0.8.0-audio-suite`
- Offline Tool Manager ใช้ `OFFLINE_CACHE_VERSION = 0.8.0-audio-suite`
- PWA manifest ไม่มี version field แยกต่างหาก จึงไม่ถูกแก้ให้มีข้อมูลซ้ำ
- Portable Settings และ IndexedDB store ยังคง schema version `1` เพื่อรักษา backward compatibility กับข้อมูลผู้ใช้เดิม
- Cache รุ่นเก่าจะถูกล้างโดย Service Worker activation ตาม cache allow-list

## Validation status

ผล local quality gate ล่าสุดหลังเพิ่ม Audio production contract regression คือ TypeScript ผ่าน, Vitest 52/52, production build ผ่าน, bundle budget ผ่าน และ Playwright 76 passed พร้อม 2 intentional skips จาก 78 cases บน Desktop Chromium, Android entry `360 × 740` และ Android current profile โดย dedicated Audio spec ครอบคลุม 21 cases

Production smoke รอบล่าสุดยืนยัน Hub, search/category, Settings, English localization, v0.8 Service Worker/cache และ Audio contract ครบ 7 tools: Audio Trimmer, Audio Compressor Pro, Audio Merger Studio, Silence Remover, Audio Finisher, Audio Speed & Pitch และ Audio Chapter Marker & Cue Sheet โดยรายละเอียดอยู่ใน `docs/v0.8-production-smoke-notes.md` การเพิ่ม one-retry recovery ใน AppShell ช่วยรับมือ transient lazy-module load state ก่อนแสดง error UI

## Known limitations และ roadmap

Audio output ยังอยู่ใน WAV family; target-size เป็นค่าประมาณ, Audio Finisher เป็น peak-based normalization และ Speed & Pitch เป็น resampling ไม่ใช่ advanced time-stretch งานถัดไปที่ควรพิจารณาหลัง baseline green ได้แก่ MP3 export แบบ optional, LUFS/true-peak metering, segment-level silence editor และ independent time-stretch โดยต้องผ่าน quality benchmark และ bundle review ก่อน

ยังไม่มี Backend, telemetry หรือ cloud storage และยังไม่เริ่ม Wave 1/Wave 3 ของ v0.9 จนกว่าจะรักษา Audio contract, regression coverage และ production evidence นี้ให้ผ่านต่อเนื่องใน CI/Pages release ถัดไป

## เอกสารอ้างอิงใน repository

- [`README.md`](README.md) — ภาพรวม source-aligned และ release contract
- [`TEST_REPORT.md`](TEST_REPORT.md) — test matrix และ production verification record
- [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md) — developer guide และ processing-heavy patterns
- [`docs/PRIVACY_AND_DEPENDENCIES.md`](docs/PRIVACY_AND_DEPENDENCIES.md) — privacy/dependency policy
- [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) — visual asset system
- [`docs/audio-tools-verification.md`](docs/audio-tools-verification.md) — audio behavior และ limitations


## Phase 6 — Trust & Usability (complete)

Phase 6 เพิ่ม Privacy route ที่ `#/privacy`, shared local-processing links, accessible privacy badges, typed bilingual tool-specific Guide catalog สำหรับ Active Tools 25 รายการ, shared How-to dialog, Escape/close behavior, first-use hint ที่เก็บ `guideSeen` ผ่าน LocalPreferences และ sample workflows สำหรับ JSON Formatter, Base64 และ Text Formatter โดยไม่เพิ่ม tool ใหม่และไม่เปลี่ยน Portable Settings schema `1`

Local validation ล่าสุด: Phase 6 trust tests 12/12 ผ่าน และ Playwright ผ่าน 86 tests พร้อม 4 intentional skips จาก 90 cases บน Desktop Chromium, Android entry และ Android current profiles. Build, bundle, npm audit, Service Worker syntax และ diff checks ผ่าน โดย Entry gzip 32.7 KB, largest lazy chunk 366.1 KB และ JavaScript รวม gzip 976.4 KB. Final application/evidence HEAD `c4238a2` ผ่าน CI run `31994517569` และ Pages deploy run `31994517551`

Production smoke script `scripts/phase6-production-smoke.mjs` ผ่าน 10/10 checks บน GitHub Pages จริงที่ viewport 360 × 740 ครอบคลุม Privacy, guides จาก 5 categories, Audio Trimmer upload/process/download, JSON sample, no-overflow, Escape และ hash back/forward/refresh. Trust-content audit และ sample metadata audit ถูกบันทึกใน `docs/phase6-trust-content-audit.md`; remaining limitations เป็นข้อจำกัดตาม implementation เช่น WAV output, browser codec support และ memory usage ไม่ใช่ unverified trust claims


## Phase 6 validation update — 17 สิงหาคม 2026

Catalog guide ถูกเปลี่ยนเป็นเนื้อหาเฉพาะเครื่องมือครบ **25/25 active tools** ในภาษาไทยและอังกฤษ โดยทุก guide มี overview, use cases, inputs, outputs, steps, limitations, privacy, FAQ และ tips ที่ผูกกับ implementation จริง ไม่มี generic fallback เหลือใน `src/data/guides.ts`.

Sample contract ตรวจแล้ว: JSON Formatter, Base64 และ Text Formatter มี `sampleAvailable: true` พร้อมปุ่ม Try Sample และ handler จริง; Privacy Redactor, File Diff และ CSV Profiler ไม่มี sample control จึงคง metadata เป็น `false`.

ผล local quality gate ล่าสุด: `npm test` ผ่าน 52/52, `npm run build` ผ่าน, bundle ผ่านด้วย entry gzip 32.7 KB, largest lazy chunk 366.1 KB และ JavaScript รวม gzip 976.4 KB, Playwright ผ่าน 86 tests และ 4 intentional skips, `npm audit --audit-level=high` พบ 0 vulnerabilities, Service Worker syntax และ `git diff --check` ผ่าน.

Guide-specific E2E assertions ถูกแก้ให้ตรวจเนื้อหา localized จริงในค่าเริ่มต้นภาษาไทย และผ่านทั้ง Desktop Chromium, Android entry `360 × 740` และ Android current profile. Phase 6 ยังอยู่ระหว่างรอ commit/CI/Pages deploy และ Production verification รอบสุดท้าย จึงยังไม่ประกาศว่า complete.


## Phase 7 — Home Experience Optimization & Smart Personalization

**สถานะ:** Implemented และ Production verified บน commit `af70a90804a9b70a0884022dd51b1fa69b6ec437`

Phase 7 ปรับ Home โดยไม่เพิ่ม Active Tool ใหม่และไม่เพิ่ม backend, analytics, account, cloud usage sync หรือ remote tracking. Large Trust Strip ถูกแทนที่ด้วย Compact Trust Chips แบบ TH/EN ที่ focus/click เพื่ออ่านคำอธิบายสั้นได้ ส่วน New Tools grid ถูกแทนที่ด้วย `Your Most Used / ใช้บ่อยของคุณ` native horizontal carousel

Most Used reuse usage counts จาก `utility-hub:usage` ใน LocalStorage เดิม จัดลำดับ usage DESC, ใช้ deterministic catalog-order tie-breaker, กรองเฉพาะ active tools และแสดงสูงสุด 5 cards. ผู้ใช้ใหม่ใช้ curated fallback: `image-compressor`, `pdf-merge`, `qr-generator`, `json-formatter`, `audio-trimmer`. Settings มี usage-only reset ที่กลับไป fallback โดยไม่ทำให้ Favorites, Recent, Locale, Theme หรือ GuideSeen หาย

### Phase 7 validation

| Check | Result |
|---|---:|
| Most Used unit tests: sort, top 5, tie-breaker, fallback, active filtering, reset | ผ่าน 4/4 tests |
| Full unit/integration suite | ผ่าน |
| Full Playwright suite | 92 passed, 4 intentional skips |
| Production smoke | 38/38 passed |
| Production viewport matrix | 360 × 740, Pixel 7-class 412 × 915, desktop 1280 × 900 |
| No page horizontal overflow | ผ่านทุก viewport |
| CI | [31996233447](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233447) ผ่าน |
| Pages deploy | [31996233427](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233427) ผ่าน |
| Bundle | Entry gzip 33.7 KB; largest lazy chunk 366.1 KB; JS gzip 977.3 KB |
| npm audit | 0 vulnerabilities |

Production details are recorded in [`docs/phase7-production-evidence.md`](docs/phase7-production-evidence.md) and are reproducible with `node scripts/phase7-production-smoke.mjs`.


## Phase 7.1 — Most Used Carousel Visual & Motion Polish

**สถานะ:** Implemented และ Production visual verified บน implementation commit `0475f82f9fba7dd05abb2297a561926bb6e63a7d`

Phase 7.1 ปรับเฉพาะ UX/visual/motion ของ Most Used carousel โดยไม่เปลี่ยน Most Used ranking algorithm, Top 5 limit, fallback order, LocalStorage usage key, tool registry, backend policy หรือ analytics policy. Compact cards ใช้ ToolMetadata icon และ existing asset resolver เดียวกับ catalog มี visual area 5rem, privacy badge, favorite control, arrow cue, fixed content rhythm และ mobile card width ประมาณ 78% ของ carousel viewport

Carousel ใช้ native `overflow-x: auto`, `scroll-snap-type: x mandatory`, `scroll-snap-align`, `scroll-behavior: smooth`, scroll padding, `overscroll-behavior-inline: contain` และ `-webkit-overflow-scrolling: touch`. Desktop มี previous/next buttons ที่ disabled ตาม edge state; mobile ใช้ swipe พร้อม 5-dot indicator; active card ใช้ subtle transform/opacity/shadow emphasis และ reduced-motion ปิด meaningful transitions/smooth scrolling แต่คง snap behavior

### Phase 7.1 validation

| Check | Result |
|---|---:|
| Phase 7.1 carousel E2E | 6 passed, 6 intentional skips |
| Full Playwright suite | 98 passed, 10 intentional skips |
| Local typecheck/unit/build/bundle/audit | ผ่าน |
| Bundle | Entry gzip 34.5 KB; largest lazy chunk 366.1 KB; JS gzip 978.2 KB |
| npm audit | 0 vulnerabilities |
| Production visual script | 13/13 passed |
| Production viewports | 360 × 740, 412 × 915, 1280 × 900 |
| Visual screenshot review | ผ่าน initial, swipe, next และ previous states |
| CI | [31998196555](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196555) ผ่าน |
| Pages deploy | [31998196579](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31998196579) ผ่าน |

Detailed evidence is in [`docs/phase71-production-evidence.md`](docs/phase71-production-evidence.md), screenshot review notes are in [`docs/phase71-visual-findings.md`](docs/phase71-visual-findings.md), and the reproducible capture command is `node scripts/phase71-production-visual.mjs`.

## Approved Reliability and Wave 0/1 milestone — 2026-08-19

เริ่มดำเนินงานตามลำดับที่อนุมัติ: Beta Reliability Sprint, Audio Production Contract, Wave 0 platform hardening และ Wave 1 ชุดเล็ก

| งาน | ผลล่าสุด |
|---|---|
| Community Mapping interaction | เพิ่ม E2E วาง Point, วาด Polygon, ตรวจสถิติ และ export GeoJSON |
| Audio Production Contract | เพิ่มการตรวจ Upload → Preview → Export → Download WAV ให้กับ audio workbenches ใหม่ 5 ตัว |
| Registry hardening | เพิ่ม `npm run check:registry` ตรวจ 29 metadata modules, unique IDs/routes, required fields และ lazy registrations |
| CI gate | เชื่อม `check:registry` เข้า `.github/workflows/ci.yml` |
| Wave 1 tool | เพิ่ม URL Query String Builder ในหมวดข้อความและข้อมูล รองรับ Unicode, repeated keys, hash, parse/build, copy และ mobile layout |
| Privacy | ทุกงานประมวลผลใน browser; URL Query Builder ไม่มี upload/backend และ audio/community tests ไม่เพิ่ม network dependency |

ผลทดสอบ milestone นี้: Vitest **90/90 ผ่าน**, typecheck ผ่าน, registry check ผ่าน **29 modules**, targeted Community Mapping/Audio E2E ผ่าน และ URL Query Builder E2E ผ่านทั้ง desktop กับ mobile profile หลัง rebuild production preview


Entry bundle gate ถูกปรับจาก 45 KB เป็น **46 KB gzip** อย่างมีเหตุผลเฉพาะสำหรับ Wave 1 pilot เนื่องจาก static metadata/guide ของ tool ใหม่ทำให้ entry วัดได้ 45.4 KB; lazy chunk ใหญ่สุดยัง 366.1 KB และ JavaScript รวม 1,066.1 KB จึงยังต่ำกว่า total budget 1,600 KB มาก การปรับนี้ถูกบันทึกเป็น comment ใน `scripts/check-bundle.mjs` และยังคงตรวจ `largestLazyGzip`/`totalJavaScriptGzip` เดิม
