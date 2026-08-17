# Test and Release Validation Report — v0.8.0

**อัปเดต:** 17 สิงหาคม 2026
**Repository:** `aodxx/Personal-Utility-Hub`
**Release baseline:** `0.8.0`
**Release scope:** Phase 5 Product Expansion และ Audio Tool Suite บน `main`

## 1. ขอบเขตของ baseline

v0.8.0 ไม่ใช่การเพิ่ม tool ใหม่ในรอบ validation นี้ แต่เป็น release baseline สำหรับ source code ที่มีอยู่จริง ได้แก่ 25 active tools, Audio processing pipeline, Worker/fallback architecture, bilingual App Shell, Settings Center, Portable Settings, Offline Tool Preparation และ mobile-first UI

Audio scope ครอบคลุม Audio Trimmer, Audio Compressor Pro, Audio Merger Studio, Silence Remover, Audio Finisher, Audio Speed & Pitch และ Audio Chapter Marker & Cue Sheet เครื่องมือเหล่านี้ทำงานใน browser และ export อยู่ใน WAV/WAV Compact family ตาม operation ปัจจุบัน

## 2. Automated validation commands

Quality gate ที่ใช้กับ v0.8 คือ:

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

## 3. Local validation record

ผล local record ล่าสุดก่อนเริ่ม baseline patch เป็นดังนี้:

| Check | Result |
|---|---:|
| TypeScript strict typecheck | ผ่าน |
| Vitest unit/integration | 52/52 tests ผ่าน จาก 13 test files |
| Production build | ผ่าน |
| Bundle budget | ผ่าน |
| Playwright | 55 passed, 2 intentional skips จาก 57 cases |
| Visual asset validation | ผ่าน |
| `git diff --check` | ผ่าน |

Playwright ใช้ 3 profiles ได้แก่ Desktop Chromium, Android entry viewport `360 × 740` และ Android current profile ที่เป็น Pixel 7 class viewport โดยมี compact mobile test ที่ตั้งใจ skip ใน profiles ที่ไม่ใช่ Android entry

## 4. Coverage matrix

| Area | Contract ที่ตรวจ |
|---|---|
| Core Tools | Route, metadata contract, lazy loading, search, localization และ favorite/history behavior |
| File Tools | Registry count 17, lazy module loading, file validation, PDF operations และ metadata contract |
| Audio Tools | PCM processing, resampling, peak/clipping metrics, preview/export path, progress/cancel และ repeated processing safeguards |
| App Shell | 25 cards, category/search filter, TH/EN, Settings Center, usage ordering และ full-card navigation |
| Mobile UX | Compact cards, icon/footer separation, touch feedback, accessible pressed states และ 360px layout assertions |
| PWA | Manifest assets, Service Worker syntax, versioned shell/tool caches, offline preparation และ runtime cache behavior |
| Privacy | No backend/runtime upload claims, local storage boundaries และ no user-data schema migration |

## 5. v0.8 version and cache contract

| Contract | Expected value |
|---|---|
| `package.json` version | `0.8.0` |
| Shell cache | `utility-hub-shell-v0.8.0-audio-suite` |
| Tool cache | `utility-hub-tools-v0.8.0-audio-suite` |
| Offline cache version | `0.8.0-audio-suite` |
| Portable Settings schema | `1`, unchanged for backward compatibility |
| IndexedDB store schema | `1`, unchanged |

`public/manifest.webmanifest` ไม่มี version field จึงไม่เพิ่ม field ซ้ำกับ package/cache release contract

## 6. Bundle budget

เกณฑ์ repository ปัจจุบันคือ Entry gzip ไม่เกิน 45 KB, lazy chunk ไม่เกิน 900 KB และ JavaScript รวม gzip ไม่เกิน 1,600 KB ผลล่าสุดที่บันทึกไว้ก่อน v0.8 documentation/version patch คือ Entry gzip 18.1 KB, lazy chunk ใหญ่สุด 366.1 KB และ JavaScript รวม gzip 961.4 KB จาก 36 chunks — ผ่านทั้งหมด

หาก build หลัง patch ให้ตัวเลขต่างจาก record นี้ ต้องแทนค่าด้วย output จาก `npm run check:bundle` ก่อนประกาศ release

