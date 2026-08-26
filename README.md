# Personal Utility Hub

ศูนย์รวม **privacy-first utility tools** แบบ Static PWA ที่ประมวลผลไฟล์และข้อมูลภายในเบราว์เซอร์เป็นหลัก โดยใช้ Modular Tool Registry, Lazy Loading, Dedicated Web Worker และ Offline/PWA support เมื่อความสามารถของเบราว์เซอร์รองรับ

**สถานะปัจจุบัน:** `v0.9.0` — เพิ่มเครื่องมือจาก ITKB อีก 7 รายการ ได้แก่ PDF Page Organizer, CSV Thai Encoding Repair, JSON i18n Mapper, Batch Image Watermark, JSON-LD Generator, Flowchart Studio และ Circle/Rounded Crop; รวม 42 tools (41 public tools) มี bilingual tool-specific guides และทำงานแบบ client-side โดยไม่เพิ่ม backend, accounts หรือ cloud storage

## เครื่องมือที่มีอยู่ใน main

### Text / Data

- JSON Formatter / Validator
- Base64 Encoder / Decoder
- Text Formatter
- Privacy Redactor Studio
- File Diff & Change Map
- CSV Data Cleaner & Profiler
- CSV Thai Encoding Repair — ตรวจและซ่อม encoding ภาษาไทย พร้อม export UTF-8 BOM

### QR

- QR Code Generator
- QR Code Reader จากรูปภาพหรือกล้อง

### Image

- Image Resizer
- Image Converter
- Image Compressor
- Image Blur & Sensor — ลากเลือกพื้นที่เพื่อเบลอหรือทำพิกเซลก่อนแชร์
- Image Contact Sheet Studio
- Batch Image Watermark — ใส่ข้อความลายน้ำบนหลายไฟล์ในเครื่อง
- Circle & Rounded Crop — ครอบรูปเป็นวงกลมหรือขอบมน
- Images to PDF

### PDF / File

- PDF Page Organizer — ลบ จัดเรียง หมุน ใส่เลขหน้า และลายน้ำ
- PDF Merge
- PDF Split
- PDF to Image
- File Metadata Viewer

### Developer Tools

- JSON i18n Mapper — ตรวจ key ของไฟล์แปลภาษา
- JSON-LD Generator — สร้าง Schema.org structured data
- Flowchart Studio — สร้างและ export แผนผัง workflow

### Maps / Location

- Land Measurement Tool — วัดระยะ เส้นรอบรูป และพื้นที่แปลงจากแผนที่หรือ GPS พร้อม GeoJSON/KML/CSV export
- Community Mapping Studio

### Audio

- Audio Trimmer
- Audio Compressor Pro
- Audio Merger Studio
- Silence Remover
- Audio Finisher
- Audio Speed & Pitch
- Audio Chapter Marker & Cue Sheet

Land Measurement ใช้ Leaflet, Browser Geolocation และ geodesic geometry ใน browser; map tiles อาจต้องใช้เครือข่ายและ provider อาจเห็น viewport ตาม layer ที่เลือก ผลลัพธ์เป็นค่าประมาณ ไม่ใช่ legal survey

ทุกเครื่องมือในรายการข้างต้นถูกลงทะเบียนเป็น active tool และโหลดแบบ lazy ตาม route เมื่อเปิดใช้งาน การทำงานหลักเกิดขึ้นบนอุปกรณ์ของผู้ใช้ ไม่มี login, analytics, backend, cloud storage หรือ runtime API request สำหรับส่งไฟล์ออกจากอุปกรณ์

## Audio Tool Suite

Audio tools ใช้ PCM pipeline ที่แชร์ร่วมกัน โดย `src/core/audio-processing.ts` รับผิดชอบการ decode/normalize/resample และ pure processing operations ส่วน `src/tools/audio-workbench.ts` จัดการ waveform, controls, preview, progress, result metrics, download และ lifecycle ของหน้าเครื่องมือ งานที่ใช้เวลานานถูกส่งผ่าน `src/core/processing-client.ts` ไปยัง `src/workers/processing.worker.ts` เมื่อ Worker พร้อม และมี main-thread fallback สำหรับ browser ที่ไม่รองรับ Worker หรือความสามารถที่จำเป็น

