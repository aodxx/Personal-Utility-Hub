# Personal Utility Hub — Progress Report

> ไฟล์นี้เป็นแหล่งข้อมูลกลางสำหรับติดตามสถานะการพัฒนา การทดสอบ การ Merge การเผยแพร่ ปัญหาค้าง และขั้นตอนถัดไปของโครงการ  
> ข้อกำหนดผลิตภัณฑ์ให้อ้างอิง `PRD.md` ส่วนผลการทดสอบโดยละเอียดให้อ้างอิง `TEST_REPORT.md`

**อัปเดตล่าสุด:** 15 สิงหาคม 2026
**สถานะโครงการ:** Phase 0–4 และ UX/UI Refinement เผยแพร่แล้ว; Phase 5 พัฒนา Audio Trimmer และผ่าน Local validation
**Phase ปัจจุบัน:** Phase 5 — Product Expansion
**เวอร์ชันปัจจุบัน:** `0.7.0`
**เว็บไซต์:** https://aodxx.github.io/Personal-Utility-Hub/

---

## 1. สรุปสถานะ

| Phase | ชื่อ | สถานะ | หลักฐานสำคัญ |
|---|---|---|---|
| Phase 0 | Foundation | ✅ เสร็จสิ้นและเผยแพร่แล้ว | PR #1, Foundation CI ผ่าน, GitHub Pages ทำงาน |
| Phase 1 | Hub MVP | ✅ เสร็จสิ้น Merge และเผยแพร่แล้ว | PR #6, CI 22/22, E2E 8/8, Deploy ผ่าน |
| Phase 2 | Visual System + Core Tools | ✅ เสร็จสิ้นและเผยแพร่แล้ว | PR #7 และ #8 Merge; CI Run #26 และ Pages Run #10 ผ่าน |
| Phase 3 | File Tools | ✅ เสร็จสิ้นและเผยแพร่แล้ว | PR #9 Merge; CI 36/36, E2E 20/20 และ Production ตอบ 200 |
| Phase 4 | Performance and Offline | ✅ เสร็จสิ้นและเผยแพร่แล้ว | PR #10 Merge; CI Run #38 ผ่าน 40/40 Unit/Integration และ E2E 36/36 |
| Pre-Phase 5 | UX/UI Refinement | ✅ เสร็จสิ้นและเผยแพร่แล้ว | PR #11–12; Compact cards, Full-card navigation และ Touch feedback |
| Phase 5 | Product Expansion | 🧪 รอตรวจสอบ | TH/EN, Portable Settings, Usage order และ Compatibility Check ผ่าน Local validation |

ความคืบหน้าตาม Roadmap: **เสร็จแล้ว 5 จาก 6 Phase**

---

## 2. Phase 0 — Foundation

