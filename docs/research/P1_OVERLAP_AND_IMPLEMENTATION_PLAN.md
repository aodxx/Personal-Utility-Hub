# P1 Overlap Review และ Implementation Plan

**วันที่:** 27 สิงหาคม 2026
**สถานะ:** Decision proposal ก่อนเริ่ม implementation
**ขอบเขต:** Data Format Converter, JSON Visualizer / Graph Viewer, Image/Media Metadata Cleaner และ SVG Optimizer / Minifier

## บทสรุปการตัดสินใจ

P1 ทั้งสี่รายการไม่ควรถูกทำด้วยกลยุทธ์เดียวกัน เพราะมีระดับความซ้ำกับเครื่องมือเดิมและความเสี่ยงเชิงข้อมูลแตกต่างกันอย่างชัดเจน แนวทางที่เหมาะสมคือ **อัปเกรด `SVG Asset Studio` โดยตรง**, สร้าง **เครื่องมือใหม่ที่ใช้ core ร่วมกัน** สำหรับ Data Format Converter และ JSON Visualizer และสร้าง **Metadata Cleaner เป็นเครื่องมือใหม่ที่แยก boundary จาก File Metadata Viewer**

| P1 candidate | แนวทางที่แนะนำ | ID/route ที่เสนอ | ความสัมพันธ์กับของเดิม |
|---|---|---|---|
| Data Format Converter | เครื่องมือใหม่ ใช้ parser/formatter core ร่วมกับ JSON tools | `data-format-converter` / `#/tools/data-format-converter` | JSON Formatter ตรวจและจัดรูปแบบ JSON เท่านั้น ส่วน converter มีหลาย format และมี conversion-loss warning |
| JSON Visualizer / Graph Viewer | เครื่องมือใหม่ เน้น interactive exploration ไม่ใช่ formatter mode | `json-visualizer` / `#/tools/json-visualizer` | ใช้ JSON parser ร่วมกับ JSON Formatter และอาจมีปุ่มส่งต่อไป visualize แต่ไม่ควรยัด tree/graph UI เข้า formatter |
| Image/Media Metadata Cleaner | เครื่องมือใหม่ แยก read-only viewer ออกจาก privacy sanitization/export | `metadata-cleaner` / `#/tools/metadata-cleaner` | ใช้ metadata parser และ file validation ร่วมกับ File Metadata Viewer แต่มี write/export และความเสี่ยงคนละประเภท |
| SVG Optimizer / Minifier | อัปเกรดเป็น optimization workflow หลักของ `SVG Asset Studio` | คง `svg-asset-studio` เดิม | ของเดิมมี inspect, sanitize, safe/balanced/aggressive optimize และ export อยู่แล้ว จึงไม่ควรสร้าง route ที่ซ้ำ |

> **หลักการสำคัญ:** ไม่ควรสร้าง route ชื่อ `*-v2` หรือ `*-v+` เพียงเพราะฟีเจอร์เพิ่มขึ้น ให้ใช้ semantic version ใน metadata สำหรับการอัปเกรดที่ยังเป็นภารกิจเดิม และสร้าง tool ID ใหม่เมื่อภารกิจ, ผลลัพธ์ หรือ privacy boundary เปลี่ยนจริง

เอกสารนี้ต่อยอดจาก research/evaluation เดิมของ repository ซึ่งจัด P1 ทั้งสี่ไว้เป็นลำดับถัดจาก P0 และกำชับเรื่อง parser feasibility, input limits, Worker, reversible export และการไม่อ้างความครอบคลุมเกิน implementation จริง [1] [2]

## เกณฑ์ตัดสินใจ: อัปเกรด, โหมดเสริม หรือเครื่องมือใหม่

ให้ตัดสินใจจาก **งานหลักที่ผู้ใช้ต้องการทำ** ไม่ใช่จากชนิดไฟล์เพียงอย่างเดียว เครื่องมือควรถูกอัปเกรดเมื่อ input, mental model, output และความเสี่ยงอยู่ใน workflow เดียวกัน หากใช้ input คล้ายกันแต่ output และวิธีตรวจสอบต่างกัน ให้แยกเป็นเครื่องมือใหม่แล้วเชื่อมโยงกันด้วย related action หรือ deep link

