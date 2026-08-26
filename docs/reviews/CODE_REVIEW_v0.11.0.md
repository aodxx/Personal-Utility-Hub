# Code Review — SVG Asset Studio P1 Optimization Upgrade v0.11.0

**วันที่:** 27 สิงหาคม 2026
**สถานะ:** Local validation passed; pending remote CI/Pages evidence
**ขอบเขต:** Upgrade ของ `svg-asset-studio` เดิม ไม่สร้าง tool route ใหม่

## Executive summary

การเปลี่ยนแปลงนี้ขยาย SVG Asset Studio จากการมี optimizer action ไปเป็น **reversible optimization workflow** ที่ผู้ใช้เห็น raw before/after bytes, optional gzip comparison, change summary และสามารถ Restore previous SVG ก่อน export ได้ การเปลี่ยนแปลงคง route และ metadata ID เดิม จึงไม่เพิ่ม duplicate tool ใน catalog ตาม decision ใน [P1 overlap and implementation plan][1]

implementation เลือกใช้ deterministic sanitizer/optimizer core ที่มีอยู่แล้วแทนการเพิ่ม SVGO dependency ใน release นี้ การตัดสินใจนี้ลด bundle/dependency risk และทำให้ behavior ที่ตรวจใน tests ตรงกับ source ของ repository แต่หมายความว่า feature ยังไม่อ้างความครอบคลุมเทียบเท่า SVGO/SVGOMG

## Changed surface

| Area | Change | Review result |
|---|---|---|
| `src/tools/svg-asset-studio/logic.ts` | เพิ่ม `SvgOptimizationResult`, raw savings bytes/percent และ optional `CompressionStream` gzip measurement | ผ่าน typecheck/unit tests |
| `src/tools/svg-asset-studio/index.ts` | เพิ่ม Before/after panel, change details, gzip availability, restore snapshot และ selected preset persistence | ผ่าน targeted/full E2E |
| `src/styles/components.css` | เพิ่ม responsive comparison metrics และ details layout | ผ่าน mobile no-overflow regression |
| `src/data/guides.ts` | อัปเดต TH/EN guide ให้บอก raw/gzip limitation และ restore behavior | source-aligned |
| `src/tools/svg-asset-studio/metadata.ts` | version `0.2.0-beta.1`, description สะท้อน comparison capability | ผ่าน registry |
| PWA release identifiers | package `0.11.0`, cache/sprite namespace `0.11.0-p1-svg` | ผ่าน PWA tests |
| Tests | raw/gzip core assertions และ SVG E2E assertions สำหรับ comparison/restore | ผ่าน |

## Correctness review

`optimizeSvgMarkup` วัด `beforeBytes` จาก raw input ที่ส่งเข้าฟังก์ชัน และวัด `afterBytes` จาก serialized output จริง จึงไม่ทำให้ตัวเลขก่อน optimize หายไปหลัง sanitize ขั้นต้น `rawSavingsBytes` และ `rawSavingsPercent` เป็นค่าที่คำนวณแบบ deterministic และรองรับผลติดลบเมื่อ output ใหญ่ขึ้นแทนการแสดงผลประหยัดปลอม

Change summary รวมรายการที่ sanitizer และ preset optimizer ทำจริง โดย deduplicate รายการก่อนแสดงผล ผู้ใช้จึงเห็นเหตุผลของการเปลี่ยนแปลงใน `details` panel และสามารถตรวจ preview ก่อน download ได้ ส่วน gzip measurement ใช้ `CompressionStream` เมื่อ browser มี API และแสดง “Unavailable in this browser” เมื่อไม่มีความสามารถดังกล่าว ตามแนวทาง progressive enhancement ของ browser API [4]

Restore snapshot เก็บ SVG ก่อน optimize ไว้เฉพาะใน module memory เมื่อเปลี่ยน asset, upload, edit หรือ fix ระบบจะล้าง snapshot เพื่อไม่ให้นำผลจาก asset ก่อนหน้ากลับมาใช้ผิดตัว การคำนวณ gzip เป็น async และตรวจว่า result object ยังเป็น operation ล่าสุดก่อนอัปเดต UI เพื่อลด stale-result risk

## Security and privacy review

ไฟล์ SVG ที่ผู้ใช้เลือกยังถูกอ่านใน browser memory และผ่าน `sanitizeSvgMarkup` ก่อน preview หรือ optimize ไม่มี upload, cloud conversion, analytics หรือ user-content persistence เพิ่มขึ้น Favorites, recents และ pack IDs ยังคงใช้ local-only preferences ตาม architecture เดิม [2]

