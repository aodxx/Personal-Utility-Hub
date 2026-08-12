# Personal Utility Hub

ศูนย์รวม Utility Web Tools แบบ Static PWA ที่เน้น Privacy by Design, Client-side Processing และ Modular Tool Registry

โครงการอยู่ใน **Phase 5: Product Expansion** โดย Phase 0–4 และ UX/UI Refinement เผยแพร่บน `main` แล้ว ส่วนภาษาไทย/English, Settings Import/Export, การเรียงเครื่องมือที่ใช้บ่อย และ Compatibility Check พัฒนาอยู่บน Branch `agent/phase-5-product-expansion`

## เครื่องมือ Core

1. JSON Formatter / Validator
2. Base64 Encoder / Decoder ที่รองรับ Unicode
3. Text Formatter
4. QR Code Generator
5. QR Code Reader จากรูปภาพหรือกล้อง
6. Image Resizer
7. Image Converter ระหว่าง PNG, JPEG และ WebP

ทุกเครื่องมือประมวลผลในเบราว์เซอร์ ไม่มี Backend และไม่อัปโหลดข้อความ รูปภาพ หรือข้อมูลจากกล้องไปยังเซิร์ฟเวอร์

## เครื่องมือไฟล์ Phase 3

1. Image Compressor เป็น WebP/JPEG
2. Images to PDF สูงสุด 20 รูป
3. PDF Merge
4. PDF Split ด้วยช่วงหน้า
5. PDF to Image เป็น PNG/JPEG
6. File Metadata Viewer พร้อม SHA-256

เครื่องมือ PDF ใช้ `pdf-lib` และ PDF.js แบบ Lazy-loaded เฉพาะเมื่อเปิดใช้งาน ไฟล์ยังคงอยู่ในอุปกรณ์ผู้ใช้ตลอดกระบวนการ

## Performance และ Offline Phase 4

- งานรูปภาพ, Images to PDF, PDF Merge/Split/Inspect และ SHA-256 ย้ายไป Web Worker เมื่อ Browser รองรับ พร้อม Main-thread fallback
- งานที่ใช้เวลานานแสดง Progress และกดยกเลิกได้; Worker ถูก terminate เมื่อจบงาน ยกเลิก หรือออกจาก Tool
- Tool Card มีปุ่มเตรียม Offline เป็นรายเครื่องมือ และบันทึกสถานะเวอร์ชันใน IndexedDB
- Service Worker แยก App Shell cache และ Tool asset cache พร้อมล้าง Cache เวอร์ชันเก่า
- Bundle Budget บังคับใน CI: Entry ≤45 KB gzip, Lazy chunk ≤900 KB gzip และ JavaScript รวม ≤1,600 KB gzip
- Playwright ตรวจ Desktop, Android ระดับเริ่มต้น 360 px และ Android รุ่นปัจจุบัน

## Product Expansion Phase 5

- App Shell, Tool Catalog, Category และ Tool header รองรับภาษาไทย/English
- Settings Center เก็บภาษาและรูปแบบการเรียงเฉพาะในอุปกรณ์
- ส่งออก/นำเข้า JSON แบบมี Schema version สำหรับ Theme, Favorites, Recent Tools, ภาษา, ลำดับ และสถิติการใช้งาน
- เลือกเรียง Tool Catalog ตาม Registry เดิมหรือจำนวนครั้งที่เปิด โดยใช้ Registry order เป็นตัวตัดสินเมื่อคะแนนเท่ากัน
- Compatibility Check แยกความสามารถจำเป็นและส่วนเสริมของ Browser
- ยังไม่มี Backend เพราะความสามารถ Phase 5 ทั้งหมดทำงาน Client-side ได้

## เริ่มพัฒนา

ต้องใช้ Node.js 22.12 ขึ้นไป

```bash
npm install
npm run dev
```

## ตรวจสอบคุณภาพ

```bash
npm run typecheck
npm test
npm run build
npm run check:bundle
npx playwright install chromium
npm run test:e2e
```

## สถาปัตยกรรม

- `src/app` — App Shell และ Hash Router
- `src/core` — Tool Contract, Loader, Search, i18n, Portable Settings, Compatibility, PWA, Offline/IndexedDB และ Worker client
- `src/workers` — งานประมวลผลหนักที่แยกออกจาก UI thread
- `src/data` — Registry, Core Tool metadata และข้อมูลกลาง
- `src/tools` — Tool Module ที่โหลดแบบ Lazy
- `src/styles` — Design Tokens และ Custom CSS
- `public` — Manifest, Service Worker, Offline fallback และ 3D assets
- `tests` — Unit, Integration และ End-to-End tests

อ่านขั้นตอนเพิ่มเครื่องมือที่ [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md), แนวทางภาพที่ [docs/VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) และนโยบายความเป็นส่วนตัวที่ [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md)

## Privacy Baseline

- ไม่มี Login, Analytics, Backend, Cloud Storage หรือ Server-side Processing
- Favorites, Recent Tools, Theme, ภาษา, Tool order และสถิติการเปิดใช้เก็บเฉพาะใน LocalStorage; หาก LocalStorage ใช้ไม่ได้ Hub จะใช้ Memory fallback
- IndexedDB เก็บเฉพาะสถานะว่า Tool version ใดเตรียม Offline แล้ว ไม่เก็บไฟล์หรือเนื้อหาของผู้ใช้
- Image Tools รองรับ PNG/JPEG/WebP ไม่เกิน 15 MB, ด้านละไม่เกิน 12,000 px และผลลัพธ์ไม่เกิน 24 ล้านพิกเซล
- File Tools จำกัดไฟล์รวม 40 MB, PDF ไม่เกิน 200 หน้า, รวมได้สูงสุด 10 PDF หรือ 20 รูปต่อครั้ง
- QR Reader ขอสิทธิ์กล้องเมื่อผู้ใช้กดเปิดเท่านั้น และหยุด Media Track เมื่อปิดกล้อง อ่านสำเร็จ หรือออกจาก Tool
- `qrcode`, `jsqr`, `pdf-lib` และ PDF.js ถูก Bundle แบบ Lazy ภายในเว็บ ไม่มี CDN, telemetry หรือ Runtime API request
