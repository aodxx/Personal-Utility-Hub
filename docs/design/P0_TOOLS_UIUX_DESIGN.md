# UI/UX Design Specification: P0 Tools

**โครงการ:** Personal Utility Hub
**ขอบเขต:** JWT Inspector, Hash & Checksum Verifier, Regex Playground และ Color Contrast Checker
**สถานะ:** Design proposal สำหรับการพัฒนารุ่นถัดไป
**หลักการ:** Privacy-first, local-only, bilingual Thai/English, desktop/mobile และ lazy-loaded tool modules

## 1. Design direction

แนวทางที่เสนอคือ **Local Utility Workbench**: หน้าจอแต่ละเครื่องมือควรให้ความรู้สึกเหมือนโต๊ะทำงานขนาดกะทัดรัด ไม่ใช่ landing page ที่มี hero ขนาดใหญ่ ผู้ใช้ต้องเห็น input, action และผลลัพธ์ในลำดับเดียวกันทันที โดยนำ pattern ที่มีอยู่ใน repository เช่น `utility-panel`, `utility-panel__header`, `field`, `tool-actions`, `tool-status`, `result-panel` และ `privacy-badge` มาใช้ต่อเนื่อง [1]

Visual language ยังคงใช้พื้นหลังอ่อน `#f5f7fb`, surface สีขาว, primary blue `#3f5bd8`, accent lime `#d7ff64`, success green `#087b55`, focus amber `#ffb224`, radius ระดับเล็ก/กลาง/ใหญ่ และ shadow แบบ soft 3D ที่มีอยู่เดิม โทนสีน้ำเงินใช้บอกการดำเนินการและการเลือก ส่วนเขียวใช้เฉพาะผลสำเร็จ สีแดง/เหลืองใช้กับ error และ warning ตามลำดับ ห้ามใช้สีเพียงอย่างเดียวในการสื่อความหมาย ต้องมี label, icon หรือข้อความกำกับเสมอ

> **Design principle:** “เห็นข้อมูลสำคัญก่อน เห็นคำอธิบายเมื่อจำเป็น และ export ได้โดยไม่ต้องเดาทาง”

## 2. Shared tool shell

### 2.1 โครงสร้าง desktop

