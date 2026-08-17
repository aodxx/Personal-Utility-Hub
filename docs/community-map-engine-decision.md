# Community Mapping Engine Decision

เลือก **Leaflet 1.9.4** เป็น mapping engine หลัก เพราะ mobile-friendly, API ตรงกับ touch drawing และรองรับการทำงานแบบ lazy-loaded ใน static PWA. Dependency ติดตั้งแบบ local ผ่าน npm และไม่ใช้ CDN.

Privacy Canvas ใช้ Leaflet map ที่ไม่มี tile layer จึงแสดงพื้นที่ว่างพร้อม drawing controls โดยไม่ทำ network request. Online Basemap เป็น opt-in และใช้ OSM raster tiles พร้อม attribution ที่หน้า map. การเปิด mode นี้ไม่ส่ง project records หรือ custom schema ไปยัง provider.

ข้อจำกัดที่ตั้งใจไม่รองรับใน phase นี้คือ cadastral-grade accuracy, geocoding, address lookup, routing, multi-user synchronization และ offline tile archive.