**สถานะ:** ✅ เสร็จสิ้น  
**PR:** [#1 — Build Phase 0 foundation](https://github.com/aodxx/Personal-Utility-Hub/pull/1)  
**Merge commit:** [`ab3428a0c97cd008c027e2596b5da804eab73c31`](https://github.com/aodxx/Personal-Utility-Hub/commit/ab3428a0c97cd008c027e2596b5da804eab73c31)

### สิ่งที่ส่งมอบ

- Vite + TypeScript แบบ Strict
- โครงสร้าง `src/app`, `src/components`, `src/core`, `src/data`, `src/tools`, `src/styles`, `public` และ `tests`
- Tool Metadata, Tool Contract และ Metadata validation
- Hash Router, Lazy Tool Loader และ lifecycle `mount()` / `unmount()`
- App Shell, Loading, Error และ Not Found states
- Custom CSS Design Foundation พร้อม Light/Dark color scheme
- GitHub Actions สำหรับ CI และ GitHub Pages
- README, คู่มือเพิ่ม Tool และ Privacy/Dependency policy
- Foundation Demo สำหรับพิสูจน์ Registry → Route → Lazy Load → Lifecycle

### ผลการตรวจสอบ

- TypeScript strict typecheck — ผ่าน
- Unit/Integration tests — ผ่าน 13/13
- Production build — ผ่าน
- Playwright — ผ่านบน Desktop และ Android viewport ใน GitHub Actions
- Dependency audit — 0 vulnerabilities

---

## 3. Phase 1 — Hub MVP

**สถานะ:** ✅ เสร็จสิ้น Merge และเผยแพร่แล้ว  
**PR:** [#6 — Build Phase 1 Hub MVP](https://github.com/aodxx/Personal-Utility-Hub/pull/6)  
**Phase head commit:** [`db42ca11023883e6427390c783aba2f4ee403b91`](https://github.com/aodxx/Personal-Utility-Hub/commit/db42ca11023883e6427390c783aba2f4ee403b91)  
**Merge commit:** [`05554a61972e4f16780bef8d4516b1b340a9ee1c`](https://github.com/aodxx/Personal-Utility-Hub/commit/05554a61972e4f16780bef8d4516b1b340a9ee1c)  
**Merged:** 12 สิงหาคม 2026

### สิ่งที่ส่งมอบ

- หน้า Hub แบบ Mobile-first
- Search ภาษาไทยจากชื่อ คำอธิบาย หมวดหมู่ และ Tags
- Category Filter และ Favorites Filter
- Tool Card, Privacy Badge และสถานะ Planned
- Favorites และ Recent Tools ด้วย LocalStorage
- Memory fallback เมื่อ LocalStorage ถูกปิดหรือใช้งานไม่ได้
- Light/Dark Mode และบันทึกค่าธีมในอุปกรณ์
- PWA Manifest, Service Worker, Offline fallback และ App icons
- Registry ของ Core Tools 7 รายการในสถานะ “เร็ว ๆ นี้”
- ปรับ README, Privacy policy และ Test Report ให้ตรงกับ Phase 1

### ผลการตรวจสอบ

- TypeScript strict typecheck — ผ่าน
- Unit/Integration tests — ผ่าน 22/22
- Playwright Desktop + Android Pixel 7 viewport — ผ่าน 8/8
- Production build สำหรับ GitHub Pages subpath — ผ่าน
- Dependency audit — 0 vulnerabilities
- CI บน `main` หลัง Merge — ผ่าน
- GitHub Pages Deploy Run #7 — ผ่าน

### หมายเหตุการตรวจจริง

- เว็บไซต์ Production เผยแพร่จาก Vite `dist` ผ่าน GitHub Actions แล้ว
- การติดตั้ง PWA และ Offline App Shell มี automated validation แล้ว
- ยังไม่มีบันทึกผลการติดตั้ง PWA บนอุปกรณ์ Android จริงของผู้ใช้ การตรวจนี้ไม่ขวางการเริ่ม Phase 2 แต่ต้องทำก่อนปิดเกณฑ์ MVP ขั้นสุดท้าย

---

## 4. Phase 2 — Core Tools

**สถานะ:** ✅ เสร็จสิ้น Merge และเผยแพร่แล้ว

**Core Tools Branch:** `agent/phase-2-core-tools`

**Core Tools Pull Request:** [#8 — Build Phase 2 core tools](https://github.com/aodxx/Personal-Utility-Hub/pull/8)

**Core Tools source commit:** [`f87df1d37bb75bf38cc0638612d9730991a3338f`](https://github.com/aodxx/Personal-Utility-Hub/commit/f87df1d37bb75bf38cc0638612d9730991a3338f)

**Core Tools Merge commit:** [`643cf81c67d2ea8fd8f0da30dfb67f838e481a3a`](https://github.com/aodxx/Personal-Utility-Hub/commit/643cf81c67d2ea8fd8f0da30dfb67f838e481a3a)

**Visual System PR:** [#7 — Build Phase 2 3D visual system](https://github.com/aodxx/Personal-Utility-Hub/pull/7)

**Visual System Merge commit:** [`f128766b13796298739890cb3ade7fa5938d6f50`](https://github.com/aodxx/Personal-Utility-Hub/commit/f128766b13796298739890cb3ade7fa5938d6f50)

**Merged:** 12 สิงหาคม 2026

### Visual System Upgrade — ✅ Merge และเผยแพร่แล้ว

- สร้าง Art Direction แบบ 3D clay/glass โทน Indigo–Violet–Cyan พร้อม Lime accent
- สร้างชุด Asset สำหรับ 8 Category states และ 7 Core Tools
- ใช้ self-hosted SVG sprite เพื่อความคมชัด ไฟล์เล็ก และใช้งาน Offline
- เพิ่ม typed asset renderer และ Category/Tool asset mapping
- ปรับ Hero, Tool Card, Category tabs และ Planned Tool panel ให้รองรับภาพ 3D
- เพิ่ม Design Tokens สำหรับ gradient, shadow, visual surface และขนาด Asset ใน Light/Dark Mode
- เพิ่ม Asset เข้า Service Worker precache
- เพิ่มเอกสาร `docs/VISUAL_SYSTEM.md` และ automated asset validation
- GitHub Actions CI Run #22 ผ่าน: TypeScript, 25/25 Unit/Integration, Production build และ Playwright 8/8 บน Desktop/Android
- GitHub Pages Deploy Run #9 หลัง Merge — ผ่าน

### Core Tools — ✅ Merge และเผยแพร่แล้ว

- JSON Formatter / Validator — Format, Minify, Validate และ Copy
- Base64 Encoder / Decoder — รองรับ UTF-8 ภาษาไทยและอีโมจิ
- Text Formatter — Trim lines, Collapse spaces, Remove blank lines และ Case conversion
- QR Code Generator — PNG 256/512/1024 px ด้วย `qrcode`
- Image Resizer — กำหนด Width/Height, Lock ratio, Preview และ Download
- Image Converter — PNG/JPEG/WebP, Quality, Preview และ Download
- QR Code Reader — อ่านจาก PNG/JPEG/WebP หรือกล้องด้วย `jsqr`
- ทุก Tool เปลี่ยน Metadata จาก `planned` เป็น `active` และโหลด Bundle แบบ Lazy
- เพิ่ม Responsive Tool UI, Loading/Success/Error states และ Keyboard-friendly controls
- เพิ่ม file size/dimension limits, ImageBitmap cleanup, Object URL cleanup และ Camera lifecycle
- Service Worker cache version เปลี่ยนเป็น `utility-hub-v0.4.0-core-tools`

### ผลการตรวจในเครื่อง

- TypeScript strict typecheck — ผ่าน
- Unit/Integration — 31/31
- Production build และ GitHub Pages subpath — ผ่าน
- Service Worker syntax และ `git diff --check` — ผ่าน
- Dependency audit — 0 vulnerabilities
- GitHub Actions CI Run #25 บน PR และ Run #26 บน `main` — ผ่าน
- Playwright 7 cases × 2 viewports = 14 executions — ผ่าน 14/14 บน Desktop Chromium และ Android Pixel 7
- GitHub Pages Deploy Run #10 หลัง Merge — ผ่าน

### ขั้นตอนถัดไป

Phase 2 ปิดแล้ว เริ่ม Phase 3 จาก Merge commit `643cf81c…`

---

## 5. Phase 3 — File Tools

**สถานะ:** ✅ เสร็จสิ้น Merge และเผยแพร่แล้ว

**Branch:** `agent/phase-3-file-tools`

**Pull Request:** [#9 — Build Phase 3 file tools](https://github.com/aodxx/Personal-Utility-Hub/pull/9)

**Merge commit:** [`0b3cf36e0640f2f4fdcbc17c34a96a4dc980a3da`](https://github.com/aodxx/Personal-Utility-Hub/commit/0b3cf36e0640f2f4fdcbc17c34a96a4dc980a3da)

**Source commit:** [`77bb6e84714e9334f63368bd1da2c6abd8bb23f2`](https://github.com/aodxx/Personal-Utility-Hub/commit/77bb6e84714e9334f63368bd1da2c6abd8bb23f2)

**Browser assertion fix:** [`072f4006d62f3103ad459c9c06d370f48be846a8`](https://github.com/aodxx/Personal-Utility-Hub/commit/072f4006d62f3103ad459c9c06d370f48be846a8)

**ฐาน Branch:** Phase 2 Merge commit `643cf81c67d2ea8fd8f0da30dfb67f838e481a3a`

### สิ่งที่พัฒนาแล้วใน Branch

- Image Compressor — เลือก WebP/JPEG, Quality และด้านยาวสูงสุด พร้อม Preview/Download
- Images to PDF — สูงสุด 20 รูป, หนึ่งหน้า A4 ต่อรูป, แนวหน้าอัตโนมัติ
- PDF Merge — สูงสุด 10 ไฟล์, รวมตามลำดับที่เลือก
- PDF Split — เลือกหน้า/ช่วงหน้า เช่น `1-3,5` แล้วสร้าง PDF ใหม่
- PDF to Image — เลือกหน้า, Scale และ PNG/JPEG ด้วย PDF.js Worker
- File Metadata Viewer — ชื่อ, MIME, ขนาด, วันที่, SHA-256, ขนาดรูป และ PDF metadata
- เพิ่ม 3D SVG Asset 6 รายการใน Visual System เดิม
- เพิ่ม `pdf-lib@1.17.1` และ `pdfjs-dist@6.2.108` แบบ Lazy/Dynamic import
- จำกัดไฟล์รวม 40 MB, PDF ไม่เกิน 200 หน้า, รูปสูงสุด 20 ไฟล์
- Service Worker cache เปลี่ยนเป็น `utility-hub-v0.5.0-file-tools`

### ผลตรวจปัจจุบัน

- TypeScript strict typecheck — ผ่าน
- Unit/Integration — 36/36
- Production build และ GitHub Pages subpath — ผ่าน
- Service Worker syntax, `git diff --check` — ผ่าน
- Dependency audit — 0 vulnerabilities
- GitHub Actions CI Run #28 — ผ่าน
- Playwright 10 cases × 2 viewports = 20 executions — ผ่าน 20/20 บน Desktop Chromium และ Android Pixel 7
- CI Run #27 พบ Smoke assertion เดิมคาด 8 Cards; แก้ให้ตรงกับ Phase 3 ที่มี 14 Cards แล้ว Run #28 ผ่าน

### ผลหลัง Merge

- PR #9 Merge เมื่อ 12 สิงหาคม 2026 เวลา 07:58 UTC
- Production GitHub Pages ตอบ HTTP 200 และ `last-modified` หลังเวลา Merge
- Phase 4 เริ่มจาก Merge commit `0b3cf36e…`

---

## 6. Phase 4 — Performance and Offline

**สถานะ:** ✅ เสร็จสิ้น Merge และเผยแพร่แล้ว

**Branch:** `agent/phase-4-performance-offline`

**Pull Request:** [#10 — Build Phase 4 performance and offline](https://github.com/aodxx/Personal-Utility-Hub/pull/10)

**Merge commit:** [`fe194b2c972b57d87f0b930f50569e5cbd3d7318`](https://github.com/aodxx/Personal-Utility-Hub/commit/fe194b2c972b57d87f0b930f50569e5cbd3d7318)

**CI-validated source commit:** [`d272790cd687217ab0b8027a6293bf1cc113794e`](https://github.com/aodxx/Personal-Utility-Hub/commit/d272790cd687217ab0b8027a6293bf1cc113794e)

**ฐาน Branch:** Phase 3 Merge commit `0b3cf36e0640f2f4fdcbc17c34a96a4dc980a3da`

### สิ่งที่พัฒนาแล้วใน Branch

- Dedicated Web Worker สำหรับ Image Resize/Convert/Compress, Images to PDF, PDF Merge/Split/Inspect และ SHA-256
- Progress status และปุ่ม Cancel; Worker ถูก terminate หลัง Success/Error/Cancel/Unmount
- Main-thread fallback สำหรับ Browser ที่ไม่มี Worker หรือ OffscreenCanvas
- IndexedDB เก็บ Offline readiness ต่อ Tool/version โดยไม่เก็บไฟล์หรือเนื้อหาผู้ใช้
- Tool Card มีปุ่ม “เตรียม Offline” และ Service Worker แยก App Shell cache/Tool cache
- Tool Registry รองรับ `prepareOffline()` เพื่อ Cache Worker และ PDF.js asset ที่ Lazy-loaded
- เพิ่ม Bundle Budget ใน CI และแก้ Worker build ให้เป็น JavaScript asset จริง
- Playwright เพิ่ม Android entry profile 360 × 740 ควบคู่ Desktop และ Pixel 7
- WebAssembly review: ยังไม่เพิ่ม Dependency เพราะ Worker + Browser API แก้ UI blocking ได้โดยไม่เพิ่ม Bundle

### ผลตรวจปัจจุบัน

- TypeScript strict typecheck — ผ่าน
- Unit/Integration — 40/40
- Production build และ Worker bundle — ผ่าน
- Bundle Budget — Entry 10.8 KB gzip; Largest lazy 366.1 KB; JavaScript รวม 929.6 KB/24 chunks
- Dependency audit — 0 vulnerabilities
- Service Worker syntax และ `git diff --check` — ผ่าน
- GitHub Actions CI Run #37 — ผ่าน
- Playwright 12 cases × 3 profiles = 36 executions — ผ่าน 36/36 บน Desktop Chromium, Android entry 360 × 740 และ Android Pixel 7
- CI Runs #31–36 ช่วยตรวจพบ Offline regression: ปรับ E2E selector ให้ตรง Accessible Name, รอ Service Worker controller, รอ runtime cache writes และใช้ Cache API `ignoreVary` เพื่อให้ Entry JS/CSS ถูกคืนจาก Cache หลังตัด Network
- Offline App Shell, Entry JS/CSS และ JSON Formatter chunk ผ่านการตรวจ Cache และเปิดใช้งานหลัง reload แบบไม่มี Network จริง

### ขั้นตอนถัดไป

PR #10 Merge แล้ว และ Production GitHub Pages ตอบ HTTP 200 หลัง Merge จากนั้นแยก Branch `agent/pre-phase-5-compact-ui` เพื่อปรับ UX/UI ก่อนเริ่ม Phase 5

### Pre-Phase 5 UX/UI Refinement — ✅ Merge และเผยแพร่แล้ว

- ลด Tool Card บน Desktop จากความสูงขั้นต่ำ 23rem เป็น 17rem พร้อมลดขนาด Visual, Padding และตัวอักษรอย่างพอดี
- บน Mobile 360px เปลี่ยนเป็น Horizontal card: ไอคอนซ้าย, เนื้อหากลาง, Favorites ขวา และ Footer แบบสั้นด้านล่าง
- จำกัดคำอธิบายสองบรรทัด โดยยังคง Category, Status, Privacy, Offline และลิงก์เปิด Tool
- เพิ่ม Active/Ripple feedback ให้ปุ่มหลัก, Category และ Offline controls
- เพิ่ม Favorite bounce หลัง LocalStorage เปลี่ยนสถานะสำเร็จ พร้อม `aria-live` feedback
- เคารพ `prefers-reduced-motion` และคงพื้นที่แตะ Favorites 44 × 44px
- TypeScript, Unit/Integration 40/40, Production build, Bundle Budget, audit 0 vulnerabilities และ `git diff --check` ผ่านในเครื่อง
- เพิ่ม Playwright ตรวจ Mobile 360 × 740 ว่ามี Tool Cards เต็มอย่างน้อย 3 ใบใน viewport และ Layout/สถานะปุ่มถูกต้อง
- Draft PR #11 และ GitHub Actions CI Run #40 ผ่าน: Playwright 37 executions ผ่านทั้งหมด พร้อม 2 skips ที่ตั้งใจไว้สำหรับ test เฉพาะ Android entry บน Desktop/Pixel 7
- PR #11 Merge เข้า `main` ที่ `41a646b95c9c857eb93d13590c1e2cc118e86325`
- หลังทดสอบ Production พบไอคอน Mobile ล้นลงทับ Privacy/Offline footer และจุดเปิด Tool ยังเล็ก จึงแยก Draft PR #12 บน Branch `agent/fix-tool-card-interaction`
- PR #12 เปลี่ยน Icon wrapper เป็น Grid area ที่มีขอบเขตชัดเจน, นำ `display: contents` ออก, จำกัด SVG overflow และทำ Full-card semantic link โดยแยก Favorite/Offline controls ไว้เหนือ Link layer
- GitHub Actions CI Run #44 ผ่าน: 40/40 Unit/Integration, Playwright 37 ผ่าน พร้อม 2 intentional skips, TypeScript, Production build และ Bundle Budget ผ่านครบ
- PR #12 Merge เข้า `main` ที่ `949103b45bdc7054181aadb6321ac89eb26ae722`

---

## 7. Phase 5 — Product Expansion

**สถานะ:** 🧪 พัฒนาแล้วและรอ Browser CI/Review

**Branch:** `agent/phase-5-product-expansion`

**ฐาน Branch:** PR #12 Merge commit `949103b45bdc7054181aadb6321ac89eb26ae722`

### สิ่งที่พัฒนาแล้วใน Branch

- เพิ่มภาษาไทย/English สำหรับ App Shell, Tool Catalog, Category, Settings และ Tool header พร้อมบันทึกภาษาบนอุปกรณ์
- เพิ่ม Settings Center สำหรับภาษา, ลำดับเครื่องมือ, Compatibility Check และข้อมูลการตัดสินใจไม่ใช้ Backend
- ส่งออก/นำเข้าการตั้งค่า JSON `schemaVersion: 1` ครอบคลุม Theme, Favorites, Recent, ภาษา, Tool order และสถิติการเปิดใช้
- ตรวจ Schema, Enum, Tool ID และเพดานไฟล์นำเข้า 256 KB ก่อนเขียน LocalStorage
- บันทึกจำนวนครั้งที่เปิด Tool และเลือกเรียงแบบ Registry เดิมหรือใช้บ่อยก่อน โดยใช้ Registry order เมื่อตัวเลขเท่ากัน
- ตรวจ File/Blob, Canvas และ Worker เป็นความสามารถจำเป็น; IndexedDB, Service Worker, Clipboard และ Camera เป็นความสามารถเสริม
- คงสถาปัตยกรรม Static PWA โดยไม่เพิ่ม Backend หรือ Runtime dependency
- อัปเดต Service Worker cache เป็น `v0.7.0-product-expansion`

### ผลตรวจในเครื่อง

- TypeScript strict typecheck — ผ่าน
- Unit/DOM integration — 47/47
- Production build — ผ่าน
- Bundle Budget — Entry 15.9 KB gzip; Largest lazy 366.1 KB; JavaScript รวม 934.8 KB/24 chunks
- Dependency audit — 0 vulnerabilities
- Service Worker syntax และ `git diff --check` — ผ่าน
- เตรียม Playwright เพิ่ม 4 cases × 3 profiles สำหรับภาษา, Usage order/Full-card navigation, Compatibility และ Settings round-trip
- Local ไม่มี Chromium executable จึงรอ GitHub Actions ตรวจ Browser suite รวม 51 executions

### Audio Trimmer — ✅ พัฒนาและตรวจสอบในเครื่องแล้ว

- เพิ่ม Audio Trimmer แบบ client-side สำหรับ MP3, WAV, M4A, OGG และ WebM สูงสุด 80 MB / 30 นาที
- เพิ่ม waveform preview, range controls สำหรับเวลาเริ่ม/จบ, preview เฉพาะช่วง และ Fade in/out
- เพิ่มการตัดและ encode เป็น WAV PCM 16-bit พร้อมแสดง duration, channels, sample rate และ output size
- เพิ่ม `audio-trim` processing protocol, Dedicated Worker และ main-thread fallback พร้อม progress/cancel lifecycle
- เชื่อม Tool Registry, Offline preparation, file-tools catalog และ TH/EN localization
- เพิ่ม unit tests สำหรับ validation, bounds, fade, WAV header และ Playwright E2E สำหรับ workflow จริง
- ผลตรวจล่าสุด: TypeScript ผ่าน, Unit/Integration 51/51, Production build ผ่าน, Bundle Budget ผ่าน และ Playwright 52 ผ่าน / 2 intentional skips จาก 54 executions

---

## 8. สถานะระบบปัจจุบัน

### Architecture

- Static PWA + Vite + TypeScript + Custom CSS
- Modular Tool Registry และ Lazy Loading
- Client-side Hash Routing
- Client-side Processing เป็นค่าเริ่มต้น
- Dedicated Worker + Main-thread fallback สำหรับงานหนัก
- IndexedDB เฉพาะ Offline readiness และ Cache API สำหรับ Tool assets
- Hosting ผ่าน GitHub Pages
- ไม่มี Backend, Database, Login, Cloud Storage หรือ Server-side Processing

### Privacy และข้อมูล

- ไม่มีการอัปโหลดไฟล์ผู้ใช้
- ไม่มี Analytics ที่เก็บข้อมูลส่วนบุคคลหรือเนื้อหาไฟล์
- Favorites, Recent Tools, Theme, ภาษา, Tool order และสถิติการเปิดใช้เก็บใน LocalStorage ของอุปกรณ์
- เมื่อ LocalStorage ใช้งานไม่ได้ ระบบทำงานต่อด้วย Memory fallback
- Runtime Dependency คือ `qrcode@1.5.4`, `jsqr@1.4.0`, `pdf-lib@1.17.1` และ `pdfjs-dist@6.2.108`; ทุกตัว Bundle แบบ Lazy ไม่มี CDN/API/telemetry

### สถานะเครื่องมือ

| Tool group | Production `main` | Branch `agent/phase-5-product-expansion` |
|---|---|---|
| Foundation Demo | Active | Active |
| Core Tools 7 รายการ | Active — CI/E2E ผ่าน | Active + localized metadata |
| File Tools 7 รายการ | Active — CI/E2E ผ่าน | Active + localized metadata + Audio Trimmer |
| Offline ราย Tool | IndexedDB + Service Worker cache | คงเดิม + Compatibility status |
| Product Expansion | ไม่มี | TH/EN + Portable Settings + Usage order |

---

## 9. ปัญหาและงานค้าง

### Blocking

- ไม่มี Source/Build/Unit test blocker

### Non-blocking / ต้องตรวจภายหลัง

- ทดสอบติดตั้ง PWA บนอุปกรณ์ Android จริง
- ทดสอบ Offline App Shell บนอุปกรณ์จริงหลังเคยเปิดเว็บไซต์อย่างน้อยหนึ่งครั้ง
- ทดสอบ QR Reader ด้วยกล้องจริงบน Android หลัง Merge; automated suite ตรวจ flow จากไฟล์ QR ส่วน lifecycle กล้องตรวจจาก Source/DOM
- ทดสอบ PDF ขนาดใกล้เพดานและไฟล์จากมือถือ Android จริงหลัง Deploy
- Browser suite 51 executions ต้องรันใน GitHub Actions เพราะ Local ไม่มี Chromium executable
- ต้องทบทวน Service Worker cache version ทุกครั้งที่เปลี่ยน Production assets เพื่อป้องกันหน้าเก่าค้าง

---

## 10. การตัดสินใจสำคัญ

| วันที่ | การตัดสินใจ | เหตุผล |
|---|---|---|
| 11 ส.ค. 2026 | ใช้ Static PWA + Vite + TypeScript + Custom CSS | เหมาะกับ GitHub Pages และ Client-side Processing |
| 11 ส.ค. 2026 | ไม่มี Backend/Login ใน MVP | ลดความซับซ้อนและรักษาความเป็นส่วนตัว |
| 11 ส.ค. 2026 | ใช้ Hash Router | รองรับ Static Hosting และ project subdirectory |
| 11 ส.ค. 2026 | ใช้ Modular Tool Registry/Contract | เพิ่ม Tool ได้โดยไม่แก้ Hub Core โดยตรง |
| 12 ส.ค. 2026 | Core Tools 7 รายการแสดงเป็น Planned ใน Phase 1 | ให้ผู้ใช้เห็น Roadmap โดยยังไม่อ้างว่าเครื่องมือทำงานแล้ว |
| 12 ส.ค. 2026 | ใช้ GitHub Actions เป็น GitHub Pages source | เผยแพร่ Vite `dist` แทน Source code ที่ยังไม่ Build |
| 12 ส.ค. 2026 | เพิ่ม `PROGRESS.md` เป็นสถานะกลาง | ลดความคลาดเคลื่อนระหว่าง PRD, PR, CI และเว็บไซต์จริง |
| 12 ส.ค. 2026 | เริ่ม Phase 2 ด้วย 3D Visual System Upgrade | ทำให้ Category และ Tool UI ใช้ภาพคุณภาพสูงในทิศทางเดียวกันก่อนเปิดใช้ Core Tools |
| 12 ส.ค. 2026 | ใช้ self-hosted SVG sprite เป็น Production Asset | คมชัด ไฟล์เล็ก รองรับ Offline และไม่พึ่ง CDN/API |
| 12 ส.ค. 2026 | ใช้ `qrcode` และ `jsqr` เฉพาะ Tool ที่เกี่ยวข้องแบบ Lazy | Browser API ไม่มีมาตรฐานสร้าง QR และการรองรับ BarcodeDetector ยังไม่สม่ำเสมอ |
| 12 ส.ค. 2026 | จำกัด Image input 15 MB, 12,000 px/ด้าน และ 24 MP | ลดความเสี่ยง Memory สูงบน Android และให้ Error ที่เข้าใจได้ก่อนประมวลผล |
| 12 ส.ค. 2026 | ใช้ `pdf-lib` สำหรับสร้าง/รวม/แยก PDF และ PDF.js สำหรับเรนเดอร์ | รองรับ Client-side โดยไม่ต้องมี Backend และแยกโหลดตาม Tool ได้ |
| 12 ส.ค. 2026 | จำกัด File Tools ที่ 40 MB, 200 หน้า, 10 PDF หรือ 20 รูป | ควบคุม Memory บนอุปกรณ์ Android ระดับเริ่มต้น |
| 12 ส.ค. 2026 | Dynamic import PDF.js หลังเลือกไฟล์ | ไม่ให้ API/Worker ขนาดใหญ่กระทบหน้า Hub และ Tool อื่น |
| 12 ส.ค. 2026 | ใช้ Dedicated Worker แบบหนึ่ง Worker ต่อหนึ่งงาน | ยกเลิก/คืน Memory ได้แน่นอนด้วย `terminate()` และไม่ให้ UI thread ค้าง |
| 12 ส.ค. 2026 | IndexedDB เก็บเฉพาะ Offline readiness | รองรับ Cache ราย Tool โดยไม่เก็บไฟล์หรือข้อมูลผู้ใช้ |
| 12 ส.ค. 2026 | ยังไม่เพิ่ม WebAssembly ใน Phase 4 | ไม่มี benchmark ที่ยืนยันว่าคุ้มกับ Bundle/Compatibility cost; Worker เพียงพอกับงานปัจจุบัน |
| 12 ส.ค. 2026 | บังคับ Bundle Budget ใน CI | ป้องกัน Initial Hub และ Lazy chunks โตขึ้นโดยไม่ตั้งใจ |
| 12 ส.ค. 2026 | Phase 5 ยังคงไม่ใช้ Backend | ภาษา, Portable Settings, Usage order และ Compatibility Check ทำงาน Client-side ได้ครบและไม่จำเป็นต้องส่งข้อมูลออกจากอุปกรณ์ |

---

## 11. กติกาการอัปเดตไฟล์นี้

ต้องอัปเดต `PROGRESS.md` ในเหตุการณ์ต่อไปนี้:

1. เริ่ม Phase ใหม่ — ระบุขอบเขต Branch และสถานะ `กำลังดำเนินการ`
2. เพิ่มหรือลดขอบเขต — บันทึกเหตุผลและผลกระทบ
3. พบปัญหาสำคัญ — เพิ่มในหัวข้อปัญหาและงานค้าง
4. เปิด Pull Request — เพิ่มหมายเลข PR, Branch และ Head commit
5. ทดสอบเสร็จ — บันทึกจำนวน Tests, Build, Audit และ Browser validation
6. Merge — เพิ่ม Merge commit และวันที่
7. Deploy — บันทึกผล Workflow และตรวจเว็บไซต์ Production
8. ปิด Phase — เปลี่ยนสถานะเป็น `เสร็จสิ้น` หลังเกณฑ์ที่กำหนดผ่าน

### ความหมายของสถานะ

- `⬜ ยังไม่เริ่ม` — ยังไม่มี Branch หรือการพัฒนา
- `⏳ เตรียมเริ่ม` — กำหนดขอบเขตแล้วแต่ยังไม่มี Source change
- `🚧 กำลังดำเนินการ` — มี Branch หรือ Commit ที่กำลังพัฒนา
- `🧪 รอตรวจสอบ` — พัฒนาแล้วแต่ Tests/Review/Deploy ยังไม่ครบ
- `✅ เสร็จสิ้น` — Tests ผ่าน Merge แล้ว และ Deploy ผ่านเมื่อ Phase กระทบ Production
- `⛔ Blocked` — มีปัญหาที่ทำให้เดินหน้าต่อไม่ได้

---

## 12. เอกสารอ้างอิง

- [PRD.md](PRD.md) — ข้อกำหนดและ Roadmap ของผลิตภัณฑ์
- [README.md](README.md) — วิธีติดตั้ง พัฒนา และโครงสร้างระบบ
- [TEST_REPORT.md](TEST_REPORT.md) — ผลการทดสอบล่าสุด
- [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md) — มาตรฐานการเพิ่ม Tool
- [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md) — Privacy และ Dependency policy
- [docs/VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) — Art direction, Asset IDs และกฎการใช้งาน 3D Visual System

ลำดับความสำคัญของข้อมูลคือ: `PRD.md` กำหนดว่า **ต้องสร้างอะไร**, `PROGRESS.md` ระบุว่า **ทำถึงไหนแล้ว**, และ `TEST_REPORT.md` แสดงว่า **ตรวจสอบอย่างไรและผ่านหรือไม่**


---

## 8. Audio Expansion — เครื่องมือเสียงใหม่ 5 รายการ

**สถานะ:** ✅ พัฒนาและตรวจสอบ Local validation ผ่าน; พร้อมส่งขึ้น `main`

### สิ่งที่ส่งมอบ

- **Audio Compressor Pro** — Target-size mode, preset สำหรับ Speech/Podcast/Music, metrics ก่อน/หลัง และ clipping warning
- **Audio Merger Studio** — เลือกหลายไฟล์, reorder, duration รวม, gap, crossfade และ output WAV PCM16/WAV Compact
- **Silence Remover** — threshold dB, minimum silence, padding และ preview ก่อน export
- **Audio Finisher** — normalize, gain, fade in/out, peak meter และ clipping protection
- **Audio Speed & Pitch** — ปรับ speed และ semitones, preview และ export WAV แบบ client-side
- ใช้ shared Audio Workbench เพื่อลด duplication แต่แยก metadata, route, copy และ controls ของแต่ละเครื่องมืออย่างชัดเจน
- เพิ่ม `audio-process` Worker protocol พร้อม main-thread fallback และ transferable PCM buffers; กรณี Merger ใช้ structured clone โดยไม่โอน buffer ซ้ำเพื่อรองรับ segments หลายชุด
- เพิ่ม TH/EN localization, lazy loading, Offline preparation, validation, progress, cancel, success/error states, responsive layout และ accessible labels
- ไม่เพิ่ม dependency ใหม่ และไม่โฆษณาความสามารถ AI; การปรับเสียงใช้ browser AudioContext, PCM processing และ WAV encoder ที่อยู่ในโปรเจกต์

### ผลตรวจล่าสุด

- TypeScript strict typecheck — ผ่าน
- Unit/Integration — ผ่าน 52/52
- Production build — ผ่าน
- Bundle check — ผ่าน: Entry gzip 17.1 KB; All JavaScript gzip 949.2 KB / 31 chunks
- `git diff --check` — ผ่าน
- Playwright E2E — ผ่าน 55 cases, 2 intentional skips จาก 57 cases; รวม workflow จริงของ Audio Trimmer และเครื่องมือใหม่ทั้ง 5 บน Desktop/Android profiles

### ข้อจำกัดที่เปิดเผยต่อผู้ใช้

- Compressor ใช้การลด sample rate และ soft saturation เพื่อเข้าใกล้ target size; ไม่ใช่ lossless compression และอาจได้ขนาดสูงกว่าเป้าหมายตามโครงสร้าง WAV
- Speed & Pitch เป็น resampling ที่คาดเดาได้และทำงาน offline; ไม่อ้างว่าเป็น studio-grade time-stretch ที่รักษาความยาวและ pitch แยกจากกันแบบ DSP ขั้นสูง
- Output ของเครื่องมือใหม่เป็น WAV ที่ประมวลผลบนอุปกรณ์ทั้งหมด เพื่อคง privacy และไม่เพิ่ม dependency ขนาดใหญ่
