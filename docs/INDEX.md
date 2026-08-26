# Repository Documentation Index

เอกสารใน repository นี้เป็น **single source of truth** สำหรับการพัฒนา Personal Utility Hub โดยแบ่งตามหน้าที่เพื่อให้ผู้พัฒนาและ AI ที่เข้ามาใหม่สามารถเริ่มจากเอกสารที่เหมาะสมได้ทันที

## จุดเริ่มต้นที่แนะนำ

| ต้องการทำอะไร | อ่านก่อน | ต่อด้วย |
|---|---|---|
| เข้าใจภาพรวมโครงการ | [`../README.md`](../README.md) | [`../AGENTS.md`](../AGENTS.md) และ [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
| เพิ่มหรือแก้เครื่องมือ | [`ADDING_A_TOOL.md`](ADDING_A_TOOL.md) | [`../skills/privacy-first-utility-expansion/SKILL.md`](../skills/privacy-first-utility-expansion/SKILL.md) |
| เข้าใจกฎ privacy/dependency | [`PRIVACY_AND_DEPENDENCIES.md`](PRIVACY_AND_DEPENDENCIES.md) | source ใน `src/core`, `src/tools` และ `src/workers` |
| ตรวจ UI/UX และ visual system | [`design/P0_TOOLS_UIUX_DESIGN.md`](design/P0_TOOLS_UIUX_DESIGN.md) และ [`VISUAL_SYSTEM.md`](VISUAL_SYSTEM.md) | component/style files ใน `src/components` และ `src/styles` |
| ตรวจ release/testing | [`reports/TEST_REPORT.md`](reports/TEST_REPORT.md) และ [`reports/PROGRESS.md`](reports/PROGRESS.md) | [`reviews/CODE_REVIEW_v0.11.0.md`](reviews/CODE_REVIEW_v0.11.0.md) และ historical P0 review |
| ตรวจ security/performance P0 | [`reviews/SECURITY_PERFORMANCE_REVIEW_P0_v0.10.0.md`](reviews/SECURITY_PERFORMANCE_REVIEW_P0_v0.10.0.md) | P0 core, Worker และ regression tests |
| อ่านเหตุผลของการเลือกเครื่องมือ | [`research/EXTERNAL_TOOLS_RESEARCH_v0.10.md`](research/EXTERNAL_TOOLS_RESEARCH_v0.10.md) | [`research/external-tools-evaluation-v0.10.md`](research/external-tools-evaluation-v0.10.md) และ [`research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md`](research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md) |
| เข้าใจ product requirements | [`product/PRD.md`](product/PRD.md) | [`V0.9_TOOL_ROADMAP.md`](V0.9_TOOL_ROADMAP.md) |

## โครงสร้างเอกสาร

| Directory | ขอบเขต |
|---|---|
| `design/` | UI/UX specification, interaction flow, responsive behavior และ visual design |
| `research/` | Competitive scan, external sources, opportunity evaluation และ research notes |
| `reviews/` | Code review, security review และ performance review |
| `reports/` | Release status, test matrix, production evidence และ validation record |
| `product/` | PRD, roadmap และ product-level requirements |
| `skills/` | Reusable AI workflow ที่อธิบายวิธีทำงานกับ repository นี้หรือ utility expansion pattern |

## กติกาเอกสาร

เอกสารที่เป็นข้อกำหนดปัจจุบันต้องอ้างอิง source หรือ test ที่ตรวจสอบได้ และต้องระบุข้อจำกัดอย่างตรงไปตรงมา เอกสารที่เป็น historical record ควรรักษาวันที่และ release context ไว้ ไม่ควรแก้ย้อนหลังเพื่อทำให้ผลเก่าดูเหมือนเป็นผลของ release ใหม่

เมื่อย้ายไฟล์เอกสาร ให้ปรับ relative links ในเอกสารที่เกี่ยวข้องและตรวจด้วย `git grep` หรือ link checker แบบ local ก่อน commit หากเอกสารมีตัวเลขผลทดสอบหรือ bundle metrics ต้องอัปเดตจาก command output ล่าสุด ไม่ใช้ค่าที่คาดเดา

## AI collaboration note

AI ที่ clone repository ควรอ่าน `AGENTS.md` ก่อน จากนั้นอ่าน `CONTRIBUTING.md`, `README.md` และเอกสารเฉพาะงานตามตารางด้านบน อย่าอาศัย conversation history ภายนอก repository เป็น source of truth และอย่าเพิ่ม backend, telemetry, cloud upload หรือ persistence ของ user file contents โดยไม่ได้รับการทบทวนและอนุมัติอย่างชัดเจน
