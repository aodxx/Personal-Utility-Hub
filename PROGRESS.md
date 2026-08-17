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


## Phase 6 — Trust & Usability (in progress)

Phase 6A–6D implementation ชุดแรกเพิ่ม Privacy route ที่ `#/privacy`, shared local-processing links, accessible privacy badges, typed bilingual Guide catalog สำหรับ Active Tools 25 รายการ, shared How-to dialog, Escape/close behavior, first-use hint ที่เก็บ `guideSeen` ผ่าน LocalPreferences และ sample workflows สำหรับ JSON Formatter, Base64 และ Text Formatter โดยไม่เพิ่ม tool ใหม่และไม่เปลี่ยน Portable Settings schema `1`

Local validation ล่าสุด: Phase 6 trust tests 12/12 ผ่าน และ Playwright หลังเพิ่ม Privacy/Guide/first-use/sample contracts 83 passed พร้อม 4 intentional skips จาก 87 cases บน Desktop Chromium, Android entry และ Android current profiles Build และ bundle ผ่าน โดย Entry gzip เพิ่มเป็นประมาณ 22.4 KB และ JavaScript รวม gzip ประมาณ 966.0 KB; ยังต้องตรวจ GitHub Actions และ Production GitHub Pages หลัง commit ก่อนปิด Phase 6

ข้อจำกัดที่ยังเหลือก่อน Definition of Done: ต้องตรวจ Privacy/Guide/first-use/sample flows บน Production จริง, ตรวจ keyboard/focus และ no-overflow รอบสุดท้ายบน device profiles, ทำ trust-content audit แบบ repository-wide และตรวจว่าทุก file/text tool ที่เหมาะสมมี sample action ตาม product contract


## Phase 6 validation update — 17 สิงหาคม 2026

Catalog guide ถูกเปลี่ยนเป็นเนื้อหาเฉพาะเครื่องมือครบ **25/25 active tools** ในภาษาไทยและอังกฤษ โดยทุก guide มี overview, use cases, inputs, outputs, steps, limitations, privacy, FAQ และ tips ที่ผูกกับ implementation จริง ไม่มี generic fallback เหลือใน `src/data/guides.ts`.

Sample contract ตรวจแล้ว: JSON Formatter, Base64 และ Text Formatter มี `sampleAvailable: true` พร้อมปุ่ม Try Sample และ handler จริง; Privacy Redactor, File Diff และ CSV Profiler ไม่มี sample control จึงคง metadata เป็น `false`.

ผล local quality gate ล่าสุด: `npm test` ผ่าน 52/52, `npm run build` ผ่าน, bundle ผ่านด้วย entry gzip 32.7 KB, largest lazy chunk 366.1 KB และ JavaScript รวม gzip 976.4 KB, Playwright ผ่าน 86 tests และ 4 intentional skips, `npm audit --audit-level=high` พบ 0 vulnerabilities, Service Worker syntax และ `git diff --check` ผ่าน.

Guide-specific E2E assertions ถูกแก้ให้ตรวจเนื้อหา localized จริงในค่าเริ่มต้นภาษาไทย และผ่านทั้ง Desktop Chromium, Android entry `360 × 740` และ Android current profile. Phase 6 ยังอยู่ระหว่างรอ commit/CI/Pages deploy และ Production verification รอบสุดท้าย จึงยังไม่ประกาศว่า complete.
