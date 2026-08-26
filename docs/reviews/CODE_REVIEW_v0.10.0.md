# Code Review — P0 Utility Expansion v0.10.0

**Repository:** `aodxx/Personal-Utility-Hub`
**Scope:** JWT Inspector, Hash & Checksum Verifier, Regex Playground และ Color Contrast Checker
**Review status:** ผ่าน initial และ supplemental security/performance review หลัง commit/push
**Date:** 26 สิงหาคม 2026

## Executive summary

การเพิ่มเครื่องมือ P0 ทั้งสี่สอดคล้องกับ Tool Contract เดิมของ Personal Utility Hub โดยทุก tool ใช้ `metadata.ts`, lazy registry loading, bilingual guide และ client-side processing ไม่มี backend หรือ runtime upload path สำหรับข้อมูลผู้ใช้

Hash Verifier ใช้ Web Crypto และมี worker path สำหรับไฟล์ โดยจำกัดไฟล์ไว้ 40 MB และ text ไว้ 4 MB พร้อม cancellation/progress ผ่าน processing client ส่วน JWT Inspector จำกัด input 256 KiB, ทำหน้าที่ decode/inspect เท่านั้น ไม่ fetch JWK และไม่อ้างว่าเป็น signature verification. Regex Playground จำกัด input ไว้ 1,000,000 ตัวอักษร, รันทั้ง match/replace ใน dedicated Worker พร้อม 2-second timeout, bounded fallback และจำกัด DOM highlight. Color Contrast Checker ใช้สีทึบสำหรับการคำนวณและแสดงผลแยกตาม normal text, large text และ UI/non-text

## Findings and disposition

| Area | Finding | Disposition |
|---|---|---|
| Privacy | P0 input และ output อยู่ใน DOM/browser memory; ไม่มี API call หรือ file upload path เพิ่ม | ผ่าน; มี local-only notice ในทุกหน้าและ guide ระบุขอบเขตจริง |
| JWT security | Decode token อาจถูกเข้าใจผิดว่า verify สำเร็จ | แก้/ป้องกัน; UI และ guide ใช้ข้อความ `Decoded ≠ cryptographically verified` และเตือน `alg=none` |
| Hash integrity | Digest เปรียบเทียบต้องแยกจาก encryption | ผ่าน; UI แสดง MATCH/MISMATCH และมี integrity note |
| Hash memory | `Blob.arrayBuffer()` ใช้ memory ตามขนาดไฟล์ | แก้/ป้องกัน; จำกัด input 40 MB และใช้ Worker เมื่อพร้อม พร้อม cancel/progress |
| Regex safety | global/sticky zero-length matchesอาจวนซ้ำ | แก้; ขยับ `lastIndex` เมื่อ match เป็น empty และจำกัด 10,000 matches |
| Regex input | input ขนาดใหญ่อาจใช้ CPU/memory มาก | แก้/ป้องกัน; จำกัด 1,000,000 ตัวอักษร, รันใน Worker พร้อม timeout และแสดงสถานะ limit |
| Color semantics | alpha blending ทำให้ ratio ซับซ้อนและอาจตีความผิด | แก้/ป้องกัน; ตรวจสีทึบเท่านั้นสำหรับ scoring และระบุ limitation |
| Lifecycle | Tool modules ต้องถอด event listeners และยกเลิกงาน async เมื่อ unmount | ผ่าน; ทุก module มี unmount cleanup; Hash aborts active controller |
| Offline | ต้องไม่ claim worker support โดยไม่มี asset preparation | ผ่าน; มี `prepareOffline` สำหรับ Hash processing worker และ Regex dedicated worker; JWT/Contrast ไม่ประกาศ worker cache ที่ไม่จำเป็น |
| Bundle | Static metadata/guides และ Worker chunks เพิ่ม payload | ผ่านแบบมีหลักฐาน; entry gzip 57.9 KB อยู่ใต้ gate 60 KB, total 1,240.8 KB across 62 chunks และ largest lazy 366.1 KB |
| Accessibility | ต้องมี labels, focusable controls, status announcements และ mobile layout | ผ่านการตรวจ route/workflow; controls ใช้ labels, `aria-live`, tabs/pressed states และ no-overflow E2E |

## Files reviewed

| Layer | Files |
|---|---|
| Core | `src/core/jwt.ts`, `src/core/hash.ts`, `src/core/regex.ts`, `src/core/color-contrast.ts` |
| Worker | `src/core/processing-protocol.ts`, `src/core/processing-client.ts`, `src/workers/processing.worker.ts`, `src/core/regex-processing-client.ts`, `src/workers/regex.worker.ts` |
| UI | `src/tools/jwt-inspector/index.ts`, `src/tools/hash-verifier/index.ts`, `src/tools/regex-playground/index.ts`, `src/tools/color-contrast/index.ts` |
| Integration | `src/data/tools.ts`, `src/data/guides.ts`, `src/data/file-tools.ts`, `src/core/i18n.ts`, `src/components/asset-icon.ts`, `public/icons/utility-3d-icons.svg` |
| Release | `public/sw.js`, `src/core/offline-tools.ts`, `scripts/check-bundle.mjs`, `README.md`, `PROGRESS.md`, `TEST_REPORT.md` |
| Tests | `tests/p0-tools.test.ts`, `tests/regex-processing-client.test.ts`, `tests/e2e/p0-tools.spec.ts` และ regression suites เดิม |

## Validation evidence

| Check | Result |
|---|---:|
| TypeScript typecheck | ผ่าน |
| Vitest | 132/132 tests ผ่าน จาก 29 files |
| P0 Playwright | 27/27 ผ่านบน 3 projects |
| Full Playwright | 271 ผ่าน, 14 intentional skips จาก 285 cases |
| Production build | ผ่าน |
| Bundle check | Entry 57.9 KB gzip; largest lazy 366.1 KB; total 1,240.8 KB across 62 chunks |
| Registry check | 46 metadata modules, unique routes และ lazy registrations ผ่าน |
| SVG integrity | 120 manifest assets, duplicate checks ผ่าน |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| Service Worker syntax | ผ่าน |
| `git diff --check` | ผ่าน |

## Known limitations

JWT Inspector ไม่ยืนยันลายเซ็นหรือสิทธิ์ของ token, ไม่มีการตรวจ JWK และจำกัด token ที่ 256 KiB. Hash Verifier โหลดไฟล์เข้าสู่ memory ก่อนคำนวณตาม Web Crypto contract จึงมี 40 MB file guard และ 4 MB text guard. Regex ใช้ JavaScript RegExp syntax; Worker timeout ช่วยรักษา UI แต่ pattern ที่ซับซ้อนอาจถูกยกเลิก และ sync fallback รองรับเฉพาะ input ไม่เกิน 20,000 ตัวอักษร. Color Contrast Checker เป็น contrast check ไม่ใช่ full accessibility audit และรุ่นนี้คำนวณสีทึบเท่านั้น

รายละเอียดการตรวจรอบ supplemental อยู่ใน `SECURITY_PERFORMANCE_REVIEW_P0_v0.10.0.md` ซึ่งบันทึก ReDoS mitigation, memory guards, race-condition fix และ residual risks เพิ่มเติม

การ review นี้ยืนยัน behavior ตาม source และ automated tests ใน repository ไม่ใช่การรับรองความปลอดภัยหรือความถูกต้องทางกฎหมายของข้อมูลที่ผู้ใช้ป้อน
