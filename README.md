# Personal Utility Hub

ศูนย์รวม Utility Web Tools แบบ Static PWA ที่เน้น Privacy by Design, Client-side Processing และ Modular Tool Registry

โครงการอยู่ใน **Phase 2: Core Tools** โดย Phase 0 Foundation, Phase 1 Hub MVP และ 3D Visual System เผยแพร่บน `main` แล้ว ส่วน Core Tools ทั้ง 7 รายการถูกพัฒนาเป็น Lazy-loaded Module บน Branch `agent/phase-2-core-tools`

## เครื่องมือ Core

1. JSON Formatter / Validator
2. Base64 Encoder / Decoder ที่รองรับ Unicode
3. Text Formatter
4. QR Code Generator
5. QR Code Reader จากรูปภาพหรือกล้อง
6. Image Resizer
7. Image Converter ระหว่าง PNG, JPEG และ WebP

ทุกเครื่องมือประมวลผลในเบราว์เซอร์ ไม่มี Backend และไม่อัปโหลดข้อความ รูปภาพ หรือข้อมูลจากกล้องไปยังเซิร์ฟเวอร์

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
npx playwright install chromium
npm run test:e2e
```

## สถาปัตยกรรม

- `src/app` — App Shell และ Hash Router
- `src/core` — Tool Contract, Loader, Search, Local Preferences, PWA และ Browser processing utilities
- `src/data` — Registry, Core Tool metadata และข้อมูลกลาง
- `src/tools` — Tool Module ที่โหลดแบบ Lazy
- `src/styles` — Design Tokens และ Custom CSS
- `public` — Manifest, Service Worker, Offline fallback และ 3D assets
- `tests` — Unit, Integration และ End-to-End tests

อ่านขั้นตอนเพิ่มเครื่องมือที่ [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md), แนวทางภาพที่ [docs/VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) และนโยบายความเป็นส่วนตัวที่ [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md)

## Privacy Baseline

- ไม่มี Login, Analytics, Backend, Cloud Storage หรือ Server-side Processing
- Favorites, Recent Tools และ Theme เก็บเฉพาะใน LocalStorage; หาก LocalStorage ใช้ไม่ได้ Hub จะใช้ Memory fallback
- Image Tools รองรับ PNG/JPEG/WebP ไม่เกิน 15 MB, ด้านละไม่เกิน 12,000 px และผลลัพธ์ไม่เกิน 24 ล้านพิกเซล
- QR Reader ขอสิทธิ์กล้องเมื่อผู้ใช้กดเปิดเท่านั้น และหยุด Media Track เมื่อปิดกล้อง อ่านสำเร็จ หรือออกจาก Tool
- `qrcode` และ `jsqr` ถูก Bundle แบบ Lazy ภายในเว็บ ไม่มี CDN, telemetry หรือ Runtime API request