บนหน้าจอขนาดตั้งแต่ประมาณ 900 px ให้ใช้ panel เดียวที่มี header ด้านบนและ workbench แบบสองคอลัมน์ด้านล่าง คอลัมน์หลักกว้างประมาณ 7–8 ส่วนสำหรับ input/editor และคอลัมน์รองกว้างประมาณ 4–5 ส่วนสำหรับ result/guide เมื่อผลลัพธ์ต้องใช้พื้นที่มาก เช่น regex match list หรือ JSON claims ให้คอลัมน์ผลลัพธ์ขยายเต็มแถวได้

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ EYEBROW · TOOL CATEGORY                         [Local-only]             │
│ Tool title / ชื่อเครื่องมือ                                             │
│ คำอธิบายสั้นหนึ่งบรรทัด + privacy statement                            │
├───────────────────────────────────────┬─────────────────────────────────┤
│ INPUT / EDITOR                        │ LIVE RESULT / QUICK GUIDE       │
│                                       │                                 │
│ field, drop zone, controls            │ summary, validation, output     │
│                                       │                                 │
│ [Primary action] [Reset]              │ [Copy] [Download]               │
├───────────────────────────────────────┴─────────────────────────────────┤
│ STATUS: aria-live message / error / success                             │
└─────────────────────────────────────────────────────────────────────────┘
```

Header ต้องมี eyebrow ที่บอกหมวดงาน, ชื่อภาษาอังกฤษหรือชื่อหลัก, ชื่อภาษาไทยใน helper/label, คำอธิบายสั้น และ badge `Local-only` ที่มองเห็นได้ตลอดเวลา ไม่ควรซ่อน privacy statement ไว้ในคู่มือเพียงอย่างเดียว

### 2.2 โครงสร้าง mobile

เมื่อ viewport ต่ำกว่า 720 px ให้เปลี่ยนเป็น single-column โดยเรียง **input → options → primary action → result → guide** ไม่ใช้สองคอลัมน์ที่ถูกบีบจนอ่านยาก ปุ่มหลักควรกว้างเต็มบรรทัดหรือมีขนาดอย่างน้อย 44 px และกลุ่ม action สุดท้ายอาจเป็น sticky action bar ด้านล่างได้ แต่ต้องไม่บัง status หรือผลลัพธ์ และต้องรองรับ safe-area inset ของอุปกรณ์มือถือ

```text
┌─────────────────────────┐
│ Tool header              │
│ [Local-only]             │
├─────────────────────────┤
│ Input / editor           │
├─────────────────────────┤
│ Options                  │
├─────────────────────────┤
│ [Primary action]         │
│ [Reset] [Sample]         │
├─────────────────────────┤
│ Result summary           │
│ Output / details         │
├─────────────────────────┤
│ Status                   │
│ Guide (collapsible)      │
└─────────────────────────┘
```

### 2.3 Shared interaction model

ทุกเครื่องมือใช้ state model เดียวกัน: `Empty → Ready to process → Processing → Result → Error/Warning` โดยไม่ควรแสดง result card ว่างตั้งแต่เริ่มต้น ให้แสดง empty state ที่บอกสิ่งที่ต้องทำต่ออย่างตรงไปตรงมา เช่น “วาง token เพื่อเริ่ม / Paste a token to begin” เมื่อผู้ใช้ทำงานสำเร็จ ให้ focus ไปยัง result heading หรือ status อย่างเหมาะสมโดยไม่ดึง focus ออกจาก input หากผู้ใช้กำลังพิมพ์อยู่

การทำงานที่เป็น local-only ต้องแสดงข้อความคงที่ใน header หรือ status เช่น “ข้อมูลไม่ถูกส่งออกจากอุปกรณ์ / Data stays in this browser” ห้ามเก็บ input จริงไว้ใน LocalStorage หรือ IndexedDB และต้องล้าง object URL, Worker และ event listener ตอนออกจาก route ตาม lifecycle contract เดิม

### 2.4 Shared component inventory

| Component | หน้าที่ | พฤติกรรมที่ต้องคงที่ |
|---|---|---|
| `ToolHeader` | eyebrow, title, helper, privacy badge | title มีลำดับ heading ชัดเจน และ badge ไม่ใช้สีอย่างเดียว |
| `InputSurface` | textarea, file drop หรือ editor | label เชื่อมกับ control, รองรับ paste/drag/drop และ sample แบบ explicit |
| `OptionRow` | select, segmented control, checkbox, range | keyboard reachable และไม่ทำให้ action หลักเลื่อนหายบน mobile |
| `PrimaryAction` | เริ่ม process หรือคำนวณ | disabled เมื่อ input ไม่พร้อม, มี working state และไม่กดซ้ำได้ |
| `ResultCard` | summary, output และ export | ใช้ heading, status icon + text, copy/download อยู่ใกล้ output |
| `ToolStatus` | feedback แบบ `aria-live` | tone มีข้อความชัดเจน: neutral, working, success, warning, error |
| `GuideDisclosure` | วิธีใช้และ privacy note | collapsed ได้บน mobile แต่ไม่ซ่อนคำเตือนด้าน security ที่จำเป็น |

## 3. Tool design: JWT Inspector

### 3.1 เป้าหมายผู้ใช้

ผู้ใช้ต้องการดูโครงสร้าง JWT อย่างรวดเร็ว ตรวจ claims และเวลาหมดอายุ โดยไม่ต้องส่ง token ไปยังบริการภายนอก การออกแบบควรยึดแนวคิดจาก debugger ที่แยก decoder, JSON view และ claims breakdown แต่ลดความสับสนระหว่างการ “อ่าน token” กับการ “ยืนยันลายเซ็น” [3]

### 3.2 Desktop layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ AUTH · TOKEN INSPECTION                         [Local-only]              │
│ JWT Inspector · ตรวจสอบ JSON Web Token                                  │
│ Decode header, payload และ claims ในอุปกรณ์นี้ — ไม่ verify โดยอัตโนมัติ │
├───────────────────────────────────────┬─────────────────────────────────┤
│ ENCODED TOKEN                         │ TOKEN SUMMARY                   │
│ [Paste token........................] │ [Valid] [HS256] [Expires in 2h] │
│ [Load sample] [Clear]                 │ Claims 5 · 3 segments          │
│                                       │                                 │
│ [Inspect token]                       │ [Header] [Payload] [Claims]     │
│                                       │ JSON viewer / claims table       │
├───────────────────────────────────────┴─────────────────────────────────┤
│ Security note: Decoded ≠ cryptographically verified                     │
└─────────────────────────────────────────────────────────────────────────┘
```