| คำถามตัดสินใจ | ถ้าใช่ | แนวทาง |
|---|---|---|
| ผู้ใช้เข้ามาเพื่อทำงานหลักเดียวกันหรือไม่ | ใช่ | อัปเกรดเครื่องมือเดิม เพิ่ม mode/option และเพิ่ม semantic version |
| ใช้ parser/core ร่วมกันได้ แต่ผู้ใช้ต้องการ output หรือ interaction คนละแบบหรือไม่ | ใช่ | แยก tool route ใหม่ ใช้ core package ร่วม และทำ cross-link |
| มีการเขียนไฟล์ใหม่, ลบข้อมูล, permission หรือ privacy risk เพิ่มหรือไม่ | ใช่ | แยก privacy boundary และมักควรเป็นเครื่องมือใหม่ |
| มีเพียงการปรับ UI, เพิ่ม format ย่อย หรือเพิ่ม export ที่ไม่เปลี่ยนภารกิจหรือไม่ | ใช่ | อัปเกรดใน tool เดิม ไม่สร้าง `v2` route |
| ทำให้ catalog search เจอผลลัพธ์ซ้ำสองรายการจนผู้ใช้เลือกไม่ถูกหรือไม่ | ใช่ | หยุดและทบทวน scope ก่อนสร้าง module ใหม่ |

### Naming และ versioning policy

`tool ID` คือชื่อของภารกิจที่เสถียร ไม่ใช่ชื่อ release ตัวอย่างเช่น `svg-asset-studio` สามารถเปลี่ยนจาก beta optimizer เป็น production-grade optimizer ได้โดยคง route เดิมและอัปเดต `metadata.version` จาก `0.1.x` เป็น `0.2.0` หรือ `1.0.0` ตามระดับการเปลี่ยนแปลง ส่วน `json-visualizer` ควรมี ID ใหม่ เพราะผู้ใช้ต้องการสำรวจโครงสร้างและกราฟ ไม่ใช่เพียงจัดรูปแบบข้อความ

## Overlap review รายรายการ

### 1. Data Format Converter — สร้างเครื่องมือใหม่ แต่ใช้ JSON core ร่วม

`JSON Formatter / Validator` ใน repository ปัจจุบันรับผิดชอบ parse, format และ minify JSON เท่านั้น [3] ขณะที่ `JSON Schema Generator` ทำ JSON sample ไปเป็น inferred schema และ `JSON i18n Mapper` ทำการเทียบ key ของ locale โดยเฉพาะ ทั้งสองจึงไม่ใช่ฐานที่เหมาะสำหรับการฝัง converter หลายรูปแบบลงไปโดยตรง

IT Tools แยกความสามารถ YAML, TOML และ XML เป็นชุด converter หลายทิศทาง เช่น YAML↔JSON, YAML↔TOML และ JSON↔XML [4] ส่วน JSON Crack ก็ประกาศรองรับการแสดงผลและแปลง JSON, YAML, CSV และ XML [5] ดังนั้นความแตกต่างที่ Personal Utility Hub ควรสร้างไม่ใช่จำนวน format มากที่สุด แต่คือ **conversion contract ที่โปร่งใส, error location ที่เชื่อถือได้ และ local-only behavior**

**คำแนะนำเชิงขอบเขตสำหรับรุ่นแรก** คือรองรับ JSON, YAML, TOML และ XML เท่านั้น โดยเริ่มจาก conversion ที่มี JSON เป็นศูนย์กลางก่อน เช่น JSON↔YAML, JSON↔TOML และ JSON↔XML ไม่ควรเพิ่ม CSV ในรุ่นแรก เพราะ repository มี CSV Profiler และ CSV Thai Encoding Repair อยู่แล้ว และ CSV มี semantics แบบตารางที่ไม่เทียบเท่า object tree โดยตรง

เครื่องมือนี้ควรเป็น **new tool** เพราะผู้ใช้เลือก input format, output format, validation และ export file เป็น workflow ใหม่ แม้จะ reuse `parseJson` หรือ error-normalization helper ได้ก็ตาม ไม่ควรเปลี่ยน JSON Formatter ให้กลายเป็น multi-format workbench เพราะจะทำให้ชื่อเดิมและ expectation เดิมคลุมเครือ

ข้อจำกัดที่ต้องประกาศใน UI คือ conversion ระหว่าง format อาจสูญเสียข้อมูลหรือเปลี่ยน semantics เช่น comments, anchors, tags, ordering, XML attributes/namespaces และชนิดข้อมูลเฉพาะของ TOML จึงต้องมี warning ว่า output เป็นการแปลงเชิงข้อมูล ไม่ใช่ round-trip fidelity guarantee

