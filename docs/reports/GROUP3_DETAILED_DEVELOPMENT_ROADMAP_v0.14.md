# แผนพัฒนาเครื่องมือกลุ่ม 3 ฉบับละเอียด

**สถานะ:** Proposed execution roadmap
**ฐานข้อมูล:** Personal Utility Hub `v0.14.0`
**ขอบเขต:** เครื่องมือกลุ่ม 3 จำนวน 36 รายการ
**หลักการ:** privacy-first, local-only, incremental releases, evidence-driven delivery

## 1. เป้าหมายและกติกากลาง

กลุ่ม 3 หมายถึงเครื่องมือที่มี workflow ใช้งานได้และมีฐานที่ต่อยอดได้ แผนนี้จึงไม่เริ่มจากการเพิ่ม option ให้มากที่สุด แต่เริ่มจากความสามารถที่ทำให้ผลลัพธ์ **ถูกต้องขึ้น ตรวจสอบได้ขึ้น ใช้งานซ้ำได้ขึ้น และส่งต่อได้ปลอดภัยขึ้น** ทุกงานต้องไม่ทำให้ first-run workflow ยาวขึ้นโดยไม่มี progressive disclosure

ทุก feature ต้องระบุ input, processing boundary, output, storage และ permission ก่อนเริ่มพัฒนา การประมวลผลไฟล์และข้อมูลผู้ใช้ต้องอยู่ใน browser memory หรือ Worker ที่มีอยู่แล้ว ห้ามเพิ่ม upload, telemetry, cloud conversion, remote key fetch หรือ content storage โดยอัตโนมัติ

## 2. วิธีจัดลำดับ

ใช้คะแนนห้ามิติจาก 1 ถึง 5 ได้แก่ Impact, Usability gain, Effort, Risk และ Reuse โดย Effort/Risk เป็นตัวลด priority ส่วนคะแนนสุดท้ายใช้เพื่อเปรียบเทียบ ไม่ใช่ telemetry หรือ prediction ของจำนวนผู้ใช้

| เกณฑ์ | คำถามตรวจสอบ | หลักฐานที่ต้องมี |
|---|---|---|
| Impact | ช่วย workflow กว้างหรือป้องกันความเสียหายสำคัญหรือไม่ | use case และ failure mode |
| Usability gain | ลดจำนวนการเดา ขั้นตอน หรือศัพท์เฉพาะหรือไม่ | before/after flow |
| Effort | ต้องแก้ core, worker, parser หรือหลาย module เพียงใด | implementation estimate |
| Risk | เสี่ยงต่อข้อมูลรั่ว output ผิด หรือ compatibility หรือไม่ | threat/compatibility note |
| Reuse | ใช้ shared core/UI/test helper กับเครื่องมืออื่นได้หรือไม่ | dependency map |

## 3. Execution order ที่แนะนำ

### Wave 0 — Shared foundation ก่อนเพิ่ม feature

ทำ shared primitives สำหรับ preview before/after, deterministic batch queue, progress/cancel, undo/reset, download verification, safe text rendering, local-only/no-network assertion และ mobile overflow assertion ก่อน เมื่อ primitive ใดเพิ่ม bundle หรือ lifecycle complexity ให้ทำ benchmark และ module contract ก่อนนำไปใช้หลายเครื่องมือ

### Wave A — P0: ความถูกต้อง ความปลอดภัย และคุณค่าที่เห็นทันที

