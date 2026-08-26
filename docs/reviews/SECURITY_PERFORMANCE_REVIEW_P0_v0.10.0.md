# Supplemental Security & Performance Review — P0 Utilities v0.10.0

**Repository:** `aodxx/Personal-Utility-Hub`
**Scope:** JWT Inspector, Hash & Checksum Verifier, Regex Playground และ Color Contrast Checker
**Review type:** เพิ่มเติมจาก `CODE_REVIEW_v0.10.0.md` หลัง release v0.10.0
**Review date:** 26 สิงหาคม 2026
**Review status:** ผ่านการตรวจ source, automated tests และ production build; มี residual limitations ตามที่ระบุด้านล่าง

## Executive summary

การตรวจรอบเพิ่มเติมไม่พบช่องโหว่ระดับ Critical หรือ High ที่ยังเปิดอยู่ใน P0 utilities ภายใต้ threat model ของแอป local-only ซึ่งรับ input จากผู้ใช้และประมวลผลในเบราว์เซอร์ ความเสี่ยงที่พบระหว่าง review ส่วนใหญ่เป็น **availability/performance risk จาก input ที่ออกแบบมาให้หนัก** ไม่ใช่ data-exfiltration path

พบและแก้ไขประเด็นสำคัญ 5 กลุ่ม ได้แก่ Regex ที่อาจทำให้ main thread ค้างจาก catastrophic backtracking, Hash ที่มีการอ่านข้อมูลทั้งก้อนก่อน `SubtleCrypto.digest()`, JWT ที่ไม่มี input-size bound และถอด malformed UTF-8 แบบเงียบ, expected digest ที่ไม่ตรวจความยาวตาม algorithm และ race condition ที่อาจแสดงชื่อไฟล์ไม่ตรงกับผล hash หลังผู้ใช้เปลี่ยนไฟล์ระหว่างประมวลผล

> **ข้อสรุป:** P0 utilities อยู่ในสถานะเหมาะสมสำหรับการใช้งานแบบ client-side แต่ไม่ควรตีความว่าเป็นการรับรองความปลอดภัยของ token, ไฟล์ หรือ regex ที่ผู้ใช้ป้อน เครื่องมือยังคงต้องแสดงข้อจำกัดตามที่ระบุไว้ใน UI และ guide

## Scope and methodology

การ review ครอบคลุม core utilities, DOM modules, processing client/protocol, existing processing Worker, dedicated Regex Worker, lazy registry/offline preparation และ regression tests โดยตรวจหา network/storage sinks, unsafe HTML sinks, unbounded input, expensive synchronous operations, stale async results, cancellation leaks, worker termination และ bundle impact

นอกจาก source inspection แล้ว ได้รัน targeted unit tests, unit tests ทั้งชุด, P0 functional E2E และ full Playwright E2E บน configured desktop/mobile projects รวมถึง production build, bundle budget, registry, SVG integrity, npm audit, Service Worker syntax และ `git diff --check`

## Findings and disposition

