# มาตรฐานจัดกลุ่มเครื่องมือ Personal Utility Hub v0.13.0

**วันที่ประเมิน:** 27 สิงหาคม 2026
**ขอบเขต:** เครื่องมือทั้งหมดใน registry จำนวน 48 รายการ รวม `foundation-demo` ซึ่งเป็นเครื่องมือภายในสำหรับตรวจ lifecycle
**ผู้จัดทำ:** Manus AI

## หลักการของมาตรฐานใหม่

มาตรฐานนี้ประเมินเครื่องมือจาก **คุณค่าที่ผู้ใช้ได้รับ**, **ความสามารถในการทำงานจนจบ**, **ความยากของ workflow**, และ **ศักยภาพในการต่อยอด** ไม่ได้ใช้ค่า `active` หรือ `beta` ใน metadata เป็นตัวตัดสินโดยตรง เพราะสถานะ release ไม่ใช่หลักฐานว่าผู้ใช้เข้าใจหรือใช้งานเครื่องมือได้ง่าย

> **กลุ่ม 1 — ใช้ไม่ได้จริงหรือมีประโยชน์ต่ำ:** เครื่องมือที่ไม่ควรนับเป็น user-facing utility ในสภาพปัจจุบัน เช่น เป็นเพียง demo ภายใน, เป็นเกม/ความบันเทิงที่ไม่สอดคล้องกับภารกิจ utility hub, ไม่มีผลลัพธ์ที่ตอบโจทย์งานจริง หรือ workflow ยังไม่ครบจนผู้ใช้พึ่งพาไม่ได้
>
> **กลุ่ม 2 — ใช้ได้แต่ใช้งานยาก:** เครื่องมือที่มี use case และให้ผลลัพธ์จริง แต่มี friction สูง เช่น ต้องตั้งค่าหลายขั้นตอน, ต้องเข้าใจ domain เฉพาะทาง, ต้องใช้ไฟล์/สิทธิ์/การโต้ตอบซับซ้อน หรือยังขาด affordance, preview, error guidance และ workflow ที่เหมาะกับผู้ใช้ทั่วไป
>
> **กลุ่ม 3 — ใช้ได้และสามารถพัฒนาเพิ่มเติมได้:** เครื่องมือที่มีผลลัพธ์ชัดเจน ใช้งานจบตามขอบเขตปัจจุบัน มี contract/test/guide รองรับ และมีทิศทางต่อยอดที่เป็นรูปธรรมโดยไม่ต้องเปลี่ยนภารกิจหลัก

| มิติ | คำถามตรวจสอบ | ผลต่อการจัดกลุ่ม |
|---|---|---|
| คุณค่า | ผู้ใช้มีงานจริงที่เครื่องมือนี้ช่วยลดเวลา/ความผิดพลาดหรือไม่ | ถ้าไม่มีอย่างชัดเจน มีแนวโน้มเป็นกลุ่ม 1 |
| ความสมบูรณ์ | ตั้งแต่ input ถึง output ทำงานได้ครบและแจ้งข้อผิดพลาดหรือไม่ | ถ้าไม่ครบหรือพึ่งพาได้ต่ำ เป็นกลุ่ม 1 |
| ความง่าย | ผู้ใช้ใหม่เข้าใจ input, action, result และข้อจำกัดได้หรือไม่ | ถ้าทำงานได้แต่มี friction สูง เป็นกลุ่ม 2 |
| ความสามารถต่อยอด | มี core/module แยกชัด, testable boundary, guide และ feature path หรือไม่ | ถ้าผ่านร่วมกับคุณค่าและความสมบูรณ์ เป็นกลุ่ม 3 |
| Privacy/ความปลอดภัย | ขอบเขต local-only, file/permission และการเก็บข้อมูลสื่อสารตรงกับ implementation หรือไม่ | หากไม่ชัดเจนต้องแก้ก่อนเลื่อนขึ้นกลุ่ม 3 |

การจัดกลุ่มครั้งนี้เป็น **engineering/product triage จาก repository** โดยอิง registry, metadata, guides, module implementation, tests และ E2E ที่มีอยู่ ไม่ใช่ผล usability study กับผู้ใช้ภายนอก จึงควรทดสอบกับผู้ใช้จริงอีกครั้งก่อนตัดสินใจลบหรือยกเลิกเครื่องมือ

## สรุปผล

| กลุ่ม | จำนวน | สัดส่วนโดยประมาณ | แนวทาง |
|---|---:|---:|---|
| กลุ่ม 1: ใช้ไม่ได้จริงหรือประโยชน์ต่ำ | 3 | 6.25% | ซ่อนจาก public catalog, ย้ายไป internal/demo หรือกำหนด product purpose ใหม่ |
| กลุ่ม 2: ใช้ได้แต่ใช้งานยาก | 9 | 18.75% | ทำ usability pass ก่อนเพิ่ม feature ใหม่ |
| กลุ่ม 3: ใช้ได้และสามารถพัฒนาเพิ่มเติมได้ | 36 | 75.00% | รักษา regression contract และจัดลำดับการต่อยอดตาม impact |
| **รวม** | **48** | **100%** | — |

