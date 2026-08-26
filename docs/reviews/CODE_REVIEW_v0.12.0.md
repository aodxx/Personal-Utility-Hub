# Code Review — Data Format Converter P1 v0.12.0

**สถานะ:** Local review complete; ready for commit after final staged review
**ขอบเขต:** `data-format-converter` ใหม่, parser dependencies, registry/metadata/guide, PWA cache namespace, tests และ responsive UI
**วันที่:** 27 สิงหาคม 2026

## Executive summary

Data Format Converter เป็นเครื่องมือใหม่ที่แยกภารกิจออกจาก JSON Formatter เดิม โดยใช้ JSON เป็น normalized intermediate model และรองรับ JSON, YAML, TOML และ XML ในรุ่น beta แรก การ implementation ใช้ maintained open-source parsers แทนการเขียน parser เอง ตาม feasibility record ใน repository [1]

การทำงานยังเป็น local-only: input อยู่ใน browser memory, ไม่มี network request, upload, analytics หรือ user-content persistence เครื่องมือถูก lazy-load ผ่าน registry และ parser dependencies อยู่ใน lazy chunk แทนการเพิ่ม parser cost เข้า entry bundle

## Scope and design decisions

| Area | Review finding | Status |
|---|---|---|
| Tool boundary | ใช้ route ใหม่ `data-format-converter`; ไม่ดูด multi-format conversion เข้า JSON Formatter | ผ่าน |
| Supported formats | JSON, YAML, TOML และ XML; JSON-centered conversion ใน beta | ผ่าน |
| Parser selection | `yaml@2.9.0`, `smol-toml@1.8.0`, `fast-xml-parser@5.11.0`, `jsonc-parser@3.3.1`; exact versions ใน lockfile | ผ่าน |
| Error contract | `DataFormatError` มี format, line และ column เมื่อ parser ให้ offset/location; ไม่เดาตำแหน่งที่ไม่มีหลักฐาน | ผ่าน |
| XML mapping | attributes ใช้ `@_`, text ใช้ `#text`, repeated tags ใช้ arrays; output ห่อด้วย `<root>` | ผ่านพร้อมข้อจำกัด |
| Input/output guards | input จำกัด 500,000 chars/2 MB UTF-8 และ output จำกัด 1,000,000 chars | ผ่าน |
| UI lifecycle | delegated click handler, mount/unmount cleanup และ loader-managed container replacement | ผ่าน |
| Offline | `supportsOffline: true`; cache namespace `0.12.0-p1-data`; parser chunk ถูก cache เมื่อ tool ถูกโหลด | ผ่าน |

## Security review

การ parse XML ใช้ `processEntities: false` เพื่อลดความเสี่ยงจาก external/general entity expansion และ XML validation เกิดก่อน parse การแสดง warning ใช้ DOM `textContent` แทนการนำ parser-derived text ไปต่อเป็น HTML โดยตรง ส่วน static module markup ใช้ค่าที่ควบคุมโดย source ไม่ใช่ user input

JSON ใช้ `jsonc-parser` แบบ strict options เพื่อรับ parse errors พร้อม offset โดยปิด comments และ trailing commas ขณะที่ parser ไม่สร้าง function หรือ executable value จาก input แต่อย่างใด YAML/TOML/XML output ถูกส่งผ่าน typed conversion result และ error messages ถูก normalize โดยไม่เปิดเผย stack trace ใน UI

การตรวจนี้ไม่ใช่การรับรอง parser เป็น sandbox สมบูรณ์ หากอนาคตเพิ่ม custom tags, XML entities, schema validation หรือ arbitrary object hooks ต้องทำ security review ใหม่ก่อน merge

## Performance review

Parser packages ถูก import โดย lazy-loaded tool module ดังนั้น build แยกเป็น `data-format-converter` lazy chunk และ entry bundle ยังผ่าน budget ปัจจุบัน Input/output guards ลดความเสี่ยงจากการสร้าง intermediate objects และ serialized output ขนาดใหญ่ แต่การ parse/serialize ยังทำบน main thread ใน beta เพราะเป็น text utility และยังไม่มี benchmark ที่พิสูจน์ว่าจำเป็นต้องใช้ Worker

