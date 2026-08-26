# AGENTS.md — Personal Utility Hub

ไฟล์นี้เป็น operating contract สำหรับ AI agents ที่ทำงานใน repository `aodxx/Personal-Utility-Hub` ผู้พัฒนามนุษย์ควรอ่าน [`CONTRIBUTING.md`](CONTRIBUTING.md) ควบคู่กัน และเอกสารทั้งหมดใน repository นี้ถือเป็น source of truth เหนือ conversation history ภายนอก

## Mission and non-negotiables

รักษา Personal Utility Hub ให้เป็น Static PWA แบบ **privacy-first/local-only** ทุก user file และ user-provided content ต้องประมวลผลใน browser memory หรือ Dedicated Worker เท่านั้น ห้ามเพิ่ม backend upload, telemetry, analytics, cloud storage, remote API หรือ account flow เพื่อความสะดวกโดยไม่มี explicit requirement, threat-model review และการอนุมัติของผู้ดูแล

ห้ามเก็บ user file contents ใน LocalStorage, IndexedDB หรือ Cache Storage พื้นที่เหล่านี้ใช้ได้เฉพาะ settings, preferences, usage, favorites, recent tools และ offline readiness ตาม implementation ปัจจุบัน ห้ามใส่ secrets, tokens, personal data, browser profiles, `node_modules`, `dist`, test artifacts หรือ generated scratch files ลง Git

อย่าใช้ `eval`, `new Function`, unsafe dynamic HTML หรือ remote assets ใน tool path หากต้องแสดงข้อมูลจากผู้ใช้ ให้ใช้ `textContent`, `.value`, escaped DOM nodes หรือ structured rendering ที่มี bounds ชัดเจน

## Read order

ก่อนเริ่มงานให้เปิด:

