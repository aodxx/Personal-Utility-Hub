# Community Mapping Studio Contract

Community Mapping Studio เป็น browser-only geographic workspace สำหรับงานสำรวจชุมชน เกษตร และ risk mapping โดยไม่ใช้ backend หรือ cloud database. Privacy Canvas เป็นค่าเริ่มต้นและต้องไม่สร้าง request ไปยัง tile provider.

| Area | Contract |
|---|---|
| Inputs | Point, LineString, Polygon, custom schema records และ project metadata |
| Storage | IndexedDB database `personal-utility-hub-community-mapping`, version 1, store `projects`; memory fallback เมื่อ IndexedDB ใช้ไม่ได้ |
| Features | Layers, touch-friendly drawing, records, Custom Schema Builder, Point-in-Polygon และ Radius |
| Exports | GeoJSON, KML, UTF-8 CSV, versioned JSON backup และ password-protected encrypted JSON backup |
| Privacy | Coordinates, layers และ records อยู่ใน browser; Online Basemap ต้องเปิดโดยผู้ใช้เอง |
| Limits | ไม่รับรอง cadastral accuracy, geocoding, cloud sync, multi-user editing หรือ offline OSM tile archive |

Encrypted backup ใช้ Web Crypto PBKDF2-SHA-256 และ AES-GCM; password ไม่ถูกเก็บและไม่มี recovery หากผู้ใช้ลืม password. การเปิด Online Basemap อาจทำให้ tile provider เห็น viewport ตาม policy ที่บันทึกแยกไว้