## 7. GitHub Actions requirements

`.github/workflows/ci.yml` ต้องรันบนทุก pull request และทุก push ไป `main` ตามลำดับต่อไปนี้:

```text
npm ci
npm run typecheck
npm test
npm run build
npm run check:bundle
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
```

หลักฐาน release ที่สมบูรณ์ต้องอ้างอิง GitHub Actions run ที่ผ่านบน commit HEAD เดียวกับ release commit ไม่ใช่ใช้ผล local เพียงอย่างเดียว

## 8. Production GitHub Pages smoke test

Production URL ที่ต้องตรวจคือ [https://aodxx.github.io/Personal-Utility-Hub/](https://aodxx.github.io/Personal-Utility-Hub/) และหลักฐานการตรวจบันทึกไว้ที่ [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md)

### Hub and navigation checklist

| Check | Status | Evidence |
|---|---|---|
| Hub เปิดได้ | ผ่านการตรวจเบื้องต้น | URL ข้างต้น; App Shell แสดงผล |
| Search และ category filter | ผ่านการตรวจเบื้องต้น | Search `รูปภาพ` แสดง 7 ผลลัพธ์; category tabs แสดง 8 หมวด |
| Favorite และ Settings | Settings ผ่าน; Favorite ยังต้องตรวจซ้ำ | Settings Center, Compatibility Check และ no-backend message แสดงผล |
| Full-card navigation, back/forward และ refresh hash route | Audio Trimmer route ผ่านเบื้องต้น; back/forward ยังต้องตรวจ | `#/tools/audio-trimmer` เปิดได้และ lazy module เริ่มโหลด |
| 360 × 740 และ Pixel 7 class layout | รอตรวจบน Production | Local E2E ผ่านบน profiles แล้ว |
| ไม่มี horizontal overflow หรือ icon/footer overlap | รอตรวจบน Production | Local E2E contract ผ่าน |

### Audio workflow checklist

ต้องทดสอบด้วยไฟล์เสียงจริงอย่างน้อยหนึ่งไฟล์ที่ browser decode ได้ในแต่ละ tool ตามลำดับ:

```text
เลือกไฟล์ → แสดงข้อมูล → ตั้งค่า → Process → Preview → Export/Download
```

| Audio tool | Status |
|---|---|
| Audio Trimmer | รอตรวจบน Production |
| Audio Compressor Pro | รอตรวจบน Production |
| Audio Merger Studio | รอตรวจบน Production |
| Silence Remover | รอตรวจบน Production |
| Audio Finisher | รอตรวจบน Production |
| Audio Speed & Pitch | รอตรวจบน Production |
| Audio Chapter Marker & Cue Sheet | รอตรวจบน Production |

### PWA/offline checklist

ตรวจ manifest, Service Worker registration, controller readiness, v0.8 shell/tool cache names, Offline Preparation และเปิด tool ที่เตรียมไว้หลังตัด network ตาม contract โดยต้องยืนยันว่า cache รุ่นเก่าไม่ถูกใช้แทน asset ของ v0.8

## 9. Known limitations

Audio Compressor ใช้ target size แบบประมาณการสำหรับ WAV; Audio Finisher เป็น peak normalization และ clipping protection ไม่ใช่ LUFS mastering; Audio Speed & Pitch เป็น resampling ที่ทำให้ speed และ pitch สัมพันธ์กัน ไม่ใช่ independent time-stretch; และยังไม่มี MP3 export ใน implementation ปัจจุบัน

Production smoke, GitHub Actions run บน commit หลัง baseline patch และ dependency audit หลัง `npm ci` ต้องบันทึกผลจริงก่อนทำเครื่องหมาย v0.8 ว่า fully verified

## 10. Release decision

v0.8.0 จะถือว่า **Production Baseline Ready** เมื่อเอกสารทั้งสามฉบับตรงกับ source, local quality gate ผ่าน, GitHub Actions บน HEAD ผ่าน, GitHub Pages smoke test ผ่านบน desktop และ mobile, Audio workflow ผ่านตามรายการ และ PWA/offline behavior ยืนยันด้วย cache version ใหม่โดยไม่มีข้อมูลผู้ใช้เดิมเสียหาย
