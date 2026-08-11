# Product Requirements Document (PRD)

## Personal Utility Hub

**ชื่อโครงการ:** Personal Utility Hub  
**ประเภทผลิตภัณฑ์:** Utility Web Tools Hub / Static Progressive Web App  
**เอกสารฉบับ:** 1.0  
**วันที่จัดทำ:** 11 สิงหาคม 2026  
**สถานะ:** Draft สำหรับเริ่มพัฒนา Phase 0  
**ภาษาเริ่มต้น:** ภาษาไทย  
**แพลตฟอร์มเป้าหมาย:** Desktop, Tablet และ Android Mobile

---

## 1. บทสรุปผลิตภัณฑ์

Personal Utility Hub คือศูนย์รวมเครื่องมือออนไลน์สำหรับงานทั่วไป เช่น จัดการรูปภาพ จัดการข้อความ แปลงข้อมูล อ่าน QR Code และจัดรูปแบบไฟล์ โดยผู้ใช้สามารถเปิดเครื่องมือจากเว็บไซต์เดียวกันได้อย่างสะดวก

แนวคิดได้รับแรงบันดาลใจจาก ITKB-style Hub แต่ระบบนี้จะเป็นแพลตฟอร์มของเราเอง โดยให้ความสำคัญกับความเป็นส่วนตัว การประมวลผลที่เครื่องผู้ใช้ การใช้งานบนมือถือ และการเพิ่มเครื่องมือใหม่ได้โดยไม่ต้องรื้อระบบหลัก

ในระยะแรกระบบจะไม่มีบัญชีผู้ใช้ ไม่มีฐานข้อมูลกลาง และไม่ส่งไฟล์ผู้ใช้ขึ้นเซิร์ฟเวอร์ เครื่องมือจะทำงานภายในเบราว์เซอร์ด้วย File API, Canvas, Web Worker และ WebAssembly เมื่อเหมาะสม

---

## 2. ปัญหาที่ต้องการแก้ไข

ผู้ใช้ต้องเปิดเว็บไซต์หลายแห่งเพื่อทำงานเล็ก ๆ เช่น ปรับขนาดรูปภาพ แปลงข้อความ จัดรูปแบบ JSON หรือสร้าง QR Code ปัญหาที่เกิดขึ้นคือ:

1. ต้องจำและค้นหาเว็บไซต์หลายแห่ง
2. วิธีใช้งานและหน้าตาแต่ละเว็บไซต์ไม่เหมือนกัน
3. ไม่ทราบแน่ชัดว่าไฟล์ถูกอัปโหลดไปที่ใด
4. บางเว็บไซต์มีโฆษณาหรือขั้นตอนที่ไม่จำเป็น
5. เครื่องมือจำนวนมากใช้งานไม่ได้เมื่อไม่มีอินเทอร์เน็ต
6. การเพิ่มเครื่องมือใหม่อาจทำให้โค้ดรวมยุ่งยาก

---

## 3. วิสัยทัศน์ผลิตภัณฑ์

> รวมเครื่องมือ Utility ที่จำเป็นไว้ใน Hub เดียว ใช้งานง่าย เป็นส่วนตัว และขยายต่อได้โดยไม่ต้องเปลี่ยนรากฐานของระบบ

ผู้ใช้ควรค้นหาและเปิดเครื่องมือที่ต้องการได้ภายในไม่กี่วินาที เห็นชัดเจนว่าเครื่องมือนั้นประมวลผลที่ใด และกลับมาใช้เครื่องมือเดิมได้ง่ายจากรายการโปรดหรือประวัติในอุปกรณ์ของตนเอง

---

## 4. เป้าหมายและตัวชี้วัด

### 4.1 เป้าหมายหลัก