### 2. JSON Visualizer / Graph Viewer — สร้างเครื่องมือใหม่ และเชื่อมจาก JSON Formatter

JSON Crack วางตำแหน่งตัวเองเป็น interactive graph/tree viewer ที่รองรับการ explore และ export เป็น PNG, JPEG หรือ SVG [5] นี่เป็น mental model คนละแบบกับ JSON Formatter ซึ่งผลลัพธ์หลักเป็นข้อความที่จัดรูปแบบแล้ว แม้ทั้งสองจะเริ่มจาก JSON input เหมือนกัน

จึงแนะนำให้สร้าง `json-visualizer` แยกเป็นเครื่องมือใหม่ โดยรุ่นแรกควรโฟกัส **JSON tree** ก่อน ไม่ต้องรับ YAML/XML/CSV ตั้งแต่เริ่ม เพราะการเพิ่มหลาย parser จะทำให้ scope ซ้อนกับ Data Format Converter และเพิ่มภาระด้าน layout/export พร้อมกัน การรองรับ format อื่นค่อยพิจารณาหลังมี shared normalized data model และ test fixtures ที่ชัดเจน

ความร่วมมือกับ JSON Formatter ควรอยู่ที่ระดับ UX ไม่ใช่การรวม module เช่น เมื่อ JSON Formatter parse สำเร็จ อาจมี action “เปิดใน JSON Visualizer” ที่ส่งเฉพาะข้อมูลใน memory ไปยัง route ใหม่โดยไม่ใช้ storage หรือ network การทำเช่นนี้รักษาหน้าที่ของแต่ละเครื่องมือและช่วยให้ผู้ใช้ค้นพบความสามารถต่อเนื่องกัน

ต้องกำหนด guard ก่อน render ได้แก่ input byte/character limit, maximum node count, maximum depth, truncation ของ string ที่ยาวมาก และ deterministic layout บนมือถือ การ export SVG/PNG ต้องสร้างจากข้อมูลที่ parse แล้วโดย escape labels และใช้ `textContent` หรือ DOM/SVG APIs ไม่ interpolate JSON ที่ผู้ใช้ป้อนเข้า `innerHTML`

### 3. Image/Media Metadata Cleaner — สร้างเครื่องมือใหม่ แยกจาก File Metadata Viewer

`File Metadata Viewer` ปัจจุบันเป็น read-only inspection workflow ที่แสดงชื่อไฟล์, MIME, ขนาด, modification time, SHA-256 และข้อมูลเฉพาะของรูปภาพหรือ PDF โดยไม่แก้ไขไฟล์ต้นฉบับ การเพิ่มปุ่ม “ล้าง metadata” เข้าไปทันทีจะทำให้เครื่องมือเดียวมีทั้ง read-only inspection และ privacy-sensitive mutation ซึ่งมี error, preview และ expectation คนละชุดกัน

ExifTool เป็น Perl library และ command-line application ที่อ่าน/เขียน metadata ได้กว้างมาก รวมถึง EXIF, GPS, IPTC, XMP, ICC, maker notes และ metadata ของภาพ เสียง และวิดีโอหลายชนิด [6] ความครอบคลุมระดับนั้นไม่ควรถูกอ้างใน browser utility หาก implementation จริงยังรองรับเพียงบาง MIME type หรือใช้การ re-encode ผ่าน Canvas

จึงแนะนำ `metadata-cleaner` เป็น **new tool** ที่ใช้ file validation และ metadata parsing core ร่วมกับ Viewer แล้วให้ Viewer มี related action “ล้างข้อมูลส่วนตัว” แทนการรวมหน้าจอทั้งหมดเข้าด้วยกัน วิธีนี้ทำให้ผู้ใช้เข้าใจว่า Viewer อ่านข้อมูล ส่วน Cleaner สร้างไฟล์ใหม่ที่ผ่านกระบวนการ sanitization

ก่อนเริ่ม UI ต้องทำ **format feasibility proof-of-concept** โดยใช้ fixtures ที่มี EXIF GPS, IPTC และ XMP จริง และตอบให้ได้ว่าแต่ละ format ทำอะไรได้บ้าง:

| รุ่นแรกที่เสนอ | การทำงาน | สถานะที่ต้องประกาศ |
|---|---|---|
| JPEG | อ่าน tag ที่รองรับและ export sanitized JPEG หรือ strip segment ตาม parser ที่เลือก | ต้องตรวจว่าคุณภาพ, orientation และ color profile เปลี่ยนหรือไม่ |
| PNG | ตรวจ ancillary metadata ที่ parser รองรับ และ/หรือ re-encode เป็น PNG ใหม่ | ห้ามอ้างว่าลบทุก proprietary chunk หากยังไม่ได้ตรวจ |
| WebP | รองรับเมื่อ parser และ browser decode/export path ตรวจสอบแล้ว | ต้องทดสอบ XMP/EXIF/ICC และ animated WebP แยกกัน |
| GIF, HEIC, AVIF, MP4/MOV และ RAW | ยังไม่อยู่ใน MVP | แสดงว่าไม่รองรับและไม่สร้างไฟล์หลอกว่าสะอาด |

คำว่า “clean” ต้องหมายถึง **tag/segment ที่ implementation ตรวจและลบได้จริง** ไม่ใช่คำรับรองว่าไม่มีข้อมูลแฝงทุกชนิด หากใช้ Canvas re-encode ต้องเตือนว่าผลลัพธ์อาจเปลี่ยน compression, color profile, animation หรือ orientation และต้อง export เป็นไฟล์ใหม่เสมอ โดยไม่ overwrite input

งานนี้ควรใช้ Worker หรืออย่างน้อยมี cancellation และ size guard เพราะอาจอ่านไฟล์ภาพขนาดใหญ่และสร้าง output buffer ใหม่ การแสดงผลก่อน/หลังควรแสดงรายการ metadata ที่ตรวจพบ, รายการที่ลบได้, รายการที่คงอยู่/ตรวจไม่ได้ และ checksum ของ output เพื่อให้ผู้ใช้ตรวจสอบได้

### 4. SVG Optimizer / Minifier — อัปเกรด SVG Asset Studio ไม่สร้าง tool ซ้ำ

`SVG Asset Studio` มี scope ครอบคลุมอยู่แล้วทั้งค้นหา asset, preview, inspect, sanitize, edit, optimize และ export pack โดยมี preset `safe`, `balanced` และ `aggressive` ใน core ปัจจุบัน ดังนั้นการสร้าง `svg-optimizer` แยกจะทำให้มีสองจุดที่ดูแล sanitizer และ optimization policy ซ้ำกัน

ข้อเสนอคือยกระดับ optimization workflow ใน `svg-asset-studio` ให้มี preview ก่อน/หลัง, raw byte comparison, gzip comparison, markup diff และผลกระทบด้าน accessibility/semantics โดยคง preset safe เป็นค่าเริ่มต้นและให้ advanced options แสดงคำเตือนก่อนลบ `title`, `desc`, metadata, scripts, IDs หรือ fixed dimensions

SVGOMG ใช้ SVGO และแสดง controls จำนวนมาก เช่น remove metadata, clean IDs, remove scripts, remove title/desc, multipass, number precision และ gzip comparison [7] ขณะที่ SVGO มี browser import ในสาย v4 ตามเอกสารโครงการ [8] หากเลือกใช้ SVGO ควรทำ feasibility spike ก่อน โดย lazy-load หรือรันใน Worker ตาม bundle/latency result ไม่ควรนำ dependency ขนาดใหญ่เข้า entry bundle

การอัปเกรดนี้ควรแยกเป็น milestone ภายใน tool เดิม:

| Milestone | ขอบเขต |
|---|---|
| A | เพิ่ม before/after bytes, gzip estimate, markup diff และ regression fixtures |
| B | เปลี่ยน safe preset ให้ใช้ optimizer ที่ deterministic และรักษา accessibility defaults |
| C | เพิ่ม balanced/aggressive options พร้อม explicit warnings และ reset/reversible preview |
| D | วัด bundle, Worker/offline preparation และทดสอบ malformed/unsafe SVG อย่างละเอียด |

## แนวทางปฏิบัติก่อนเริ่มเพิ่ม P1

### ขั้นที่ 0: ปิดขอบเขตและแยกงานจาก P0 ที่ค้างอยู่

ขณะจัดทำเอกสารนี้ working tree มี P0 test-suite changes ที่ยังไม่ได้ commit ได้แก่ dedicated unit/integration tests และการอัปเดต test report ดังนั้นควร commit งาน P0 ให้แยกจาก P1 ก่อนเริ่มเพิ่ม dependency หรือแก้ catalog เพื่อให้ rollback และ review ได้ชัดเจน การทำ P1 ต่อบน working tree เดียวกันโดยไม่แยก commit จะทำให้แยกสาเหตุของ regression ยากขึ้น