| ลำดับ | Tool | Deliverable หลัก | Acceptance criteria | Effort/Risk |
|---:|---|---|---|---|
| 1 | `json-formatter` | diagnostics ที่ระบุ line/column, JSON/JSONC mode, large-input benchmark | malformed input ชี้ตำแหน่งได้, mode ไม่สับสน, 200k-char case ไม่ block UI | 2/2 |
| 2 | `image-blur` | multi-region history, privacy preview, assist แบบ local | เห็น original/preview สลับได้, reset/undo ได้, export ไม่เก็บต้นฉบับ | 3/3 |
| 3 | `image-resizer` | batch, presets, aspect lock, target-size guidance, EXIF policy | queue มี progress/cancel, ชื่อ output deterministic, no-overflow | 2/2 |
| 4 | `image-compressor` | before/after, quality presets, batch queue, size comparison | output size/quality แสดงจริง, warning เมื่อใหญ่ขึ้น, partial failure ชัด | 3/3 |
| 5 | `pdf-organizer` | thumbnails ที่เร็วขึ้น, drag/keyboard reorder, undo, page summary | reorder 3 หน้าและ undo ได้, export ลำดับตรง, keyboard path ผ่าน | 3/3 |
| 6 | `privacy-redactor` | confidence review, custom rules, audit, reversible preview | blocking/warning แยกชัด, ตรวจ redaction ก่อน export, ไม่มี false claim | 3/3 |
| 7 | `hash-verifier` | multi-file manifest, drag/drop compare, algorithm presets, report | manifest deterministic, file/text guard, report copy/download ตรงค่า | 2/2 |
| 8 | `csv-profiler` | type inference, null/duplicate profile, delimiter preview, report | inference มี confidence/unknown, Unicode/delimiter ผิดแสดงเหตุผล | 2/2 |
| 9 | `qr-reader` | multi-code scan, permission explainer, result validation, opt-in session | ขอ camera หลัง user action, ปิด stream ทุกทาง, session ไม่ persist โดย default | 2/3 |
| 10 | `data-format-converter` | presets, schema warnings, round-trip diff | lossy conversion มี warning, output diff ก่อน download, limits คงเดิม | 3/3 |
| 11 | `json-visualizer` | focus-to-match, richer path query, subtree export, truncation summary | search แล้ว focus ได้, export subtree ตรง selection, limits อธิบายชัด | 2/2 |
| 12 | `image-converter` | batch, format/quality presets, metadata policy, compatibility warning | output extension/MIME ตรงกัน, batch cancel/retry และ metadata notice ผ่าน | 2/2 |

**Wave A gate:** ทุกเครื่องมือต้องมี unit test ของ core, module lifecycle contract, Playwright success/error/download/mobile test และ static audit ที่ยืนยัน no-network/no-content-storage หาก output เปลี่ยนความหมายต้องมี preview หรือ diff ก่อน export

### Wave B — P1: Batch และ interoperability

| ลำดับ | Tool | Deliverable หลัก | Acceptance criteria | Effort/Risk |
|---:|---|---|---|---|
| 13 | `csv-encoding-repair` | delimiter detection, encoding confidence, diff preview, batch | preview แสดงอักขระเสียก่อน/หลัง, partial failure report ครบ | 2/2 |
| 14 | `file-diff` | folder-aware diff, ignore rules, binary summary, report/patch export | ignore rules deterministic, binary ไม่ถูก decode ผิด, report reproducible | 3/3 |
| 15 | `file-metadata` | privacy-risk groups, batch inspection, report export | GPS/EXIF/IPTC/XMP แยก risk, report ไม่เก็บไฟล์ต้นฉบับ | 2/2 |
| 16 | `image-contact-sheet` | sort/filter, captions, layout presets, PDF export | order/filter แสดงก่อน export, long filename ไม่ overflow | 2/2 |
| 17 | `image-crop` | aspect presets, safe-area guide, batch crop, transparency preview | crop boundary deterministic, transparent output preview ตรงจริง | 2/2 |
| 18 | `image-watermark` | position presets, opacity preview, tile mode, batch progress | preview ตรงตำแหน่ง/opacity, cancel ไม่ทิ้ง stale output | 2/2 |
| 19 | `images-to-pdf` | reorder, page-size/margin presets, quality summary, preview | page order/size/margin ตรวจได้ก่อน export, memory guard ทำงาน | 2/3 |
| 20 | `json-i18n-mapper` | locale diff, missing/extra key report, placeholder validation, patch export | missing/extra/placeholder mismatch แยกประเภท, patch ไม่เขียนทับต้นฉบับ | 3/2 |
| 21 | `json-schema-generator` | draft selector, inferred constraints, required review, schema diff | required fields ต้อง review ได้, draft/output contract ตรงกัน | 3/3 |
| 22 | `markdown-table-builder` | CSV paste, alignment presets, malformed-row validation, round-trip preview | pipe/newline escaping ถูกต้อง, preview กับ Markdown output ตรงกัน | 1/1 |
| 23 | `svg-asset-studio` | optimization profiles, attribute diff, accessibility checks, regression preview | semantics-sensitive diff แสดงก่อน export, restore ได้, SVG sanitize คงเดิม | 3/3 |
| 24 | `qr-generator` | batch QR, error correction presets, label templates, print sheet | payload ไม่ upload, batch naming deterministic, scan-back test ผ่าน | 2/2 |