1. สร้าง Hub สำหรับรวม Utility Web Tools ไว้ในเว็บไซต์เดียว
2. ใช้ Modular Architecture เพื่อเพิ่มเครื่องมือใหม่ได้ง่าย
3. ประมวลผลไฟล์และข้อมูลบนอุปกรณ์ผู้ใช้เป็นหลัก
4. แสดงสถานะความเป็นส่วนตัวของแต่ละเครื่องมืออย่างชัดเจน
5. รองรับมือถือและติดตั้งเป็น PWA
6. มีระบบค้นหา หมวดหมู่ รายการโปรด และประวัติ
7. แยกการพัฒนา Tool Module ออกจาก Hub Core

### 4.2 ตัวชี้วัดความสำเร็จระยะแรก

- ค้นหาและเปิดเครื่องมือได้ภายใน 3 ขั้นตอนหรือน้อยกว่า
- เพิ่มเครื่องมือใหม่โดยไม่ต้องแก้ Router หรือระบบค้นหาหลักโดยตรง
- เครื่องมือ MVP ไม่อัปโหลดไฟล์ผู้ใช้
- หน้า Hub ใช้งานได้บนหน้าจอมือถือกว้างประมาณ 360px ขึ้นไป
- ติดตั้งเว็บไซต์เป็น PWA ได้
- เครื่องมือที่ระบุว่ารองรับ Offline ทำงานได้หลังดาวน์โหลดทรัพยากรครบ
- ฟังก์ชันหลักผ่านการทดสอบบน Desktop และ Android

---

## 5. กลุ่มผู้ใช้งาน

### ผู้ใช้ทั่วไป

ต้องการใช้เครื่องมือเฉพาะกิจโดยไม่สมัครสมาชิกและไม่ติดตั้งโปรแกรมเพิ่มเติม

### ผู้ใช้ประจำ

ใช้เครื่องมือหลายครั้ง ต้องการรายการโปรด ประวัติ และการติดตั้ง PWA

### ผู้ดูแลหรือนักพัฒนา

เพิ่มเครื่องมือ แก้ไข Metadata ตรวจสอบคุณภาพ และรักษามาตรฐานความปลอดภัย

---

## 6. หลักการผลิตภัณฑ์

1. Privacy by Design — ไม่ส่งไฟล์ออกจากเครื่องโดยไม่จำเป็น
2. Local-first — รายการโปรด ประวัติ และค่าตั้งค่าเก็บในอุปกรณ์ผู้ใช้
3. Modular by Contract — ทุกเครื่องมือทำตามสัญญากลาง
4. Mobile-first — ออกแบบจากประสบการณ์บนมือถือ
5. Transparent Processing — แจ้งวิธีประมวลผลตามจริง
6. Progressive Enhancement — อุปกรณ์ที่มีความสามารถสูงได้รับประสบการณ์ที่ดีขึ้น
7. Simple by Default — ลดขั้นตอนและตัวเลือกที่ไม่จำเป็น

---

## 7. ขอบเขตผลิตภัณฑ์

### 7.1 ขอบเขต MVP

- หน้าแรกของ Hub
- Tool Registry
- ระบบค้นหา
- หมวดหมู่และตัวกรอง
- Tool Card และหน้าเครื่องมือ
- รายการโปรดและประวัติด้วย LocalStorage
- Light Mode และ Dark Mode
- Responsive UI
- PWA Manifest และ Service Worker
- Privacy Badge
- เครื่องมือพื้นฐาน:
  1. JSON Formatter / Validator
  2. QR Code Generator
  3. QR Code Reader
  4. Image Resizer
  5. Image Converter
  6. Base64 Encoder / Decoder
  7. Text Formatter

### 7.2 ขอบเขตระยะถัดไป

- รวมและแยก PDF
- PDF เป็นรูปภาพ และรูปภาพเป็น PDF
- บีบอัดรูปภาพหลายไฟล์
- ตัดและรวมเสียง
- แปลงวิดีโอเป็น GIF
- Web Worker และ WebAssembly สำหรับงานหนัก
- ระบบหลายภาษา
- นำเข้าและส่งออกค่าตั้งค่า
- การตรวจสอบคุณภาพเครื่องมืออัตโนมัติ

