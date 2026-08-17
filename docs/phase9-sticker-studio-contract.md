# LINE Sticker Studio — Product Contract

**สถานะเริ่มต้น:** Active tool candidate; final status จะตัดสินหลัง Definition of Done และ production smoke

## User job

ผู้ใช้ต้องการเตรียมชุด LINE stickers จาก sticker sheet, ไฟล์ภาพหลายไฟล์ หรือภาพเดี่ยว โดยแบ่งภาพ ปรับแต่งพื้นหลัง/ขอบ/ระยะปลอดภัย ตรวจคุณภาพทางเทคนิค สร้าง main image และ chat thumbnail แล้วส่งออกเป็น PNG และ ZIP ภายใน browser โดยไม่อัปโหลดไฟล์

## Inputs

| Mode | Input | Guard |
|---|---|---|
| Static sheet | PNG, JPEG หรือ WebP 1 ไฟล์; grid preset หรือ custom rows/columns | ใช้ image guards เดิม; จำกัด 24 cells และ aggregate pixels ตาม preset |
| Multiple images | PNG, JPEG หรือ WebP หลายไฟล์ | จำกัด 40 images, 15 MB ต่อไฟล์ และ aggregate pixels เพื่อป้องกัน memory pressure |
| Single image | PNG, JPEG หรือ WebP 1 ไฟล์ | ใช้สำหรับ sticker เดี่ยว, main image หรือ thumbnail |
| Animated preparation | PNG/JPEG/WebP frames หรือ sprite sheet ที่แยกเป็น frames | จำกัด 20 frames; APNG export ไม่ประกาศ ready จนกว่าจะมี encoder และ round-trip verification |

## Static workflow

`Upload → Split → Clean → Edit → Style → Review → Export`

The UI uses a step navigator. Desktop presents a thumbnail rail, canvas, and inspector; mobile uses a horizontal thumbnail rail and horizontal step navigation in the document flow without hiding the canvas.

## Controls

Grid controls include rows, columns, editable boundaries, reset, equalize rows/columns, snap guides, pixel/percentage indicators, and a small-cell warning. Per-sticker controls include crop/fit/contain/cover, pan, zoom, rotate, horizontal flip, reset, background color-key removal with tolerance/feather, white-background preset, stroke color/thickness, safe-margin overlay, and Auto Fit. Batch actions have explicit scope: current, selected, or all.

## Output

Static export produces actual PNG files with dimensions, alpha state, and byte size verified after encoding. The set ZIP uses the application naming convention `stickers/01.png`, `stickers/02.png`, etc., plus `main.png`, `tab.png`, and `validation-report.json`; the UI will not claim that this naming is an official LINE naming requirement. A JSON and TXT validation report are also available. APNG export is intentionally partial unless it is independently validated.

## Privacy

All decoding, canvas operations, validation, hashing, ZIP assembly, and prompt generation occur locally. No backend, AI API, upload, account, or runtime CDN dependency is introduced. Prompt Studio generates copyable text only; it does not send prompts to an image generator.

## Failure behavior

Invalid formats, over-limit bytes/pixels, decode failures, empty images, missing alpha, duplicate images, failed preset validation, and ZIP/output verification failures must show an actionable message. Drag-only operations are never the sole control; keyboard or Up/Down alternatives are provided. Object URLs, ImageBitmaps, canvas references, workers, and event listeners are released on replacement, reset, cancel, error, and unmount.

## Acceptance

The implementation is accepted only when the static workflow passes unit and Playwright tests with actual PNG/ZIP output verification, the registry and guide remain valid, mobile 360×740 and 412×915 layouts have no horizontal overflow, desktop 1280×900 remains usable, full Phase 7.1 and Phase 8 tests pass, bundle limits remain acceptable, CI passes on the implementation HEAD, and GitHub Pages production smoke verifies downloaded PNG and ZIP contents. Animated mode may be reported as **PARTIAL** for frame preparation and validation if APNG encode/round-trip verification is not implemented.
