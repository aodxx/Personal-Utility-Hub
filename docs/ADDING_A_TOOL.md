# Adding a Tool — Developer Guide

คู่มือนี้อธิบายวิธีเพิ่มเครื่องมือใหม่ให้ Personal Utility Hub โดยรักษา **client-side processing, privacy by design, modular registry, lazy loading, offline/PWA และ mobile-first UX** ของโครงการไว้ เครื่องมือใหม่ต้องมี behavior ที่พิสูจน์ได้จาก source code และห้ามประกาศความสามารถที่ implementation ยังไม่มี

## 1. เลือก taxonomy ก่อนเริ่มเขียน

| Category | ตัวอย่างปัจจุบัน | Pattern ที่เหมาะสม |
|---|---|---|
| Text / Data | JSON Formatter, Privacy Redactor, CSV Profiler | Pure functions, text/file validation และ deterministic export |
| QR | QR Generator, QR Reader | Lazy dependency, camera lifecycle เมื่อเกี่ยวข้อง |
| Image | Image Resizer, Contact Sheet | ImageBitmap/object URL cleanup และ Worker เมื่อ batch ใหญ่ |
| PDF / File | PDF Merge, PDF Split, File Metadata | Lazy `pdf-lib`/PDF.js, page/byte limits และ Worker |
| Audio | Audio Trimmer, Audio Finisher, Audio Chapter Marker | Shared PCM pipeline, waveform, preview/export, Worker/fallback |
| Future categories | Video หรือ archive tools | ต้องมี contract, privacy boundary และ bundle rationale ก่อนเพิ่มหมวด |

อย่าเพิ่ม category ใหม่เพียงเพราะชื่อ tool แตกต่าง หาก processing semantics ยังอยู่ในหมวดเดิม ควรใช้ category ที่มีอยู่เพื่อให้ search, localization และ visual system สอดคล้องกัน

## 2. โครงสร้าง Tool Module

ทุก tool ที่ active ควรมีโครงสร้างขั้นต่ำดังนี้:

```text
src/tools/<tool-id>/
  metadata.ts
  index.ts
```

`metadata.ts` ประกาศ `id`, title/description, category, route, icon, tags, processing mode, `supportsOffline`, `requiresFile`, status และ tool version ผ่าน `ToolMetadata` contract ส่วน `index.ts` export metadata และ lifecycle ของ tool อย่างน้อย `mount(container, context)` ซึ่งคืน cleanup function หรือมี `unmount()` ตาม convention ของ module

ตัวอย่าง metadata แบบย่อ:

```ts
export const metadata = {
  id: 'example-tool',
  title: 'Example Tool',
  description: 'ทำงานใน browser โดยไม่อัปโหลดไฟล์',
  category: 'ข้อความและข้อมูล',
  route: '/tools/example-tool',
  icon: 'tool-text-formatter',
  tags: ['example'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
} as const satisfies ToolMetadata;
```

การเพิ่ม tool ต้องลงทะเบียนใน `src/data/tools.ts` ด้วย dynamic import และเตรียม offline assets ผ่าน shared helper เมื่อจำเป็น อย่า import implementation หนักแบบ static จาก App Shell เพราะจะทำให้ lazy chunk และ entry bundle โตขึ้น

## 3. Shared Audio Architecture

Audio tools เป็นตัวอย่างของ **processing-heavy tool** และไม่ควร copy PCM logic ไปไว้ในหน้าแต่ละ tool ความสัมพันธ์หลักมีดังนี้:

```text
src/core/audio-processing.ts
        │ pure PCM operations, validation, metrics
        ▼
src/core/processing-client.ts
        │ Worker dispatch, cloned transferable buffers, fallback
        ▼
src/workers/processing.worker.ts
        │ audio-trim / audio-process jobs, progress, errors
        ▼
src/tools/audio-workbench.ts
        │ waveform, controls, preview/export, lifecycle
        ▼
src/data/tools.ts
        │ lazy registry entry, metadata, offline assets
```

### Logic ที่ควร reusable

`src/core/audio-processing.ts` ควรเก็บ typed operation unions, PCM transforms, resampling, channel handling, gain/peak calculations, silence detection และ deterministic result metrics ฟังก์ชันเหล่านี้ควรรับ typed data และ options ที่ validate แล้ว ไม่ควรอ่าน DOM, สร้าง download link หรือแสดงข้อความภาษาใดภาษาหนึ่ง

`src/tools/audio-workbench.ts` ควรเก็บ lifecycle และ UI pattern ที่แชร์กัน เช่น waveform rendering, input file state, Preview/Export separation, progress/cancel, result metrics และ object URL management ส่วน operation-specific controls, labels, validation copy, output naming และ mapping ของ options ต้องอยู่ใน tool module หรือ metadata ที่ชัดเจน

### Worker และ fallback

