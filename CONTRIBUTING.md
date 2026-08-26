# Contributing to Personal Utility Hub

ขอบคุณที่ช่วยพัฒนา Personal Utility Hub โครงการนี้เป็น Static PWA ที่ให้ความสำคัญกับ **privacy-first, local-only processing, accessibility, lazy loading และการทำงานบน mobile** เป้าหมายของคู่มือนี้คือทำให้ผู้พัฒนาใหม่สามารถอ่าน repository แล้วทำงานต่อได้โดยไม่ต้องพึ่ง conversation history ภายนอก

## เริ่มต้นใช้งาน

ต้องใช้ Node.js `22.12.0` ขึ้นไป จากนั้นติดตั้ง dependency และรัน development server:

```bash
npm ci
npm run dev
```

อ่าน [`README.md`](README.md) สำหรับภาพรวม และอ่าน [`docs/INDEX.md`](docs/INDEX.md) เพื่อเลือกเอกสารตามประเภทงาน หากกำลังเพิ่ม browser utility ให้ดู [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md) และ workflow ฉบับ reusable ที่ [`skills/privacy-first-utility-expansion/SKILL.md`](skills/privacy-first-utility-expansion/SKILL.md)

## หลักการที่ต้องรักษา

เครื่องมือใหม่ต้องประมวลผลข้อมูลภายใน browser หรือ Worker และต้องไม่อัปโหลด user files ไป backend/cloud โดยไม่มี requirement และ security review ที่ชัดเจน ห้ามเก็บ contents ของไฟล์ผู้ใช้ใน LocalStorage หรือ IndexedDB; storage ที่มีอยู่ใช้สำหรับ settings, usage, favorites, recent tools และ offline readiness ตาม contract เดิมเท่านั้น

ทุก active tool ต้องมี `metadata.ts`, `index.ts`, lazy registry entry, bilingual guide, privacy statement, cleanup lifecycle และ unique local asset icon ตามรูปแบบของ repository หากใช้ Worker ต้องมี typed protocol/client, fallback behavior ที่ไม่อ้างเกินจริง, cancellation/termination และ offline asset preparation ที่สอดคล้องกับ `supportsOffline`

การเพิ่ม dependency ต้องมีเหตุผลที่ชัดเจน ตรวจ license, bundle impact, browser support, audit result และพิจารณา native browser API หรือ pure utility ก่อน ไม่ควรเพิ่ม library ขนาดใหญ่สำหรับงานที่ทำได้ด้วย platform API แบบ bounded และตรวจสอบได้

## Workflow สำหรับการเปลี่ยนแปลง

1. อ่าน `AGENTS.md`, `README.md`, `docs/ADDING_A_TOOL.md`, privacy policy และเอกสารเฉพาะ feature ก่อนแก้ source
2. ตรวจ `git status`, branch และ recent history เพื่อแยกงานของตนเองจากการเปลี่ยนแปลงที่มีอยู่ อย่า reset, checkout ทับ หรือ force push งานของผู้อื่น
3. กำหนด input/output limits, threat model, privacy boundary, responsive behavior และ error states ก่อน implement
4. แยก pure logic ไว้ใน `src/core` และให้ UI module รับผิดชอบ DOM/events/lifecycle เท่านั้น ใช้ `textContent`, `.value` หรือ DOM nodes สำหรับ user-derived output และหลีกเลี่ยง unsafe HTML sinks
5. เชื่อม metadata, lazy registry, guide, localization, taxonomy, icon และ offline contract ให้ครบก่อนประกาศว่าเครื่องมือพร้อม
6. เพิ่ม unit/regression tests สำหรับ happy path, malformed input, limits, cancellation, stale async result, privacy boundary และ accessibility-relevant states
7. รัน quality gates ในหัวข้อถัดไป แล้วตรวจ diff ด้วยตนเอง โดยเฉพาะ generated files, cache version, docs links และ bundle changes
8. เขียนหรืออัปเดตเอกสารใน `docs/` ให้ตรงกับ implementation และเก็บ residual limitations ไว้ใน review/report
9. ใช้ commit message ที่อธิบายการเปลี่ยนแปลง และ push แบบ fast-forward เท่านั้นเมื่อ branch/remote สดและไม่มี divergence

## Quality gates

ก่อนเปิด pull request ควรรันอย่างน้อย:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run check:bundle
npm run check:registry
npm run check:svg-library
npm run test:e2e
npm audit --audit-level=high
node --check public/sw.js
git diff --check
```

หากเปลี่ยน logic ของ utility ให้เพิ่ม targeted test ที่จับ failure mode นั้นโดยตรงด้วย หากเปลี่ยน UI หรือ route ให้รัน P0/feature E2E บน Desktop Chromium และ Android projects รวมถึงตรวจ no horizontal overflow และ keyboard/focus behavior

## เอกสารและ pull request

Pull request ควรระบุ motivation, changed paths, privacy impact, input/file limits, Worker/fallback behavior, tests ที่รัน, bundle impact และ known limitations หากมี external source หรือ standard ให้ใส่ลิงก์อ้างอิงในเอกสาร review ไม่ควรคัดลอกเนื้อหาจาก source โดยไม่ตรวจ license และความถูกต้อง

เอกสารที่เป็น current contract ควรเก็บใน `docs/` ส่วน reusable AI workflow ให้เก็บใน `skills/` ตามโครงสร้าง `SKILL.md` ของ skill creator อย่าวาง scratch notes, credentials, personal data, `node_modules`, `dist`, test results หรือ browser profile ลงใน commit

## Git และ release safety

ใช้ identity ที่ผู้ดูแล repository อนุมัติและตั้งค่าเฉพาะ repository หากไม่ต้องการเปลี่ยน global identity อย่าใช้ `git push --force` หรือแก้ไข remote history หาก `origin/main` เปลี่ยนระหว่าง review ให้ fetch, ตรวจ divergence และรวมการเปลี่ยนแปลงอย่างโปร่งใสก่อน push

ก่อน push ให้ตรวจ:

```bash
git fetch origin
git status -sb
git diff --check
git diff --cached --check
git log -1 --oneline --decorate
git ls-remote origin refs/heads/main
```

## รายงานปัญหา

เมื่อพบ security issue ให้ระบุ affected route/module, input ที่ทำให้เกิดปัญหา, impact, reproduction ที่ไม่เปิดเผยข้อมูลจริง และ mitigation ที่เสนอ อย่าใส่ token, secret, user file หรือข้อมูลส่วนบุคคลใน issue, test fixture หรือ log