### 7.3 นอกขอบเขตระยะแรก

- Login และระบบสมาชิก
- การอัปโหลดไฟล์ไปยัง Backend
- Cloud Storage
- ระบบชำระเงิน
- Online Admin Dashboard
- Analytics ที่เก็บข้อมูลส่วนบุคคล
- Server-side Processing เป็นความสามารถหลัก

---

## 8. User Flows หลัก

### 8.1 ค้นหาและเปิดเครื่องมือ

1. เปิดหน้า Hub
2. พิมพ์คำค้นหรือเลือกหมวดหมู่
3. ระบบกรองรายการทันทีจากข้อมูลในเครื่อง
4. เลือก Tool Card
5. ระบบเปิด Tool Module ผ่าน Client-side Route

### 8.2 ประมวลผลไฟล์

1. เลือกไฟล์หรือลากไฟล์เข้า Drop Zone
2. ตรวจสอบชนิดและขนาด
3. ประมวลผลในเบราว์เซอร์
4. แสดงสถานะและผลลัพธ์
5. ดาวน์โหลดผลลัพธ์
6. ล้างข้อมูลชั่วคราวเมื่อจบงาน

### 8.3 รายการโปรด

1. กดปุ่มรายการโปรด
2. บันทึกรหัสเครื่องมือใน LocalStorage
3. เปิดหมวดรายการโปรด
4. เลือกเครื่องมือที่ต้องการ

---

## 9. ข้อกำหนดด้านฟังก์ชัน

### FR-001: Tool Registry

ระบบต้องมีข้อมูลกลางสำหรับประกาศเครื่องมือทุกตัว โดยมีข้อมูลขั้นต่ำดังนี้:

    export interface ToolMetadata {
      id: string;
      title: string;
      description: string;
      category: string;
      route: string;
      icon?: string;
      tags: string[];
      processing: "client-side" | "hybrid" | "server-side";
      supportsOffline: boolean;
      requiresFile: boolean;
      status: "active" | "beta" | "planned" | "disabled";
      version: string;
    }

### FR-002: Tool Module Contract

เครื่องมือทุกตัวต้องส่งออก Module ตามสัญญากลาง:

    export interface ToolModule {
      metadata: ToolMetadata;
      mount(container: HTMLElement): void | Promise<void>;
      unmount?(): void | Promise<void>;
    }

เมื่อเปลี่ยนหน้า ระบบต้องเรียก unmount ถ้ามี เพื่อคืน Event Listener, Worker, Object URL และข้อมูลชั่วคราว

### FR-003: การค้นหาและหมวดหมู่

ระบบต้อง:

- ค้นหาจากชื่อ คำอธิบาย หมวดหมู่ และ Tags
- รองรับภาษาไทย
- ไม่แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่สำหรับภาษาอังกฤษ
- แสดงผลทันทีโดยไม่เรียก Backend
- แสดงข้อความเมื่อไม่พบผลลัพธ์
- มีหมวดหมู่เริ่มต้น: รูปภาพ, PDF และเอกสาร, ข้อความและข้อมูล, QR Code และบาร์โค้ด, เสียงและวิดีโอ, Developer Tools และอื่น ๆ

### FR-004: รายการโปรดและประวัติ

- เพิ่มและลบรายการโปรดได้
- บันทึกเครื่องมือที่เปิดล่าสุดได้
- ล้างประวัติได้
- ข้อมูลเก็บเฉพาะในอุปกรณ์ผู้ใช้
- หาก LocalStorage ใช้งานไม่ได้ ระบบยังเปิดเครื่องมือหลักได้

### FR-005: การจัดการไฟล์

เครื่องมือที่รับไฟล์ต้อง:

