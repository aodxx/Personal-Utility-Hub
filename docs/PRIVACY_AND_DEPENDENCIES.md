# Privacy และ Dependency Policy

## กฎของ Client-side Tool

- ห้ามส่งไฟล์ ชื่อไฟล์ เนื้อหา หรือภาพตัวอย่างของผู้ใช้ไปยัง API
- ห้ามเก็บไฟล์ผู้ใช้บน Server หรือ Analytics
- ต้องล้าง Event Listener, Timer, Worker และ Object URL เมื่อเลิกใช้
- ต้องแสดง Processing mode และ Privacy Notice ตามพฤติกรรมจริง
- ถ้า Browser API ไม่รองรับ ต้องหยุดอย่างปลอดภัยและอธิบายข้อผิดพลาดด้วยภาษาที่เข้าใจได้

## Dependency Review

ก่อนเพิ่ม Runtime Dependency ให้บันทึก:

1. ปัญหาที่ Dependency แก้และเหตุผลที่ Browser API ไม่เพียงพอ
2. License และแหล่งเผยแพร่หลัก
3. ขนาด Bundle และผลต่อ Mobile
4. Network request, telemetry และพฤติกรรมเก็บข้อมูล
5. ประวัติช่องโหว่และแผนอัปเดต
6. ความสามารถในการ Lazy Load และยกเลิกงาน

Phase 1 ไม่มี Runtime Dependency ส่วน Phase 2 เพิ่มเฉพาะ Dependency ที่จำเป็นสำหรับ QR Code และ Bundle ไว้ภายใน Production build โดยไม่โหลด Third-party Script หรือ CDN

ข้อมูล Favorites, Recent Tools และ Theme เก็บเฉพาะใน LocalStorage ของอุปกรณ์ ไม่เก็บเนื้อหาไฟล์หรือข้อมูลที่ผู้ใช้ป้อน หาก LocalStorage ใช้งานไม่ได้ Hub จะทำงานต่อด้วยข้อมูลชั่วคราวใน Memory

## Phase 2 Runtime Dependencies

| Dependency | Version | License | ใช้ทำอะไร | Privacy / Network | Lazy bundle |
|---|---:|---|---|---|---:|
| `qrcode` | 1.5.4 | MIT | สร้าง QR Code เป็น PNG Data URL | ไม่มี telemetry, storage หรือ network request | 27.03 kB raw / 10.43 kB gzip |
| `jsqr` | 1.4.0 | Apache-2.0 | อ่าน QR จาก RGBA pixel data ของ Canvas | ไม่มี telemetry, storage หรือ network request | 135.69 kB raw / 50.04 kB gzip |

ทั้งสอง Dependency ถูกโหลดเมื่อเปิด Tool ที่เกี่ยวข้องเท่านั้น จึงไม่เพิ่มขนาด JavaScript เริ่มต้นของหน้า Hub และ `npm audit --omit=dev` ณ วันที่ 12 สิงหาคม 2026 รายงาน 0 vulnerabilities

## File และ Camera Lifecycle

- Image Resizer, Image Converter และ QR Reader รับเฉพาะ PNG, JPEG หรือ WebP ขนาดไม่เกิน 15 MB
- จำกัดรูปภาพด้านละไม่เกิน 12,000 px และไม่เกิน 24 ล้านพิกเซล เพื่อควบคุม Memory บนอุปกรณ์พกพา
- `ImageBitmap.close()` ถูกเรียกหลังประมวลผลทุกครั้ง
- Object URL ของไฟล์ผลลัพธ์ถูก `URL.revokeObjectURL()` เมื่อสร้างผลลัพธ์ใหม่หรือออกจาก Tool
- QR Reader ขอ `getUserMedia()` หลังผู้ใช้กดเปิดกล้องเท่านั้น
- Media Track และ Animation Frame ถูกหยุดเมื่อผู้ใช้ปิดกล้อง, อ่าน QR สำเร็จ หรือออกจาก Route
- Pixel data, ข้อความ QR และชื่อไฟล์ไม่ถูกส่งไปยัง Backend/API