| ID | Area | Initial risk | Finding | Disposition |
|---|---|---:|---|---|
| S-01 | Regex ReDoS / UI availability | Medium–High | JavaScript RegExp ใช้ backtracking ได้ และ pattern ที่เป็นอันตรายอาจใช้เวลานานมากหรือทำให้หน้าเว็บค้างได้ [1] | **แก้แล้ว:** run และ replace ย้ายไป dedicated Worker; มี timeout 2 วินาที, abort/terminate, sync fallback จำกัด 20,000 ตัวอักษร และ core limits สำหรับ input/matches/replacement |
| S-02 | Regex DOM cost | Medium | ผล match สูงสุด 10,000 รายการอาจสร้าง DOM highlight มากเกินจำเป็นบนมือถือ | **แก้แล้ว:** list แสดง 100 รายการแรก และ highlighted preview สร้าง `<mark>` สูงสุด 1,000 รายการ พร้อมข้อความแจ้งการ cap |
| S-03 | Hash memory | Medium | `SubtleCrypto.digest()` ไม่รองรับ streaming และต้องอ่าน input ทั้งหมดเข้า memory ก่อน digest [2] | **ลดความเสี่ยงแล้ว:** file guard 40 MB และ text guard 4 MB อยู่ใน core, UI, fallback และ Worker; file path มี progress/cancel แต่ยังคงใช้ whole-buffer ตาม API contract |
| S-04 | Hash comparison | Low | expected digest ที่เป็น hex แต่ความยาวไม่ตรงกับ algorithm อาจถูกนำไปเปรียบเทียบในฐานะ input ที่ valid | **แก้แล้ว:** ตรวจ SHA-256 = 64 hex และ SHA-384/SHA-512 = 128 hex; จำกัด expected input 256 ตัวอักษร และ truncate เฉพาะการแสดงผลใน DOM |
| S-05 | Hash async race | Low | ผู้ใช้อาจเลือกไฟล์ใหม่ระหว่างงานเดิม ทำให้ผล digest เดิมแสดงคู่กับชื่อไฟล์ใหม่ | **แก้แล้ว:** capture source filename พร้อมงานที่เริ่ม และใช้ operation ID/AbortController กัน stale result |
| S-06 | JWT input/malformed bytes | Medium | JWT ที่ยาวมากทำให้ parser และ claim rendering ใช้ memory เพิ่ม; decoder แบบ replacement อาจซ่อน malformed UTF-8 | **แก้แล้ว:** จำกัด JWT 256 KiB, ใช้ fatal UTF-8 decoder และ propagate error ที่ระบุสาเหตุจริง |
| S-07 | JWT semantics | Informational | JWT เป็น compact claims representation ที่อาจ signed/MACed/encrypted ตามโครงสร้าง JWS/JWE; การ decode payload ไม่เท่ากับ validation หรือ authorization [3] | **ผ่านตามขอบเขต:** UI/guide ระบุชัดว่าไม่ verify signature, ไม่ fetch JWK และเตือน `alg=none`; `exp`/`nbf` ใช้เพื่อแสดงผลเชิงข้อมูลเท่านั้น |
| S-08 | Local-only boundary | Informational | P0 source มี static template `innerHTML` สำหรับ markup คงที่ แต่ user-derived values ใช้ `textContent`/textarea/value; ไม่พบ fetch, XHR, WebSocket, storage write หรือ dynamic code execution ใน scope | **ผ่าน:** ไม่มี content upload หรือ persistence path เพิ่มจาก P0 |
| S-09 | Color Contrast performance/safety | Low | color parser และ ratio calculation ทำงาน synchronous ทุก input event แต่ input มีรูปแบบสั้นและ calculation มีขนาดคงที่ | **ยอมรับได้:** ไม่พบ practical DoS จาก parser; CSS preview ใช้ normalized color ที่ parse แล้ว และ scoring ปฏิเสธ alpha/non-opaque colors |
| S-10 | Release integration | Low | การเพิ่ม Worker อาจทำให้ offline claim ไม่ตรงกับ asset preparation หรือเพิ่ม bundle โดยไม่วัด | **แก้แล้ว:** Regex Worker ถูกผูกกับ `prepareOffline`; production build ไม่มี ineffective dynamic-import warning; bundle gate ยังคงผ่าน |

## Detailed security analysis

### Regex Playground

Regex เป็นจุดเสี่ยงที่สุดด้าน availability เพราะ pattern และ test input มาจากผู้ใช้โดยตรง OWASP อธิบายว่า pattern ที่มี nested repetition หรือ overlapping alternation อาจทำให้เวลาประมวลผลเพิ่มขึ้นอย่างรุนแรง หรือค้างเป็นเวลานานได้ [1] เดิมการทำงานบน main thread ทำให้ risk นี้กระทบ interaction ทั้งหน้าเว็บ

รอบนี้จึงย้ายทั้ง `run` และ `replace` ไป dedicated Worker การย้ายนี้ไม่ได้ทำให้ pattern ปลอดภัยโดยตัวมันเอง แต่ทำให้ main UI ยังตอบสนองได้ และ client สามารถ terminate worker เมื่อครบ timeout หรือเมื่อผู้ใช้เปลี่ยน input/กด clear/ออกจาก route นอกจากนี้ยังจำกัด sync fallback ไว้ 20,000 ตัวอักษร เพื่อไม่ให้กรณีที่ browser ไม่มี Worker กลายเป็นช่องทางให้ input ขนาดใหญ่ทำให้ UI ค้างโดยไม่มีขอบเขต

