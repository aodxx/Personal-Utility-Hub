# Phase 9.2 — LINE Sticker Splitter Reliability Contract

## Mission

Phase 9.2 แก้ production blocker ของ LINE Sticker Studio ที่เกิดจากการตัด Sticker Sheet ไม่ตรงกับ grid โดยให้ **Upload → Source Preview → Grid Confirmation → Quick Split → Verify Outputs → Process → Review → Export** เป็น pipeline ที่ตรวจสอบได้ด้วย original pixel coordinates

## State machine

| State | ความหมาย | อนุญาตให้ทำ |
|---|---|---|
| `empty` | ยังไม่มี source | upload |
| `source-loaded` | decode source สำเร็จ | ดู source และเลือก grid |
| `grid-ready` | มี grid ที่ผ่าน validation และยังไม่มี output | ปรับ grid หรือ Quick Split |
| `split-complete` | output cells ผ่าน identity/size/aspect checks | background, Auto Fit, border, review |
| `processing` | batch operation กำลังทำงาน | progress/cancel ตามที่รองรับ |
| `review` | validation summary พร้อม | fix/revalidate/export |
| `export-ready` | output encode และ round-trip ผ่าน | download |

Upload ต้องไม่สร้าง StickerItem โดยอัตโนมัติ. Quick Split เท่านั้นเป็น commit point ที่สร้าง output หลัง validate grid, crop bounds, cell dimensions และ mapping สำเร็จ

## Geometry source of truth

`getGridCells(grid, sourceWidth, sourceHeight)` เป็น geometry API กลางสำหรับ overlay, crop, output validation, debug report และ tests. Internal coordinates อยู่ใน original source pixel space; CSS preview ใช้ normalized percentage สำหรับแสดงผลเท่านั้น

Equal grid ต้องมี integer boundaries เริ่มที่ 0 จบที่ full dimension ไม่มี gap/overlap และผลรวม cell widths/heights เท่ากับ source dimensions แม้ source จะหารไม่ลงตัว

## Output reliability

4×4 source ต้องได้ 16 output ตาม row-major order 01..16. แต่ละ output ต้องมี dimensions ตรงกับ cell, aspect ratio ไม่เป็น strip, identity ตรงกับ pixel signature ของ source cell และไม่มี neighbor bleed เกิน tolerance. Thumbnail และ selected preview ต้องวาดจาก `StickerItem.canvas` เดียวกับ export path

## Processing order

Background Removal ต้องเกิดหลัง `split-complete` และทำบน StickerItem เท่านั้น ไม่แตะ sourceCanvas. Recommended Finish คือ Background Removal → Auto Fit → Border → Validate. Re-split หรือ upload ใหม่ต้อง cleanup output, blobs, history, quality, review และ export state

## Verification

Unit และ E2E ต้องพิสูจน์ว่า upload แล้วไม่มี sticker outputs, 4×4 ได้ 16 cells ที่ identity ถูก, non-divisible dimensions ถูก, overlay/crop geometry เท่ากัน, no strip/bleed, selected preview parity, ZIP mapping/unique hashes และ PNG round-trip. Automated count อย่างเดียวไม่เพียงพอ

## Scope guard

Phase นี้ไม่เพิ่ม tool ใหม่ ไม่เพิ่ม animated/APNG capability และไม่ redesign UI ใหญ่เกินจำเป็น. Animated mode คง partial contract เดิม. Phase 9.1 prompt handoff, privacy disclosure, draft, review และ download regression ต้องยังผ่าน