คอลัมน์ซ้ายใช้ textarea แบบ monospace สูงประมาณ 11–14 บรรทัด มีปุ่ม `Paste`, `Load sample` และ `Clear` อยู่ใกล้กัน ปุ่มหลักใช้ชื่อ `Inspect token / ตรวจสอบ Token` ไม่ใช้คำว่า `Verify` เพื่อไม่สื่อเกินขอบเขต คอลัมน์ขวาเริ่มด้วย summary strip ที่แสดงจำนวน segment, algorithm และสถานะเวลา หากไม่พบ `exp` ให้แสดง `No expiry claim / ไม่ระบุวันหมดอายุ` แทนการเดาว่า token ไม่มีวันหมดอายุ

ผลลัพธ์ใช้ tab หรือ segmented control สามส่วน ได้แก่ `Header`, `Payload` และ `Claims`. Header และ payload แสดง JSON ที่อ่านได้พร้อม copy button ส่วน Claims เป็นตาราง key/value โดยจัดกลุ่ม standard claims เช่น `iss`, `sub`, `aud`, `iat`, `nbf`, `exp` ไว้บนสุด และแปลง Unix timestamp เป็นเวลาที่อ่านง่ายพร้อมแสดงค่า raw กำกับ

### 3.3 Mobile layout

บน mobile ให้เรียง token input, summary, tabs และ security note ตามลำดับ โดย tab ใช้ horizontal scroll ที่มีปุ่มขนาดสัมผัสได้ ไม่ควรใช้ตารางกว้างเต็มหน้าจอ ให้เปลี่ยน claims เป็น stacked definition list: ชื่อ claim อยู่บรรทัดบน ค่าอยู่บรรทัดถัดไป และตัดคำยาวด้วย `overflow-wrap: anywhere`

### 3.4 States และคำแนะนำการสื่อสาร

| State | การแสดงผล |
|---|---|
| Empty | แสดง placeholder ตัวอย่างรูปแบบ `xxxxx.yyyyy.zzzzz` และปุ่ม `Load sample` |
| Valid decode | แถบเขียวพร้อมคำว่า `Decoded locally / ถอดข้อมูลในเครื่องแล้ว` และแสดง summary |
| Malformed | แถบแดงระบุ segment ที่ผิด เช่น `Expected 3 segments` พร้อมคง token ไว้ให้แก้ไข |
| Invalid Base64/JSON | แสดงตำแหน่งส่วนที่อ่านไม่ได้และคำแนะนำให้ตรวจ padding/encoding |
| Expired | แถบเหลืองหรือแดงระบุ `Expired` พร้อมเวลาหมดอายุ ไม่สรุปว่า token ใช้ไม่ได้ในทุกระบบ |
| `alg: none` หรือ algorithm เสี่ยง | แสดง security warning เด่นและไม่ใช้สีเขียวกับ token นี้ |
| No `exp` | แสดง neutral note ว่าไม่มี expiry claim |

ห้ามเรียก network, fetch JWK หรือส่ง token ไปตรวจสอบภายนอกโดยอัตโนมัติ หากอนาคตจะเพิ่ม signature verification ให้เป็นฟังก์ชันแยกที่มี consent dialog และคำเตือนชัดเจนว่าเป็นการตรวจสอบเชิงเทคนิค ไม่ใช่การรับรองสิทธิ์ของระบบ

## 4. Tool design: Hash & Checksum Verifier

### 4.1 เป้าหมายผู้ใช้

ผู้ใช้ต้องการคำนวณ hash จากข้อความหรือไฟล์ และเปรียบเทียบกับค่า expected digest เพื่อยืนยันว่าเนื้อหาไม่เปลี่ยนแปลง เครื่องมือนี้ควรออกแบบให้ผู้ใช้เข้าใจความต่างระหว่าง “คำนวณ hash” และ “ตรวจว่าตรงกัน” ตั้งแต่หน้าแรก

