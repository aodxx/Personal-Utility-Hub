# Phase 6 Trust & Usability Content Audit

**วันที่ตรวจ:** 17 สิงหาคม 2026  
**Scope:** source, guides, UI copy, documentation และ release claims ของ Personal Utility Hub v0.8.0

## ผลสรุป

Catalog `src/data/guides.ts` มี Tool-specific Guide ครบ **25/25 active tools** โดยใช้ schema เดียวกันที่บังคับให้มี overview, use cases, inputs, outputs, steps, limitations, privacy, FAQ และ tips ในทั้งภาษาไทยและภาษาอังกฤษ ไม่มี generator หรือ fallback generic guide เหลืออยู่ใน catalog และ `getToolGuide(toolId)` ใช้ direct lookup ตาม `toolId`.

Sample metadata ถูกตรวจเทียบกับ UI implementation แล้วพบว่า `sampleAvailable: true` มี **3 tools** ได้แก่ JSON Formatter, Base64 และ Text Formatter ซึ่งมีปุ่ม Try Sample และ handler จริง ส่วน Privacy Redactor, File Diff และ CSV Profiler ไม่มี sample control จึงคงค่า `false` เพื่อไม่ให้เอกสารสัญญาเกินความสามารถของ UI.

## Trust wording policy

ข้อความใน guide และ Privacy route ใช้ถ้อยคำเชิงข้อเท็จจริง ได้แก่ การประมวลผลใน browser, ไม่มี backend upload flow, ผลลัพธ์อาจอยู่ใน memory หรือ local browser storage ตาม feature และผู้ใช้ควรล้างไฟล์/ดาวน์โหลดเมื่อใช้งานเสร็จแล้ว ไม่มีคำกล่าวว่า “100% safe”, ไม่มีการรับรองความปลอดภัยแบบสมบูรณ์ และไม่มีการเรียกความสามารถว่า AI.

คำว่า “lossless” ใช้เฉพาะเมื่อหมายถึงโหมดหรือผลลัพธ์ที่ implementation รองรับจริง และ guide ของ Audio Compressor ระบุข้อจำกัดว่า target size เป็นค่าประมาณ ส่วน Audio Finisher ระบุว่าเป็น peak normalization ไม่ใช่ LUFS mastering และ Audio Speed & Pitch ระบุว่าเป็น resampling ที่ทำให้ speed กับ pitch เปลี่ยนสัมพันธ์กัน.

## Automated scan record

การค้นหาคำที่อาจเกี่ยวข้องกับ privacy/security/performance claims ถูกบันทึกไว้ในไฟล์ raw ที่สร้างระหว่าง audit (`docs/phase6-trust-audit.txt`) เพื่อให้ตรวจย้อนกลับได้ การ match รวมข้อความ localization, ชื่อเทคนิค, test fixtures และ documentation references จึงไม่ถือว่าเป็น false claim โดยอัตโนมัติ การตัดสินใช้ source implementation และ guide contract เป็นหลัก.

## Verification status

Local typecheck, unit/integration, production build, bundle budget, Playwright, npm audit, Service Worker syntax check และ `git diff --check` ผ่านหลัง guide catalog และ guide-specific E2E assertions ถูกปรับให้ตรวจ localized content จริง การตรวจ GitHub Actions บน commit สุดท้ายและ Production Pages smoke test ยังเป็น release gate แยกต่างหาก และต้องบันทึกใน `docs/v0.8-production-smoke-notes.md` ก่อนประกาศ Phase 6 เป็น complete.
