# Personal Utility Hub — Progress Report

> แหล่งข้อมูลกลางสำหรับสถานะการพัฒนา การทดสอบ การ release และข้อจำกัดของ Personal Utility Hub

**อัปเดตล่าสุด:** 26 สิงหาคม 2026
**สถานะโครงการ:** `v0.10.0` ถูก push ไปยัง `origin/main` แล้ว — เพิ่มเครื่องมือ P0 จากแหล่งภายนอก 4 รายการ พร้อม bilingual guides, unique visual assets, local-only processing, Hash/Regex Worker paths และ mobile E2E; รอบ supplemental security/performance review ผ่าน local gates แล้ว และใช้ hardening cache namespace ใหม่ ยังไม่ได้ประกาศ deploy ใหม่
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
| v0.8.1 — Image Blur/Sensor | ผ่าน local quality gates | เลือกกรอบสี่เหลี่ยม, Blur/Pixelate, progress/cancel, Worker/fallback, local-only output และ unique SVG asset |
| v0.9.0 — ITKB Utility Expansion | ผ่าน local quality gates | PDF Page Organizer, CSV Thai Encoding Repair, JSON i18n Mapper, Batch Image Watermark, JSON-LD Generator, Flowchart Studio และ Circle/Rounded Crop พร้อม 42 metadata modules |
| v0.10.0 — External P0 Utility Expansion | push `origin/main` แล้ว; supplemental review ผ่าน | JWT Inspector, Hash & Checksum Verifier, Regex Playground และ Color Contrast Checker พร้อม Hash/Regex Worker paths, bilingual guides, 46 metadata modules และ mobile E2E |

## ความสามารถปัจจุบัน

Catalog ปัจจุบันมี **46 tools (45 public tools)** และ file-oriented tools 23 รายการ ทุก tool ใช้ client-side processing, lazy loading และ metadata contract ที่ประกาศ processing/privacy behavior อย่างชัดเจน

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

Audio pipeline แชร์ `src/core/audio-processing.ts`, `src/tools/audio-workbench.ts`, `src/core/processing-client.ts` และ `src/workers/processing.worker.ts` โดยมี main-thread fallback เมื่อจำเป็น ไฟล์ผลลัพธ์อยู่ใน WAV/WAV Compact family และ Audio Merger รองรับ MP3 128 kbps แบบ local ด้วย; ยังไม่มี LUFS/EBU R128 mastering, variable-bitrate MP3 หรือ independent time-stretch

### New Utility Suite

- JWT Inspector
- Hash & Checksum Verifier
- Regex Playground
- Color Contrast Checker
- Privacy Redactor Studio
- File Diff & Change Map
- Image Contact Sheet Studio
- Image Blur & Sensor
- CSV Data Cleaner & Profiler
- Audio Chapter Marker & Cue Sheet

## Release contract v0.10.0

- `package.json` ใช้ version `0.10.0`
- Service Worker ใช้ shell cache `utility-hub-shell-v0.10.0-p0-hardening` และ tool cache `utility-hub-tools-v0.10.0-p0-hardening`
- Offline Tool Manager ใช้ `OFFLINE_CACHE_VERSION = 0.10.0-p0-hardening`
- PWA manifest ไม่มี version field แยกต่างหาก จึงไม่ถูกแก้ให้มีข้อมูลซ้ำ
- Portable Settings และ IndexedDB store ยังคง schema version `1` เพื่อรักษา backward compatibility กับข้อมูลผู้ใช้เดิม
- Cache รุ่นเก่าจะถูกล้างโดย Service Worker activation ตาม cache allow-list

## Validation status

ผล supplemental local quality gate ของ v0.10.0: TypeScript, Vitest 132 tests จาก 29 files, production build, bundle 57.9 KB gzip entry, registry 46 metadata modules, SVG integrity, npm audit 0 vulnerabilities, Service Worker syntax, diff check และ P0 Playwright 27/27 ผ่าน; full Playwright 271 ผ่านและ 14 intentional skips จาก 285 cases

