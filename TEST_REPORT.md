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
| Playwright | 86 passed, 4 intentional skips จาก 90 cases |
| Visual asset validation | ผ่าน |
| `git diff --check` | ผ่าน |

Playwright ใช้ 3 profiles ได้แก่ Desktop Chromium, Android entry viewport `360 × 740` และ Android current profile ที่เป็น Pixel 7 class viewport โดยมี compact mobile test ที่ตั้งใจ skip ใน profiles ที่ไม่ใช่ Android entry

## 4. Coverage matrix

| Area | Contract ที่ตรวจ |
|---|---|
| Core Tools | Route, metadata contract, lazy loading, search, localization และ favorite/history behavior |
| File Tools | Registry count 17, lazy module loading, file validation, PDF operations และ metadata contract |
| Audio Tools | 21 dedicated E2E cases ครอบคลุม Audio Trimmer และ shared workbench/Chapter Marker tools ตั้งแต่ upload, processing, result metrics และ WAV/cue-sheet download รวมถึง repeated processing ของ Trimmer |
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

เกณฑ์ repository ปัจจุบันคือ Entry gzip ไม่เกิน 45 KB, lazy chunk ไม่เกิน 900 KB และ JavaScript รวม gzip ไม่เกิน 1,600 KB ผลล่าสุดหลัง guide catalog patch คือ Entry gzip 32.7 KB, lazy chunk ใหญ่สุด 366.1 KB และ JavaScript รวม gzip 976.4 KB จาก 36 chunks — ผ่านทั้งหมด

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

Local regression suite ล่าสุดผ่าน 86 cases และมี 4 intentional skips จาก 90 cases. Final HEAD `c4238a226a5098dc4fb7db99b4c481066ee8303b` ผ่าน [CI run 31994517569](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31994517569) และ [GitHub Pages deploy run 31994517551](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31994517551) โดยทั้งสอง run จบด้วย success

## 8. Production GitHub Pages smoke test