### 4.2 Desktop layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ FILE INTEGRITY · HASHING                         [Local-only]             │
│ Hash & Checksum Verifier · ตรวจสอบความถูกต้องของไฟล์                    │
├───────────────────────────────────────┬─────────────────────────────────┤
│ INPUT                                 │ RESULT                          │
│ [Text] [File]                         │ SHA-256                         │
│                                       │ 9f86d081884c7d6...               │
│ textarea หรือ file drop zone          │ [Copy digest]                   │
│                                       │                                 │
│ Algorithm [SHA-256 ▼]                 │ Expected digest (optional)       │
│ Expected [.........................]  │ [Match] / [Mismatch]              │
│                                       │                                 │
│ [Calculate hash] [Reset]              │ File name · size · processed     │
├───────────────────────────────────────┴─────────────────────────────────┤
│ STATUS: Hashing locally · progress                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

ด้านบนของ input ใช้ segmented control `Text / ข้อความ` และ `File / ไฟล์` โดย default เป็น Text เพื่อให้เริ่มต้นเร็ว ใน File mode ให้แสดง drop zone ที่ระบุชนิดไฟล์และขนาดสูงสุดที่รองรับอย่างชัดเจน เมื่อเลือกไฟล์แล้วควรเปลี่ยน drop zone เป็น file summary row ที่มีชื่อไฟล์, ขนาด, ปุ่ม replace และปุ่ม remove

Algorithm selector ใช้ค่าเริ่มต้น `SHA-256` และมี `SHA-384` กับ `SHA-512` เป็นตัวเลือกถัดไป ส่วน MD5/SHA-1 หากรองรับเพื่อ compatibility ควรติด warning ว่าไม่เหมาะกับความปลอดภัยสมัยใหม่ ไม่ควรทำให้ตัวเลือกที่ไม่แนะนำอยู่ในตำแหน่งเด่น

Expected digest เป็น optional field พร้อมปุ่ม `Auto-format` หรือ normalize whitespace/uppercase เพื่อช่วย paste ค่า checksum จาก release note เมื่อคำนวณเสร็จให้แสดง digest แบบ monospace, ปุ่ม copy และ comparison result ขนาดใหญ่ `MATCH / ตรงกัน` หรือ `MISMATCH / ไม่ตรงกัน` พร้อมข้อความอธิบาย ไม่ใช้แค่สีเขียว/แดง

### 4.3 Progress และ memory guard

งานไฟล์ควรแสดง progress หรือ indeterminate working state พร้อมปุ่ม `Cancel` หากใช้ Worker สำหรับไฟล์ขนาดใหญ่ต้องแจ้งว่า “ไฟล์ยังคงอยู่ในอุปกรณ์นี้” และกำหนด size limit ที่สอดคล้องกับ memory budget เมื่อเกิน limit ให้หยุดก่อนประมวลผลและแนะนำให้ใช้ไฟล์ที่เล็กลง แทนการปล่อยให้ tab ค้าง

### 4.4 Mobile layout และ states

บน mobile ให้เรียง mode switch, input, algorithm, expected digest, action และ result ตามลำดับ ปุ่ม `Calculate hash` กว้างเต็มบรรทัด ส่วน result card แยก digest และ verdict เป็นสอง block เพื่อให้ copy ค่าได้โดยไม่ต้อง scroll แนวนอน

| State | การแสดงผล |
|---|---|
| Empty | ข้อความ `Paste text or choose a file` และ action disabled |
| Ready | แสดง preview input summary และเปิด action |
| Working | spinner/progress, ปุ่ม Cancel, ป้องกันการกดซ้ำ |
| Hash ready | แสดง algorithm, digest, size และเวลาโดยประมาณถ้ามี |
| Match | badge + text `MATCH / ตรงกัน` พร้อม copy digest |
| Mismatch | warning เด่น แสดง expected กับ actual แบบแยกบรรทัด |
| Unsupported/too large | error ที่บอกสาเหตุและวิธีแก้ ไม่ล้าง input เดิม |

## 5. Tool design: Regex Playground

### 5.1 เป้าหมายผู้ใช้

