# Code Review — JSON Visualizer / Graph Viewer P1 v0.13.0

**สถานะ:** Local review complete; ready for commit after final staged review
**ขอบเขต:** `json-visualizer` core/UI, registry/metadata/guide/icon integration, PWA cache namespace, unit/contract/E2E tests และ release documentation
**วันที่:** 27 สิงหาคม 2026
**ผู้รีวิว:** Manus AI

## Executive summary

JSON Visualizer / Graph Viewer เพิ่มภารกิจใหม่ที่ไม่ทับซ้อนกับ JSON Formatter เดิม โดยแปลง JSON ที่ถูกต้องเป็น deterministic tree model และ parent-child SVG graph ผู้ใช้ค้นหา path/key/value, ย่อหรือขยาย node, คัดลอก tree summary และ export SVG/PNG ได้จาก browser โดยตรง การออกแบบและ limits สอดคล้องกับ feasibility และ overlap plan ของ P1 [1] [2]

การทำงานคง **local-only/privacy-first contract**: input ถูกอ่านและ parse ใน browser memory, ไม่มี upload, network request, analytics หรือ content persistence; export สร้างจาก SVG Blob/Canvas ใน browser การ implement ถูก lazy-load ผ่าน registry และไม่เพิ่ม graph implementation เข้า static entry โดยตรง

## Scope and design decisions

| Area | Review finding | Status |
|---|---|---|
| Tool boundary | ใช้ route ใหม่ `json-visualizer`; JSON Formatter ยังคงรับผิดชอบ format/minify/validate | ผ่าน |
| Input model | รับ JSON เท่านั้น และสร้าง node ที่มี id, path, depth, kind, label, preview และ parent/children | ผ่าน |
| Deterministic layout | ใช้ parent-child layout แบบคงที่แทน force-directed simulation เพื่อให้ preview/export ทำซ้ำได้ | ผ่าน |
| Search and navigation | ค้นหา path, key หรือ value และรักษา root/ancestor context สำหรับ tree exploration | ผ่าน |
| Limits | input 200,000 chars, 500 tree nodes, depth 32 และ graph rendering 360 visible nodes | ผ่าน |
| Output | tree summary, SVG graph และ PNG ที่สร้างใน browser; filename และ status ถูกกำหนดคงที่ | ผ่าน |
| UI lifecycle | delegated action handler, search input cleanup, object URL revocation และ state reset ใน `unmount()` | ผ่าน |
| Offline | `supportsOffline: true`; lightweight tool ไม่เพิ่ม worker asset ที่ไม่จำเป็น; cache namespace `v0.13.0-p1-json` | ผ่าน |
| Documentation | metadata, bilingual guide, README, progress, test report และ code review ถูกอัปเดต | ผ่าน |

## Security and privacy review

การแสดงข้อมูลจากผู้ใช้ใน tree และ graph ใช้ DOM `textContent` หรือ SVG escaping สำหรับ labels, paths และ previews จึงไม่ควรตีความ input เป็น HTML หรือ script การทดสอบยืนยันว่า `<script>`, closing tags และ ampersands ถูก escape ใน SVG output และไม่มี `<script>` ที่มาจาก input ปรากฏในผลลัพธ์ [3]

ข้อมูลไม่ถูกเขียนลง LocalStorage, IndexedDB หรือ remote endpoint โดยตัว module เก็บ state ไว้ใน memory ระหว่าง mount เท่านั้น การ export ใช้ Blob URL ที่ถูก revoke หลังการใช้งาน และ `unmount()` ล้าง listener, model, expanded state และ graph URL ความเสี่ยงจากการ parse ลดลงด้วย input length, node count และ depth guards ก่อนสร้าง model ขนาดใหญ่

PNG export อาศัย browser `Image`, `Canvas` และ Blob; หาก capability ไม่พร้อม ระบบรายงาน error ผ่าน status output แทนการส่งข้อมูลไปบริการภายนอก ข้อจำกัดสำคัญคือ local-only ไม่ได้หมายความว่า JSON จะไม่ปรากฏบนหน้าจอหรือใน browser memory ขณะผู้ใช้กำลังใช้งาน จึงควรหลีกเลี่ยงข้อมูลลับบนอุปกรณ์ที่ไม่ไว้วางใจ

## Performance review

Core logic เป็น synchronous text/JSON utility จึงยังใช้ main thread ตาม pattern ของโครงการ ไม่เพิ่ม Worker โดยไม่มี benchmark ที่พิสูจน์ความจำเป็น Guards จำกัดต้นทุนจาก input, recursion และ graph layout ส่วน renderer ตัด graph ที่เกิน 360 visible nodes เพื่อป้องกัน SVG ที่ใหญ่เกินควบคุม การ implement ถูกแยกเป็น lazy chunk