Production URL ที่ต้องตรวจคือ [https://aodxx.github.io/Personal-Utility-Hub/](https://aodxx.github.io/Personal-Utility-Hub/) และหลักฐานการตรวจบันทึกไว้ที่ [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md)

### Hub and navigation checklist

| Check | Status | Evidence |
|---|---|---|
| Hub เปิดได้ | ผ่านการตรวจเบื้องต้น | URL ข้างต้น; App Shell แสดงผล |
| Search และ category filter | ผ่านการตรวจเบื้องต้น | Search `รูปภาพ` แสดง 7 ผลลัพธ์; category tabs แสดง 8 หมวด |
| Favorite และ Settings | Settings ผ่าน; Favorite ยังต้องตรวจซ้ำ | Settings Center, Compatibility Check และ no-backend message แสดงผล |
| Full-card navigation, back/forward และ refresh hash route | Audio Trimmer route ผ่านเบื้องต้น; back/forward ยังต้องตรวจ | `#/tools/audio-trimmer` เปิดได้และ lazy module เริ่มโหลด |
| 360 × 740 และ Pixel 7 class layout | ผ่านบน Production smoke 360 × 740; Pixel 7 class ผ่าน local Android current | `scripts/phase6-production-smoke.mjs`, Playwright Android current |
| ไม่มี horizontal overflow หรือ icon/footer overlap | ผ่านบน Production 360 × 740 | Production smoke `scrollWidth` check และ local E2E contract |

### Audio workflow checklist

ต้องทดสอบด้วยไฟล์เสียงจริงอย่างน้อยหนึ่งไฟล์ที่ browser decode ได้ในแต่ละ tool ตามลำดับ:

```text
เลือกไฟล์ → แสดงข้อมูล → ตั้งค่า → Process → Preview → Export/Download
```

| Audio tool | Status |
|---|---|
| Audio Trimmer | ผ่าน — upload → process → preview → export → download WAV |
| Audio Compressor Pro | ผ่าน — upload → process → result metrics → download WAV |
| Audio Merger Studio | ผ่าน — multi-file workbench, process → result metrics → download WAV |
| Silence Remover | ผ่าน — upload → process → result metrics → download WAV |
| Audio Finisher | ผ่าน — peak/normalize process → result metrics → download WAV |
| Audio Speed & Pitch | ผ่าน — resampling process → result metrics → download WAV |
| Audio Chapter Marker & Cue Sheet | ผ่าน — upload → marker → TXT cue-sheet export |

### PWA/offline checklist

ตรวจ manifest, Service Worker registration, controller readiness, v0.8 shell/tool cache names, Offline Preparation และเปิด tool ที่เตรียมไว้หลังตัด network ตาม contract โดยต้องยืนยันว่า cache รุ่นเก่าไม่ถูกใช้แทน asset ของ v0.8

## 9. Known limitations

Audio Compressor ใช้ target size แบบประมาณการสำหรับ WAV; Audio Finisher เป็น peak normalization และ clipping protection ไม่ใช่ LUFS mastering; Audio Speed & Pitch เป็น resampling ที่ทำให้ speed และ pitch สัมพันธ์กัน ไม่ใช่ independent time-stretch; และยังไม่มี MP3 export ใน implementation ปัจจุบัน

GitHub Actions และ dependency audit หลัง `npm ci` ผ่านแล้วบน final HEAD ก่อน Audio regression; Production smoke notes บันทึกผล Hub, search/category, Settings, English localization, Service Worker/cache และ Audio contract ครบ 7 tools ไว้ใน [`docs/v0.8-production-smoke-notes.md`](docs/v0.8-production-smoke-notes.md) หลังเพิ่ม one-retry recovery ใน AppShell และ dedicated Audio E2E coverage

## 10. Release decision

v0.8.0 จะถือว่า **Production Baseline Ready** เมื่อเอกสารทั้งสามฉบับตรงกับ source, local quality gate ผ่าน, GitHub Actions บน HEAD ผ่าน, GitHub Pages smoke test ผ่านบน desktop และ mobile, Audio workflow ผ่านตามรายการ และ PWA/offline behavior ยืนยันด้วย cache version ใหม่โดยไม่มีข้อมูลผู้ใช้เดิมเสียหาย


## 11. Phase 6 Trust & Usability validation

Phase 6 เพิ่ม `src/core/tool-guide.ts` และ `src/data/guides.ts` เป็น typed bilingual Guide contract/catalog แบบ tool-specific สำหรับ Active Tools 25 รายการ พร้อม shared AppShell Guide dialog, Privacy route `#/privacy`, accessible privacy links, first-use guidance ที่เก็บ `guideSeen` แบบ local-only และ sample workflows ใน JSON Formatter, Base64 และ Text Formatter

| Phase 6 check | Local status |
|---|---:|
| Active Tools มี Guide ครบและ schema valid | ผ่าน 25/25 |
| Privacy route และ hash parser | ผ่าน |
| TH/EN guide fields | ผ่าน |
| guideSeen storage + memory-safe fallback | ผ่าน |
| Guide open/close และ Escape behavior | ผ่านใน Playwright |
| First-use dismiss persistence | ผ่านใน Playwright |
| Sample data workflow | ผ่านใน Playwright |
| Mobile guide sheet contract | ผ่านใน Android entry profile |
| Phase 6 trust/unit integration tests | 12/12 ผ่าน |
| Playwright รวม | 86 passed, 4 intentional skips จาก 90 cases |

Production verification ของ Phase 6 ผ่าน smoke script `scripts/phase6-production-smoke.mjs` ครบ 10/10 checks บน URL จริงและ viewport 360 × 740: Privacy, guides จาก 5 categories, Audio Trimmer upload → process → WAV result → download, JSON sample, no horizontal overflow, Escape close และ back/forward/refresh. Final HEAD และ Pages deploy ผ่าน CI/Pages runs ที่ระบุในหัวข้อ 7. Audio regression contract เดิมยังผ่านใน local Playwright และ production smoke notes มีหลักฐาน shared audio tools/Chapter Marker; ข้อจำกัดที่เหลือเป็นเรื่อง output/codec ตาม implementation ไม่ใช่ trust/usability gate


## 12. Phase 7 Home Experience Optimization validation

Phase 7 ปรับเฉพาะ Home experience โดยไม่มี Active Tool ใหม่ ไม่มี Backend, Analytics, Login, Cloud usage sync, Remote usage tracking หรือ slider dependency เพิ่ม. Large Trust Strip เดิมถูกแทนที่ด้วย Compact Trust Chips แบบ TH/EN และส่วน New Tools grid ถูกแทนที่ด้วย `Your Most Used / ใช้บ่อยของคุณ` native horizontal carousel

| Phase 7 check | Result |
|---|---:|
| Compact Trust Chips 3 รายการ | ผ่าน |
| Trust Chip focus/click explanation และ keyboard semantics | ผ่าน |
| Most Used ใช้ `utility-hub:usage` เดิม | ผ่าน |
| Usage DESC, Top 5 และ deterministic catalog tie-breaker | ผ่าน unit tests |
| Active-only filtering และ missing count handling | ผ่าน unit tests |
| New-user fallback 5 tools | ผ่าน |
| Fallback order | Image Compressor, PDF Merge, QR Code Generator, JSON Formatter / Validator, Audio Trimmer |
| Compact cards full-card navigation | ผ่าน touch/mouse/keyboard contract |
| Native horizontal scroll/snap | ผ่าน |
| Ranking update หลังเปิด tool และกลับ Home | ผ่าน |
| Reload persistence | ผ่าน |
| Usage-only reset | ผ่าน; Favorites/Locale/Theme ไม่ถูกลบ |
| TH/EN | ผ่าน |
| 360 × 740 | ผ่าน Production |
| Pixel 7-class 412 × 915 | ผ่าน Production |
| Desktop 1280 × 900 | ผ่าน Production |
| Page horizontal overflow | ไม่พบทุก viewport |
| Phase 6 Privacy/Guide regression | ผ่าน Production |

### Phase 7 automated and Production results

`tests/phase7-home.test.ts` ผ่าน 4/4 tests. Full Playwright suite ผ่าน **92 tests** และมี 4 intentional skips. Local release gates ผ่าน typecheck, full Vitest, build, bundle check, `npm audit --audit-level=high`, Service Worker syntax และ `git diff --check`. Bundle metrics คือ **33.7 KB entry gzip**, **366.1 KB largest lazy chunk** และ **977.3 KB JavaScript gzip across 36 chunks**; npm audit รายงาน **0 vulnerabilities**

Production smoke ใช้ `node scripts/phase7-production-smoke.mjs` ตรวจ real GitHub Pages URL [https://aodxx.github.io/Personal-Utility-Hub/](https://aodxx.github.io/Personal-Utility-Hub/) และผ่าน **38/38 checks** ครอบคลุม Home/catalog, old strip removal, chips, fallback, carousel, full-card navigation, reset, localization, ranking, reload, overflow, Privacy route และ Phase 6 Guide/Escape regression

Final Phase 7 implementation commit คือ `af70a90804a9b70a0884022dd51b1fa69b6ec437`. GitHub Actions CI run [31996233447](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233447) และ Pages deploy run [31996233427](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/31996233427) ผ่านบน HEAD เดียวกัน

### Known limitations

Carousel ใช้ native horizontal scrolling และไม่มี previous/next arrow controls เพื่อคง dependency และ event handling ให้เล็ก. Most Used เป็น local personalization ของอุปกรณ์ปัจจุบัน ไม่ใช่ global popularity, trending หรือ aggregate ranking. Usage reset ล้างเฉพาะ usage counts ตาม contract และไม่ล้าง Favorites, Recent, Locale, Theme หรือ GuideSeen