Production smoke รอบล่าสุดยืนยัน Hub, search/category, Settings, English localization, v0.8 Service Worker/cache และ Audio contract ครบ 7 tools: Audio Trimmer, Audio Compressor Pro, Audio Merger Studio, Silence Remover, Audio Finisher, Audio Speed & Pitch และ Audio Chapter Marker & Cue Sheet โดยรายละเอียดอยู่ใน `../v0.8-production-smoke-notes.md` การเพิ่ม one-retry recovery ใน AppShell ช่วยรับมือ transient lazy-module load state ก่อนแสดง error UI

## Known limitations และ roadmap

Audio output ส่วนใหญ่ยังอยู่ใน WAV family; Audio Merger มี MP3 128 kbps แบบ local แล้ว, target-size เป็นค่าประมาณ, Audio Finisher เป็น peak-based normalization และ Speed & Pitch เป็น resampling ไม่ใช่ advanced time-stretch. งานถัดไปที่ควรพิจารณาคือ LUFS/EBU R128 mastering, variable-bitrate MP3, segment-level silence editor, APNG export และ independent time-stretch โดยต้องผ่าน quality benchmark และ bundle review ก่อน

ยังไม่มี Backend, telemetry หรือ cloud storage และยังไม่เริ่ม Wave 1/Wave 3 ของ v0.9 จนกว่าจะรักษา Audio contract, regression coverage และ production evidence นี้ให้ผ่านต่อเนื่องใน CI/Pages release ถัดไป

## เอกสารอ้างอิงใน repository

- [`README.md`](../../README.md) — ภาพรวม source-aligned และ release contract
- [`TEST_REPORT.md`](TEST_REPORT.md) — test matrix และ production verification record
- [`CODE_REVIEW_v0.11.0.md`](../reviews/CODE_REVIEW_v0.11.0.md) — SVG P1 optimization review และ validation evidence
- [`CODE_REVIEW_v0.10.0.md`](../reviews/CODE_REVIEW_v0.10.0.md) — historical P0 code review และ validation evidence
- [`SECURITY_PERFORMANCE_REVIEW_P0_v0.10.0.md`](../reviews/SECURITY_PERFORMANCE_REVIEW_P0_v0.10.0.md) — supplemental security/performance findings และ mitigations
- [`ADDING_A_TOOL.md`](../ADDING_A_TOOL.md) — developer guide และ processing-heavy patterns
- [`PRIVACY_AND_DEPENDENCIES.md`](../PRIVACY_AND_DEPENDENCIES.md) — privacy/dependency policy
- [`VISUAL_SYSTEM.md`](../VISUAL_SYSTEM.md) — visual asset system
- [`audio-tools-verification.md`](../audio-tools-verification.md) — audio behavior และ limitations
- [`P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md`](../research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md) — P1 overlap decisions และ implementation order


## Phase 6 — Trust & Usability (complete)

Phase 6 เพิ่ม Privacy route ที่ `#/privacy`, shared local-processing links, accessible privacy badges, typed bilingual tool-specific Guide catalog สำหรับ Active Tools 25 รายการ, shared How-to dialog, Escape/close behavior, first-use hint ที่เก็บ `guideSeen` ผ่าน LocalPreferences และ sample workflows สำหรับ JSON Formatter, Base64 และ Text Formatter โดยไม่เพิ่ม tool ใหม่และไม่เปลี่ยน Portable Settings schema `1`

Local validation ล่าสุด: Phase 6 trust tests 12/12 ผ่าน และ Playwright ผ่าน 86 tests พร้อม 4 intentional skips จาก 90 cases บน Desktop Chromium, Android entry และ Android current profiles. Build, bundle, npm audit, Service Worker syntax และ diff checks ผ่าน โดย Entry gzip 32.7 KB, largest lazy chunk 366.1 KB และ JavaScript รวม gzip 976.4 KB. Final application/evidence HEAD `c4238a2` ผ่าน CI run `31994517569` และ Pages deploy run `31994517551`