## กลุ่ม 1 — ใช้ไม่ได้จริงหรือมีประโยชน์ต่ำ

| ID | เครื่องมือ | เหตุผลหลัก | การตัดสินใจที่แนะนำ |
|---|---|---|---|
| `foundation-demo` | Foundation Lifecycle Demo | เป็น diagnostic/demo สำหรับทีมพัฒนา ไม่ใช่ utility ที่ผู้ใช้ปลายทางต้องใช้ | คงไว้ใน registry สำหรับ internal QA แต่ซ่อนจาก public catalog อย่างชัดเจนและไม่ใช้เป็นตัวชี้วัด product utility |
| `orbit-catcher` | Orbit Catcher | เป็นเกม/ประสบการณ์ความบันเทิง ไม่ใช่เครื่องมือแก้ปัญหาหรือ productivity utility | แยกเป็น experimental/game area หรือถอดออกจาก public utility catalog หากไม่มี product rationale |
| `pattern-pulse` | Pattern Pulse | เป็นเกม/ความบันเทิงและไม่มีผลลัพธ์ที่ผู้ใช้ export หรือนำไปทำงานต่อ | แยกเป็น experimental/game area หรือยกเลิกหากไม่ใช่เป้าหมายของ Hub |

กลุ่มนี้ไม่ควรถูกตีความว่า implementation เสียทั้งหมด `foundation-demo` ยังมีประโยชน์ในฐานะ infrastructure diagnostic ส่วนเกมอาจมีประโยชน์ด้าน engagement แต่ **ไม่ควรปะปนกับตัวชี้วัด utility** และไม่ควรใช้งบพัฒนาเท่ากับเครื่องมือที่แก้ปัญหาจริง

## กลุ่ม 2 — ใช้ได้แต่ใช้งานยาก

| ID | เครื่องมือ | จุดที่ทำให้ใช้งานยาก | งานปรับปรุงลำดับแรก |
|---|---|---|---|
| `audio-chapter-marker` | Audio Chapter Marker & Cue Sheet | ต้องเข้าใจ waveform, timestamp และ chapter semantics ก่อน export | เพิ่ม sample audio/fixture ที่ชัดเจน, keyboard workflow, cue preview และ validation ก่อน export |
| `audio-compressor` | Audio Resampler (WAV) | ผู้ใช้ต้องเข้าใจ sample rate, format และผลกระทบต่อคุณภาพเสียง | ใช้ preset ภาษาคน, แสดง before/after size/quality note และ preview metadata |
| `audio-finisher` | Audio Finisher | เป็น workflow เฉพาะทางที่มีตัวเลือกด้าน audio processing หลายส่วน | สร้าง guided preset, progress/cancel ที่ชัดเจน และ before/after preview |
| `audio-merger` | Audio Merger Studio | ต้องเตรียมหลายไฟล์และเข้าใจลำดับ/format ก่อนรวม | เพิ่ม sortable queue, duration/format summary และ clear output policy |
| `audio-speed-pitch` | Audio Speed & Pitch | speed กับ pitch เป็นแนวคิดเฉพาะทางและผลลัพธ์ต้องฟังจึงประเมินได้ | เพิ่ม preset use cases, audio preview, reset และ warning เรื่อง quality/artifacts |
| `audio-trimmer` | Audio Trimmer | ต้องควบคุมช่วงเวลาบน waveform และระบุ output ให้ถูกต้อง | เพิ่ม handles ที่ใช้ง่าย, timestamp input คู่กับ slider และ preview selection |
| `community-mapping` | Community Mapping Studio | ต้องเข้าใจ layer, map interaction และข้อมูลเชิงพื้นที่ก่อนเห็นผลลัพธ์ | เพิ่ม empty-state walkthrough, sample map layer, legend และ export/use-case guidance |
| `land-measurement` | วัดระยะและพื้นที่แปลง | ต้องโต้ตอบกับแผนที่และเข้าใจหน่วย/geometry; ความผิดพลาดของจุดวัดมีผลต่อผลลัพธ์ | เพิ่ม step-by-step measurement mode, undo จุดล่าสุด, unit preset และ confidence/limitations notice |
| `line-sticker-studio` | LINE Sticker Studio | มี workflow หลายขั้นตอน ตั้งแต่ภาพ, crop, text, pack และ export ซึ่งผู้ใช้ใหม่อาจไม่รู้ลำดับ | ทำ wizard หรือ checklist, template pack, validation ของขนาด/จำนวน และ preview ก่อน export |

