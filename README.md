# Personal Utility Hub

ศูนย์รวม Utility Web Tools แบบ Static PWA ที่เน้น Privacy by Design, Client-side Processing และ Modular Tool Registry

ขณะนี้โครงการอยู่ใน **Phase 0: Foundation** มี App Shell, Hash Router, Typed Tool Contract, Lazy Tool Loader, Error/Not Found states, Custom CSS Design System และ GitHub Pages workflow ส่วน Search, Favorites, PWA และเครื่องมือ MVP จะพัฒนาใน Phase ถัดไปตาม `PRD.md`

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
- `src/core` — Tool Contract, Loader และ Error types
- `src/data` — Registry และข้อมูลกลาง
- `src/tools` — Tool Module ที่โหลดแบบ Lazy
- `src/styles` — Design Tokens และ Custom CSS
- `tests` — Unit และ End-to-End tests

อ่านขั้นตอนเพิ่มเครื่องมือที่ [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md) และนโยบายความเป็นส่วนตัวที่ [docs/PRIVACY_AND_DEPENDENCIES.md](docs/PRIVACY_AND_DEPENDENCIES.md)

## Privacy Baseline

Phase 0 ไม่มี Backend, Login, Analytics, Runtime Dependency หรือ Third-party Script และไม่ส่งข้อมูลผู้ใช้ออกจาก Browser
