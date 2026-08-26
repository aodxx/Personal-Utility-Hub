# Code Review Report — Personal Utility Hub v0.9.0

**วันที่ตรวจ:** 26 สิงหาคม 2026

**ขอบเขต:** เครื่องมือใหม่ 7 รายการจาก ITKB ได้แก่ PDF Page Organizer, CSV Thai Encoding Repair, JSON i18n Mapper, Batch Image Watermark, JSON-LD Generator, Flowchart Studio และ Circle/Rounded Crop รวมถึง registry, processing primitives, worker-related contracts, PWA cache, localization, guides, SVG assets, tests และ release documentation

## สรุปผล

ผล review รอบสุดท้ายอยู่ในสถานะ **พร้อมสำหรับการ Commit และรอผู้ใช้ยืนยันก่อน Push** โดยยังไม่มีการ commit หรือ push ในระหว่างการตรวจครั้งนี้

| ประเด็น | ผล |
|---|---|
| Type safety และ build | ผ่าน |
| Local-only/privacy boundary | ผ่าน; ไม่พบ fetch, XHR, WebSocket หรือ beacon ในโมดูลใหม่ |
| User-input safety | ผ่าน; Flowchart label ถูก escape ก่อนฝังใน SVG และ preview HTML ของ CSV/watermark escape ข้อความที่มาจากไฟล์ |
| Object URL/resource cleanup | ผ่านจากการตรวจ lifecycle และ E2E download workflows |
| Lazy registry/offline metadata | ผ่าน; เอา processing Worker ออกจากเครื่องมือที่ทำงานบน main thread เพื่อไม่ cache asset เกินจำเป็น |
| Mobile layout | ผ่าน E2E บน 360 × 740 และ Pixel 7 |

## Findings และการแก้ไข

### 1. Flowchart slug collision — แก้ไขแล้ว

เดิม label ที่ normalize เป็น slug เดียวกัน เช่น `A B` และ `A-B` อาจทำให้ node ID ซ้ำหรือ reference ภายหลังไม่คงที่ จึงเพิ่ม `labelIds` map เพื่อให้ label เดิม reuse ID เดิม และสร้าง suffix เฉพาะเมื่อเป็น label คนละตัวจริง พร้อมเพิ่ม regression test สำหรับ collision และ SVG escaping

### 2. Batch watermark memory guard — แก้ไขแล้ว

เครื่องมือ Batch Image Watermark เดิมจำกัดจำนวนไฟล์แต่ยังไม่จำกัด byte รวม จึงเพิ่ม guard รวมขนาด batch ไม่เกิน 40 MB โดยยังคง per-file image validation 15 MB และ pixel/dimension limits ของ shared image processing

### 3. Rounded crop browser compatibility — แก้ไขแล้ว

เพิ่ม fallback path ด้วย `arcTo` เมื่อ Canvas implementation ไม่มี `roundRect` เพื่อให้ rounded crop ยังทำงานได้บน browser/mobile profile ที่ไม่มี API ดังกล่าว

### 4. Offline preparation accuracy — แก้ไขแล้ว

PDF Page Organizer, Batch Image Watermark และ Circle/Rounded Crop ไม่ได้ใช้ processing Worker จริง จึงนำ `prepareOffline: processingWorkerAssets` ที่ไม่จำเป็นออกจาก registry เพื่อลดการ cache asset เกิน behavior จริง

## Automated evidence

| Gate | ผลลัพธ์ |
|---|---:|
| `npm run typecheck` | ผ่าน |
| `npm test` | 27 test files, 124/124 tests ผ่าน |
| Full Playwright E2E | 244 ผ่าน, 14 skipped ตามเงื่อนไขเดิมของโครงการ |
| Functional E2E ของเครื่องมือใหม่ | ทุกเครื่องมือผ่านบน Desktop Chromium และ mobile profiles; รวม 21 workflows |
| Registry check | 42 metadata modules, routes และ lazy registrations ผ่าน |
| SVG library check | 120 assets, exact duplicates 0, geometry duplicates 0, near-duplicate warnings 0 |
| Production build | ผ่าน |
| Bundle check | Entry gzip 54.8 KB, gate 56 KB; largest lazy chunk 366.1 KB; JavaScript รวม 1,220.8 KB |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| `node --check public/sw.js` | ผ่าน |
| `git diff --check` | ผ่าน |

## Functional workflows covered

PDF Page Organizer ทดสอบ upload PDF 3 หน้า, reorder, delete, watermark, page numbering และ download PDF ผลลัพธ์แล้ว ส่วน CSV Thai Encoding Repair ทดสอบ upload CSV ภาษาไทย, preview, UTF-8 BOM export และ filename output

JSON i18n Mapper ทดสอบ missing/extra/shared keys และ skeleton output ขณะที่ JSON-LD Generator ทดสอบ Product schema, URL/price validation path และ JSON/script output ส่วน Flowchart Studio ทดสอบ DSL render, SVG export และ node label handling

Batch Image Watermark ทดสอบ upload PNG, text watermark, Canvas processing และ download ส่วน Circle/Rounded Crop ทดสอบ PNG input, circle output, preview และ transparent PNG download ทุก workflow ทำงานบน desktop และ mobile profiles

## Push boundary

การตรวจครั้งนี้เป็น local validation ใน working copy บน branch `main` ซึ่งมี remote `origin` ชี้ไปยัง GitHub repository ของผู้ใช้ แต่ยัง **ไม่มี commit และไม่มี push** การดำเนินการถัดไปควรเป็นการ review diff ครั้งสุดท้าย แล้วจึงใช้คำสั่ง commit/push ที่ผู้ใช้ยืนยันเอง