Production smoke script `scripts/phase6-production-smoke.mjs` ผ่าน 10/10 checks บน GitHub Pages จริงที่ viewport 360 × 740 ครอบคลุม Privacy, guides จาก 5 categories, Audio Trimmer upload/process/download, JSON sample, no-overflow, Escape และ hash back/forward/refresh. Trust-content audit และ sample metadata audit ถูกบันทึกใน `../phase6-trust-content-audit.md`; remaining limitations เป็นข้อจำกัดตาม implementation เช่น WAV output, browser codec support และ memory usage ไม่ใช่ unverified trust claims


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

Production details are recorded in [`phase7-production-evidence.md`](../phase7-production-evidence.md) and are reproducible with `node scripts/phase7-production-smoke.mjs`.


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

Detailed evidence is in [`phase71-production-evidence.md`](../phase71-production-evidence.md), screenshot review notes are in [`phase71-visual-findings.md`](../phase71-visual-findings.md), and the reproducible capture command is `node scripts/phase71-production-visual.mjs`.

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


## Audio edge cases and Wave 1 Text/Data expansion — 2026-08-19

รอบนี้ปิด edge cases ของ audio workflow และเพิ่ม Wave 1 Text/Data beta pilots อีก 2 เครื่องมือ โดยยังไม่เพิ่ม category ใหม่

| งาน | ผลล่าสุด |
|---|---|
| Audio edge cases | เพิ่ม fixture และ E2E สำหรับ stereo, 44.1 kHz, 16 kHz, silence-then-tone, invalid file และ repeated Preview → Export → Download WAV |
| JSON Schema Generator | สร้าง inferred JSON Schema draft 2020-12 จาก JSON ตัวอย่าง รองรับ nested object, array, mixed item shapes, Unicode และ local-only error state |
| Markdown Table Builder | แปลง CSV/TSV/pipe เป็น Markdown table รองรับ quoted comma, pipe escaping, missing-cell padding, copy/sample/clear |
| Catalog | 31 metadata modules; Text/Data มี 8 tools; เครื่องมือใหม่ทั้งสองเป็น beta เพื่อผ่าน production evidence เพิ่มเติมก่อน active |
| Registry and guides | lazy registration, bilingual guides, unit tests และ mobile E2E เพิ่มครบ |
| Bundle | Entry 46.4 KB gzip / 47 KB Wave 1 budget; largest lazy 366.1 KB; total JS 1,070.6 KB |

Targeted audio suite ผ่าน 21/21 tests, Wave 1 E2E ผ่าน 4 testsและ 2 intentional skips, full Playwright ผ่าน 181 testsและ 14 intentional skips, Vitest ผ่าน 99/99 และ registry ผ่าน 31 modules


## Developer credit — 2026-08-19

เพิ่ม footer developer credit แบบ responsive ด้วยข้อความ **Developed by aod** และปุ่ม Facebook แบบ accessible ที่เปิด `https://www.facebook.com/share/1AWvhjdr44/` ในแท็บใหม่ โดยใช้ inline SVG icon และไม่เพิ่ม dependency หรือ network request ใหม่

ตรวจสอบแล้วด้วย AppShell unit assertion, smoke E2E, typecheck, Vitest, build, bundle และ `git diff --check`


## Unique tool icon coverage — 2026-08-21

เพิ่ม SVG symbols เฉพาะตัวให้เครื่องมือที่เคยใช้ category icon หรือ fallback ซ้ำ รวมถึงกลุ่ม Audio, Text/Data, File, Image, Community Mapping, LINE Sticker Studio และ SVG Asset Studio ทำให้ catalog tools ทั้ง 31 รายการมี visual asset ID ของตนเอง ไม่มี duplicate symbol ID และยังใช้ sprite แบบ self-hosted โดยไม่เพิ่ม dependency หรือ network request

เพิ่ม visual asset regression test ตรวจว่า tool catalog ทุกตัวมี icon ที่ประกาศใน sprite และบันทึกผล integrity: 120 SVG assets, exact duplicates 0, geometry duplicates 0, near-duplicate warnings 0


