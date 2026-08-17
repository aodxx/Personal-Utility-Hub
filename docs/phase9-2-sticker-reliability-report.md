# Phase 9.2 — LINE Sticker Splitter Reliability Recovery Report

## สถานะก่อนเผยแพร่

Implementation ถูก merge เข้า `main` ที่ final HEAD `396c8a11b78d77bbe0bbffbe1a70f69844966bc6` หลังผ่าน CI และ GitHub Pages deployment. Branch `phase-9-2-sticker-reliability` ถูกใช้สำหรับ PR #16 และ source ทั้งหมดอยู่บน production branch แล้ว

## Root cause ที่แก้

ปัญหาหลักคือ `loadStaticFiles()` เดิมสร้าง grid และเรียก `splitSourceCanvas()` ทันทีหลัง upload. ทำให้ downstream เห็น thumbnails ก่อนผู้ใช้ตรวจ source/grid และทำให้การแก้ grid, overlay และ crop มีโอกาสใช้ state คนละจังหวะ. Phase 9.2 ย้ายการสร้าง StickerItem ไปไว้ใน `performSplit()` ซึ่งถูกเรียกโดย Quick Split เท่านั้น

## Pipeline ใหม่

> Upload → Decode Original Pixels → Source Preview → Suggested Grid → User Confirms Grid → Quick Split → Verify Cell Bounds/Dimensions → Background/Auto Fit/Border → Review → Export

Upload ใหม่ cleanup `sourceCanvas`, `stickers`, `originalCanvas`, `grid`, `selectedIndex`, `quality`, `blob`, history และ review/export state. ก่อน Quick Split จะไม่มี StickerItem outputs และ downstream buttons จะ disabled

## Geometry and output contract

`getGridCells(grid, sourceWidth, sourceHeight)` เป็น source of truth เดียวสำหรับ overlay, crop และ tests. Internal crop coordinates ใช้ original source pixels. `validateGrid()` ตรวจ positive rows/columns, boundary count, integer monotonic boundaries, first=0, last=full dimension และ positive cell size. `normalizedToSource()`/`sourceToNormalized()` รองรับ parity ของ preview percentage กับ source pixels

สำหรับ 1536×1536 4×4 boundaries คือ 0, 384, 768, 1152, 1536 ทั้งสองแกน และ mapping เป็น row-major 01..16. สำหรับ 1537×1539 4×4 boundaries เป็น integer เริ่ม 0 จบ full dimension ไม่มี gap/overlap และผลรวม widths/heights ครบ source dimensions

## Pixel evidence

`pixel-signature-4x4-sheet.png` เป็น synthetic 1024×1024 fixture ที่แต่ละ cell มี center color และ corner markers เฉพาะตัว. Browser E2E sample จาก thumbnail canvas พิสูจน์ identity **16/16**, selected preview ตรวจ 01/07/16 และ ZIP smoke ตรวจ 16 PNG hashes ไม่ซ้ำ พร้อม mapping `01.png` ถึง `16.png`

`realistic-4x4-sheet.png` เป็น synthetic 1536×1536 fixture มี subject ขนาดใหญ่, white background, thin separators และ text-like blocks ด้านล่าง เพื่อทดสอบ scenario ที่ใกล้ real-world โดยไม่ใช้รูปผู้ใช้. Contact sheet QA อยู่ใน `/tmp/phase92-pixel-contact-sheet.png` และไม่ได้ commit เข้า repository

## Processing safety

Background Removal, Auto Fit, Border, Review และ Export ถูก gate ให้ทำงานหลัง split-complete เท่านั้น. `StickerItem.originalCanvas` เก็บ original pixels ต่อ item สำหรับ Reset Current; cleanup ทำกับ source replacement, re-split, delete, duplicate และ new set. `renderSticker()` แยก checkerboard preview ออกจาก final transparent PNG render เพื่อให้ preview/export content parity ดีขึ้น. Decode guard จำกัด source ที่ 20,000,000 decoded pixels ก่อนสร้าง canvas

## Local evidence

| Gate | Result |
|---|---:|
| TypeScript typecheck | PASS |
| LINE Sticker unit tests | 10/10 PASS |
| LINE Sticker Studio E2E | 24/24 PASS across desktop and Android profiles |
| Phase 9.2 local reliability smoke | 36/36 PASS across 360×740, 412×915, 1280×900 |
| Pixel identity | 16/16 PASS |
| ZIP uniqueness/mapping | 16 unique PNGs and 01..16 mapping PASS |
| Source preview before split | PASS; no thumbnails before Quick Split |
| Downstream gate before split | PASS; clean/export disabled |
| Synthetic visual review | PASS for realistic and pixel-signature fixtures |
| Full repository Playwright | 156 passed / 12 skipped |
| npm audit --audit-level=high | PASS — 0 vulnerabilities |
| SVG library check / service-worker syntax | PASS |
| Main CI | PASS — run [32040766941](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/32040766941) |
| GitHub Pages deployment | PASS — rerun [32040909767](https://github.com/aodxx/Personal-Utility-Hub/actions/runs/32040909767) |
| Production reliability smoke | 36/36 PASS on [GitHub Pages](https://aodxx.github.io/Personal-Utility-Hub/) across 360×740, 412×915 and 1280×900 |

## Scope and limitations

Phase 9.2 does not add tools, animated/APNG capability or a large UI redesign. Animated mode remains the existing partial frame-preparation contract. Pixel fixtures prove deterministic geometry and mapping, but they do not replace visual review of every possible AI-generated sheet. Background removal remains a local color-key algorithm and may need tolerance tuning for complex anti-aliased edges. The first Pages run for the merge SHA failed after artifact upload; the manual rerun succeeded and the production smoke passed 36/36.