- ตรวจสอบชนิดและขนาดก่อนประมวลผล
- แสดงชื่อและขนาดไฟล์
- ไม่ส่งไฟล์ไปเซิร์ฟเวอร์ในเครื่องมือ Client-side
- เรียก URL.revokeObjectURL เมื่อเลิกใช้ Object URL
- รองรับการยกเลิกงานที่ใช้เวลานาน
- แสดงข้อความผิดพลาดที่เข้าใจได้

### FR-006: PWA

ระบบต้องมี Web App Manifest, ไอคอน, ชื่อแอป, Service Worker, Offline Fallback และคำแนะนำการติดตั้งบนอุปกรณ์ที่รองรับ

### FR-007: การเข้าถึง

- รองรับ Light และ Dark Mode
- มี Focus State ที่เห็นได้ชัด
- ใช้งาน Keyboard ได้ในส่วนสำคัญ
- ใช้ Contrast ที่เหมาะสม
- มี aria-label สำหรับปุ่มไอคอน
- ปุ่มและพื้นที่กดบนมือถือมีขนาดเหมาะสม

---

## 10. ความเป็นส่วนตัวและความปลอดภัย

### 10.1 กฎบังคับ

1. เครื่องมือที่เป็น client-side ห้ามส่งไฟล์หรือเนื้อหาผู้ใช้ไปยัง API
2. ห้ามเก็บไฟล์ผู้ใช้บนเซิร์ฟเวอร์
3. ห้ามใส่ชื่อไฟล์ เนื้อหา หรือภาพตัวอย่างลงใน Analytics
4. ไม่โหลดสคริปต์ภายนอกโดยไม่จำเป็น
5. ตรวจสอบ Dependency ทุกตัวก่อนนำมาใช้
6. ใช้ HTTPS เมื่อเผยแพร่จริง
7. กำหนด Content Security Policy ให้เหมาะสม
8. แสดงสถานะ client-side, hybrid หรือ server-side ให้ชัดเจน
9. ล้าง Worker, Object URL และข้อมูลชั่วคราวหลังจบงาน
10. Privacy Notice ต้องตรงกับพฤติกรรมจริง

### 10.2 Privacy Badge

Tool Card ต้องแสดงป้ายตามจริง เช่น:

- ประมวลผลในเครื่อง
- ใช้งาน Offline ได้
- ไม่อัปโหลดไฟล์
- ต้องใช้อินเทอร์เน็ต

หากเครื่องมือใดส่งข้อมูลออกจากอุปกรณ์ ต้องอธิบายก่อนเริ่มงาน และห้ามแสดงป้ายไม่อัปโหลดไฟล์

---

## 11. สถาปัตยกรรมระบบ

### 11.1 ภาพรวม

    Hub Shell
       ├── Tool Registry
       ├── Router
       ├── Search
       ├── Local Storage
       └── Tool Modules
              ├── Browser APIs
              └── Web Worker / WebAssembly

### 11.2 เทคโนโลยีหลัก

| ส่วนประกอบ | เทคโนโลยี | เหตุผล |
|---|---|---|
| Frontend | Vite + TypeScript | Build เร็วและตรวจชนิดข้อมูล |
| UI | Custom CSS Design System | สร้างเอกลักษณ์และควบคุม Responsive UI |
| Routing | Client-side Router | เหมาะกับ Static Hosting |
| File Processing | File API, Blob, Canvas | ประมวลผลในเบราว์เซอร์ |
| งานหนัก | Web Worker | ลดการค้างของ UI |
| งานประสิทธิภาพสูง | WebAssembly ตามความจำเป็น | เหมาะกับ PDF, Audio และ Video |
| Local Data | LocalStorage และ IndexedDB | เก็บค่าตั้งค่าและข้อมูลชั่วคราว |
| Hosting | GitHub Pages | Static Hosting และเชื่อม Git |
| PWA | Manifest + Service Worker | ติดตั้งและแคชทรัพยากร |
| Testing | Vitest + Playwright หรือเทียบเท่า | ทดสอบ Logic และการใช้งาน |

