# Personal Utility Hub

ศูนย์รวม **privacy-first utility tools** แบบ Static PWA ที่ประมวลผลไฟล์และข้อมูลภายในเบราว์เซอร์เป็นหลัก โดยใช้ Modular Tool Registry, Lazy Loading, Dedicated Web Worker และ Offline/PWA support เมื่อความสามารถของเบราว์เซอร์รองรับ

**สถานะปัจจุบัน:** `v0.8.0` — Phase 5 Product Expansion และ Production Audio verification ถูก merge เข้า `main` แล้ว; Phase 6 Trust & Usability อยู่ระหว่างการยกระดับบน baseline เดิม โดยไม่เพิ่มจำนวนเครื่องมือ

## เครื่องมือที่มีอยู่ใน main

### Text / Data

- JSON Formatter / Validator
- Base64 Encoder / Decoder
- Text Formatter
- Privacy Redactor Studio
- File Diff & Change Map
- CSV Data Cleaner & Profiler

### QR

- QR Code Generator
- QR Code Reader จากรูปภาพหรือกล้อง

### Image

- Image Resizer
- Image Converter
- Image Compressor
- Image Contact Sheet Studio
- Images to PDF

### PDF / File

- PDF Merge
- PDF Split
- PDF to Image
- File Metadata Viewer

### Audio

- Audio Trimmer
- Audio Compressor Pro
- Audio Merger Studio
- Silence Remover
- Audio Finisher
- Audio Speed & Pitch
- Audio Chapter Marker & Cue Sheet

ทุกเครื่องมือในรายการข้างต้นถูกลงทะเบียนเป็น active tool และโหลดแบบ lazy ตาม route เมื่อเปิดใช้งาน การทำงานหลักเกิดขึ้นบนอุปกรณ์ของผู้ใช้ ไม่มี login, analytics, backend, cloud storage หรือ runtime API request สำหรับส่งไฟล์ออกจากอุปกรณ์

## Audio Tool Suite

Audio tools ใช้ PCM pipeline ที่แชร์ร่วมกัน โดย `src/core/audio-processing.ts` รับผิดชอบการ decode/normalize/resample และ pure processing operations ส่วน `src/tools/audio-workbench.ts` จัดการ waveform, controls, preview, progress, result metrics, download และ lifecycle ของหน้าเครื่องมือ งานที่ใช้เวลานานถูกส่งผ่าน `src/core/processing-client.ts` ไปยัง `src/workers/processing.worker.ts` เมื่อ Worker พร้อม และมี main-thread fallback สำหรับ browser ที่ไม่รองรับ Worker หรือความสามารถที่จำเป็น

Audio output ในชุดปัจจุบันเป็น **WAV/WAV Compact family** ตาม operation และ quality profile ที่เลือก ไม่ใช่ MP3 encoder และไม่ได้อัปโหลดไฟล์ขึ้น server เครื่องมือรองรับการแสดง duration, channels, sample rate, peak, clipping state, output format และ byte size เมื่อ metric นั้นเกี่ยวข้องกับ operation

ข้อจำกัดที่ควรเข้าใจก่อนใช้งานมีดังนี้:

- Audio Compressor ใช้ target size เป็นค่าประมาณสำหรับ WAV ไม่ใช่การรับประกันขนาดไฟล์สุดท้าย
- Audio Finisher ใช้ peak normalization และ clipping protection ไม่ใช่ LUFS mastering
- Audio Speed & Pitch ใช้ resampling ratio เดียว จึงเปลี่ยนความเร็วและ pitch ที่สัมพันธ์กัน ไม่ใช่ advanced time-stretch ที่ควบคุมสองค่าจากกันอย่างอิสระ
- ไฟล์ต่าง sample rate จะถูก resample ให้เป็น rate ที่ pipeline ใช้ร่วมกัน และ output ยังอยู่ใน WAV family
- Preview และ Export ใช้ processing path เดียวกัน โดยผลลัพธ์ preview ไม่ถูกดาวน์โหลดจนกว่าผู้ใช้จะสั่ง export

## Phase 6 Trust & Usability

ทุก Active Tool มี shared **วิธีใช้งาน / How to use** dialog แบบ TH/EN พร้อม overview, use cases, supported inputs, outputs, steps, limitations, privacy, FAQ และ tips ตาม `src/data/guides.ts` เปิดคู่มือได้จาก Tool page โดยไม่ reset state และปิดด้วยปุ่มหรือ Escape ได้