| Metric | Local result |
|---|---:|
| Entry gzip | 60.2 KB |
| Entry budget | 64 KB gzip; budget ถูกปรับอย่างมีเอกสารเพื่อรองรับ bilingual P1 catalog/guide |
| Largest lazy chunk | 366.1 KB (`pdf.worker.min`) |
| JSON Visualizer lazy chunk | 13.36 KB raw / 5.13 KB gzip |
| JavaScript total | 1,311.7 KB gzip จาก 64 chunks |
| Input guard | 200,000 chars |
| Tree guard | 500 nodes และ depth 32 |
| Graph guard | 360 visible nodes |

การเพิ่ม entry budget จาก 60 เป็น 64 KB เป็นการเปลี่ยนแปลงที่จำกัดและตรวจสอบได้: entry ที่วัดจริง 60.2 KB ยังมี headroom 3.8 KB ขณะที่ implementation ถูก lazy-load และ JSON Visualizer chunk มีขนาดเล็กกว่า parser-heavy P1 tool ก่อนหน้า การเพิ่ม budget นี้ไม่เปลี่ยน total JavaScript ceiling ที่ 1,600 KB gzip

## Functional and regression review

Unit suite ครอบคลุม deterministic paths/kinds, string preview truncation, empty/oversized/deep/large inputs, search ancestor preservation, collapse state, graph count และ SVG escaping Module contract ตรวจ metadata, route, lazy loading, mount controls และ unmount cleanup Playwright ตรวจ route load, local-only notice, sample loading, tree collapse/expand, search, graph SVG, SVG download, invalid JSON status และ mobile no-overflow

| Gate | Result |
|---|---:|
| TypeScript | ผ่าน `npm run typecheck` |
| JSON Visualizer unit suite | 6/6 tests |
| Module contract | ผ่าน; full contract file 6/6 tests |
| Full Vitest | 171/171 tests จาก 35 files |
| JSON Visualizer targeted E2E | 4 passed, 2 intentional skips จาก 6 cases |
| Full Playwright | 279 passed, 18 intentional skips จาก 297 cases บน 3 configured profiles |
| Production build | ผ่าน `npm run build` |
| Bundle gate | Entry 60.2 KB gzip; largest lazy 366.1 KB; total 1,311.7 KB จาก 64 chunks |
| Registry gate | ผ่าน 48 metadata modules, unique routes และ lazy registrations |
| SVG integrity | 120 assets; exact/geometry duplicates 0; near-duplicate warnings 0 |
| npm audit | 0 vulnerabilities |
| Service Worker syntax / diff check | ผ่าน |

## Residual risks and follow-up

รุ่นแรกเป็น JSON-only และไม่รองรับ YAML/XML/CSV, force-directed layout หรือ reference cycles เนื่องจาก JSON.parse รับ tree data ที่ไม่มี reference identity ผู้ใช้ควรใช้ Data Format Converter ก่อนหากข้อมูลต้นทางไม่ใช่ JSON และควรตรวจ node count/graph truncation เมื่อใช้ payload ใหญ่

การค้นหาใน tree ใช้ ancestor context เพื่อให้ node ที่ตรงคำค้นยังอ่านได้ แต่ filtering ไม่ใช่ semantic query language และไม่รองรับ JSONPath expression เต็มรูปแบบ หากอนาคตเพิ่ม query language ต้องกำหนด grammar และ escaping แยกต่างหาก

การ parse/render ยังทำบน main thread เมื่อ input ใกล้ limits หาก benchmark จริงพบ UI blocking ควรย้าย core ไป Worker พร้อม cancellation protocol และ lifecycle tests ไม่ควรเพิ่ม Worker เพียงเพื่อรองรับ graph ที่อยู่ใน limits ปัจจุบัน

การตรวจนี้เป็น local validation เท่านั้น ยังไม่อ้าง GitHub Actions หรือ GitHub Pages deployment evidence ใหม่จนกว่าจะ push commit และตรวจ remote state

## References

[1]: ../research/P1_JSON_VISUALIZER_FEASIBILITY.md "JSON Visualizer feasibility and design record"
[2]: ../research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md "P1 overlap and implementation plan"
[3]: ../../src/core/json-visualizer.ts "JSON Visualizer core model and SVG renderer"
[4]: ../../src/tools/json-visualizer/index.ts "JSON Visualizer UI module and lifecycle"
[5]: ../reports/TEST_REPORT.md "Repository validation evidence"
