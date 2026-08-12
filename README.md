# Personal Utility Hub

ศูนย์รวม Utility Web Tools แบบ Static PWA ที่เน้น Privacy by Design, Client-side Processing และ Modular Tool Registry

ขณะนี้โครงการอยู่ใน **Phase 1: Hub MVP** โดย Foundation ของ Phase 0 ทำงานร่วมกับหน้า Hub แบบ Mobile-first, Search, Category Filter, Tool Card, Privacy Badge, Favorites, Recent Tools, Light/Dark Mode และ PWA/Offline App Shell แล้ว

เครื่องมือ Core 7 รายการจาก PRD แสดงใน Registry ด้วยสถานะ “เร็ว ๆ นี้” และจะเริ่มเพิ่มความสามารถประมวลผลจริงใน Phase 2

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
- `src/core` — Tool Contract, Loader, Search, Local Preferences และ PWA controller
- `src/data` — Registry และข้อมูลกลาง
- `src/tools` — Tool Module ที่โหลดแบบ Lazy
- `src/styles` — Design Tokens และ Custom CSS
- `public` — Manifest, Service Worker, Offline fallback และ App icons
- `tests` — Unit, Integration และ End-to-End tests

อ่านขั้นตอนเพิ่มเครื่องมือที่ [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md) และนโยบายความเป็นส่วนตัวที่ [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md)

## Privacy Baseline

MVP ไม่มี Backend, Login, Analytics, Runtime Dependency หรือ Third-party Script และไม่ส่งข้อมูลผู้ใช้ออกจาก Browser รายการโปรด ประวัติ และธีมเก็บใน LocalStorage ของอุปกรณ์เท่านั้น หาก LocalStorage ถูกปิด ฟังก์ชันหลักยังเปิดใช้งานได้
