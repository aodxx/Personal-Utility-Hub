# Data Format Converter — Parser Feasibility Record

**วันที่:** 27 สิงหาคม 2026
**สถานะ:** Approved for MVP implementation
**ขอบเขต:** JSON, YAML, TOML และ XML แบบ local-only โดยใช้ JSON เป็น normalized intermediate model

## Decision

Data Format Converter จะเป็น tool ใหม่ `data-format-converter` ที่รองรับ conversion แบบ JSON-centered ในรุ่นแรก ได้แก่ JSON↔YAML, JSON↔TOML และ JSON↔XML ไม่รวม CSV และไม่เปลี่ยน JSON Formatter ให้เป็น multi-format workbench ตาม [P1 overlap plan][1]

เลือกใช้ parser ที่มี maintained open-source implementation แทนการเขียน YAML/TOML/XML parser เอง:

| Format | Candidate | Decision และ boundary |
|---|---|---|
| JSON | Web platform `JSON.parse`/`JSON.stringify` และ existing JSON core | ใช้เป็น normalized model และคง error position จาก `SyntaxError` เท่าที่ browser ให้ได้ |
| YAML | `yaml@2.9.0` | ISC, 0 external dependencies, modern browser support; ใช้ `parseDocument`/`stringify` เพื่ออ่าน diagnostics และ serialize |
| TOML | `smol-toml@1.8.0` | BSD-3-Clause, TOML 1.1-oriented, browser-compatible package; ใช้ `parse`/`stringify` พร้อม normalized error |
| XML | `fast-xml-parser@5.11.0` | MIT; ใช้ `XMLValidator.validate`, `XMLParser` และ `XMLBuilder` แบบ explicit options; จำกัด XML model ที่แปลงกลับได้อย่างโปร่งใส |

Package versions and licenses were checked from npm metadata on 27 August 2026. The `yaml` project documents parse/stringify and modern-browser support [2]. The `fast-xml-parser` project documents XML validation, parsing and building without native C/C++ dependencies [3]. The `smol-toml` project documents TOML 1.1 parsing/stringifying and notes that some date/time fidelity details are format-specific [4]

## Normalized model

รูปแบบภายในของ converter คือ JSON-compatible value: object, array, string, number, boolean และ null การแปลงต้องไม่สร้าง JavaScript class, function หรือ executable value จาก input และต้อง reject/flag root values ที่ target format ไม่สามารถแสดงผลได้อย่างชัดเจน

XML ใช้ adapter แบบ explicit:

```text
object key       → child element
array             → repeated child element เมื่อชื่อ element กำหนดได้
text              → #text field
attributes        → @_attribute fields
mixed content     → preserve ด้วย ordered/explicit policy หรือแสดง conversion warning
```

MVP จะเลือก XML options ที่ทำให้ attributes ใช้ `@_` prefix, text ใช้ `#text`, และ repeated tags กลายเป็น arrays โดยประกาศว่า XML comments, processing instructions, namespace fidelity, mixed-content ordering และบาง XML schema semantics อาจไม่ round-trip เหมือนต้นฉบับ

## Error contract

ทุก parser ต้องคืน normalized error ที่มีอย่างน้อย `format`, `message`, `line?`, `column?` และ `sourceLabel` โดยไม่แสดง stack trace ให้ผู้ใช้เป็นค่าเริ่มต้น:

| Source | Location strategy |
|---|---|
| JSON | ใช้ position ที่ parse error เปิดเผยได้; หาก browser ไม่ให้ offset ให้แสดง actionable message โดยไม่เดาตำแหน่ง |
| YAML | ใช้ document errors และ `linePos` ถ้า package เปิดเผยข้อมูลนั้น |
| TOML | แปลง parser error message แบบ conservative; หากไม่พบ line/column ให้แสดง “location unavailable” แทนการเดา |
| XML | ใช้ `XMLValidator.validate` result ซึ่งรายงาน line/col เมื่อ invalid; parse/build error ต้องถูก normalize โดยไม่อ้างตำแหน่งที่ไม่มีหลักฐาน |

ห้ามทำ heuristic line/column จากข้อความ error โดยอ้างว่าแม่นยำ หาก parser ไม่ได้ให้ offset จริง

## Privacy and performance boundary

Input text อยู่ใน browser memory เท่านั้น ไม่มี fetch, upload, analytics หรือ persistence ใน LocalStorage/IndexedDB ขนาด input รุ่นแรกควรมี explicit character/UTF-8 byte guard และ output guard เพื่อป้องกัน memory spikes จากการ parse หลายรูปแบบพร้อมกัน เนื่องจาก parser dependencies อยู่ใน lazy tool chunk จึงไม่เพิ่ม parser cost เข้า entry bundle แต่ต้องวัด largest lazy chunk และ total JavaScript ก่อน merge

MVP ใช้ main thread เพราะเป็น text utility และ skill ระบุให้ใช้ pure core ก่อน Worker สำหรับงาน text ขนาดเล็ก หาก benchmark พบว่า parse/serialize input ใกล้ limit ทำให้ UI ค้าง ให้แยก Worker protocol ใน milestone ถัดไปแทนการเพิ่ม Worker โดยไม่มีหลักฐาน

## Lossy conversion warning

UI ต้องแสดง warning เมื่อ conversion อาจไม่รักษา semantics เช่น YAML comments/anchors/tags, TOML date types/table ordering, XML attributes/namespaces/comments/mixed content และ root scalar/array ที่ target format รองรับต่างกัน ผลลัพธ์เป็น conversion preview ไม่ใช่ round-trip fidelity guarantee

## Test fixtures required before release

ต้องมี fixtures สำหรับ JSON nested/Unicode/array, YAML invalid indentation/anchors, TOML invalid table/key/date cases, XML attributes/repeated tags/namespaces/malformed closing tags และ conversion loss warnings ทั้งหมดต้องเป็น synthetic fixtures ไม่มีข้อมูลส่วนบุคคลหรือ secret จริง

## References

[1]: P1_OVERLAP_AND_IMPLEMENTATION_PLAN.md "P1 overlap review and implementation plan"
[2]: https://www.npmjs.com/package/yaml "yaml package documentation and metadata"
[3]: https://github.com/NaturalIntelligence/fast-xml-parser "fast-xml-parser official repository"
[4]: https://github.com/squirrelchat/smol-toml "smol-toml official repository"
