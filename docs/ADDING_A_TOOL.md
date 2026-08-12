# คู่มือเพิ่ม Tool Module

เอกสารนี้ใช้กับสถาปัตยกรรม Modular Tool ของ Personal Utility Hub เครื่องมือใหม่ต้องเพิ่มผ่าน Registry และไม่แก้ Router หรือ Search Core โดยตรง

## 1. สร้างโฟลเดอร์

สร้าง `src/tools/<tool-id>/` โดย `tool-id` ต้องเป็น kebab-case และมีอย่างน้อย `metadata.ts` กับ `index.ts`

## 2. ประกาศ Metadata

ให้ `metadata.ts` ส่งออกข้อมูลที่ตรงกับ `ToolMetadata` โดยเฉพาะ `route` ต้องเป็น `/tools/<tool-id>` และ Privacy fields ต้องตรงกับพฤติกรรมจริง

## 3. ทำตาม Tool Contract

`index.ts` ต้องส่งออก `metadata`, `mount(container)` และ `unmount()` หาก Module สร้าง Event Listener, Worker, Timer หรือ Object URL ต้องคืน Resource ทั้งหมดใน `unmount()`

## 4. ลงทะเบียนแบบ Lazy

เพิ่ม Metadata และ dynamic import ใน `src/data/tools.ts` เท่านั้น:

```ts
{
  metadata: myToolMetadata,
  load: () => import('../tools/my-tool'),
}
```

ห้าม import โค้ดประมวลผลหลักของ Tool แบบ static เพราะจะทำให้หน้า Hub โหลด Bundle ของทุกเครื่องมือ

## 5. ตรวจสอบก่อนส่งงาน

- `npm run typecheck`
- `npm test`
- `npm run build`
- ทดสอบเข้าและออกจาก Route ซ้ำ เพื่อยืนยันว่า `unmount()` คืน Resource ครบ
- ทดสอบหน้าจอ 360px, Keyboard และข้อความผิดพลาด
- ยืนยันว่า Client-side Tool ไม่เรียก API ด้วยข้อมูลผู้ใช้