### 11.3 โครงสร้างโครงการ

    personal-utility-hub/
    ├── public/
    │   ├── icons/
    │   ├── manifest.webmanifest
    │   └── offline.html
    ├── src/
    │   ├── app/
    │   │   ├── app-shell.ts
    │   │   ├── router.ts
    │   │   └── routes.ts
    │   ├── components/
    │   │   ├── tool-card/
    │   │   ├── search-box/
    │   │   ├── category-tabs/
    │   │   └── privacy-badge/
    │   ├── core/
    │   │   ├── tool-contract.ts
    │   │   ├── tool-loader.ts
    │   │   ├── search.ts
    │   │   ├── storage.ts
    │   │   └── errors.ts
    │   ├── data/
    │   │   ├── categories.ts
    │   │   └── tools.ts
    │   ├── tools/
    │   │   ├── json-formatter/
    │   │   ├── qr-generator/
    │   │   ├── qr-reader/
    │   │   ├── image-resizer/
    │   │   ├── image-converter/
    │   │   ├── base64/
    │   │   └── text-formatter/
    │   ├── styles/
    │   │   ├── tokens.css
    │   │   ├── base.css
    │   │   ├── layout.css
    │   │   └── components.css
    │   ├── main.ts
    │   └── sw.ts
    ├── tests/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── README.md
    └── PRD.md

---

## 12. แนวทาง UI/UX

### หน้าแรก

- Header พร้อมชื่อแอป ปุ่มธีม และปุ่มติดตั้ง PWA
- Hero อธิบายการประมวลผลในเครื่อง
- ช่องค้นหา
- หมวดหมู่
- เครื่องมือแนะนำ
- รายการโปรด
- เครื่องมือที่เปิดล่าสุด
- Footer พร้อม Privacy และ About

### Tool Card

ต้องแสดงไอคอน ชื่อ คำอธิบาย หมวดหมู่ Privacy Badge สถานะ Beta หรือ Planned และปุ่มรายการโปรด

### หน้าเครื่องมือ

ประกอบด้วย Breadcrumb หรือปุ่มย้อนกลับ ชื่อและคำอธิบาย Privacy Notice พื้นที่ป้อนข้อมูล พื้นที่แสดงความคืบหน้า ผลลัพธ์ ปุ่มดาวน์โหลดหรือคัดลอก และคำแนะนำการใช้งาน

---

## 13. ข้อกำหนดด้านประสิทธิภาพ

- หน้าแรกต้องโหลดได้ดีบนโทรศัพท์ระดับเริ่มต้น
- ไม่โหลดไลบรารีของทุกเครื่องมือตั้งแต่เริ่มต้น
- ใช้ Lazy Loading สำหรับ Tool Module ขนาดใหญ่
- ย้ายงานที่ใช้เวลานานไป Web Worker เมื่อทำได้
- มีสถานะ Loading, Progress, Success และ Error
- การค้นหาต้องตอบสนองทันทีสำหรับรายการระดับหลักร้อยรายการ
- หลีกเลี่ยงการเก็บไฟล์ขนาดใหญ่หลายสำเนาใน Memory
- ทดสอบบน Android ที่มีทรัพยากรจำกัด

---

## 14. แผนพัฒนา

### Phase 0: Foundation

- สร้าง Repository ด้วย Vite + TypeScript
- วางโครงสร้างโฟลเดอร์
- สร้าง Design Tokens และ Custom CSS
- สร้าง Tool Metadata และ Tool Contract
- สร้าง Router และ Tool Loader
- สร้าง App Shell และหน้าข้อผิดพลาด
- เตรียม GitHub Pages Deployment
- เขียน README และคู่มือเพิ่ม Tool

### Phase 1: Hub MVP

