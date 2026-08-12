# Latest Validation Report — Phase 5 Product Expansion

วันที่ตรวจ: 12 สิงหาคม 2026

## ขอบเขตที่ตรวจ

- สถานะ Production หลัง Merge Phase 3: PR #9 และ Merge commit `0b3cf36e0640f2f4fdcbc17c34a96a4dc980a3da`
- Dedicated Worker สำหรับงานรูปภาพ, Images to PDF, PDF Merge/Split/Inspect และ SHA-256
- Progress, Cancel, Worker termination และ Main-thread fallback
- IndexedDB record สำหรับ Offline readiness โดยไม่เก็บไฟล์ผู้ใช้
- App Shell cache และ Tool cache รายเวอร์ชันผ่าน Service Worker
- Lazy Worker/PDF assets, Bundle Budget และ GitHub Pages subpath
- Playwright บน Desktop, Android ระดับเริ่มต้น 360 px และ Android รุ่นปัจจุบัน

## Automated validation ในเครื่อง

- TypeScript strict typecheck — **ผ่าน**
- Vitest: Route, Tool contract/loader, Search, Storage fallback, PWA, App Shell, 3D Assets, Core/File Tools, Worker fallback และ Offline store — **ผ่าน 40/40 tests**
- Vite production build — **ผ่าน**
- Worker output — **ผ่าน**; `processing.worker-*.js` เป็น JavaScript ที่ Bundle แล้ว ไม่ใช่ TypeScript source
- Service Worker syntax — **ผ่าน**
- `git diff --check` — **ผ่าน**
- Dependency audit — **0 vulnerabilities**

## Bundle Budget

| Budget | ผลปัจจุบัน | เกณฑ์ | สถานะ |
|---|---:|---:|---|
| Hub entry gzip | 10.8 KB | ≤45 KB | ผ่าน |
| Lazy chunk ใหญ่สุด | 366.1 KB | ≤900 KB | ผ่าน |
| JavaScript รวม gzip | 929.6 KB / 24 chunks | ≤1,600 KB | ผ่าน |

`npm run check:bundle` ถูกเพิ่มเข้า GitHub Actions หลัง Production build เพื่อป้องกัน Bundle โตเกินงบโดยไม่ทราบตัว

## Browser validation

Playwright มี **12 test cases × 3 projects = 36 executions**:

- Desktop Chromium
- Android entry profile: viewport 360 × 740, device scale factor 2
- Android current profile: Pixel 7

ครอบคลุม 14 Tool Cards, Core/File Tools, Worker-backed processing, Offline preparation, reload แบบไม่มี Network, Lazy Worker loading, PWA, Theme, Favorites, History และ Not Found

Local workspace ยังไม่มี Chromium executable จึงใช้ GitHub Actions เป็น Browser runtime หลัก การทดสอบบน CI ยืนยันทั้ง Desktop และ Android สองระดับแล้ว

**สถานะ Browser E2E:** GitHub Actions CI Run #37 ผ่าน **36/36 executions**

### Offline regression ที่ตรวจพบและแก้ไข

- CI Run #31 พบ E2E selector ใช้ชื่อ `JSON Formatter` แต่ Accessible Name จริงคือ `JSON Formatter / Validator`; แก้ให้ตรวจ Accessible Name เต็มและคลิกด้วย `data-action="offline"`
- CI Runs #32–36 ยืนยันว่าปุ่มเตรียม Offline และ Cache entries สำเร็จ แต่ Entry JS/CSS ไม่ถูกคืนหลังตัด Network เพราะ Request variant ไม่ตรงกับ Cache lookup
- Service Worker แก้ให้ Pre-cache `index.html`, รอ Navigation/runtime cache writes และเรียก `caches.match(request, { ignoreVary: true })`
- Browser test ตรวจ Service Worker controller และยืนยันว่า Cache มี App Shell, Entry JS, CSS และ JSON Formatter chunk ก่อนตัด Network
- CI Run #37 ผ่าน reload หน้า Hub และเปิด JSON Formatter ขณะ Offline ครบทั้ง 3 Browser profiles

## WebAssembly decision

Phase 4 ไม่เพิ่ม WebAssembly dependency ในรอบนี้ เพราะ PDF.js มี Worker ของตนเอง และงานที่ UI-blocking ถูกย้ายไป Dedicated Worker ได้โดยไม่เพิ่ม Runtime/Memory overhead ใหม่ การเพิ่ม WASM จะทำเมื่อมี Tool Audio/Video หรือ benchmark จริงยืนยันว่าประโยชน์สูงกว่าขนาด Bundle และ Compatibility cost

## Pre-Phase 5 UX/UI refinement

หลัง PR #10 Merge เข้า `main` ที่ commit `fe194b2c972b57d87f0b930f50569e5cbd3d7318` ได้เพิ่มชุดตรวจสำหรับ Compact Tool Cards และ Micro-interactions บน Branch `agent/pre-phase-5-compact-ui`