### ขั้นที่ 1: เขียน ADR และทำ dependency feasibility spike

ก่อนสร้าง UI ให้สร้าง decision record ต่อรายการ โดยบันทึก primary task, existing overlap, selected route, input/output limits, parser/library candidate, Worker decision, offline assets, failure behavior และ known limitations สำหรับ Data Format Converter และ Metadata Cleaner ต้องทำ parser PoC ก่อนอนุมัติ implementation เต็มรูปแบบ ส่วน SVG ต้องวัด SVGO/browser bundle ก่อนตัดสินใจเพิ่ม dependency

### ขั้นที่ 2: สร้าง pure core และ fixtures ก่อน module UI

วาง parser, conversion model, error normalization, metadata report, sanitizer และ size guards ไว้ใน `src/core/` หรือ logic module ที่แยกทดสอบได้ กำหนด fixture ที่ปลอดภัยและไม่ใช่ข้อมูลส่วนตัวจริง โดยเฉพาะไฟล์ JPEG/PNG/WebP ที่มี metadata จำลองและ SVG ที่มี `title`, `desc`, `script`, remote URL, IDs และ malformed XML

### ขั้นที่ 3: ออกแบบ privacy boundary ให้เห็นใน UI

ทุก tool ต้องแสดง local-only notice และบอกชัดเจนว่า input อ่านที่ใด, ประมวลผลใน thread/Worker ใด, เก็บข้อมูลไว้หรือไม่ และ output ถูกสร้างใหม่อย่างไร ห้ามเพิ่ม URL fetch, analytics, remote parser service, cloud upload, user-content persistence หรือ remote JWK-like behavior โดยปริยาย การดาวน์โหลดต้องเป็น explicit user action และต้องไม่แก้ input file เดิม

### ขั้นที่ 4: สร้าง module ตาม repository contract

แต่ละเครื่องมือที่เป็น route ใหม่ต้องมี `metadata.ts`, `index.ts`, typed bilingual guide, static metadata import, lazy registry entry, unique icon และ lifecycle cleanup ตาม `privacy-first-utility-expansion` skill [9] หากมี Worker ต้องมี protocol ที่ typed, timeout/cancel/terminate, bounded fallback เมื่อเหมาะสม และ `prepareOffline` เฉพาะ asset ที่ต้องใช้จริง

### ขั้นที่ 5: ทำ test matrix ก่อนประกาศว่าเสร็จ

ขั้นต่ำต้องมี unit tests ของ pure core, registry/module contract tests และ Playwright workflows บน Desktop Chromium กับ Android profiles โดยครอบคลุม success, malformed input, size limit, reset/cancel, export/download, no-overflow และ privacy notice สำหรับ Metadata Cleaner และ SVG Optimizer ต้องมี before/after fixtures ที่ตรวจว่า output ไม่สูญเสีย semantics ที่ safe preset สัญญาว่าจะรักษา

### ขั้นที่ 6: ตรวจ performance และ security แบบ targeted

ต้องตรวจ bundle impact ของ parser/optimizer, memory peak ของ conversion และ image re-encode, Worker lifecycle, stale async result, object URL revocation, unsafe XML/SVG content, remote references, scripts, external entities และ untrusted labels การผ่าน unit test อย่างเดียวไม่เพียงพอสำหรับเครื่องมือที่สร้างไฟล์ใหม่หรือ parse markup ที่ผู้ใช้ป้อน

### ขั้นที่ 7: Integrate catalog และ release record ใน commit เดียวกับ feature

เมื่อ feature ผ่าน review แล้วจึงเพิ่ม metadata/catalog/guides/search/localization/icon/offline cache assertions พร้อมกัน และบันทึกตัวเลขจริงใน `docs/reports/TEST_REPORT.md`, `docs/reports/PROGRESS.md` และ code-review report ไม่ปรับ exact-count assertions ให้หลวมเพื่อซ่อนผลกระทบของ feature

## ลำดับ implementation ที่แนะนำ

