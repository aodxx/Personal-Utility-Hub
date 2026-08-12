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

Phase 1 ไม่มี Runtime Dependency, Phase 2 เพิ่ม Dependency สำหรับ QR Code และ Phase 3 เพิ่ม Dependency สำหรับสร้าง/แก้ไข/เรนเดอร์ PDF ทุกตัวถูก Bundle ภายใน Production build โดยไม่โหลด Third-party Script หรือ CDN

ข้อมูล Favorites, Recent Tools และ Theme เก็บเฉพาะใน LocalStorage ของอุปกรณ์ ไม่เก็บเนื้อหาไฟล์หรือข้อมูลที่ผู้ใช้ป้อน หาก LocalStorage ใช้งานไม่ได้ Hub จะทำงานต่อด้วยข้อมูลชั่วคราวใน Memory

Phase 4 ใช้ IndexedDB เก็บเฉพาะ `toolId`, Tool/Cache version, เวลาเตรียม Offline และจำนวน Resource ที่ Cache แล้ว ไม่มีชื่อไฟล์ เนื้อหาไฟล์ Hash หรือผลลัพธ์ถูกเก็บใน IndexedDB

## Phase 2 Runtime Dependencies

| Dependency | Version | License | ใช้ทำอะไร | Privacy / Network | Lazy bundle |
|---|---:|---|---|---|---:|
| `qrcode` | 1.5.4 | MIT | สร้าง QR Code เป็น PNG Data URL | ไม่มี telemetry, storage หรือ network request | 27.03 kB raw / 10.43 kB gzip |
| `jsqr` | 1.4.0 | Apache-2.0 | อ่าน QR จาก RGBA pixel data ของ Canvas | ไม่มี telemetry, storage หรือ network request | 135.69 kB raw / 50.04 kB gzip |

ทั้งสอง Dependency ถูกโหลดเมื่อเปิด Tool ที่เกี่ยวข้องเท่านั้น จึงไม่เพิ่มขนาด JavaScript เริ่มต้นของหน้า Hub และ `npm audit --omit=dev` ณ วันที่ 12 สิงหาคม 2026 รายงาน 0 vulnerabilities

## Phase 3 Runtime Dependencies

| Dependency | Version | License | ใช้ทำอะไร | Privacy / Network | Lazy bundle |
|---|---:|---|---|---|---:|
| `pdf-lib` | 1.17.1 | MIT | สร้าง PDF จากรูป, รวม, แยก และอ่าน Document Metadata | ประมวลผล `ArrayBuffer` ใน Browser, ไม่มี telemetry/network | shared chunk 422.32 kB raw / 176.48 kB gzip |
| `pdfjs-dist` | 6.2.108 | Apache-2.0 | อ่านจำนวนหน้าและเรนเดอร์หน้าที่เลือกเป็น Canvas | Worker และ API ถูก self-hosted ใน Build, ไม่มีการส่ง PDF ออกนอกเครื่อง | API 427.59 kB raw / 127.75 kB gzip + worker 1.26 MB |

หน้า Hub ไม่โหลด PDF dependency ทั้งสองตัวตั้งแต่เริ่มต้น `pdf-lib` ถูกโหลดเมื่อเปิด File Tool ที่ต้องใช้ และ PDF.js ถูก dynamic import หลังผู้ใช้เลือก PDF ใน PDF to Image เท่านั้น Runtime asset ที่เคยโหลดจะถูก Service Worker เก็บแบบ same-origin สำหรับการใช้งานครั้งถัดไป

## File และ Camera Lifecycle

- Image Resizer, Image Converter และ QR Reader รับเฉพาะ PNG, JPEG หรือ WebP ขนาดไม่เกิน 15 MB
- จำกัดรูปภาพด้านละไม่เกิน 12,000 px และไม่เกิน 24 ล้านพิกเซล เพื่อควบคุม Memory บนอุปกรณ์พกพา
- `ImageBitmap.close()` ถูกเรียกหลังประมวลผลทุกครั้ง
- Object URL ของไฟล์ผลลัพธ์ถูก `URL.revokeObjectURL()` เมื่อสร้างผลลัพธ์ใหม่หรือออกจาก Tool
- QR Reader ขอ `getUserMedia()` หลังผู้ใช้กดเปิดกล้องเท่านั้น
- Media Track และ Animation Frame ถูกหยุดเมื่อผู้ใช้ปิดกล้อง, อ่าน QR สำเร็จ หรือออกจาก Route
- Pixel data, ข้อความ QR และชื่อไฟล์ไม่ถูกส่งไปยัง Backend/API

## Phase 3 File Lifecycle

- Image Compressor ใช้ข้อจำกัดรูปเดิม: 15 MB, ด้านละไม่เกิน 12,000 px และไม่เกิน 24 ล้านพิกเซล
- Images to PDF รับสูงสุด 20 รูป รวมไม่เกิน 40 MB และสร้างหนึ่งหน้า A4 ต่อรูป
- PDF Merge รับสูงสุด 10 ไฟล์รวมไม่เกิน 40 MB; PDF Merge/Split/Render จำกัดไม่เกิน 200 หน้า
- File Metadata Viewer รับไฟล์ไม่เกิน 40 MB และคำนวณ SHA-256 ด้วย Web Crypto ภายในอุปกรณ์
- Object URL ของผลลัพธ์ถูกยกเลิกเมื่อสร้างผลลัพธ์ใหม่หรือออกจาก Tool
- ไม่รองรับ PDF ที่ล็อกรหัสผ่าน และไม่มีการเก็บสำเนาไฟล์ใน LocalStorage/IndexedDB

## Phase 4 Worker และ Offline Lifecycle

- Image Resizer, Image Converter, Image Compressor, Images to PDF, PDF Merge/Split/Inspect และ SHA-256 ใช้ Dedicated Web Worker เมื่อ Browser รองรับ
- Worker แต่ละงานถูก `terminate()` หลัง Success, Error, Cancel หรือเมื่อออกจาก Tool และใช้ Main-thread fallback เมื่อ Worker/OffscreenCanvas ไม่พร้อม
- Progress message ส่งเฉพาะเปอร์เซ็นต์และข้อความสถานะ ไม่ส่งชื่อไฟล์หรือเนื้อหาไปภายนอก
- ปุ่ม “เตรียม Offline” โหลด Module/Worker แบบ same-origin แล้วให้ Service Worker เก็บใน Tool cache รายเวอร์ชัน
- Service Worker ปฏิเสธ URL ต่าง origin และ URL นอก GitHub Pages app scope
- Phase 4 ไม่เพิ่ม WebAssembly dependency เพราะ Web Worker + Browser API เดิมแก้ปัญหา UI blocking ได้โดยไม่เพิ่ม Runtime ขนาดใหญ่; จะใช้ WASM ภายหลังเมื่อมี benchmark ยืนยันความจำเป็น
