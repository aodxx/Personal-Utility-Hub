# Phase 9.2 Reference Notes

## External example

Source: https://itkb.app/th/line-sticker-tool

วันที่ตรวจ: 2026-08-17

ตัวอย่าง ITKB วาง workflow เป็นสามช่วงที่อ่านง่าย: สร้าง Prompt หรืออัปโหลดรูป, ลากเส้นตารางและลบพื้นหลัง, แล้วดาวน์โหลด ZIP. หน้าแสดง input rows/columns แยกสำหรับ prompt และ crop, มี background mode, target color, tolerance, smoothness, stroke type/color/width และปุ่มหลัก `ประมวลผลตัดสติกเกอร์` กับ `ดาวน์โหลดไฟล์ ZIP`. เนื้อหาหน้าอธิบายว่ารองรับ sticker sheet จากหลาย AI และเน้นการลาก grid ที่อิสระก่อนประมวลผล

สำหรับ Phase 9.2 สิ่งที่นำมาใช้ได้คือการทำให้ source/grid controls อยู่ในขั้นตอนเดียวกัน, ให้ปุ่มประมวลผลเป็น commit point ที่ชัด, แสดง grid rows/columns และให้ preview/advanced controls อยู่ใกล้กัน. ไม่ได้นำคำกล่าวอ้างหรือ network behavior ของเว็บตัวอย่างมาใช้แทน contract ของ Personal Utility Hub

## Reliability requirements carried forward

Phase 9.2 requires upload without auto-split, source preview before split, `grid-ready` state, Quick Split validation/rollback, original-pixel crop geometry, row-major 4×4 mapping, non-divisible boundaries, pixel identity/neighbor bleed/no-strip tests, downstream gating before split, preview/export parity, ZIP source mapping and production smoke at 360×740, 412×915 and 1280×900.

## Fixture visual inspection

`tests/fixtures/line-sticker/realistic-4x4-sheet.png` เป็นภาพสังเคราะห์ 1536×1536 แบบ 4×4 มี subject ขนาดใหญ่, พื้นหลังขาว, เส้นแบ่งบาง และแถบข้อความจำลองด้านล่างของแต่ละ cell. ใช้สำหรับ visual review และ crop regression ได้โดยไม่ผูกกับข้อมูลผู้ใช้