ผู้ใช้ต้องการเขียน regex, ทดลองกับข้อความ และดู match/capture groups แบบทันที เครื่องมือนี้ควรลดระยะห่างระหว่าง pattern กับผลลัพธ์ โดยให้ test string มีพื้นที่มากพอ และไม่ซ่อน flags ไว้ในเมนูที่เข้าถึงยาก

### 5.2 Desktop layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ TEXT · PATTERN TESTING                            [Local-only]             │
│ Regex Playground · ทดลอง Regular Expression                             │
├─────────────────────────────────────────────────────────────────────────┤
│ PATTERN                                                                    │
│ / [pattern................................................] / [g i m s u y]│
│ [Sample ▼] [Clear]                                      12 matches         │
├───────────────────────────────────────┬─────────────────────────────────┤
│ TEST STRING                           │ MATCH RESULTS                    │
│ [multiline editor...................]  │ match #1  0–5  "hello"         │
│                                       │ capture groups                    │
│ [Run / Auto-run toggle]               │ [highlighted preview]             │
├───────────────────────────────────────┴─────────────────────────────────┤
│ REPLACE PREVIEW (collapsed)        [replacement] [Copy result]            │
└─────────────────────────────────────────────────────────────────────────┘
```

Pattern fieldเป็น single-line monospace input ที่แสดง `/pattern/flags` เป็น visual wrapper แต่เก็บ pattern กับ flags แยกเป็นข้อมูลภายในจริง เพื่อให้ keyboard editing ไม่สับสน Flags ใช้ checkbox หรือ toggle chips ที่มี label เต็ม เช่น `Global`, `Ignore case`, `Multiline`, `Dotall`, `Unicode`, `Sticky` พร้อม tooltip อธิบายสั้น

Test string เป็น editor หลัก มี sample dropdown เช่น email, URL, Thai text และ log line แต่ sample ต้องโหลดเมื่อผู้ใช้กดเท่านั้น ไม่เติมข้อมูลแทนข้อความของผู้ใช้เอง Results แสดงจำนวน match, เวลาในการคำนวณถ้ามี, match list และ capture groups แต่ละรายการคลิกเพื่อ scroll/highlight ตำแหน่งใน test string ได้

Replace preview ควรเป็น disclosure ที่ปิดไว้ก่อน เพื่อลดความหนาแน่นของหน้าจอ เมื่อเปิดแล้วให้มี replacement input, preview ผลลัพธ์ และ `Copy result` โดยต้องติด warning ว่าเป็น preview และไม่ได้แก้ไฟล์ต้นฉบับ

### 5.3 Mobile layout

บน mobile ใช้ลำดับ `Pattern → Flags → Test string → Run → Results` และเปลี่ยน result เป็น tab `Summary / Matches / Replace`. ไม่ควรใช้ split pane แบบสองคอลัมน์บนมือถือ การ highlight ใน test string ต้องมีข้อความสำรอง เช่น match list พร้อม start/end index เพื่อให้ผู้ใช้ที่มองสีไม่ชัดยังใช้งานได้

### 5.4 States และ safety

| State | การแสดงผล |
|---|---|
| Empty | placeholder pattern และ sample button |
| Valid, no match | neutral result `0 matches / ไม่พบรายการที่ตรงกัน` |
| Valid, matches | summary count, highlighted preview และ match list |
| Invalid pattern | inline error ใต้ pattern พร้อมตำแหน่ง/ข้อความจาก parser |
| Replace preview | แสดงผลลัพธ์ใหม่โดยไม่เขียนทับ input |
| Input too large/slow | หยุดการประมวลผล แนะนำลดขนาด input และมี Cancel |

การประมวลผล pattern ที่ผู้ใช้ป้อนควรทำใน Worker เมื่อเป็นไปได้ พร้อม cancellation และ input limit เพื่อป้องกัน regex ที่ใช้เวลานานจนทำให้ UI ค้าง การออกแบบไม่ควรอ้างว่า regex ปลอดภัยสำหรับทุก pattern; ให้ใช้ข้อความเชิงปฏิบัติว่า “ประมวลผลในเบราว์เซอร์นี้” และจัดการ timeout/ยกเลิกให้ชัดเจน

## 6. Tool design: Color Contrast Checker

### 6.1 เป้าหมายผู้ใช้

ผู้ใช้ต้องการตรวจว่าสี foreground และ background อ่านร่วมกันได้หรือไม่ พร้อมเห็น preview ที่ใกล้เคียงการใช้งานจริง เครื่องมือนี้ควรนำผู้ใช้ไปสู่การตัดสินใจ ไม่ใช่แสดงตัวเลข ratio เพียงตัวเดียว ตาม WCAG 2.2 เกณฑ์ทั่วไปคืออย่างน้อย 4.5:1 สำหรับข้อความปกติ และ 3:1 สำหรับข้อความขนาดใหญ่ [2]

### 6.2 Desktop layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ACCESSIBILITY · COLOR                               [Local-only]          │
│ Color Contrast Checker · ตรวจสอบความเปรียบต่างของสี                     │
├───────────────────────────────────────┬─────────────────────────────────┤
│ COLORS                                │ CONTRAST RESULT                 │
│ FOREGROUND                            │ 7.24 : 1                        │
│ [color swatch] [#1F2937] [picker]     │ Excellent                        │
│                                       │ Normal text      AA ✓  AAA ✓     │
│ [Swap colors]                         │ Large text       AA ✓  AAA ✓     │
│ BACKGROUND                            │ UI / non-text    3:1 guidance    │
│ [color swatch] [#FFFFFF] [picker]     │                                 │
│ [Black/white] [Brand sample]          │ [Copy CSS] [Reset]               │
├───────────────────────────────────────┴─────────────────────────────────┤
│ LIVE PREVIEW: Heading · body · button · disabled/hover sample           │
└─────────────────────────────────────────────────────────────────────────┘
```