## Category taxonomy refinement — 2026-08-21

ปรับหมวดหมู่ให้สื่อความหมายตามลักษณะงานมากขึ้น โดยเพิ่ม `แผนที่และภูมิสารสนเทศ` สำหรับ Community Mapping Studio และ `ไฟล์และข้อมูลเมตา` สำหรับ File Metadata Viewer พร้อมเปลี่ยนหมวดเสียงเดิมเป็น `เสียงและดนตรี` และย้าย Silence Remover เข้าหมวดเดียวกัน หมวดทั้งหมดมี 10 รายการรวม `ทั้งหมด` และมี category visuals กับคำแปลภาษาอังกฤษครบทุกหมวด

หลักฐานล่าสุด: TypeScript ผ่าน, Vitest 100/100 ผ่าน, production build ผ่าน และ smoke E2E 29 ผ่าน 4 skipped


## Category groups expansion — 2026-08-21

เพิ่มหมวดว่างสำหรับการขยายผลิตภัณฑ์ในอนาคต ได้แก่ `ไดอะแกรม` (Diagrams), `เกม` (Games) และ `ดูดวง` (Fortune & Astrology) พร้อมไอคอน SVG เฉพาะหมวดและการแปลภาษาอังกฤษครบถ้วน ปัจจุบัน Hub มีหมวดให้เลือก 13 หมวดรวม `ทั้งหมด` โดยยังไม่มีเครื่องมือในสามหมวดใหม่นี้ จึงพร้อมรองรับการเพิ่มเครื่องมือชุดถัดไปโดยไม่ต้องเปลี่ยน taxonomy อีกครั้ง

หลักฐานล่าสุด: typecheck, registry check, SVG integrity, Vitest 101/101, production build และ smoke E2E 29 ผ่าน 4 skipped


หมายเหตุ release: entry gzip budget ถูกปรับอย่างมีเหตุผลจาก 47 KB เป็น 48 KB เนื่องจากเพิ่ม category metadata, localization และ visual resolver สำหรับสามหมวดใหม่ โดยผลล่าสุดอยู่ที่ประมาณ 47.0 KB และยังต่ำกว่างบใหม่


## Playable Games — 2026-08-22

เพิ่มเกม local-first ที่เล่นได้จริง 2 เกมในหมวด `เกม`: `Orbit Catcher` เกม arcade บน canvas สำหรับเก็บดาวและหลบอุกกาบาต รองรับ keyboard, mouse และ touch พร้อม score, lives และ 30-second session; และ `Pattern Pulse` เกมจำลำดับสี 4 ช่องที่เพิ่ม sequence ทีละรอบ มี level, score และ high score ใน localStorage เกมทั้งสองเป็น lazy-loaded tools มี metadata, bilingual guide, unique SVG icon และไม่ส่งข้อมูลไป backend

หลักฐานล่าสุด: registry ตรวจพบ 33 metadata modules, typecheck ผ่าน, Vitest 101/101 ผ่าน, production build ผ่าน และ smoke E2E 32 ผ่าน 4 skipped รวม gameplay start flow ของทั้งสองเกม


## Icon Refinement — 2026-08-22

ปรับไอคอน visual identity สำหรับหมวด `ดูดวง` และเปลี่ยนไอคอนของ `Foundation Lifecycle Demo` กับ `File Metadata Viewer` จากการใช้ไอคอนหมวดหรือไอคอนร่วม มาเป็น symbol เฉพาะใน SVG sprite ได้แก่ `category-fortune`, `tool-foundation-demo` และ `tool-file-metadata` โดยคงโทน indigo, violet, cyan และ gold ของ Hub ไว้ครบถ้วน ไอคอนใหม่ผ่าน SVG integrity และไม่เกิด duplicate geometry/symbol


## Icon Visibility Cache Fix — 2026-08-22

