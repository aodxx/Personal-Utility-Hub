# P1 JSON Visualizer / Graph Viewer — Feasibility Record

**สถานะ:** Approved implementation baseline
**วันที่:** 27 สิงหาคม 2026
**ขอบเขต:** JSON tree exploration, deterministic graph preview และ SVG/PNG export ใน browser

## Decision summary

สร้าง `json-visualizer` เป็น tool ใหม่แยกจาก `json-formatter` เพราะภารกิจหลักคือการสำรวจโครงสร้างและความสัมพันธ์ของข้อมูล ไม่ใช่การจัดรูปแบบข้อความ การออกแบบรุ่นแรกใช้ native DOM/SVG และ Canvas export โดยไม่เพิ่ม graph library เพื่อควบคุม bundle, escaping, offline behavior และ deterministic output

| Decision | Choice | Reason |
|---|---|---|
| Input | Strict JSON เท่านั้นในรุ่นแรก | ไม่ซ้อน scope กับ Data Format Converter และใช้ JSON parser ที่ผู้ใช้คุ้นเคย |
| Model | Bounded normalized tree with `path`, `key`, `kind`, `depth`, `value` | ใช้ร่วมกับ tree UI, graph layout และ export ได้ |
| Tree UI | Native DOM list, expand/collapse และ path search | keyboard-accessible, ไม่ต้องพึ่ง library |
| Graph UI | Layered deterministic SVG with parent-child edges | ความสัมพันธ์แม่นยำ, ใช้ preview เดียวกับ SVG export |
| SVG export | Serialize generated SVG string เป็น Blob | คง text/labels และไม่ใช้ remote asset |
| PNG export | Load same-origin Blob URL เข้า Canvas แล้ว export PNG | ใช้ browser API เดิมของ repository |
| Large input | 200,000 characters, 1,500 nodes, depth 32, string preview 160 chars | กัน recursion, DOM growth และ layout cost |
| Persistence | ไม่มี LocalStorage/IndexedDB สำหรับ input หรือ graph | คง privacy-first local-only contract |

## Normalized model

แต่ละ node มี `id`, `path`, `label`, `kind`, `depth`, `parentId`, `valuePreview`, `childCount` และ `children` เฉพาะที่อยู่ภายใต้ bounds ที่กำหนด `kind` มี `object`, `array`, `string`, `number`, `boolean` และ `null` การใช้ JSON Pointer-like path เช่น `$.users[0].name` ทำให้ tree search และ export labels ตรวจสอบย้อนกลับได้

Object properties รักษา insertion order ตาม `Object.keys`; array items ใช้ index เป็น label การเรียงนี้ deterministic และไม่อ้างอิง locale หรือ random ID ค่า primitive ไม่ถูกนำไปสร้าง HTML โดยตรง ต้องผ่าน text node/attribute escaping ก่อน render

## Layout and interaction contract

Graph layout ใช้ระดับ depth เป็นแกน Y และจัด nodes ในแต่ละระดับตาม document order โดยมี minimum node width/height, bounded canvas dimensions และ edge paths ที่คำนวณจาก node boxes ไม่ใช้ force simulation การ collapse node จะซ่อน descendants และคำนวณ graph ใหม่ ปุ่ม Expand all, Collapse all และ Search path เป็นการเปลี่ยน state ใน memory เท่านั้น

บน mobile ให้ tree เป็น default view เพื่อหลีกเลี่ยง graph ที่เล็กเกินไป และให้ graph viewport scroll ได้เฉพาะภายใน panel โดยไม่ทำให้ document มี horizontal overflow การ export ยังคงใช้ full graph bounds ที่จำกัดไว้

## Export and security

SVG preview/export สร้างจาก DOM/SVG APIs หรือ escaped deterministic markup เท่านั้น ห้าม interpolate raw JSON เข้า `innerHTML` โดยตรง ค่า labels และ primitive previews ต้อง escape `&`, `<`, `>`, `"` และ `'` ตาม context PNG export ต้อง revoke temporary Blob URL หลัง image decode/export เสร็จ

ไม่มี network request, remote font, external image, storage write หรือ telemetry ข้อมูล JSON อยู่ใน textarea และ module state จนกว่าจะเปลี่ยน route/unmount

## Deferred scope

รุ่นแรกยังไม่รองรับ YAML/XML/CSV, force-directed layout, arbitrary graph references/cycles, JSON Schema validation, diff mode, server-side rendering หรือการ export PDF หากเพิ่ม input formats ต้องใช้ normalized model ร่วมกับ Data Format Converter และทำ feasibility review ใหม่

## Definition of Done

ต้องมี unit tests สำหรับ parse bounds, node paths, primitive preview, search/collapse state และ SVG escaping; module contract ต้องตรวจ lazy load/mount/unmount; Playwright ต้องตรวจ sample → render, tree/graph toggle, collapse/search, SVG/PNG export trigger และ mobile no-overflow; release ต้องอัปเดต registry, i18n, guide, icon, cache namespace, README, progress, test report และ code review