### ผลตรวจในเครื่อง

- TypeScript strict typecheck — **ผ่าน**
- Vitest — **ผ่าน 40/40 tests**
- Vite production build — **ผ่าน**
- Bundle Budget — **ผ่าน**; Entry 11.0 KB gzip, Lazy chunk ใหญ่สุด 366.1 KB, JavaScript รวม 929.8 KB/24 chunks
- Dependency audit — **0 vulnerabilities**
- `git diff --check` — **ผ่าน**

### Browser contract ที่เพิ่ม

- รันเฉพาะ Android entry viewport 360 × 740 สำหรับเกณฑ์ Compact UI
- หลังเลื่อน Tool Grid เข้าสู่ viewport ต้องเห็น Tool Card เต็มอย่างน้อย 3 ใบพร้อมกัน
- Tool icon ต้องอยู่ด้านซ้ายของชื่อเครื่องมือ
- Category button ต้องอัปเดต `aria-pressed` หลังแตะ
- Favorite button ต้องอัปเดต `aria-pressed`, บันทึกรายการโปรด และประกาศผลผ่าน `aria-live`

Local workspace ไม่มี Chromium executable จึงยังเริ่ม Browser process ไม่ได้ การเรียก Playwright หยุดก่อนโหลดแอปและไม่ใช่ Source failure

GitHub Actions CI Run #40 ยืนยัน Browser contract ใหม่แล้ว: Playwright ผ่าน **37 executions** บน Desktop Chromium, Android entry 360 × 740 และ Android Pixel 7 พร้อม **2 skips ที่ตั้งใจไว้** เนื่องจาก Compact UI case ถูกจำกัดให้รันเฉพาะ Android entry profile ผล Unit/Integration ผ่าน 40/40 และ TypeScript, Production build กับ Bundle Budget ผ่านครบ

### Tool Card regression fix หลัง Merge PR #11

การทดสอบ Production พบว่า Mobile icon สามารถล้นกรอบลงทับ Privacy/Offline footer และผู้ใช้ยังต้องแตะลิงก์ “เปิด →” ขนาดเล็ก Draft PR #12 แก้ด้วย Icon Grid area ที่มี `overflow: clip`, ยกเลิก `display: contents`, แยก Favorite control เป็น Layer ของตนเอง และใช้ Semantic link ครอบพื้นที่การ์ดทั้งหมด โดย Favorite/Offline controls อยู่เหนือ Link layer

Playwright เพิ่มการตรวจว่า Icon bounding box ไม่ทับ Footer, Favorite click ไม่เปลี่ยน URL และ Full-card click เปลี่ยนไป `#/tools/base64` พร้อมแสดง H1 จริง GitHub Actions CI Run #44 ผ่าน **37 executions** พร้อม **2 intentional skips**; Unit/Integration ผ่าน 40/40 และ TypeScript, Build, Bundle Budget ผ่านครบ

## Phase 5 Product Expansion

Phase 5 เพิ่มภาษาไทย/English ใน App Shell และ metadata ของเครื่องมือ, Settings Center, Portable Settings JSON, การเรียงตามจำนวนครั้งที่เปิด และ Browser Compatibility Check โดยไม่เพิ่ม Backend หรือ Runtime dependency

### Automated validation ในเครื่อง

- TypeScript strict typecheck — **ผ่าน**
- Vitest — **ผ่าน 47/47 tests** ใน 12 test files
- Vite production build — **ผ่าน**
- Bundle Budget — **ผ่าน**; Entry 15.9 KB gzip, Lazy chunk ใหญ่สุด 366.1 KB, JavaScript รวม 934.8 KB/24 chunks
- Service Worker syntax — **ผ่าน**
- Dependency audit — **0 vulnerabilities**
- `git diff --check` — **ผ่าน**

### Phase 5 contracts ที่เพิ่ม

- Translation keys และ metadata อังกฤษของ Tool Catalog ทุกเครื่องมือ
- Usage sorting แบบมากไปน้อย พร้อม Registry-order tie-break
- Portable Settings `schemaVersion: 1` ตรวจ Theme, Locale, Tool order, Tool IDs, Usage counts และ Recent limit
- Settings Center เปลี่ยนภาษา/ลำดับและตรวจ Browser capabilities ได้
- Playwright ตรวจ TH→EN, Usage order พร้อม Full-card navigation, Compatibility/No-backend message และ Export/Import round-trip

Playwright suite มี **17 test cases × 3 profiles = 51 executions** แต่ Local workspace ไม่มี Chromium executable จึงหยุดที่ Browser launch ตามข้อจำกัด environment ผล Browser จริงจะยืนยันผ่าน GitHub Actions หลัง Push Branch