ตรวจสอบ Production แล้วพบว่า commit และ SVG ใหม่ถูกเผยแพร่จริงครบทั้ง `category-fortune`, `tool-foundation-demo` และ `tool-file-metadata` แต่ PWA ใช้ cache-first สำหรับ asset และยังมี cache namespace เดิม `v0.8.1` จึงอาจทำให้มือถือแสดง JavaScript/SVG sprite รุ่นเก่า แก้โดยเปลี่ยน shell/tool cache เป็น `v0.8.2-icons` และเพิ่ม query version `v=0.8.2-icons` ให้ SVG icon references เพื่อบังคับโหลด asset ใหม่ โดยยังคง local-first และ offline behavior


## Reliability Remediation — 2026-08-22

แก้ P0 Audio Speed & Pitch โดยแยก pitch shift, time stretch และ speed control ออกจากกัน ทำให้ sample rate คงเดิมและ duration เปลี่ยนตาม speed จริง พร้อมเพิ่ม regression test

แก้ P0 Privacy Redactor โดยตรวจ credential ก่อน PII รองรับ key/value secrets, Bearer/JWT-like values, OpenAI-style `sk-/pk-/rk-` keys และ AWS access keys รวมถึงสะสม count จากหลาย secret patterns และไม่แสดงข้อความ success เมื่อไม่พบรูปแบบที่รองรับ

แก้ P1 Image Compressor ให้แสดงสถานะ warning เมื่อ output ใหญ่กว่า original, แก้ P1 File Diff เป็น LCS diff เพื่อไม่ให้ insertion ทำให้บรรทัดถัดไปถูกนับผิด และแก้ P1 CSV Profiler ให้รองรับ quoted newline, delimiter comma/semicolon/tab, file-size guard และคำนวณ duplicate จาก cleaned rows จริง

แก้ accessibility ของ Community Mapping และ SVG Asset Studio โดยเปลี่ยน nested `<main>` ภายในเป็น labelled `section[role=region]` พร้อมเพิ่ม regression tests ครบชุด


## Reliability Validation — 2026-08-22

ผลตรวจหลังแก้ไข: regression tests ใหม่ครอบคลุม P0/P1 และ accessibility; Vitest ผ่าน 109 tests, E2E ผ่าน 187 tests และ skipped 14 ตามเงื่อนไข environment, registry check ผ่าน 33 modules, SVG integrity ผ่าน 120 assets, typecheck/build/bundle check ผ่าน โดย entry gzip อยู่ที่ 48.9 KB จากงบ 50 KB


## Review remediation continuation — 22 August 2026

Follow-up fixes based on `Personal-Utility-Hub-Tool-Review-2026-08-22.md`: the public catalog now excludes the internal Foundation Lifecycle Demo while preserving its direct diagnostic route; Image Resizer and Image Converter compare source/output bytes and use a warning state when output grows; PNG conversion hides the quality control that has no effect; Image Contact Sheet revokes source/output Blob URLs and reports success only after `toBlob`; shared Audio Workbench warns on larger output, missed approximate targets, or clipping; Pattern Pulse now describes failed rounds as game over and includes an explicit local best-score reset; Audio Speed & Pitch and Audio Chapter Marker guides were synchronized with shipped behavior. Typecheck and targeted/full unit tests passed at this checkpoint. Remaining advanced roadmap items such as full PDF queues, semantic JSON diff, LUFS processing, APNG export, and CRS/tile packages remain documented as future waves rather than unverified claims.


## Audio export and metering follow-up — 22 August 2026

เพิ่ม MP3 export แบบ local-only สำหรับ Audio Merger ที่ 128 kbps โดยใช้ browser-compatible vendored encoder bundle ไม่มี runtime network หรือ backend dependency; WAV และ WAV Compact ยังคงเป็น output หลักของ workbench อื่น ๆ. เพิ่ม RMS loudness และ 2x interpolated true-peak screening metrics ให้ผลลัพธ์ audio และเพิ่ม warning เมื่อ output โตขึ้น, missed approximate target หรือมี clipping risk. เพิ่ม unit และ Playwright regression coverage สำหรับ MP3 filename, MP3 frame output, audio metrics และ download flow. MP3 encoder เป็น fixed-bitrate export และ RMS/true-peak เป็น screening metrics ไม่ใช่ LUFS/EBU R128 mastering meter.