Residual risk คือ regex engine ยังเป็น JavaScript RegExp แบบ backtracking และ timeout ถูกกำหนดที่ระดับ client ดังนั้น pattern ที่ซับซ้อนอาจถูกยกเลิกแม้จะเป็น pattern ที่ผู้ใช้ตั้งใจใช้งานจริง ผู้ใช้ควรลดความซับซ้อนของ pattern หรือแบ่ง input เป็นชุดเล็กลงเมื่อเกิด timeout

### Hash & Checksum Verifier

MDN ระบุว่า `SubtleCrypto.digest()` ไม่รองรับ streaming input และต้องอ่านข้อมูลทั้งหมดเข้า memory ก่อนส่งให้ digest [2] ดังนั้น Worker ช่วยลดผลกระทบต่อ UI แต่ไม่ได้ลด peak memory ของการอ่านไฟล์และการสร้าง digest buffer โดยอัตโนมัติ รอบนี้จึงบังคับ file limit 40 MB และ text limit 4 MB ใน `src/core/hash.ts` และเรียก guard ซ้ำที่ UI, main-thread fallback และ Worker เพื่อป้องกันการ bypass ด้วยการเรียก path อื่น

expected digest เป็น input text เช่นกัน จึงมี limit 256 ตัวอักษรและตรวจความยาว hex ตาม algorithm ผลที่แสดงใน DOM ถูกตัดให้สั้นลงเมื่อยาวเกิน 160 ตัวอักษรเพื่อป้องกัน layout/DOM bloat แต่ comparator ยังไม่ใช้ค่าที่ตัดทอนในการตัดสิน MATCH/MISMATCH

Residual risk คือเครื่องมือยังเป็น checksum verifier ไม่ใช่ encryption และการคำนวณ hash ไม่ได้ยืนยันว่าไฟล์มาจากแหล่งที่เชื่อถือได้ ผู้ใช้ต้องได้รับ expected digest จากช่องทางที่เชื่อถือได้และตรวจ algorithm ให้ตรงกัน

### JWT Inspector

RFC 7519 อธิบาย JWT ว่าเป็น representation ของ claims ที่อยู่ใน JWS หรือ JWE ได้ และ `exp`, `nbf`, `iat` เป็น NumericDate claims ที่ต้องตีความตามบริบทของ application [3] เครื่องมือนี้ทำเพียง decode/inspect จึงไม่สามารถยืนยันลายเซ็น issuer audience หรือ authorization ได้ การตรวจ `exp`/`nbf` ใน UI เป็น informational summary เท่านั้น

รอบนี้เพิ่ม bound 256 KiB ก่อน split/decode และใช้ `TextDecoder` แบบ `fatal` เพื่อไม่ให้ malformed UTF-8 ถูกแทนที่ด้วย replacement character แล้วดูเหมือน decode สำเร็จ นอกจากนี้ยังคงใช้ `textContent`/textarea สำหรับการแสดง payload และ claims เพื่อไม่ให้ claim value กลายเป็น HTML

Residual risk คือ payload ที่ decode ได้ยังอาจมีข้อมูลลับ ผู้ใช้ไม่ควรวาง token จริงบนอุปกรณ์ที่ผู้อื่นเข้าถึงได้ และไม่ควร copy/share output โดยไม่ตรวจข้อมูลส่วนบุคคลก่อน

### Color Contrast Checker

การคำนวณของเครื่องมือนี้เป็น deterministic operation ขนาดคงที่ ประกอบด้วยการ parse color, relative luminance และ ratio จึงไม่พบ input amplification ที่มีนัยสำคัญเมื่อเทียบกับ Regex/Hash เครื่องมือยอมรับ HEX/RGB/RGBA ตาม parser และปฏิเสธสีที่มี alpha ใน scoring เพื่อไม่ทำให้ผล ratio ถูกตีความโดยไม่มี compositing context

การกำหนด `style.color` และ `style.backgroundColor` ใช้ค่าที่ผ่าน parser และ normalize เป็น HEX ก่อนแสดง preview ไม่ได้ต่อ string เป็น markup หรือสร้าง CSS rule จาก user input โดยตรง เครื่องมือยังต้องใช้เป็น contrast check ไม่ใช่ full accessibility audit ตามข้อความเตือนใน UI