**Wave B gate:** batch ต้องมี queue/progress/cancel, file-size/memory guard, deterministic naming และ partial-failure report; interoperability ต้องมี explicit loss warning และ round-trip/diff evidence

### Wave C — P2: ความลึกเฉพาะทางเมื่อมี demand ชัด

| ลำดับ | Tool | Deliverable หลัก | Acceptance criteria | Effort/Risk |
|---:|---|---|---|---|
| 25 | `jwt-inspector` | claim timeline, issuer/audience hints, redacted export | ย้ำว่า decode ไม่ใช่ verify, redaction ไม่เปลี่ยน raw token โดยอัตโนมัติ | 2/2 |
| 26 | `regex-playground` | explain mode, test-case sets, backtracking warning | Worker timeout/DoS guard ไม่ลดลง, explanation ไม่อ้างความปลอดภัยเกินจริง | 3/3 |
| 27 | `silence-remover` | threshold presets, waveform markers, selection preview, batch | preview ระบุช่วงที่จะตัด, cancel/unmount ผ่าน, benchmark ก่อน worker decision | 3/3 |
| 28 | `base64` | file mode, URL-safe mode, strict diagnostics, line-wrap | text/file mode แยก, malformed byte/URL-safe semantics อธิบายชัด | 1/1 |
| 29 | `color-contrast` | palette batch, suggested colors, WCAG context | pass/fail ไม่พึ่งสี, suggestion ไม่อ้างว่าเป็น full audit | 2/2 |
| 30 | `flowchart-studio` | templates, import/export standard, keyboard graph editing, validation | round-trip ไม่ loss เงียบ, graph keyboard path ผ่าน | 3/3 |
| 31 | `json-ld-generator` | schema presets, validation hints, snippet preview | JSON-LD valid ตาม selected context, ไม่รับประกัน SEO | 2/2 |
| 32 | `pdf-merge` | reorder preview, bookmarks, progress, partial-failure | large-file guard, cancel/worker cleanup, page order preview ตรง output | 3/3 |
| 33 | `pdf-split` | range presets, thumbnails, batch split, naming preview | boundary/rotated-page cases ผ่าน, names deterministic | 2/3 |
| 34 | `pdf-to-image` | page range, quality presets, size estimate, memory guidance | output estimate มี caveat, worker cancel/revoke ครบ | 3/3 |
| 35 | `text-formatter` | named presets, transform preview, shortcuts, custom pipeline | pipeline deterministic, original reversible, mobile controls ไม่ล้น | 1/1 |
| 36 | `url-query-builder` | URL diff, array presets, fixtures, invalid URL guidance | encoding semantics แสดงชัด, input ไม่ถูกส่ง/เก็บ, round-trip test ผ่าน | 2/2 |

**Wave C gate:** ต้องมี sample ที่ปลอดภัย, plain-language explanation, explicit limitation, core tests และ progressive disclosure; หาก feature เพิ่ม first-run complexity โดยคุณค่าไม่ชัด ให้เลื่อนออก

## 4. Release slicing และ dependency

ไม่รวม 12 เครื่องมือใน release เดียว ให้แบ่งเป็น release slice ละ 2–4 เครื่องมือที่ใช้ foundation เดียวกัน