| Metric | Local result |
|---|---:|
| Entry gzip | 59.2 KB |
| Largest lazy chunk | 366.1 KB (`pdf.worker.min`) |
| Data converter lazy chunk | 203.82 KB raw / 64.77 KB gzip จาก build output |
| JavaScript total | 1,305.7 KB gzip จาก 63 chunks |
| Input guard | 500,000 chars และ 2 MB UTF-8 |
| Output guard | 1,000,000 chars |

Data converter lazy chunk มีขนาดสูงกว่า lightweight text tools เพราะรวม parser implementations หลายชนิด แต่ไม่เพิ่มเข้า entry bundle และยังไม่ทำให้ `check:bundle` entry/largest/total budgets fail จึงยอมรับได้สำหรับ P1 beta โดยควรวัดซ้ำเมื่อเพิ่ม format หรือ parser option ใหม่

## Functional and regression review

Unit suite ครอบคลุม format matrix, nested Unicode data, TOML tables, XML attributes/repeated nodes, malformed input diagnostics, warning semantics, empty/oversized input และ TOML root-table restriction Module contract test ตรวจ metadata, route, lazy load, mount และ unmount event cleanup ส่วน Playwright suite ตรวจ sample → convert → warning → swap, invalid YAML error และ 360px no-overflow

| Gate | Result |
|---|---:|
| TypeScript | ผ่าน `npm run typecheck` |
| Full Vitest | 164/164 tests จาก 34 files |
| Converter unit suite | 9/9 tests |
| Converter targeted E2E | 4 passed, 2 intentional skips จาก 6 cases |
| Full Playwright | 275 passed, 16 intentional skips จาก 291 cases ด้วย single worker |
| Production build | ผ่าน |
| Bundle gate | Entry 59.2 KB gzip; largest lazy 366.1 KB; total 1,305.7 KB จาก 63 chunks |
| Registry gate | 47 metadata modules ผ่าน |
| SVG integrity | 120 assets; exact/geometry duplicates 0; near-duplicate warnings 0 |
| npm audit | 0 vulnerabilities |
| Service Worker syntax / diff check | ผ่าน |

## Residual risks and follow-up

รุ่นนี้ไม่รับประกัน round-trip fidelity เต็มรูปแบบของ YAML comments/anchors/tags, TOML date/time semantics หรือ XML comments, namespaces และ mixed content ordering ผู้ใช้ต้องตรวจ conversion notes ก่อนนำ output ไปใช้จริง XML output ใช้ generated `<root>` wrapper และ TOML output ต้องเป็น root table

Parser dependencies เพิ่มขนาด lazy chunk และการ parse/serialize ยังใช้ main thread หาก benchmark กับ input ใกล้ guard พบ UI blocking ควรย้าย core ไป Worker ใน milestone แยก พร้อม cancellation protocol และการวัด memory/latency ไม่ควรเพิ่ม Worker เพียงเพราะขนาด dependency

การตรวจครั้งนี้เป็น local validation เท่านั้น ยังไม่ได้อ้าง GitHub Actions หรือ GitHub Pages deployment evidence ใหม่จนกว่าจะ push commit และตรวจ remote result

## References

[1]: ../research/P1_DATA_FORMAT_CONVERTER_FEASIBILITY.md "Data Format Converter parser feasibility record"
[2]: https://www.npmjs.com/package/yaml "yaml package documentation and metadata"
[3]: https://github.com/squirrelchat/smol-toml "smol-toml official repository"
[4]: https://github.com/NaturalIntelligence/fast-xml-parser "fast-xml-parser official repository"
[5]: https://github.com/microsoft/node-jsonc-parser "Microsoft node-jsonc-parser official repository"
