# Community Mapping Studio — UX Adaptation Contract

## หลักการ

Phase 11 จะนำแนวคิดการจัดวางจาก [ITKB Community Mapping](https://itkb.app/th/community-mapping) มาใช้ในระดับ workflow และ information architecture เท่านั้น ไม่คัดลอกโลโก้ ชื่อสินค้า ข้อความเฉพาะ ไอคอน หรือ asset ของคู่แข่งโดยตรง

> เป้าหมายคือทำให้ผู้ใช้เห็นแผนที่เป็นพื้นที่หลัก และเข้าถึงการวางจุด วาดพื้นที่ วาดเส้น ค้นหา กรองข้อมูล นำเข้า/บันทึก และวิเคราะห์ได้จากแผงควบคุมเดียว

## สิ่งที่นำมาปรับใช้

| Reference pattern | Phase 11 adaptation | Privacy decision |
|---|---|---|
| แผนที่ขนาดใหญ่ด้านขวาและ control rail ด้านซ้าย | ใช้ `community-map-shell` แบบ map-first พร้อม command rail บน desktop และ stacked/mobile bottom action bar | Privacy Canvas ยังเป็นค่าเริ่มต้น ไม่มี tile request |
| โหมดดูแผนที่/วางสถานที่/วาดพื้นที่/วาดเส้นทาง | ใช้ navigation mode เดียวกับ geometry engine: Navigate, Point, Polygon, LineString | การวาดทำใน browser และบันทึก IndexedDB |
| สถิติและตัวกรองอยู่ในแผงเดียว | เพิ่ม local feature summary, search, layer filter และ geometry filter | ค้นหาเฉพาะ project ที่อยู่ในเครื่อง |
| Import JSON / Save / Clear | เพิ่ม import backup แบบ local, save indicator, new project และ clear project พร้อม confirmation | ไม่อัปโหลดไฟล์หรือ records |
| Labels และ geolocation controls บนแผนที่ | เพิ่ม toggle labels สำหรับ feature markers และ location request แบบ user-triggered | location ใช้ browser permission และไม่ส่งพิกัดออก |
| ขั้นตอนใช้งาน 3 ขั้น | เพิ่ม fieldwork guide: 1 กำหนดพื้นที่ 2 ปักจุด/เพิ่มข้อมูล 3 วิเคราะห์/export | guide เป็นคำแนะนำ ไม่เปลี่ยน data contract |

## State และ acceptance

ผู้ใช้ต้องสามารถเปิด tool แล้วเห็น Privacy Canvas และแผนที่ทันทีโดยไม่มี network request ไปยัง tile provider. เมื่อเลือก Online Basemap ต้องมี disclosure และ status ว่า viewport อาจถูกส่งไปยัง provider. การวาด Point/Line/Polygon ต้องผ่าน command rail เดียวกันกับ map canvas และ records/layers/analyze ต้องเปิดเป็น drawer/panel โดยไม่ทำให้ map state หาย

การค้นหาและตัวกรองต้องลดรายการ feature ที่แสดงใน local list และไม่ mutate source data. `Save` ต้องเรียก IndexedDB autosave และแสดงเวลาบันทึกล่าสุด. `Import JSON` ต้องใช้ existing conflict-safe backup validation และไม่รับข้อมูลจาก network. `Clear` ต้องมี confirmation ก่อนล้าง project

## Mobile contract

บน viewport กว้างไม่เกิน 640px แผงควบคุมต้องเปลี่ยนเป็น stacked flow ที่ map อยู่ด้านบนและ action rail แบบ horizontal scroll ได้เฉพาะปุ่มภายใน ไม่ให้ `body` เกิด horizontal overflow. ปุ่มหลักต้องมีพื้นที่แตะอย่างน้อย 44px และ command ที่สำคัญต้องมองเห็นโดยไม่ต้องเปิดหลายชั้น

## Non-goals

ไม่เพิ่ม backend, cloud database, mandatory account, cloud geocoding, health-specific schema, หรือ OSM tile request อัตโนมัติ. เนื้อหาเฉพาะทางสาธารณสุขของ reference จะถูกแทนด้วย generic community survey language เพื่อใช้ได้กับงานสำรวจ เกษตร และ risk mapping หลายประเภท

## References

[1]: https://itkb.app/th/community-mapping "ITKB Community Mapping reference page"