หน้า Privacy ใหม่อยู่ที่ [`#/privacy`](https://aodxx.github.io/Personal-Utility-Hub/#/privacy) ใช้ภาษาทั่วไปอธิบายเส้นทาง `ไฟล์ → Browser → เครื่องมือ → ผลลัพธ์ → ดาวน์โหลด` และระบุอย่างตรงไปตรงมาว่า LocalStorage/IndexedDB/Cache Storage ใช้เก็บ settings หรือ offline state ไม่ใช่ user file contents ตาม implementation ปัจจุบัน Tool cards มี privacy badge ที่เปิดคำอธิบายได้ และมี first-use hint ที่เก็บสถานะเฉพาะ local device

เครื่องมือ Text/Data ที่เหมาะสมมี sample workflow เช่น JSON Formatter, Base64 และ Text Formatter เพื่อให้ผู้ใช้เริ่มทดลองโดยไม่ต้องใช้ข้อมูลจริง

## Processing และ privacy architecture

ไฟล์ผู้ใช้ถูกอ่านใน browser memory เท่านั้น งาน CPU-heavy ใช้ Dedicated Worker พร้อม progress, cancel และการ terminate เมื่อ success, error, cancel หรือ unmount โดยมีการ clone typed-array ก่อน transfer เพื่อป้องกัน detached buffer เมื่อผู้ใช้ Preview แล้ว Export ซ้ำ เครื่องมือที่สร้าง object URL, AudioContext, ImageBitmap หรือ event listener ต้อง cleanup resource เมื่อ input, output, error หรือหน้า tool เปลี่ยน

IndexedDB ใช้เก็บเฉพาะสถานะว่า tool version ใดเตรียม Offline แล้ว ส่วน Favorites, Recent Tools, Theme, Locale, Tool order และ usage counts อยู่ใน LocalStorage พร้อม memory fallback เมื่อ LocalStorage ใช้ไม่ได้ Portable Settings ยังคง `schemaVersion: 1` เพื่อรักษา backward compatibility กับข้อมูลเดิม

## Version และ release contract

Release baseline ปัจจุบันคือ `0.8.0` โดย identifiers ที่เกี่ยวกับ cache ใช้ `v0.8.0-audio-suite` ใน Service Worker และ Offline Tool Manager การเปลี่ยน release version จะ invalidate shell/tool cache รุ่นเก่า แต่ไม่เปลี่ยน schema ข้อมูลผู้ใช้โดยอัตโนมัติ

PWA manifest ไม่มี version field แยกต่างหาก จึงใช้ package version และ versioned cache identifiers เป็น release source ที่ตรวจสอบได้ ดูรายละเอียด milestone และข้อจำกัดได้ใน [`PROGRESS.md`](PROGRESS.md) และผล validation ใน [`TEST_REPORT.md`](TEST_REPORT.md)

## เริ่มพัฒนา

ต้องใช้ Node.js `22.12` ขึ้นไป

```bash
npm ci
npm run dev
```

## Quality gate

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run check:bundle
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
```

Playwright ตั้งค่าไว้ 3 projects ได้แก่ Desktop Chromium, Android entry viewport `360 × 740` และ Android current profile ที่ใช้ Pixel 7 class viewport

## โครงสร้าง repository

- `src/app` — App Shell และ Hash Router
- `src/core` — Tool Contract, Loader, Search, i18n, Storage, PWA, Offline และ Worker client
- `src/workers` — Dedicated Worker สำหรับงานประมวลผลหนัก รวมถึง PDF, image, hash และ audio
- `src/data` — Tool Registry, taxonomy และ shared metadata/configuration
- `src/tools` — Tool modules ที่มี `metadata.ts` และ `index.ts` และโหลดแบบ lazy
- `src/styles` — Design tokens และ responsive component styles
- `public` — PWA manifest, Service Worker, offline fallback และ local SVG assets
- `tests` — Unit, integration, contract, performance/offline และ Playwright E2E tests
- `docs` — Developer guide, privacy policy, visual system และ verification reports

เริ่มเพิ่มเครื่องมือจาก [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md) โดยเลือก pattern ให้ตรงกับประเภทงาน อย่าใช้ main-thread-only pattern ของ text tool กับ PDF, image หรือ audio ที่มี processing หนัก อ่าน [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md), [docs/VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) และ [docs/audio-tools-verification.md](docs/audio-tools-verification.md) ประกอบ

## เอกสารสำคัญ

| เอกสาร | ขอบเขต |
|---|---|
| [`PROGRESS.md`](PROGRESS.md) | Milestones, release status และ known limitations |
| [`TEST_REPORT.md`](TEST_REPORT.md) | Automated validation, browser matrix และ production evidence |
| [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md) | Tool contract, registry, taxonomy และ processing-heavy guidance |
| [`docs/PRIVACY_AND_DEPENDENCIES.md`](docs/PRIVACY_AND_DEPENDENCIES.md) | Privacy baseline และ dependency policy |
| [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md) | Asset และ UI visual system |
| [`docs/audio-tools-verification.md`](docs/audio-tools-verification.md) | Audio behavior, limitations และ verification notes |
| [`src/data/guides.ts`](src/data/guides.ts) | Typed bilingual guide catalog สำหรับ Active Tools |
| [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md) | Production smoke evidence และ Audio contract |

## Privacy baseline

- ไม่มี Login, Analytics, Backend, Cloud Storage หรือ Server-side Processing
- LocalStorage/IndexedDB ไม่เก็บไฟล์หรือเนื้อหาไฟล์ผู้ใช้
- Image Tools จำกัดตาม implementation ปัจจุบันด้านขนาดไฟล์, dimensions และ output pixels
- File/PDF Tools มี limits ด้านจำนวนไฟล์, bytes และจำนวนหน้าเพื่อควบคุม memory pressure
- QR Reader ขอสิทธิ์กล้องเมื่อผู้ใช้กดเปิด และหยุด Media Track เมื่อปิดหรือออกจาก tool
- Dependencies สำหรับ QR/PDF ถูก bundle แบบ lazy และไม่มี CDN runtime dependency