ใช้ color input คู่กับ text input แบบ HEX เป็นหลัก และรองรับ RGB/HSL เป็นช่องทางเสริมผ่าน disclosure `Advanced format`. Swatch ต้องมี border เพื่อเห็นสีอ่อนบนพื้นขาว ปุ่ม `Swap colors` อยู่ระหว่างสองสีและมี accessible label ชัดเจน Presets ใช้เป็น quick action เช่น `Black / White`, `Navy / White`, `Brand sample` แต่ต้องไม่เขียนทับค่าที่ผู้ใช้กรอกโดยไม่แจ้ง

Result card วาง ratio ขนาดใหญ่ด้านบน ตามด้วย decision rows สำหรับ `Normal text`, `Large text` และ `UI / non-text`. แต่ละแถวมีทั้ง icon, label, ratio threshold และข้อความ `Pass / Fail / Check context`. Live preview ต้องมี heading, body copy, link และ button เพื่อให้ผู้ใช้เห็นความแตกต่างของขนาดและน้ำหนักตัวอักษรในบริบทจริง

### 6.3 Mobile layout

บน mobile ให้ใช้ color controls เป็น stacked cards: Foreground, Swap, Background ตามด้วย ratio card และ result rows จากนั้นค่อยแสดง preview ด้านล่าง ทุก input มี min-height 44 px และ color picker ต้องมี text alternative เป็น HEX ไม่บังคับให้ใช้ native color picker เพียงอย่างเดียว

### 6.4 States และคำแนะนำการสื่อสาร

| State | การแสดงผล |
|---|---|
| Empty | preset ที่ปลอดภัยหนึ่งชุด พร้อมคำชวนให้เปลี่ยนสี |
| Valid pass | ratio เด่น, แถว pass ที่มี threshold และ live preview |
| Valid fail | สี warning/error, ข้อความว่าควรเพิ่มความต่าง และคง preview ไว้ |
| Invalid color | inline error เช่น `Use a valid HEX/RGB/HSL color` |
| Alpha/transparency | warning ว่าผลจริงขึ้นกับพื้นหลังที่อยู่ด้านหลัง |
| Context limitation | note ว่า ratio check ไม่ใช่การ audit accessibility ทั้งเว็บไซต์ |

ไม่ควรใช้คำว่า “accessible” แบบรับรองเด็ดขาดจาก ratio เดียว ควรใช้ `Passes this contrast check / ผ่านเกณฑ์ contrast นี้` และแนะนำให้ทดสอบ focus state, hover state, images of text และองค์ประกอบจริงเพิ่มเติม

