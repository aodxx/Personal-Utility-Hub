# Basemap and Privacy Policy

## Privacy Canvas

Privacy Canvas เป็นค่าเริ่มต้นของ Community Mapping Studio. ไม่มี tile layer, ไม่มี OSM request และไม่มีการส่ง coordinates, records หรือ project metadata ออกนอก browser. Map ใช้สำหรับ drawing และ spatial analysis จากข้อมูลที่ผู้ใช้สร้างในอุปกรณ์

## Online Basemap

ผู้ใช้ต้องกดเปิด Online Basemap เอง. เมื่อเปิดแล้ว Leaflet จะเรียก `https://tile.openstreetmap.org/{z}/{x}/{y}.png` ตาม viewport และแสดง attribution `© OpenStreetMap contributors`. ผู้ให้บริการอาจเห็น IP และ tile viewport; feature records, schema และ project JSON ไม่ถูกส่งโดย tool.

ผู้ใช้ต้องพิจารณา tile usage policy, availability และ attribution requirements ของ provider ก่อนใช้งานจริง. ไม่มีการ cache หรือ archive OSM tiles ใน phase นี้ และการกลับสู่ Privacy Canvas ทำได้จากการเริ่มต้น route ใหม่.