Inspector values ที่มาจาก SVG เช่น `viewBox`, fill/stroke และ check details ถูก escape ก่อนประกอบเข้า HTML ใน render/update paths ส่วน change summary ก็ escape เช่นกัน Preview ยังคงแสดงเฉพาะ SVG ที่ผ่าน sanitizer แล้ว การแก้ไขนี้ลดความเสี่ยงจาก malicious attribute/text injection ใน inspector และไม่เปลี่ยนหลักการใช้ `textContent`/sanitized markup ของ workflow เดิม

Input upload guard เดิมจำกัด SVG ที่ 2 MB และ core guard จำกัดจำนวน nodes, paths และ path data ตาม `SVG_LIMITS` การอัปเกรดไม่ได้เพิ่ม network capability หรือ parser ที่ประมวลผลข้อมูลนอก browser

## Performance review

การวัด gzip ไม่เพิ่ม dependency และเรียกเฉพาะเมื่อผู้ใช้กด Optimize จึงไม่เพิ่ม entry-path work การเปลี่ยนแปลงยังคง lazy-loaded SVG chunk และไม่เพิ่ม SVGO bundle ใน release นี้ ผล local bundle ล่าสุดคือ entry gzip 58.1 KB, largest lazy chunk 366.1 KB และ JavaScript รวม 1,241.7 KB จาก 62 chunks ซึ่งยังต่ำกว่า budget ที่ repository กำหนด

`CompressionStream` สร้าง compressed buffer ใน memory อีกชุดหนึ่ง จึงยังมี residual memory cost สำหรับ SVG ขนาดใหญ่ แต่ input guard 2 MB จำกัดขอบเขตไว้ และ UI ไม่คำนวณ gzip ระหว่าง typing หรือทุก render การ snapshot สำหรับ restore ก็อยู่ใน memory เฉพาะช่วงหลัง optimize และถูกล้างเมื่อ asset/workflow เปลี่ยน

## Test evidence

| Validation | Result |
|---|---:|
| Targeted SVG unit suite | 9/9 passed |
| Full Vitest | 154/154 tests จาก 33 files passed |
| Targeted SVG Playwright | 6/6 passed บน Desktop Chromium และ Android profiles |
| Full Playwright | 271 passed, 14 intentional skips จาก 285 cases ด้วย single worker |
| Typecheck | passed |
| Production build | passed |
| Bundle check | passed |
| Registry check | 46 metadata modules passed |
| SVG integrity | 120 assets; duplicates/warnings 0 |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| Service Worker syntax / diff check | passed |

รายละเอียดและคำสั่ง reproducible อยู่ใน [TEST_REPORT.md][3]

## Residual risks and limitations

Safe, Balanced และ Aggressive เป็น policy ของ optimizer ที่มีอยู่ใน repository ไม่ใช่ proof ว่า output จะมี visual/semantic equivalence แบบ formal โดยเฉพาะการลบ IDs, fixed dimensions หรือ metadata ผู้ใช้ต้องตรวจ preview และใช้ Restore หากผลไม่ตรงต้องการ คู่มือจึงไม่รับรองว่า raw/gzip savings เท่ากับ visual quality improvement

gzip comparison ขึ้นกับ browser support และไม่ใช่ขนาดที่รับรองสำหรับทุก server/content-encoding configuration เนื่องจากเป็นการวัด gzip ของ markup ใน browser ไม่ใช่ผลจาก deployment pipeline จริง

การ release นี้ยังไม่มี SVGO plugin matrix, semantic SVG diff หรือ dedicated Worker สำหรับ optimizer เพราะ input limit และ current bundle budget ยังเพียงพอ หากเพิ่ม batch optimization หรือรองรับ SVG ขนาดใหญ่ ควรทำ Worker/benchmark ก่อนขยาย limits ตาม P1 roadmap [1]

ยังไม่มี GitHub Actions หรือ GitHub Pages production evidence ใหม่ในรายงานนี้ จนกว่าจะ push commit แล้วตรวจผล remote จริง

## Review conclusion

การอัปเกรดเหมาะสมสำหรับ P1 รุ่นแรก เพราะเพิ่มคุณค่าที่ผู้ใช้ตรวจสอบได้โดยไม่สร้าง route ซ้ำ ไม่เพิ่ม dependency หนัก และรักษา privacy-first architecture ผล implementation ผ่าน local quality gates และมี residual risks ระบุไว้ตรงไปตรงมา แนะนำให้ merge ได้หลังตรวจ staged diff และ remote CI ตาม release workflow ใน [CONTRIBUTING.md](../../CONTRIBUTING.md)

## References

[1]: ../research/P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md "P1 overlap review and implementation plan"
[2]: ../../skills/privacy-first-utility-expansion/SKILL.md "Privacy-First Utility Expansion skill"
[3]: ../reports/TEST_REPORT.md "Test and release validation report"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream "MDN CompressionStream API"