งานที่ decode/process PCM จำนวนมากหรือใช้เวลานานควรเรียกผ่าน `processing-client.ts` เพื่อใช้ Dedicated Worker เมื่อพร้อม `processing.worker.ts` เป็นจุด dispatch ของ `audio-trim` และ `audio-process` พร้อม progress/error messages หาก Worker ใช้ไม่ได้ ต้องมี deterministic main-thread fallback ที่ใช้ processing function เดียวกัน ไม่ควรมี algorithm สองชุดที่ให้ผลต่างกันโดยไม่จำเป็น

ก่อน transfer `ArrayBuffer` หรือ typed array ต้อง clone input ทุกครั้ง หาก workflow รองรับ Preview แล้ว Export ซ้ำ เพื่อไม่ให้ buffer เดิมกลายเป็น detached buffer หลัง Preview การยกเลิกต้อง abort หรือหยุดงานที่ทำได้, terminate Worker และคืน UI สู่ state ที่ใช้งานต่อได้

### Cleanup contract

ทุก tool ต้อง cleanup `AudioContext`, Worker, `AbortController`, `Object URL`, `ImageBitmap`, MediaStream track และ event listener ที่ตนสร้าง เมื่อเปลี่ยน input, เปลี่ยน output, เกิด error, กด cancel หรือ unmount ห้ามพึ่งพา page reload เพื่อคืน resource และต้อง revoke URL เก่าก่อนสร้าง URL ใหม่

## 4. Privacy, metadata และ Offline

Metadata ต้องระบุ `processing: 'client-side'`, `supportsOffline` และ `requiresFile` ให้ตรงกับ behavior จริง คำว่า AI, lossless, mastering, serverless หรือ secure deletion ห้ามใช้ถ้า source code ไม่รองรับโดยตรง

Tool ที่รองรับ offline ควรมี `prepareOffline` ใน registry เพื่อให้ `OfflineToolManager` รวบรวม loaded resources และ additional assets แล้วส่งให้ Service Worker cache ใน version ปัจจุบัน Tool metadata version ใช้ตรวจว่า asset ของ tool เป็นรุ่นเดียวกับ registry ส่วน `OFFLINE_CACHE_VERSION` ใช้ invalidate release cache ทั้งชุด

ห้ามเก็บไฟล์หรือเนื้อหาไฟล์ลง LocalStorage/IndexedDB เว้นแต่มี product contract ใหม่ที่ได้รับการออกแบบเฉพาะ ข้อมูล settings เดิมใช้ Portable Settings `schemaVersion: 1`; การเพิ่ม tool ไม่ควร bump schema หรือทำลาย favorite/recent/usage records

## 5. UI/UX และ localization

Tool page ต้องมี empty, loading, processing, cancel, success และ error states ที่เข้าใจได้บนมือถือ ปุ่มหลักต้องมี accessible name, focus state และ touch target ที่เหมาะสม Preview ต้องแยกจาก Export อย่างชัดเจน และ Download ต้องเปิดหลัง processing สำเร็จเท่านั้น

เพิ่มข้อความทั้งภาษาไทยและ English ใน `src/core/i18n.ts` และ metadata โดยใช้ locale fallback ที่มีอยู่ อย่า hard-code ภาษาใน shared component ตรวจ mobile viewport `360 × 740` และ Pixel 7 class โดยเฉพาะ waveform, sliders, multi-file lists และ result metrics ที่อาจทำให้เกิด horizontal overflow

## 6. Testing contract

ก่อนเปิดสถานะ active ให้เพิ่มการตรวจที่เหมาะกับประเภท tool:

| ระดับ | สิ่งที่ต้องตรวจ |
|---|---|
| Pure unit | validation, bounds, Unicode/newline, PCM output, headers, metrics และ edge cases |
| Registry/integration | metadata contract, lazy loading, category, localization, offline flag และ tool count เมื่อ count เป็น contractual |
| Browser E2E | upload → configure → Preview → Export/Download → result metrics และ error/cancel path |
| Mobile | 360px layout, touch controls, no overflow, waveform/list wrapping และ accessible labels |
| Release | build, bundle budget, Service Worker syntax, `npm audit` และ production smoke เมื่อ deploy |

Audio tool ที่มี preview/export ต้องทดสอบ repeated Preview → Export และควรมี mono/stereo, sample-rate ต่างกัน, silence/non-silence, invalid file และ cancel coverage ตาม behavior ที่รองรับ อย่าใช้เพียงการพบข้อความ “สำเร็จ” เป็นหลักฐานว่า processing complete หาก UI มี upload success แยกจาก processing success

## 7. Quality gate และ checklist

รันคำสั่งต่อไปนี้ก่อน commit:

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

ตรวจ `git diff --stat`, `git status --short` และยืนยันว่าไม่มี debug/temp artifacts จากนั้นอัปเดต `README.md`, `PROGRESS.md` และ `TEST_REPORT.md` เมื่อ behavior, version หรือ test evidence เปลี่ยน การประกาศ release ต้องมี GitHub Actions run บน commit HEAD และ Production GitHub Pages smoke evidence ไม่ใช่ local result อย่างเดียว