## Performance evidence

| Metric | Result | Interpretation |
|---|---:|---|
| P0 targeted unit/worker tests | 10/10 passed | ครอบคลุม core guards, Regex fallback, Worker abort และ Worker timeout |
| Full unit tests | 132/132 passed จาก 29 files | ไม่พบ regression ใน repository test suite |
| P0 functional E2E | 27/27 passed | route, local notice, processing flow, result และ mobile/desktop workflows ผ่าน |
| Full Playwright E2E | 271 passed, 14 intentional skipped จาก 285 cases | P0 changes ไม่กระทบ workflows เดิม |
| Entry JavaScript | 57.9 KB gzip | อยู่ใต้ bundle gate 60 KB |
| Largest lazy chunk | 366.1 KB | เป็น PDF worker เดิม ไม่ใช่ P0 bottleneck |
| All JavaScript | 1,240.8 KB gzip / 62 chunks | lazy architecture ยังแยกโหลดตาม tool |
| Registry | 46 metadata modules | unique routes/lazy registrations ผ่าน |
| SVG integrity | 120 assets, duplicate 0 | icon registry/sprite integrity ผ่าน |
| npm audit | 0 vulnerabilities ระดับ high ขึ้นไป | dependency audit ผ่าน |

## Test and source checks

คำสั่งที่ผ่านในรอบนี้มีดังต่อไปนี้:

```text
npm run typecheck
npm test -- --run
npm run build
npx playwright test tests/e2e/p0-tools.spec.ts
npm run test:e2e
npm run check:bundle
npm run check:registry
npm run check:svg-library
npm audit --audit-level=high
node --check public/sw.js
git diff --check
```

Static scan ใน scope P0 ไม่พบ `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `localStorage`, `sessionStorage`, `indexedDB`, `eval` หรือ `Function` และไม่พบการนำ user-derived data ไปใส่ dynamic HTML หลังจาก template mount ครั้งแรก

## Recommendations for a future release

หากต้องการลด residual risk ต่อไป ควรพิจารณาใช้ streaming-capable hashing implementation สำหรับไฟล์ที่ใหญ่กว่า 40 MB โดยต้องทำ benchmark บนอุปกรณ์ mobile ก่อนเพิ่ม limit ควรเพิ่ม pattern linting แบบ advisory สำหรับรูปแบบที่มี nested quantifier โดยไม่อ้างว่าสามารถตรวจ ReDoS ได้ครบทุกกรณี และควรเพิ่ม optional signature verification ของ JWT เป็น feature แยกที่ต้องมี explicit key input หรือ explicit network consent ไม่ควรผูกเข้ากับ decode flow แบบเงียบ ๆ

สำหรับ production hardening ควรตั้ง Content Security Policy ที่ deployment layer และทดสอบด้วย browser security headers จริง แม้ P0 source จะไม่เพิ่ม network/storage path ก็ตาม เนื่องจาก CSP และ headers เป็นคุณสมบัติของ hosting/deployment ไม่ใช่สิ่งที่ยืนยันได้จาก source modules เพียงอย่างเดียว

## Final disposition

| Severity | Open findings | Status |
|---|---:|---|
| Critical | 0 | ไม่มี |
| High | 0 | ไม่มี |
| Medium | 0 exploitable findings; 2 residual limitations | แก้ mitigation แล้ว; Regex ยังยกเลิก pattern ที่ timeout และ Hash ยัง whole-buffer |
| Low/Informational | 0 blocking findings | มีข้อจำกัดเชิง semantics/privacy ที่แสดงไว้ใน UI/guide |

การ review นี้เป็นการตรวจ source และ automated behavior ใน repository ณ วันที่ระบุ ไม่ใช่การรับรองความปลอดภัยของข้อมูลที่ผู้ใช้ป้อน หรือการรับรองความถูกต้องทางกฎหมายของ token, checksum, regex หรือ accessibility decision

## References

[1]: https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS "OWASP — Regular expression Denial of Service (ReDoS)"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest "MDN — SubtleCrypto: digest() method"
[3]: https://www.rfc-editor.org/rfc/rfc7519 "RFC 7519 — JSON Web Token (JWT)"
[4]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C WAI — Understanding WCAG 2.2 Success Criterion 1.4.3"