กลุ่ม 2 ควรแก้ **friction ก่อนเพิ่มความสามารถเชิงลึก** โดยใช้หลัก “ทำงานแรกให้สำเร็จเร็ว” เช่น sample, preset, preview, undo/reset, progress และ error message ที่ชี้การแก้ไขได้ การเพิ่ม feature ใหม่โดยไม่ลดความซับซ้อนมีความเสี่ยงทำให้เครื่องมือยากขึ้น

## กลุ่ม 3 — ใช้ได้และสามารถพัฒนาเพิ่มเติมได้

| ID | เครื่องมือ | เหตุผลที่อยู่กลุ่ม 3 | ทิศทางต่อยอดที่เหมาะสม |
|---|---|---|---|
| `base64` | Base64 Encoder / Decoder | งานชัดเจน input/output ตรงไปตรงมา | file mode, URL-safe Base64 และ validation detail |
| `color-contrast` | Color Contrast Checker | ให้ผล contrast ratio และ pass/fail ที่ตรวจสอบได้ | palette batch check, color suggestion และ WCAG context เพิ่มเติม |
| `csv-encoding-repair` | CSV Thai Encoding Repair | แก้ปัญหา encoding ที่พบจริงและ export ได้ | delimiter detection, preview diff และ batch files |
| `csv-profiler` | CSV Data Cleaner & Profiler | สรุปข้อมูลและช่วยตรวจ CSV ก่อนใช้งาน | column type detection, duplicate/null profiling และ export report |
| `data-format-converter` | Data Format Converter | มี format boundary, diagnostics และ conversion warnings ชัดเจน | schema-aware conversion, richer round-trip warnings และ format presets |
| `file-diff` | File Diff & Change Map | เปรียบเทียบ input/output และสื่อสารการเปลี่ยนแปลงได้ชัด | folder-aware diff, ignore rules และ patch export |
| `file-metadata` | File Metadata Viewer | แสดงข้อมูลไฟล์โดยไม่ต้องแก้ไขไฟล์ต้นฉบับ | metadata export, privacy risk grouping และ batch inspection |
| `flowchart-studio` | Flowchart Studio | สร้าง diagram ที่นำไปใช้ต่อและ export ได้ | templates, import/export standard และ keyboard graph editing |
| `hash-verifier` | Hash & Checksum Verifier | use case ตรวจ checksum ชัดเจนและมี worker path/guards | multi-file manifest, drag/drop comparison และ algorithm presets |
| `image-blur` | Image Blur & Sensor | แก้ privacy problem ก่อนแชร์ภาพโดยตรง | face/object assist แบบ local, multi-region history และ batch mode |
| `image-compressor` | Image Compressor | ผลลัพธ์เป็นไฟล์ที่ใช้ต่อได้และมี processing pipeline | before/after preview, target-size mode และ batch queue |
| `image-contact-sheet` | Image Contact Sheet Studio | รวมภาพหลายไฟล์เป็น output ที่ชัดเจน | captions, sorting, layout presets และ PDF/contact export |
| `image-converter` | Image Converter | แปลง format เป็นงานทั่วไปและทำในเครื่อง | metadata policy, batch conversion และ quality presets |
| `image-crop` | Circle & Rounded Crop | มี output เฉพาะทางและเข้าใจง่ายเมื่อเห็น preview | aspect presets, safe-area guides และ batch crop |
| `image-resizer` | Image Resizer | งานทั่วไป มีผลลัพธ์ชัดและตรวจ aspect ratio ได้ | target file size, batch resize และ EXIF policy |
| `image-watermark` | Batch Image Watermark | แก้โจทย์ป้องกันการนำภาพไปใช้ต่อและ export ได้ | positioning presets, opacity preview และ batch progress |
| `images-to-pdf` | Images to PDF | workflow และ output เป็นมาตรฐานที่นำไปใช้ต่อได้ | reorder UX, page size presets และ image quality summary |
| `json-formatter` | JSON Formatter / Validator | เป็นพื้นฐานที่ชัดเจนสำหรับอ่าน/ตรวจ JSON | diagnostics UX, JSONC opt-in และ large-input benchmark |
| `json-i18n-mapper` | JSON i18n Mapper | ช่วยตรวจ/จัดโครงสร้าง translation keys | locale diff, missing-key report และ export patch |
| `json-ld-generator` | JSON-LD Generator | สร้าง structured data ที่นำไปใช้กับเว็บได้ | schema presets, validation hints และ snippet preview |
| `json-schema-generator` | JSON Schema Generator | เปลี่ยนตัวอย่าง JSON เป็น schema ที่ต่อยอด API/test ได้ | draft selection, inferred constraints และ schema diff |
| `json-visualizer` | JSON Visualizer / Graph Viewer | tree/graph, search และ SVG/PNG export ชัดเจน; มี limits และ tests | richer query, graph focus, PNG options และ benchmark/worker หากจำเป็น |
| `jwt-inspector` | JWT Inspector | อ่าน header/payload ได้เร็วและสื่อสารว่าไม่ใช่ signature verification | claim timeline, issuer/audience hints และ safer redaction |
| `markdown-table-builder` | Markdown Table Builder | สร้าง output markdown ที่ copy ไปใช้ต่อได้ทันที | paste-from-CSV, alignment presets และ table validation |
| `pdf-merge` | PDF Merge | output เป็นไฟล์มาตรฐานและ workflow ตรงกับงานจริง | reorder preview, bookmarks และ large-file progress |
| `pdf-organizer` | PDF Page Organizer | จัดหน้า PDF แล้ว export ได้จริงแม้ workflow ต้องใช้ความละเอียด | thumbnails ที่เร็วขึ้น, keyboard reorder และ undo history |
| `pdf-split` | PDF Split | แยกไฟล์ตามช่วงหน้าเป็นงานที่ชัดเจน | range presets, page preview และ batch split |
| `pdf-to-image` | PDF to Image | แปลง PDF เป็นภาพและมี output ที่นำไปใช้ต่อได้ | page range, quality presets และ memory guidance |
| `privacy-redactor` | Privacy Redactor Studio | ลดข้อมูลส่วนตัวในข้อความก่อนแชร์และมี local boundary | custom patterns, confidence review และ redaction audit |
| `qr-generator` | QR Code Generator | input/output ชัดเจนและ export ใช้งานได้ทันที | batch QR, error correction presets และ label templates |
| `qr-reader` | QR Code Reader | อ่าน QR จากไฟล์/กล้องเป็น use case ที่ชัดเจน | multi-code scan, history แบบ opt-in และ permission guidance |
| `regex-playground` | Regex Playground | ทดลอง pattern และเห็น match/capture ได้ทันที มี worker timeout | explain mode, test case sets และ safer catastrophic-backtracking hints |
| `silence-remover` | Silence Remover | แก้ audio editing task จริงและมี output file | threshold presets, waveform preview และ batch processing |
| `svg-asset-studio` | SVG Asset Studio | preview/optimize/restore และ raw/gzip comparison มีคุณค่าชัด | SVGO profiles, attribute diff และ accessibility checks |
| `text-formatter` | Text Formatter | งานทำความสะอาดข้อความง่ายและ output คาดเดาได้ | named presets, transform preview และ keyboard shortcuts |
| `url-query-builder` | URL Query Builder | สร้าง/แก้ query parameters ได้โดยเห็นผลทันที | URL diff, array encoding presets และ import/export fixtures |