Audio output ในชุดปัจจุบันเป็น **WAV/WAV Compact family** สำหรับ workbench ทั่วไป และ **MP3 128 kbps** สำหรับ Audio Merger โดย encode ใน browser และไม่อัปโหลดไฟล์ขึ้น server เครื่องมือรองรับการแสดง duration, channels, sample rate, peak, RMS loudness, 2x interpolated true-peak screening metric, clipping state, output format และ byte size เมื่อ metric นั้นเกี่ยวข้องกับ operation

ข้อจำกัดที่ควรเข้าใจก่อนใช้งานมีดังนี้:

- Audio Compressor ใช้ target size เป็นค่าประมาณสำหรับ WAV ไม่ใช่การรับประกันขนาดไฟล์สุดท้าย; Audio Merger MP3 ใช้ fixed 128 kbps
- Audio Finisher ใช้ peak normalization และ clipping protection; RMS/true-peak ที่แสดงเป็น screening metrics ไม่ใช่ LUFS mastering ตาม EBU R128
- Audio Speed & Pitch ใช้ local granular time-stretch แบบประมาณการเพื่อแยก speed กับ pitch แต่อาจมี artifact ในเสียงที่ซับซ้อน และไม่เทียบเท่า advanced DAW time-stretch
- ไฟล์ต่าง sample rate จะถูก resample ให้เป็น rate ที่ pipeline ใช้ร่วมกัน และ output ยังอยู่ใน WAV family
- Preview และ Export ใช้ processing path เดียวกัน โดยผลลัพธ์ preview ไม่ถูกดาวน์โหลดจนกว่าผู้ใช้จะสั่ง export

## Phase 6 Trust & Usability — complete

ทุก Active Tool มี shared **วิธีใช้งาน / How to use** dialog แบบ TH/EN พร้อม overview, use cases, supported inputs, outputs, steps, limitations, privacy, FAQ และ tips ตาม `src/data/guides.ts` เปิดคู่มือได้จาก Tool page โดยไม่ reset state และปิดด้วยปุ่มหรือ Escape ได้

Production verification ของ final HEAD ผ่าน 10/10 checks ที่ viewport 360 × 740 ครอบคลุม Privacy route, guides จาก 5 categories, JSON sample, Audio Trimmer upload/process/download, no-overflow และ hash back/forward/refresh. รายละเอียดอยู่ใน [`docs/phase6-production-evidence.md`](docs/phase6-production-evidence.md) และ [`docs/phase6-trust-content-audit.md`](docs/phase6-trust-content-audit.md)

