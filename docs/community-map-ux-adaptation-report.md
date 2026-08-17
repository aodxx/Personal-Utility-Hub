# Community Mapping Studio — UX Adaptation Report

## สรุป

Phase 11 ถูกปรับจาก workspace แบบ tabs เป็น **map-first fieldwork shell** ที่เหมาะกับการสำรวจภาคสนามมากขึ้น โดยนำรูปแบบ information architecture จาก [ITKB Community Mapping](https://itkb.app/th/community-mapping) มาเป็น reference: แผนที่เป็นพื้นที่หลัก, command rail สำหรับวางจุด/วาดพื้นที่/วาดเส้น, แผงสถิติและตัวกรอง, import/save/clear controls และ mobile action rail

การปรับนี้ไม่คัดลอกโลโก้ ข้อความเฉพาะ หรือ assets ของ reference. คำเรียกข้อมูลยังเป็น generic community survey เพื่อรองรับงานสำรวจชุมชน เกษตร และ risk mapping

## สิ่งที่เปลี่ยน

| Area | ก่อนปรับ | หลังปรับ |
|---|---|---|
| Primary layout | แผง tabs และ map ใน panel เดียว | Map-first shell พร้อม sidebar บน desktop และ stacked/mobile action rail |
| Fieldwork modes | ปุ่มวาดแยกใน Map/Add | Command rail: ดูแผนที่, วางสถานที่, วาดพื้นที่, วาดเส้นทาง |
| Discovery | ไม่มี summary/filter ที่หน้าหลัก | Project card, Point/พื้นที่/เส้นทาง stats, search, layer filter, geometry filter |
| Data operations | export buttons กระจายอยู่ใน Map panel | import JSON, save backup, clear และ export actions ในลำดับ fieldwork ที่ชัดขึ้น |
| Map controls | Online Basemap และ drawing controls | labels toggle, geolocation request, explicit Online Basemap disclosure, Finish/Cancel |
| Guidance | คำอธิบายสั้น | guide 3 ขั้น: กำหนดอาณาเขต → ปักหมุด/วาดเส้น → วิเคราะห์และส่งออก |
| Mobile | responsive panel เดิม | bottom action rail แบบ sticky, map canvas ใหญ่, buttons อย่างน้อย 44px และ no overflow |

## Privacy และ engine guarantees

Privacy Canvas ยังคงเป็น default และใช้ **local vector basemap** ที่สร้างด้วย Leaflet GridLayer เพื่อให้ผู้ใช้เห็นพื้นผิวแผนที่ ถนน/ลำน้ำ/ป้ายบริบทได้ทันที โดยไม่เรียก external tile. Production smoke ตรวจแล้วว่าไม่มี request ไปยัง `tile.openstreetmap.org` จนกว่าผู้ใช้กดเปิด Online Basemap. Features, filters, records และ schema ทำงานบน browser และ autosave ไป IndexedDB. Online Basemap มี disclosure ว่า provider อาจเห็น viewport

Leaflet และ geometry engine เดิมไม่ได้ถูกเปลี่ยน. การวาด Point/LineString/Polygon, Point-in-Polygon, Radius, schema builder และ GeoJSON/KML/CSV/encrypted backup contracts ยังอยู่ครบ

## Evidence

| Gate | Result |
|---|---:|
| TypeScript typecheck | PASS |
| Vitest | 88/88 PASS |
| Community Mapping E2E | 10 PASS / 2 skipped |
| Full Playwright | 159 passed / 12 skipped |
| Production build | PASS |
| Bundle check | PASS — entry gzip 44.1 KB |
| Adaptation smoke | 30/30 PASS on 360×740, 412×915, 1280×900 |
| Privacy map surface tiles | PASS — local SVG vector tiles rendered |
| Privacy Canvas default tile requests | 0 |
| Horizontal overflow | PASS on all three viewports |

## Map surface correction

การตรวจ production พบว่า Leaflet controls แสดงตามปกติ แต่ Privacy Canvas เดิมมีเพียงพื้นหลังสีเทาและเส้น grid จึงทำให้ผู้ใช้รู้สึกว่าไม่มีแผนที่. การแก้ไขเพิ่ม local SVG vector tiles แบบ deterministic เข้าไปใน Leaflet GridLayer; แผนที่จึงมองเห็นได้ทันทีในโหมด Privacy Canvas โดยยังคงไม่ส่งพิกัดหรือเรียก tile server. เมื่อผู้ใช้ต้องการแผนที่ OSM จริง สามารถกด `เปิด Online Basemap` ได้อย่างชัดเจน

## Known limitations

Reference-specific health filters, population schema และ PDF report ไม่ถูกคัดลอกเข้ามา เพราะ Phase 11 มี generic schema builder และ local export formats ที่รองรับหลาย use case. การค้นหาใน adaptation เป็น local filter ของ records/features; ยังไม่มี remote geocoding หรือ cloud collaboration. Geolocation ใช้ browser permission เฉพาะเมื่อผู้ใช้กดปุ่ม และพิกัดจะไม่ถูกส่งไป server

## References

[1]: https://itkb.app/th/community-mapping "ITKB Community Mapping reference page"