## 7. Accessibility และ content rules ร่วม

ทุก control ต้องมี visible label หรือ accessible name, keyboard order ต้องไหลจาก input ไป options ไป action แล้วจึงไป result, และ focus ring ต้องมองเห็นได้ชัดบน light/dark theme การเปลี่ยนแปลงแบบ live เช่น regex results และ contrast ratio ควรประกาศผ่าน `aria-live="polite"` เฉพาะ summary ไม่ประกาศ output ทุกตัวอักษรเพื่อไม่รบกวน screen reader

การแสดงผลที่ใช้สีควรมีข้อความคู่กันเสมอ เช่น `MATCH`, `MISMATCH`, `Pass`, `Fail`, `Expired` และ `Invalid`. ตาราง claims หรือ match list ต้องมี heading ที่ชัดเจน ไม่พึ่ง placeholder เป็น label และต้องรองรับข้อความยาวภาษาไทย/อังกฤษด้วย `overflow-wrap: anywhere`

motion ใช้เฉพาะ transition สั้นประมาณ 160–220 ms สำหรับ state change และปิด animation ที่ไม่จำเป็นเมื่อ `prefers-reduced-motion: reduce` ปุ่มกดต้องมี active feedback แต่ไม่ทำให้ layout ขยับหรือทำให้ผู้ใช้สูญเสียตำแหน่ง scroll

## 8. Bilingual copy system

แนะนำให้ใช้ภาษาไทยเป็นคำอธิบายหลักและภาษาอังกฤษเป็นชื่อ operation ที่ผู้ใช้สายเทคนิคคุ้นเคย เช่น `ตรวจสอบ Token / Inspect token`, `คำนวณ Hash / Calculate hash`, `รูปแบบ / Pattern`, `ความเปรียบต่าง / Contrast`. Error messages ควรเป็น bilingual ในบรรทัดเดียวหรือสองบรรทัดที่มีความหมายเท่ากัน ไม่ควรแปลเฉพาะ heading แต่ปล่อย error เป็นภาษาอังกฤษอย่างเดียว

| UI element | ตัวอย่าง copy |
|---|---|
| Privacy badge | `Local-only · ประมวลผลในอุปกรณ์` |
| Primary action | `ตรวจสอบ Token / Inspect token` |
| Success | `คำนวณสำเร็จ / Hash calculated` |
| Warning | `ยังไม่ได้ยืนยันลายเซ็น / Signature not verified` |
| Empty state | `วางข้อมูลเพื่อเริ่ม / Paste input to begin` |
| Reset | `ล้างข้อมูล / Clear` |
| Sample | `ใช้ตัวอย่าง / Load sample` |
| Download/copy | `คัดลอก / Copy`, `ดาวน์โหลด / Download` |

## 9. Suggested implementation sequence

รอบพัฒนาแรกควรสร้าง shared primitives สำหรับ `ToolHeader`, `SegmentedMode`, `ResultCard`, `StatusBanner` และ `GuideDisclosure` ก่อน แล้วค่อยทำ core UI ของแต่ละเครื่องมือ การเรียงลำดับที่เหมาะสมคือ Color Contrast Checker และ JWT Inspector ก่อน เพราะ state model ตรงไปตรงมา จากนั้น Hash Verifier ที่ต้องออกแบบ Worker/progress/memory guard และปิดท้ายด้วย Regex Playground ซึ่งต้องเน้น cancellation และ large-input handling

ก่อน implement ควรล็อก design decisions ต่อไปนี้: ชื่อ route และ metadata ID, ขนาด input limit, algorithm ที่รองรับ, การใช้ Worker, copy/download behavior, sample data และ wording ของ security warnings หลัง implement ให้เพิ่ม E2E อย่างน้อย workflow ละ 1 ชุดบน desktop และ mobile โดยตรวจ empty, valid, error, result, copy/download, route unmount และการไม่สร้าง network request จาก input

## References

[1]: https://github.com/aodxx/Personal-Utility-Hub "Personal Utility Hub repository"
[2]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum "W3C WAI — Understanding WCAG 2.2 Success Criterion 1.4.3"
[3]: https://jwt.io/ "jwt.io — JSON Web Tokens Debugger"
