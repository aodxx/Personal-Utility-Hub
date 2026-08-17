# Phase 9.1 LINE Sticker Studio — Delivery Report

## สถานะ

Phase 9.1 ปรับ LINE Sticker Studio จากเครื่องมือแบบ editor-first ให้เป็น **Prompt-first six-step workflow** โดยยังรักษา image engine, local-only privacy และ animated/APNG partial contract จาก Phase 9 เดิม

> Prompt และภาพไม่ถูกส่งไป backend หรือ AI API ของ Utility Hub การเปิด ChatGPT เป็นการเปิดเว็บไซต์ภายนอกด้วย user gesture ของผู้ใช้เอง

## สิ่งที่ส่งมอบ

| พื้นที่ | ผลลัพธ์ |
|---|---|
| Prompt Studio | เพิ่ม grid presets 3×3, 4×4, 4×5, custom; phrase/grid warning; anti-poster and consistency guards; Thai phrase fidelity |
| Provider handoff | Clipboard API + textarea fallback; `Copy Prompt + Open ChatGPT`; popup-blocked status; external privacy disclosure |
| Workflow | เพิ่ม six-step navigator: Prompt, AI handoff, Upload/Split, Batch edit, Review, Download |
| Upload/Split | Suggested Grid จาก prompt state, numbered 01..N overlay, Quick Split และ advanced boundary controls เดิม |
| Batch processing | ลบพื้นหลังทั้งชุด, Auto Fit ทั้งชุด, ขอบขาวทั้งชุด และ Recommended Finish พร้อม progress output |
| Review | validation summary เดิม, Fix Next Issue และ revalidate flow |
| Download | แสดงจำนวน stickers, main.png, tab.png, validation report และ ZIP size หลังสร้างสำเร็จ |
| Draft | เก็บ prompt fields, grid, prompt output และ latest step ใน localStorage; ไม่เก็บ image binary |
| Mobile UX | sticky step navigation, sticky quick-split card, full-width primary actions และ no-overflow guard |
| Recovery | สร้างชุดใหม่พร้อม confirmation และล้าง canvas/object state ใน workspace |

## Evidence

| Gate | Result |
|---|---:|
| TypeScript typecheck | PASS |
| Vitest | 85/85 ผ่าน |
| LINE Sticker Studio E2E | 15/15 ผ่าน desktop + Android profiles |
| Local production smoke | 30/30 ผ่าน บน 360×740, 412×915 และ 1280×900 |
| Prompt privacy network test | PASS — distinctive prompt ไม่ปรากฏใน request URL/body ของ Utility Hub |
| Suggested 4×4 preview | PASS — 16 numbered cells และ 16 stickers |
| ZIP integrity | PASS — ZIP signature, sticker entries, main, tab และ validation report |
| Production build | PASS |
| Bundle check | PASS — entry gzip 44.1 KB; LINE Sticker Studio lazy chunk 13.88 KB gzip |

## Known limitations

Animated mode ยังคงเป็นการเตรียม frame, playback และ validation เท่านั้น; APNG encoder และ round-trip verification ยังไม่พร้อม จึงไม่ประกาศ APNG export ready. Technical validation ไม่ใช่การรับรองการอนุมัติเนื้อหาโดย LINE และการสร้างภาพจาก ChatGPT ยังเป็นขั้นตอนภายนอกที่ผู้ใช้ต้องดำเนินการเอง

## Files

- `src/tools/line-sticker-studio/logic.ts`
- `src/tools/line-sticker-studio/index.ts`
- `src/styles/components.css`
- `tests/line-sticker-studio.test.ts`
- `tests/e2e/line-sticker-studio.spec.ts`
- `scripts/phase91-production-smoke.mjs`
- `docs/phase9-1-sticker-workflow-contract.md`