| ลำดับ | งาน | เหตุผล | เงื่อนไขเริ่ม |
|---:|---|---|---|
| 0 | Commit P0 test suite ที่ค้างอยู่ | แยก baseline และลดความเสี่ยงปนกัน | Full unit/P0 E2E ผ่านแล้ว |
| 1 | SVG Asset Studio optimization upgrade | ใช้ module/core เดิมมากที่สุดและลด catalog duplication | ผ่าน SVGO/browser feasibility และ bundle spike |
| 2 | Data Format Converter MVP | คุณค่าชัดและแชร์ JSON parser/error model ได้ | เลือก parser, semantics warning และ format matrix แล้ว |
| 3 | JSON Visualizer MVP | เป็นความสามารถใหม่ที่เชื่อม JSON Formatter ได้ แต่ต้องทำ layout/performance | กำหนด node/depth/layout/export limits แล้ว |
| 4 | Metadata Cleaner feasibility + MVP | คุณค่าสูงแต่ risk และ parser scope ใหญ่ที่สุด | มี format fixtures และ proof ว่าลบ tag ได้จริงก่อนสร้าง UI |

ลำดับนี้ไม่ได้หมายความว่า Metadata Cleaner มีคุณค่าน้อยกว่า แต่สะท้อนความเสี่ยงของการอ้างว่าไฟล์ “สะอาด” และความกว้างของ format support หาก proof-of-concept ไม่ผ่าน ควรเลื่อน feature หรือหั่น scope เป็น `Image Metadata Sanitizer` ที่ประกาศรองรับเฉพาะ format/tag ที่พิสูจน์ได้ แทนการปล่อยเครื่องมือกว้างแต่ไม่สามารถรับรองผลลัพธ์ได้

## Definition of Done สำหรับ P1

P1 จะถือว่าพร้อม merge เมื่อมีผลครบทั้งด้าน product, privacy, correctness และ operations ดังนี้:

| Area | เกณฑ์ผ่าน |
|---|---|
| Product boundary | ชื่อ/route ไม่ซ้ำกับเครื่องมือเดิม และอธิบายความแตกต่างใน guide ได้ |
| Core correctness | มี pure tests สำหรับ valid, invalid, boundary และ lossy/unsupported cases |
| Privacy | ไม่มี network/storage ของ user content และ UI อธิบายขอบเขตจริง |
| Lifecycle | abort/cancel/terminate/revoke/cleanup ครบตามชนิดงาน |
| UX | มี preview ก่อน export, error location หรือ unsupported reason ที่ actionable, keyboard/mobile safe |
| Integration | metadata, lazy registry, guide, localization, icon และ offline preparation ถูกอัปเดตครบ |
| Performance | entry/lazy/total bundle, input limits และ memory-sensitive paths ผ่าน budget ที่วัดจริง |
| Regression | full typecheck, Vitest, build, bundle, registry, SVG integrity, P0 E2E และ relevant full E2E ผ่าน |
| Documentation | test report, progress และ code review ระบุผลจริงและ known limitations |

## ข้อสรุป

แนวทางที่เหมาะสมไม่ใช่การสร้างเครื่องมือใหม่ทั้งสี่รายการ แต่เป็นการใช้ **shared core + distinct user-facing task boundaries**: `SVG Asset Studio` ควรเป็นจุดรวมของ SVG optimization, Data Format Converter และ JSON Visualizer ควรแยกเป็นสอง route ที่เชื่อมกันได้, และ Metadata Cleaner ควรแยกจาก File Metadata Viewer จนกว่าจะพิสูจน์ parser และ sanitization contract ได้ครบ การตัดสินใจนี้ลด duplicate tools ใน catalog, รักษาความเข้าใจง่ายของผู้ใช้ และทำให้ security/performance review ตรวจเป็นราย boundary ได้

## References

[1]: EXTERNAL_TOOLS_RESEARCH_v0.10.md "External tools research in this repository"
[2]: external-tools-evaluation-v0.10.md "External tools evaluation matrix in this repository"
[3]: https://it-tools.tech/ "IT Tools — Handy tools for developers"
[4]: https://it-tools.tech/ "IT Tools — Converter catalog"
[5]: https://jsoncrack.com/ "JSON Crack — Interactive JSON graphs"
[6]: https://exiftool.org/ "ExifTool by Phil Harvey"
[7]: https://svgomg.net/ "SVGOMG — Optimize and minify SVG images"
[8]: https://github.com/svg/svgo "SVGO — SVG Optimizer for Node.js and CLI"
[9]: ../../skills/privacy-first-utility-expansion/SKILL.md "Privacy-First Utility Expansion skill"
