# Phase 9.1 — LINE Sticker Studio Workflow Contract

## เป้าหมาย

Phase 9.1 ปรับ LINE Sticker Studio จาก workspace ที่มีความสามารถครบแต่ต้องเรียนรู้เอง ให้เป็น workflow ที่นำผู้ใช้จาก **สร้าง Prompt → เปิด ChatGPT ด้วยการสั่งงานของผู้ใช้ → กลับมาอัปโหลด Sticker Sheet → Suggested Grid → Quick Split → Batch Finish → Review → Download ZIP** โดยยังประมวลผลภาพใน browser และไม่ส่ง prompt หรือภาพผ่าน backend

## Six-step workflow

| ขั้น | ผู้ใช้ต้องเห็น | Primary action |
|---|---|---|
| 1. สร้าง Prompt | fields, grid preset, phrase/grid warning และ prompt preview | คัดลอก Prompt + เปิด ChatGPT |
| 2. สร้างภาพด้วย AI | external handoff state พร้อม privacy disclosure | เปิด ChatGPT / คัดลอกใหม่ |
| 3. อัปโหลดและตัดภาพ | drag/drop, file picker, Suggested Grid, numbered overlay | ตัด N ภาพ |
| 4. ลบพื้นหลัง/ตกแต่ง | preset, tolerance, feather, border และ batch progress | จัดชุดอัตโนมัติ |
| 5. ตรวจและแก้ | PASS/WARNING/FAIL, summary, Before/After และ fix-next | แก้ปัญหาถัดไป หรือไปดาวน์โหลด |
| 6. ดาวน์โหลด | sticker count, main.png, tab.png, report และ ZIP size | ดาวน์โหลด ZIP |

## Prompt contract

Prompt Studio รองรับ character, style, outfit, language, phrases, sticker count, rows, columns, background, expression strategy และ consistency options. Presets ได้แก่ 3×3, 4×4, 4×5 และ Custom. หากจำนวน phrases ไม่ตรงจำนวน cell ต้องแสดง warning ที่อ่านได้ก่อน copy.

Prompt ต้องมีคำสั่ง same character, same face, same hairstyle, same outfit, same rendering style, consistent proportions, one character per cell, distinct pose/expression, exact equal grid, clear cell separation, no poster/infographic/title/frame/extra character/extra text/duplicate pose และ background ที่เหมาะกับ removal. หากเลือก Thai text ต้องระบุให้ใช้วลีที่ให้มาแบบตรงตัว ไม่แปล ไม่เติม punctuation และไม่คิดคำใหม่

## External provider and privacy

ปุ่มหลักทำ `copy → window.open(ChatGPT URL, '_blank', 'noopener,noreferrer')` จาก user gesture เท่านั้น. ห้ามกรอกข้อความใน ChatGPT อัตโนมัติ ห้าม POST prompt และห้ามมี internal fetch ที่มี prompt. หาก clipboard API ใช้ไม่ได้ ต้องใช้ fallback textarea. UI ต้องบอกว่า Utility Hub ไม่ส่ง prompt หรือภาพไป ChatGPT เอง และการประมวลผลภายนอกเกิดบนเว็บไซต์ของ provider ตามการตัดสินใจของผู้ใช้

## Image and split contract

รับ PNG, JPEG และ WebP ตาม image guards เดิม. หลัง upload ต้องแสดง preview, suggested grid จาก prompt state ล่าสุดและ image ratio โดยเรียกว่า Suggested Grid ไม่ใช่ AI detection. Default split ต้องเปิด quick view ก่อน advanced boundary controls; overlay แสดงเลข 01 ถึง N; advanced controls ยังคงรองรับ rows, columns, draggable boundaries, equalize, reset และ pixel/percentage indicators

## Batch and review contract

Batch actions ต้องมี scope และ progress ที่อ่านได้ ได้แก่ remove background, Auto Fit, white/black/custom border, validate และ download. Recommended Finish ต้องแจ้ง pipeline ก่อนเริ่ม: remove selected background → Auto Fit → white border → validate. ต้องมี cancel/retry behavior และไม่รายงาน success ก่อน operation เสร็จจริง. Review summary แสดงจำนวน PASS/WARNING/FAIL และ Fix Next Issue เปิด sticker ที่มีปัญหาถัดไปพร้อม revalidate หลังแก้

## Output and persistence

ZIP ต้องมี `stickers/01.png` ถึง `stickers/N.png`, `main.png`, `tab.png` และ `validation-report.json`; output ต้อง decode ตรวจได้ก่อนประกาศพร้อม download. Draft เก็บเฉพาะ prompt fields, grid, background และ latest step ใน local storage; ห้ามเก็บ image binary ใน local storage. Image persistence ไม่จำเป็นใน Phase 9.1 และให้ล้าง object URLs/canvas/timers/listeners เมื่อ reset, replacement, error และ unmount

## Acceptance

ต้องผ่าน unit tests ของ prompt/grid/processing, E2E prompt handoff และ no-prompt-network, 4×4 quick split เป็น 16 cards, batch green removal, batch border, recommended finish, ZIP integrity และ mobile workflow ที่ 360×740 กับ 412×915 โดยไม่มี horizontal overflow. Desktop 1280×900 ต้องใช้ได้ และ full repository CI ต้องผ่านโดยไม่ลด existing privacy หรือ animated/APNG partial contract