## Audio backlog closure — 22 August 2026

Audio Merger now supports local MP3 export at fixed 128 kbps in addition to WAV/WAV Compact, with a vendored browser-compatible encoder to avoid the CommonJS `MPEGMode` bundling defect. Shared audio results now expose RMS loudness and an interpolated true-peak screening metric; status becomes a warning for larger outputs, missed approximate targets, or clipping risk. Metadata and bilingual guides were updated, and MP3 frame/filename/download coverage was added to unit and Playwright tests. Targeted Audio E2E passed 66/66 across the configured browser profiles after correcting the download-label contract.

LUFS/EBU R128 mastering, variable-bitrate MP3, and advanced phase-vocoder quality remain explicitly unsupported capabilities rather than falsely marked complete; the UI and guides now state this boundary.

## Final quality gate — 22 August 2026

Static checks passed: TypeScript typecheck, Vitest unit suite, production build, 33-tool registry integrity, 120-icon SVG integrity, bundle budget (49.2 KB entry gzip), high-severity audit scan (0 vulnerabilities), service-worker syntax check, and whitespace validation. The complete Playwright suite passed **190 passed / 14 skipped** across 204 tests with `--workers=1`. A 3-worker run reproduced an environment-level Chromium crash under the sandbox memory ceiling after 189 tests passed; the single-worker run completed all coverage without failures and is the authoritative release result for this constrained environment. The realistic 4×4 LINE Sticker export contract is now given a 60-second test budget because 16 PNG encodes plus validation are CPU-heavy on Android under parallel load.

## Land Measurement visual map fix — 22 August 2026

ตรวจจากภาพผู้ใช้พบว่า Leaflet container และเส้นวัดทำงาน แต่ basemap tile ไม่แสดง และ default Leaflet marker image เสีย. ปรับ tile fallback ให้ผูก `tileerror` กับ TileLayer โดยตรงแทนการรอ event ที่ map และเปลี่ยน marker เป็น bundled numbered `divIcon` จึงไม่พึ่ง default image path ของ Leaflet. เพิ่ม E2E assertion ว่ามี `.leaflet-tile` และ numbered markers จริง พร้อมคง map action rail ใต้แผนที่สำหรับย้อนจุด/ล้างข้อมูล.

## Land Measurement network-independent map fallback — 22 August 2026

จากภาพการใช้งานจริงพบว่า OSM และ Esri ต่างไม่ส่ง tile ถึงมือถือ แม้ Leaflet และ attribution จะทำงาน จึงเพิ่ม final fallback แบบ local coordinate grid ที่สร้างด้วย CSS/DOM ในเครื่อง ไม่พึ่ง network และยังรองรับการวัด geometry จากจุดที่ผู้ใช้แตะหรือ GPS ได้. Tile errors ของ OSM, Esri street และ Esri satellite ถูกจับแยกตาม layer; เมื่อออนไลน์กลับมา tile ที่โหลดได้จะซ่อน local grid อัตโนมัติ.

เพิ่ม Playwright regression ที่ abort external tile providers ทั้งหมดและตรวจ `.local-map-fallback` แสดงจริง. Full unit 115/115, targeted Land Measurement E2E 9/9, typecheck, build และ bundle check 49.9 KB entry gzip ผ่าน.

## Land Measurement real offline geographic basemap — 22 August 2026

ผู้ใช้ยืนยันว่า local grid ไม่ใช่แผนที่ภูมิศาสตร์จริง จึงเพิ่ม Natural Earth public-domain country-boundary GeoJSON ขนาดประมาณ 820 KB เป็น local vector basemap ใน `public/data/world-countries.geojson`. เครื่องมือจะโหลด layer นี้จากอุปกรณ์และแสดงขอบเขตประเทศเป็นบริบทจริงแม้ OSM/Esri tiles ถูกบล็อก; local grid ยังคงเป็นพื้นหลังสำรองหาก asset โหลดไม่ได้. ระบุขอบเขตความสามารถตรงไปตรงมาว่าเป็น country-level context ไม่ใช่ street/parcel map และไม่ใช่ cadastral survey.

