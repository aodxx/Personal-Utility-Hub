# Group 3 Roadmap Playbook

ใช้ reference นี้เมื่อมีเครื่องมือที่ทำงานได้อยู่แล้วและต้องวางแผนเพิ่มความสามารถโดยไม่ทำให้ workflow ซับซ้อนเกินคุณค่า

## Decision sequence

1. ตรวจ registry, metadata, guide, module, core, tests, PWA และ git state ก่อนแก้
2. ระบุ first-run job, failure modes, privacy boundary และ output semantics
3. ให้คะแนน Impact, Usability gain, Effort, Risk และ Reuse ระดับ 1–5
4. เลือก capability ที่ลดความผิดพลาดหรือเพิ่มความมั่นใจ ก่อน capability ที่เพิ่ม option
5. จัด feature เป็น shared foundation, Wave A, Wave B หรือ Wave C
6. แบ่งเป็น release slice ละ 2–4 tools ที่ใช้ core/UI/test helper ร่วมกัน
7. กำหนด acceptance criteria ที่ตรวจได้ก่อนเขียนโค้ด

## Priority heuristic

ให้ความสำคัญสูงเมื่อ feature มีผลต่อ privacy/data correctness, มีผู้ใช้กว้าง, reuse ได้หลาย tools และ effort ต่ำถึงกลาง ลดลำดับเมื่อ feature ต้องพึ่ง algorithm ที่ยังไม่มี benchmark, เปลี่ยน semantics โดยไม่มี preview/diff หรือทำให้ first-run flow ยาวขึ้นเกินหนึ่งขั้น

ไม่ใช้ telemetry สมมติเป็นหลักฐาน เพราะ local-only utility ไม่ควรเก็บ content หรือ behavior โดยอัตโนมัติ ให้ใช้ source evidence, existing tests, documented use cases, failure analysis และ explicit user request แทน

## Shared capability order

พัฒนาในลำดับนี้เมื่อมีเครื่องมือหลายตัวต้องใช้ร่วมกัน: safe text rendering → preview before/after → deterministic batch queue → progress/cancel → undo/reset → download verification → no-network/no-storage test helper → mobile overflow/accessibility helpers

ทุก shared primitive ต้องมี unit/integration contract, lifecycle cleanup, bundle measurement และตัวอย่างการใช้อย่างน้อยหนึ่ง tool ก่อนนำไปใช้วงกว้าง

## Acceptance matrix

| Concern | Required evidence |
|---|---|
| Correctness | pure core tests, malformed/boundary cases, deterministic output |
| Usability | first-run path, visible labels, plain-language defaults, reset/preview |
| Privacy | no upload/storage/telemetry beyond contract; permission only after action |
| Lifecycle | abort/cancel, stale-result protection, object URL/resource cleanup, unmount test |
| Accessibility | keyboard path, focus, labels, live status, non-color-only state |
| Mobile | 360px/Android route, no horizontal overflow, touch target check |
| Release | metadata/registry/guide/assets/cache updates and measured bundle |
| Delivery | actual quality-gate output, staged diff check, remote SHA verification |

## Wave rules

**Wave A** ให้ทำงานที่ลดความผิดพลาดหรือป้องกัน privacy/data loss โดยตรง เช่น diagnostics, preview, batch basics, metadata risk review และ reversible export

**Wave B** ให้ทำงานที่เพิ่ม interoperability, batch และ report หลัง shared foundation เสถียรแล้ว ต้องมี deterministic naming, partial-failure report, memory/file guards และ explicit loss warnings

**Wave C** ให้ทำงานเฉพาะทางเมื่อมี demand ชัดและมี benchmark/test corpus เช่น advanced PDF, regex explanation, audio analysis หรือ structured-data hints ต้องใช้ progressive disclosure และไม่ลด guard เดิม

## Release loop

ทำตามลำดับ: inspect → privacy decision → user-flow design → pure core → lifecycle-safe module → registry/guide/assets → unit/contract/E2E → exact quality gates → release docs/code review → staged diff → fetch/compare → commit → normal push → remote verification

หาก gate ล้มเหลว ให้แก้ implementation หรือ contract แล้วรันซ้ำ ห้ามลด assertion เพื่อทำให้ผ่าน ห้ามใช้ force push และห้ามอ้าง CI/Pages/production verification หากยังไม่ได้ตรวจจริง