- หน้าแรก
- Search, Category และ Filter
- Tool Card และ Privacy Badge
- Favorites และ Recent Tools
- Light/Dark Mode
- Responsive Mobile-first
- Manifest และ Service Worker

### Phase 2: Core Tools

1. JSON Formatter / Validator
2. Base64 Encoder / Decoder
3. Text Formatter
4. QR Code Generator
5. Image Resizer
6. Image Converter
7. QR Code Reader

### Phase 3: File Tools

- Image Compressor
- Images to PDF
- PDF Merge
- PDF Split
- PDF to Image
- File Metadata Viewer

### Phase 4: Performance and Offline

- Web Worker
- IndexedDB
- WebAssembly ตามความเหมาะสม
- Offline Cache รายเครื่องมือ
- ทดสอบ Android หลายระดับ
- ลด Bundle Size และเพิ่ม Lazy Loading

### Phase 5: Product Expansion

- หลายภาษา
- นำเข้าและส่งออกการตั้งค่า
- การจัดลำดับเครื่องมือที่ใช้บ่อย
- Compatibility Check
- พิจารณา Backend เมื่อมีความจำเป็นจริง

---

## 15. เกณฑ์ยอมรับงาน MVP

### Hub Core

- [ ] เปิดหน้าแรกจาก Static Hosting ได้
- [ ] แสดง Tool Card จาก Registry ได้
- [ ] ค้นหาเครื่องมือได้
- [ ] กรองตามหมวดหมู่ได้
- [ ] เปิด Tool Module ผ่าน Route ได้
- [ ] กลับหน้า Hub ได้
- [ ] แสดงหน้า Not Found เมื่อ Route ไม่ถูกต้อง

### Local Features

- [ ] เพิ่มและลบรายการโปรดได้
- [ ] แสดงเครื่องมือที่เปิดล่าสุดได้
- [ ] ล้างประวัติได้
- [ ] ระบบยังเปิดเครื่องมือหลักได้เมื่อ LocalStorage ใช้งานไม่ได้

### Privacy

- [ ] เครื่องมือ Client-side ไม่เรียก API เพื่อส่งไฟล์
- [ ] มี Privacy Badge ในการ์ดและหน้าเครื่องมือ
- [ ] ไม่มีการเก็บข้อมูลไฟล์ใน Analytics
- [ ] มีเอกสารอธิบาย Client-side Processing

### PWA

- [ ] Manifest ถูกต้อง
- [ ] ติดตั้งบน Android ที่รองรับได้
- [ ] มีไอคอนและชื่อแอปถูกต้อง
- [ ] มี Offline Fallback
- [ ] App Shell เปิดได้หลังจากเคยโหลดแล้ว

### Quality

- [ ] ไม่มี TypeScript Error
- [ ] ไม่มี Console Error ในเส้นทางหลัก
- [ ] ผ่านการทดสอบ Desktop และ Mobile
- [ ] ใช้งาน Keyboard ได้ในส่วนสำคัญ
- [ ] ข้อความผิดพลาดเข้าใจได้

---

## 16. ความเสี่ยงและแนวทางรับมือ

| ความเสี่ยง | ผลกระทบ | แนวทางรับมือ |
|---|---|---|
| ไฟล์ใหญ่ทำให้มือถือค้าง | สูง | จำกัดขนาดไฟล์ แสดงคำเตือน และใช้ Worker |
| ไลบรารี PDF/Video ใหญ่ | สูง | Lazy Load และแยกเป็นเครื่องมือเฉพาะ |
| Browser รองรับ API ไม่เท่ากัน | กลาง | ตรวจสอบความสามารถและมีทางเลือกสำรอง |
| Service Worker ใช้ Cache เก่า | กลาง | ใช้ Cache Version และกลยุทธ์อัปเดต |
| LocalStorage เต็มหรือถูกปิด | กลาง | ตรวจสอบความพร้อมและทำงานแบบไม่บันทึก |
| เครื่องมือทำ Client-side ได้ยาก | สูง | แสดงข้อจำกัดและเลื่อนไป Phase หลัง |
| Tool ไม่ทำตาม Contract | กลาง | ใช้ TypeScript, Checklist และ Automated Test |
| Dependency มีพฤติกรรมเก็บข้อมูล | สูง | ตรวจสอบไลบรารีและลด Third-party Script |

