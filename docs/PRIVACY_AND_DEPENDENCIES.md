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

Phase 0 ไม่มี Runtime Dependency และไม่โหลด Third-party Script