## กฎการใช้มาตรฐานต่อไป

เครื่องมือใหม่หรือเครื่องมือที่มีการแก้ไขใหญ่ควรได้รับการประเมินตามลำดับนี้: ตรวจว่ามีงานจริงและผลลัพธ์ชัดเจน, ทดสอบ happy path และ error path, ให้ผู้ใช้ใหม่ทำงานแรกสำเร็จ, ตรวจ privacy/local-only boundary, จากนั้นจึงประเมินศักยภาพต่อยอด การเป็นกลุ่ม 3 ไม่ใช่การอนุมัติให้เพิ่ม feature ทันที แต่หมายถึงมีฐานที่เหมาะสมสำหรับการลงทุนต่อ

เครื่องมือกลุ่ม 1 ต้องมี decision record แยกก่อนเพิ่มโค้ดใหม่ กลุ่ม 2 ต้องลด usability friction เป็น acceptance criterion ก่อนเพิ่ม scope ส่วนกลุ่ม 3 ต้องรักษา module contract, tests, guides, accessibility และ bundle/privacy gates ทุกครั้งที่ต่อยอด

ควรทบทวนการจัดกลุ่มเมื่อมีข้อมูลใหม่จาก bug reports, E2E failures, telemetry ที่ผู้ใช้อนุมัติอย่างชัดเจน หรือ usability testing แบบไม่เก็บเนื้อหาส่วนตัว โดยไม่ควรเพิ่ม telemetry เพียงเพื่อรองรับมาตรฐานนี้ เพราะ Hub มี privacy-first/local-only contract

## แหล่งข้อมูลอ้างอิงใน repository

[1]: ../../src/data/tools.ts "Tool registry and lazy-loading entries"
[2]: ../../src/data/guides.ts "Typed bilingual tool guides"
[3]: ../../src/core/tool-contract.ts "Tool metadata and module contract"
[4]: ../../tests "Unit, contract and Playwright test suites"
[5]: ../research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md "Approved P1 overlap and implementation plan"
