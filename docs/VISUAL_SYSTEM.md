# 3D Visual System

Personal Utility Hub ใช้ภาพ 3D clay/glass ที่เป็นระบบเดียวกันสำหรับ Hero, Category และ Tool Card โดยยังคงหลัก Local-first: Asset ทั้งหมดอยู่ใน Repository, ไม่มี CDN, ไม่มี Runtime API และรองรับ Offline ผ่าน Service Worker

## Art direction

- รูปทรงมนแบบ tactile 3D ผสม translucent glass
- มุมมอง isometric เล็กน้อยและแสงสตูดิโอนุ่ม
- สีหลัก Indigo, Violet และ Cyan พร้อม Lime accent
- ไม่มีข้อความ โลโก้ หรือลวดลายที่พึ่งพาแบรนด์ภายนอก
- คงความชัดเจนเมื่อแสดงตั้งแต่ 32px ใน Category ไปจนถึง 160px ใน Hero

## Implementation

- Master sprite: `public/icons/utility-3d-icons.svg`
- Typed asset renderer: `src/components/asset-icon.ts`
- Category mapping: `src/data/visual-assets.ts`
- Tool mapping: ค่า `icon` ใน Tool Metadata
- Design tokens: `src/styles/tokens.css`
- Component styles: `src/styles/components.css`

การใช้ SVG sprite ทำให้ภาพคมชัดทุกความละเอียดและลดการโหลดไฟล์ย่อยจำนวนมาก หากต้องเปลี่ยน Art Direction ภายหลัง ให้รักษา `symbol id` เดิมไว้เพื่อไม่ต้องแก้ Component หรือ Tool Metadata

## Asset IDs

### Categories

- `category-all`
- `category-images`
- `category-documents`
- `category-text-data`
- `category-qr-barcode`
- `category-media`
- `category-developer`
- `category-other`
- `category-location` — แผนที่และภูมิสารสนเทศ
- `category-files` — ไฟล์และข้อมูลเมตา
- `category-diagrams` — ไดอะแกรม
- `category-games` — เกม
- `category-fortune` — ดูดวง

### Core tools

- `tool-json-formatter`
- `tool-base64`
- `tool-text-formatter`
- `tool-qr-generator`
- `tool-qr-reader`
- `tool-image-resizer`
- `tool-image-converter`

### File tools

- `tool-image-compressor`
- `tool-images-to-pdf`
- `tool-pdf-merge`
- `tool-pdf-split`
- `tool-pdf-to-image`
- `tool-file-metadata`

## Accessibility and performance rules

- ภาพเป็น decorative และใช้ `aria-hidden="true"`; ชื่อเครื่องมือยังเป็นข้อความจริง
- ห้ามใช้ภาพแทนชื่อ ปุ่ม หรือ Privacy Badge
- ต้องตรวจ Light Mode, Dark Mode, 360px mobile และ Desktop
- Asset ใหม่ต้อง self-hosted, ไม่มี script/event handler และเพิ่มเข้า precache เมื่อจำเป็น
- ทุก Tool ต้องมี fallback ที่อ่าน UI ได้แม้ภาพโหลดไม่สำเร็จ