เพิ่ม E2E ที่บล็อก external tiles และตรวจ local map fallback, numbered marker และการวัดเดิม. Typecheck, Land Measurement unit tests 6/6, targeted E2E 9/9 และ bundle check 49.9 KB entry gzip ผ่าน.

## Phatthalung offline street map — 22 August 2026

ตามแนวทาง D เพิ่ม road-only GeoJSON จาก HOT/HDX OpenStreetMap export สำหรับ bounding box จังหวัดพัทลุง (14,608 road features, 9.1 MB) เป็น offline street layer. ระบบโหลด asset เฉพาะเมื่อ OSM/Esri online tiles ล้มเหลว จึงไม่เพิ่ม network/parse cost ให้ผู้ใช้ที่ออนไลน์ตามปกติ. ใน offline mode แผนที่จะโฟกัสพัทลุงโดยอัตโนมัติและแสดงถนนหลัก/ถนนรองเป็นเส้นจริง พร้อม attribution OpenStreetMap Contributors และ HOT/HDX.

ขอบเขต coverage ใช้ bounding box ครอบคลุมจังหวัดพัทลุง ไม่ใช่ cadastral/parcel data และ road extract ไม่มีการรับรองความครบถ้วนหรือความสดของถนนทุกเส้น. Typecheck, Land Measurement unit 6/6, build, bundle check 50.0 KB และ targeted E2E 9/9 ผ่าน.


## v0.11.0 — SVG Asset Studio P1 optimization upgrade — 27 สิงหาคม 2026

อัปเกรด `svg-asset-studio` เดิมโดยไม่สร้าง route ซ้ำ เพิ่ม optimizer comparison สำหรับ raw bytes และ gzip เมื่อ browser รองรับ `CompressionStream`, deterministic change summary, restore previous SVG ก่อน export, selected optimizer preset ระหว่าง render และ escaping ของ inspector values ที่มาจากไฟล์ผู้ใช้ การอัปเกรดยังคง local-only, ไม่เพิ่ม SVGO dependency เข้า bundle และไม่เปลี่ยน Portable Settings หรือ IndexedDB schema

| งาน | ผลล่าสุด |
|---|---|
| Package/cache release | package `0.11.0`; shell/tool/offline cache `0.11.0-p1-svg`; sprite query `v=0.11.0-p1-svg` |
| SVG metadata | `svg-asset-studio` version `0.2.0-beta.1`, route เดิมและ `supportsOffline: true` |
| Optimizer core | raw before/after bytes, savings bytes/percent, change summary และ optional gzip measurement |
| UI workflow | Before/after panel, gzip availability state, details ของ changes และ Restore previous SVG |
| Regression tests | SVG unit 9/9, full Vitest 154/154 จาก 33 files, targeted SVG E2E 6/6 |
| Full browser regression | Playwright 271 passed, 14 intentional skips จาก 285 cases ด้วย single worker |
| Bundle | Entry 58.1 KB gzip; largest lazy 366.1 KB; total JavaScript 1,241.7 KB จาก 62 chunks |
| Integrity/security | Registry 46 modules ผ่าน, SVG 120 assets ผ่าน, npm audit 0 vulnerabilities, Service Worker syntax และ diff check ผ่าน |

Release นี้ผ่าน local quality gates แล้ว แต่ยังไม่ถือว่าเป็น production deployment หรือ CI-verified จนกว่าจะ push commit และตรวจ remote/Pages evidence ใหม่ การ optimize โดยเฉพาะ Balanced/Aggressive อาจเปลี่ยน visual semantics จึงยังต้องตรวจ preview ก่อน export; gzip comparison อาจไม่พร้อมใน browser บางรุ่น
