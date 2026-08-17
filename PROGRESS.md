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
| v0.8.0 — Audio Tool Suite Baseline | CI/Deploy ผ่าน; production smoke บางส่วนผ่าน | Versioned cache contract, source-aligned docs, CI run `31987799709`, Pages deploy run `31987799615` และ smoke notes |

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

ผลล่าสุดจาก local quality gate ก่อน baseline patch คือ TypeScript ผ่าน, Vitest 52/52, production build ผ่าน, bundle budget ผ่าน และ Playwright 55 passed พร้อม 2 intentional skips จาก 57 cases บน Desktop Chromium, Android entry `360 × 740` และ Android current profile

GitHub Actions บน HEAD ผ่านแล้ว: [CI run 31987799709](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31987799709) และ [Pages deploy run 31987799615](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31987799615) ผล production smoke ยืนยัน Hub, search/category, Settings, English localization, Audio route และ v0.8 Service Worker/cache แล้ว แต่ Audio process/export ด้วยไฟล์จริงยังไม่แสดง completion state ใน browser observation จึงยังไม่ mark baseline ว่า fully verified; รายละเอียดอยู่ใน `docs/v0.8-production-smoke-notes.md`

## Known limitations และ roadmap

Audio output ยังอยู่ใน WAV family; target-size เป็นค่าประมาณ, Audio Finisher เป็น peak-based normalization และ Speed & Pitch เป็น resampling ไม่ใช่ advanced time-stretch งานถัดไปที่ควรพิจารณาหลัง baseline green ได้แก่ MP3 export แบบ optional, LUFS/true-peak metering, segment-level silence editor และ independent time-stretch โดยต้องผ่าน quality benchmark และ bundle review ก่อน

ยังไม่มี Backend, telemetry หรือ cloud storage และไม่มีแผนเพิ่มเครื่องมือใหม่จนกว่า v0.8 Production Baseline จะผ่านเอกสาร, CI, production smoke และ offline verification ครบ

## เอกสารอ้างอิงใน repository

- [`README.md`](README.md) — ภาพรวม source-aligned และ release contract
- [`TEST_REPORT.md`](TEST_REPORT.md) — test matrix และ production verification record
- [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md) — developer guide และ processing-heavy patterns
- [`docs/PRIVACY_AND_DEPENDENCIES.md`](docs/PRIVACY_AND_DEPENDENCIES.md) — privacy/dependency policy
- [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) — visual asset system
- [`docs/audio-tools-verification.md`](docs/audio-tools-verification.md) — audio behavior และ limitations