หน้า Privacy ใหม่อยู่ที่ [`#/privacy`](https://aodxx.github.io/Personal-Utility-Hub/#/privacy) ใช้ภาษาทั่วไปอธิบายเส้นทาง `ไฟล์ → Browser → เครื่องมือ → ผลลัพธ์ → ดาวน์โหลด` และระบุอย่างตรงไปตรงมาว่า LocalStorage/IndexedDB/Cache Storage ใช้เก็บ settings หรือ offline state ไม่ใช่ user file contents ตาม implementation ปัจจุบัน Tool cards มี privacy badge ที่เปิดคำอธิบายได้ และมี first-use hint ที่เก็บสถานะเฉพาะ local device

เครื่องมือ Text/Data ที่เหมาะสมมี sample workflow เช่น JSON Formatter, Base64 และ Text Formatter เพื่อให้ผู้ใช้เริ่มทดลองโดยไม่ต้องใช้ข้อมูลจริง

## Phase 7 Home Experience Optimization — implemented

หน้า Home ถูกปรับให้กระชับขึ้นโดยแทนที่ Trust Strip เดิมด้วย Compact Trust Chips และแทนที่ `เครื่องมือใหม่ที่น่าลอง / New tools to try` ด้วย horizontal `ใช้บ่อยของคุณ / Your Most Used` carousel ที่ใช้ usage counts จากอุปกรณ์นี้เท่านั้น

Most Used ใช้ LocalStorage key เดิม `utility-hub:usage`, จัดลำดับ usage จากมากไปน้อย, ใช้ catalog order เป็น tie-breaker และจำกัด 5 รายการ เครื่องมือผู้ใช้ใหม่จะเห็น fallback แบบ curated ได้แก่ Image Compressor, PDF Merge, QR Code Generator, JSON Formatter / Validator และ Audio Trimmer เมื่อเริ่มใช้งานจริง ranking จะปรับอัตโนมัติเมื่อกลับหน้า Home การล้าง Most Used ล้างเฉพาะ usage counts และไม่ลบ Favorites, Recent, Locale, Theme หรือ GuideSeen

Carousel ใช้ native CSS `overflow-x: auto`, `scroll-snap-type` และ smooth scrolling โดยไม่มี slider dependency เพิ่ม Compact cards กดได้ทั้ง card และรองรับ touch, mouse และ keyboard ส่วน Trust Chips มี TH/EN, focus state, `aria-expanded`, short explanation และ touch target ที่เหมาะสม รายละเอียด Production อยู่ใน [`docs/phase7-production-evidence.md`](docs/phase7-production-evidence.md)

### Phase 7.1 Carousel Visual & Motion Polish — implemented

Most Used cards ใช้ visual asset เดียวกับ Tool Catalog ผ่าน `ToolMetadata.icon` และ `toolAssetIcon()` มี visual area 5rem, card width mobile ประมาณ 78% ของ viewport, visible next-card peek, privacy badge, favorite control และ arrow cue. Carousel ใช้ native momentum scrolling, scroll padding, mandatory snap, active-card emphasis, 5-dot indicator, desktop previous/next controls และ reduced-motion override โดยไม่เปลี่ยน ranking logic

Production visual evidence ผ่าน **13/13 checks** ที่ 360 × 740, 412 × 915 และ 1280 × 900 พร้อม screenshot review ของ initial, swipe, next และ previous states อยู่ใน [`docs/phase71-production-evidence.md`](docs/phase71-production-evidence.md) และ [`docs/phase71-visual-findings.md`](docs/phase71-visual-findings.md)

## Processing และ privacy architecture

ไฟล์ผู้ใช้ถูกอ่านใน browser memory เท่านั้น งาน CPU-heavy ใช้ Dedicated Worker พร้อม progress, cancel และการ terminate เมื่อ success, error, cancel หรือ unmount โดยมีการ clone typed-array ก่อน transfer เพื่อป้องกัน detached buffer เมื่อผู้ใช้ Preview แล้ว Export ซ้ำ เครื่องมือที่สร้าง object URL, AudioContext, ImageBitmap หรือ event listener ต้อง cleanup resource เมื่อ input, output, error หรือหน้า tool เปลี่ยน

IndexedDB ใช้เก็บเฉพาะสถานะว่า tool version ใดเตรียม Offline แล้ว ส่วน Favorites, Recent Tools, Theme, Locale, Tool order และ usage counts อยู่ใน LocalStorage พร้อม memory fallback เมื่อ LocalStorage ใช้ไม่ได้ Portable Settings ยังคง `schemaVersion: 1` เพื่อรักษา backward compatibility กับข้อมูลเดิม

## Version และ release contract

Release baseline ปัจจุบันคือ `0.8.1` โดย identifiers ที่เกี่ยวกับ cache ใช้ `v0.8.1-image-blur` ใน Service Worker และ Offline Tool Manager การเปลี่ยน release version จะ invalidate shell/tool cache รุ่นเก่า แต่ไม่เปลี่ยน schema ข้อมูลผู้ใช้โดยอัตโนมัติ

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