---

## 17. มาตรฐานการเพิ่มเครื่องมือใหม่

1. สร้างโฟลเดอร์ src/tools/<tool-id>/
2. สร้าง Module ตาม ToolModule
3. กำหนด ToolMetadata ให้ครบ
4. ระบุวิธีประมวลผลและ Privacy ตามจริง
5. เพิ่ม Module เข้า Tool Registry
6. เพิ่ม Unit Test ของ Logic หลัก
7. ทดสอบข้อมูลว่าง ไฟล์ผิดชนิด และข้อมูลขนาดใหญ่
8. ตรวจสอบ Responsive UI
9. ตรวจสอบ Resource หลังเปลี่ยนหน้า
10. อัปเดต README หรือเอกสารของเครื่องมือ

เครื่องมือใหม่ไม่ควรแก้ Hub Core เว้นแต่เป็นความสามารถทั่วไปที่หลายเครื่องมือต้องใช้ร่วมกัน

---

## 18. การตัดสินใจด้านข้อมูลและ Backend

### ระยะ MVP

- ไม่มีฐานข้อมูลกลาง
- ไม่มี Login
- ไม่มีระบบอัปโหลดไฟล์
- ใช้ Static Assets และ Tool Registry ใน Repository
- ใช้ LocalStorage สำหรับข้อมูลขนาดเล็ก
- ใช้ IndexedDB สำหรับข้อมูลชั่วคราวขนาดใหญ่เมื่อจำเป็น

### เงื่อนไขสำหรับ Backend ในอนาคต

พิจารณา Backend เมื่อจำเป็นต้อง:

- ซิงค์รายการโปรดข้ามอุปกรณ์
- จัดการ Tool Registry จาก Admin
- เผยแพร่เวอร์ชันหรือ Feature Flag
- ทำงานที่เบราว์เซอร์ทำไม่ได้จริง

หากเพิ่ม Backend ต้องแจ้งให้ผู้ใช้ทราบอย่างชัดเจนว่าเครื่องมือใดส่งข้อมูลออกจากอุปกรณ์

---

## 19. ผลลัพธ์ที่ต้องส่งมอบ

เมื่อจบ MVP ต้องมี:

1. Source Code ใน Repository
2. เว็บไซต์บน GitHub Pages
3. ไฟล์ PRD.md
4. README.md พร้อมวิธีติดตั้งและเพิ่ม Tool
5. Tool Registry และ Tool Contract
6. Hub Shell พร้อม Search, Category, Favorites และ History
7. เครื่องมือพื้นฐานอย่างน้อย 5 รายการ
8. PWA Manifest และ Service Worker
9. Test Report
10. Privacy Checklist และรายการ Dependency

---

## 20. สรุปการตัดสินใจ

โครงการนี้จะเริ่มด้วยสถาปัตยกรรม:

> **Static PWA + Vite + TypeScript + Custom CSS + Modular Tool Registry + Client-side Processing + GitHub Pages**

การพัฒนาจะเริ่มจาก Hub Core และมาตรฐานการเพิ่มเครื่องมือก่อน แล้วจึงเพิ่มเครื่องมือพื้นฐานที่ทดสอบได้ง่าย จากนั้นค่อยขยายไปยัง PDF, Audio, Video, Web Worker และ WebAssembly

แนวทางนี้ทำให้ Personal Utility Hub เป็นศูนย์รวมเครื่องมือที่ปลอดภัย ใช้งานง่าย และเติบโตได้โดยไม่ทำให้โค้ดหลักซับซ้อนเกินจำเป็น