1. [`README.md`](README.md) — ภาพรวม architecture และ current catalog
2. [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow และ quality gates
3. [`docs/INDEX.md`](docs/INDEX.md) — แผนที่เอกสาร
4. [`docs/ADDING_A_TOOL.md`](docs/ADDING_A_TOOL.md) — tool contract และ processing patterns
5. [`docs/PRIVACY_AND_DEPENDENCIES.md`](docs/PRIVACY_AND_DEPENDENCIES.md) — privacy/dependency policy
6. [`skills/privacy-first-utility-expansion/SKILL.md`](skills/privacy-first-utility-expansion/SKILL.md) — reusable workflow สำหรับ utility expansion

อ่านเอกสารใน `docs/design/`, `docs/research/`, `docs/reviews/`, `docs/reports/` หรือ `docs/product/` ตามขอบเขตงาน อย่าอ้างรายงานที่อยู่นอก repository เมื่อมีฉบับใน `docs/` แล้ว

## Repository map

| Path | Responsibility |
|---|---|
| `src/app` | App Shell, router และ global navigation |
| `src/core` | Pure utilities, contracts, loaders, processing clients, storage/offline helpers |
| `src/tools` | Lazy-loaded tool modules; active tools require metadata and lifecycle cleanup |
| `src/workers` | Dedicated processing Workers และ typed job dispatch |
| `src/data` | Registry, taxonomy, guides, localization และ configuration |
| `src/components` | Shared UI components และ asset icons |
| `src/styles` | Design tokens, responsive layout และ component styles |
| `public` | Manifest, Service Worker, offline fallback และ self-hosted assets |
| `tests` | Unit, integration, contract, performance/offline และ Playwright E2E |
| `docs` | Project documentation, design, research, review, reports และ product records |
| `skills` | Repository-portable reusable AI workflows |

## Task protocol

เริ่มทุก task ด้วยการตรวจ `git status -sb`, branch, recent commit และ relevant files อย่าทำ `reset --hard`, `checkout` ทับงาน, `clean -fd`, rebase หรือ force push หากยังไม่ตรวจว่ามีงานของผู้ร่วมพัฒนาหรือไม่

กำหนด acceptance criteria ก่อนเขียน code โดยต้องรวม behavior, error states, input/file limits, privacy boundary, responsive behavior, accessibility และ test evidence แยก pure logic ใน `src/core` จาก DOM/lifecycle ใน `src/tools` เมื่อเป็นงานหนักให้ใช้ Worker พร้อม typed protocol, progress ที่ truthful, cancellation, timeout/termination และ bounded fallback อย่าประกาศ offline support ถ้า asset preparation ไม่ครบ

หลังแก้ source ให้เชื่อมทุก integration ที่เกี่ยวข้อง ได้แก่ `metadata.ts`, lazy registry, guides, i18n, taxonomy, icon sprite, offline cache และ tests อย่าลืมตรวจ stale references เมื่อย้ายเอกสารหรือเปลี่ยน cache namespace

## Security and performance checklist

ตรวจทุก user-derived rendering ว่าไม่สร้าง HTML injection ตรวจ input limits และ amplification paths โดยเฉพาะ regex backtracking, JSON depth/size, file `ArrayBuffer`, image dimensions และ output DOM count งาน async ต้องป้องกัน stale result เมื่อ input/route เปลี่ยน และต้อง cleanup event listener, Worker, timer, object URL, ImageBitmap หรือ AudioContext ที่สร้างขึ้น

สำหรับ Regex ให้คุม input/matches/replacement, run ใน Worker เมื่อ pattern อาจใช้เวลานาน และกำหนด timeout/cancel สำหรับ Hash ให้ตรวจ algorithm, digest length, text/file byte limits และระบุข้อจำกัด whole-buffer ของ Web Crypto สำหรับ JWT ให้แยก decode จาก verification, จำกัด token size และไม่ fetch JWK โดยอัตโนมัติ สำหรับ Color Contrast ให้ normalize สี, ปฏิเสธ input ที่ตีความไม่ได้ และไม่อ้างผลว่าเป็น full accessibility audit

## Required validation

รันคำสั่งต่อไปนี้ก่อนสรุปงาน หาก environment รองรับ:

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

รายงานจำนวน tests, skipped tests, bundle metrics, registry count, audit result และ known limitations จาก output จริงเท่านั้น หาก test ล้มเหลวให้แยกว่าเป็น product defect, stale assertion, environment issue หรือ test harness issue และอย่าประกาศผ่านจนมีคำอธิบายที่ตรวจสอบได้

## Documentation protocol

อัปเดตเอกสารในตำแหน่งที่เหมาะสม: design ใน `docs/design`, research ใน `docs/research`, review ใน `docs/reviews`, test/release evidence ใน `docs/reports`, product requirements ใน `docs/product` และ reusable AI workflow ใน `skills/` ทุกเอกสารต้องใช้ relative links ที่ตรวจสอบได้จากตำแหน่งไฟล์จริงและระบุข้อจำกัดอย่างตรงไปตรงมา

หากเพิ่มหรือแก้ security/performance behavior ให้สร้างหรืออัปเดต review report พร้อม finding, severity, disposition, residual risk และ test evidence อย่าแก้ historical evidence ให้ดูเหมือนเป็นผลของ release ใหม่

## Git protocol

ใช้ Git identity ตามที่ผู้ดูแลอนุมัติและตั้งค่าใน repository scope เมื่อเหมาะสม ตรวจ remote freshness ก่อน push:

```bash
git fetch origin
git status -sb
git diff --check
git diff --cached --check
git log -1 --oneline --decorate
git ls-remote origin refs/heads/main
```

ห้ามใช้ `git push --force` ห้ามเขียนทับ remote history หาก remote diverged ให้หยุดและวางแผนรวมอย่างปลอดภัย ใช้ commit message ที่อธิบาย intent ชัดเจน และให้ผู้ตรวจสอบเห็นไฟล์เอกสารกับ validation evidence ใน commit เดียวกันหรือ commit sequence ที่เข้าใจได้

## Handoff protocol

สรุป handoff ต้องระบุ changed paths, behavior ที่เพิ่ม, privacy/security impact, tests ที่ผ่าน, known limitations, current branch/commit และสิ่งที่ยังไม่ได้ทำ อย่ารายงานว่า push/deploy สำเร็จโดยไม่มี command output ยืนยัน