| Slice | ขอบเขต | Dependency หลัก | เหตุผล |
|---|---|---|---|
| R0 | shared preview/queue/cancel/undo/safe rendering | tool-ui, processing-client, test helpers | ลด duplicated lifecycle และทำให้ทุก slice ใช้ gate เดียวกัน |
| R1 | JSON Formatter, JSON Visualizer, Data Converter | JSON core, diff/diagnostic helpers | ลดความสับสนของ JSON family และเพิ่ม reuse สูง |
| R2 | Image Resizer, Compressor, Converter | image processing, batch queue, metadata notice | workflow ไฟล์ภาพร่วมกันมาก |
| R3 | Image Blur, Privacy Redactor, File Metadata | privacy preview, redaction/audit helpers | impact ด้าน privacy สูงและต้องมี review ก่อน export |
| R4 | PDF Organizer, Images to PDF, PDF Merge/Split | thumbnail/order, PDF lifecycle | ลด irreversible ordering mistakes |
| R5 | Hash Verifier, CSV Profiler, CSV Encoding Repair | manifest/report, text parsing, batch | เป็น preflight/data quality group |
| R6 | QR Reader/Generator, Markdown Table, JSON i18n | scan-back, report/export, text diff | output ตรวจสอบกลับได้ง่าย |
| R7 | File Diff, JSON Schema, JSON-LD, SVG Studio | diff/validation/report | correctness สูง ต้องใช้ evidence ก่อน release |
| R8 | JWT, Regex, Color Contrast, Base64, URL Query | diagnostics, security boundary, pure cores | small utilities เหมาะกับ focused releases |
| R9 | Flowchart, PDF advanced, Silence Remover, Text Formatter | domain-specific cores/benchmarks | ทำเมื่อ demand และ test corpus พร้อม |

## 5. Definition of Done ต่อเครื่องมือ

ก่อนประกาศว่า feature เสร็จ ให้ตรวจครบทุกข้อ: core logic แยกและมี tests; metadata/registry/lazy route ถูกต้อง; UI มี label, keyboard path, status live region และ mobile layout; success/error/cancel/reset/unmount ครบ; user-controlled text ใช้ DOM-safe rendering; ไม่มี network/storage ที่ไม่อยู่ใน contract; preview/diff มีเมื่อ semantics เปลี่ยน; download/copy output ตรวจได้; guide และ limitation ตรงกับ implementation; quality gates ผ่านและบันทึกตัวเลขจริงใน TEST_REPORT

## 6. กติกาเลื่อนหรือหยุด

ให้หยุดและทำ decision record หากต้องส่งข้อมูลขึ้น cloud, เพิ่ม telemetry, ขอ permission ก่อน user action, เปลี่ยน schema ข้อมูลผู้ใช้ หรือทำให้ output semantics เปลี่ยนโดยไม่มี preview/diff หากงานทำให้ first-run เพิ่มมากกว่าหนึ่งขั้นโดยไม่มีคุณค่าเห็นได้ทันที ให้ย้ายไป progressive disclosure หรือเลื่อนไป Wave ถัดไป

ให้เลื่อน algorithm เฉพาะทาง เช่น LUFS, advanced time-stretch, OCR/face assist, regex explanation และ PDF optimization จนกว่าจะมี benchmark/test corpus และ resource guard ที่ชัดเจน อย่าเพิ่ม Worker เพียงเพราะเป็นไฟล์ใหญ่ หากยังไม่มีหลักฐานว่า main thread ไม่ผ่าน performance budget

## 7. รอบการทำงานที่นำกลับมาใช้ได้

ใช้ลำดับสั้น ๆ เดียวกันทุก slice: inspect repository → classify user value and risk → define privacy contract → design first-run flow → implement/test pure core → build lifecycle-safe module → integrate registry/guides/assets → add unit/contract/E2E tests → run exact quality gates → update release evidence → review staged diff → fetch and compare remote → commit/push without force → verify remote SHA

ผลลัพธ์ของแต่ละ slice ต้องทิ้งหลักฐานอย่างน้อยสามชนิด ได้แก่ implementation diff, automated test evidence และ decision/release note เพื่อให้ AI หรือนักพัฒนาคนถัดไปทำงานต่อได้โดยไม่อาศัยความจำของ session
