# วิเคราะห์กลุ่ม 2 และแผนพัฒนากลุ่ม 3

**วันที่:** 27 สิงหาคม 2026
**ขอบเขต:** กลุ่ม 2 จำนวน 9 เครื่องมือ และกลุ่ม 3 จำนวน 36 เครื่องมือใน Personal Utility Hub v0.13.0
**ผู้จัดทำ:** Manus AI

## บทสรุปผู้บริหาร

เครื่องมือกลุ่ม 2 ไม่ได้ถูกจัดกลุ่มเพราะ “ทำงานไม่ได้” แต่เพราะผู้ใช้ต้องแบกรับ **ภาระทางความคิด (cognitive load)** สูงกว่าคุณค่าที่ได้รับใน workflow แรก โดยเฉพาะ audio tools ที่ใช้ศัพท์เฉพาะและมีหลายพารามิเตอร์, Community Mapping และ Land Measurement ที่เป็น map-first applications, และ LINE Sticker Studio ที่มีขั้นตอนต่อเนื่องจำนวนมาก การแก้ควรเริ่มจาก guided workflow, preset, preview, recovery และ feedback ก่อนเพิ่มความสามารถใหม่

เครื่องมือกลุ่ม 3 มีฐานที่เหมาะกับการลงทุนต่อ แต่ไม่ควรพัฒนาทุกตัวพร้อมกัน แผนนี้จึงแบ่งเป็นสาม wave โดยให้ความสำคัญกับงานที่มี **ผู้ใช้กว้าง, ลดความผิดพลาด, เพิ่มความปลอดภัย/privacy, ใช้ core ร่วมได้ และ effort ไม่สูงเกินไป** ก่อน งานทุก wave ต้องคง local-only processing, ไม่เพิ่ม telemetry ของเนื้อหาผู้ใช้, รักษา lazy loading, module contract, accessibility และ regression gates

## 1. วิธีวิเคราะห์และเกณฑ์จัดลำดับ

การวิเคราะห์ใช้หลักฐานจาก metadata, registry, guides, source modules, shared audio workbench, unit tests และ Playwright E2E ใน repository [1] [2] [3] การผ่าน E2E หมายถึง workflow ที่ทดสอบทำงานได้ ไม่ได้แปลว่า workflow นั้นเหมาะกับผู้ใช้ใหม่ทั้งหมด ตัวอย่างเช่น audio E2E ยืนยัน upload → process → result → download แต่ยังไม่ได้วัดว่าผู้ใช้เลือกค่า parameter ได้ถูกต้องโดยไม่อ่านเอกสาร [4]

| มิติ | คำถาม | คะแนนที่ใช้ใน roadmap |
|---|---|---:|
| Impact | ถ้าปรับแล้วจะช่วยผู้ใช้จำนวนมากหรือป้องกันความผิดพลาดสำคัญหรือไม่ | 1–5 |
| Usability gain | ลดจำนวนขั้นตอน/ศัพท์เฉพาะ/ความไม่แน่นอนได้มากเพียงใด | 1–5 |
| Effort | ต้องแก้ core, worker, file pipeline หรือ browser capability มากเพียงใด | 1–5 โดยคะแนนสูงคือยาก |
| Risk | มีความเสี่ยงด้าน privacy, output correctness, compatibility หรือ data loss หรือไม่ | 1–5 |
| Reuse | ใช้ shared component/core กับหลายเครื่องมือได้หรือไม่ | 1–5 |

ลำดับความสำคัญในเอกสารนี้เป็น product/engineering priority ไม่ใช่การคาดการณ์จาก telemetry เพราะ Hub ไม่เก็บพฤติกรรมหรือเนื้อหาของผู้ใช้โดยอัตโนมัติ คำว่า **P0 ใน roadmap** หมายถึงงานที่ควรทำก่อน feature ใหม่ของเครื่องมือนั้น ไม่ได้เปลี่ยน release tier ของเครื่องมือ

## 2. ภาพรวม pain points ของกลุ่ม 2

| กลุ่มย่อย | เครื่องมือ | สาเหตุร่วม |
|---|---|---|
| Audio editing/processing | `audio-chapter-marker`, `audio-compressor`, `audio-finisher`, `audio-merger`, `audio-speed-pitch`, `audio-trimmer` | ต้องเข้าใจ waveform, codec, sample rate, gain, peak, loudness, crossfade หรือ semitones; preview และ preset ยังไม่ช่วยตัดสินใจมากพอ |
| Spatial fieldwork | `community-mapping`, `land-measurement` | แผนที่เป็นพื้นที่ทำงานหลัก มีโหมดวาด/ชั้นข้อมูล/หน่วย/พิกัด/permission หลายแนวคิด และมีความเสี่ยงจากการวางจุดผิด |
| Asset production workflow | `line-sticker-studio` | มี upload, split, edit, review, prompt handoff และ export อยู่ในเครื่องมือเดียว ผู้ใช้ใหม่ต้องเข้าใจลำดับงานและข้อจำกัดของ platform พร้อมกัน |

มีประเด็นด้าน security ที่ต้องแก้ควบคู่กับ usability: shared audio workbench นำ `file.name` ไปประกอบใน `innerHTML` และ Audio Chapter Marker นำ marker title/note ไปประกอบใน `innerHTML` โดย escape เพียงเครื่องหมายคำพูดบางส่วน [5] [6] ควรเปลี่ยนเป็น DOM node + `textContent` ก่อนเพิ่ม feature อื่น เพราะ filename และ marker เป็นข้อมูลที่ผู้ใช้ควบคุมได้

## 3. วิเคราะห์เชิงลึกเครื่องมือกลุ่ม 2

### 3.1 `audio-chapter-marker` — ทำ Chapter ให้เสียง / Cue Sheet

**จุดที่ทำให้ใช้งานยาก:** ผู้ใช้ต้องเลือกไฟล์ก่อน, รอ decode/ตรวจ codec, กดเล่น, หยุดที่เวลาที่ต้องการ และกดเพิ่ม marker จากนั้นจึงแก้ title/note แบบ inline การวาง marker ที่แม่นยำทำได้ยากเพราะ UI หลักเป็น audio player กับ scrubber ไม่ใช่ waveform ที่เห็น transient หรือช่วงเสียงได้โดยตรง ผู้ใช้ยังต้องตัดสินใจเองว่าจะตั้งชื่อ chapter อย่างไรและควรมี marker ซ้ำหรือห่างกันเท่าใด

**ปัญหาเชิง implementation ที่กระทบความไว้วางใจ:** `renderMarkers()` สร้าง HTML จาก `marker.title` และ `marker.note` จึงควรเลิกใช้ string interpolation สำหรับค่าที่ผู้ใช้แก้ไขเอง [5] การ export CSV/TXT/JSON ไม่มี validation เรื่องชื่อว่าง, marker ซ้ำ หรือ marker ที่เรียงไม่เหมาะกับเนื้อหา แม้ระบบจะ sort ตามเวลา แต่การเปลี่ยนลำดับหลังเพิ่ม marker อาจทำให้ผู้ใช้รู้สึกว่ารายการ “ย้ายเอง”

**แนวทางปรับปรุงตามลำดับ:** ระยะแรกเพิ่ม waveform overview พร้อม zoom, ปุ่ม “เพิ่ม ณ เวลา” ที่มี keyboard shortcut, timecode input แบบ `mm:ss.ms`, undo/remove ที่ชัดเจน และ empty state ที่มี sample marker ระยะถัดไปเพิ่ม chapter validation, duplicate-time warning, drag reorder ที่ยังรักษา timestamp และ preview cue sheet ก่อน export ระยะสุดท้ายเพิ่ม import/export round-trip และ templates สำหรับ podcast, lecture และ music chapters

**Definition of Done:** ผู้ใช้ใหม่สามารถเลือกไฟล์, วาง marker 3 จุด, แก้ title, preview และ export ได้โดยไม่ต้องอ่าน guide; marker list แสดงเวลาเรียงชัดเจน; ชื่อ/note ที่มี `<`, `&`, quote และ Unicode แสดงผลเป็นข้อความปลอดภัย; unmount revoke object URL และหยุด listener ครบ

### 3.2 `audio-compressor` — Audio Resampler (WAV)

**จุดที่ทำให้ใช้งานยาก:** ชื่อ “compressor” ทำให้คาดหวัง codec compression แต่ implementation เป็นการลด sample rate ของ WAV เพื่อประมาณการลดขนาด ไม่ใช่ compressor ที่ลด dynamic range และไม่ใช่การเข้ารหัส MP3 ผู้ใช้ต้องกำหนด target MB และ quality profile ทั้งที่ขนาดจริงขึ้นกับ sample rate, channels และ header จึงเป็น parameter ที่คาดการณ์ยาก

**แนวทางปรับปรุง:** เปลี่ยนชื่อ/คำอธิบายให้ชัดว่าเป็น WAV resampler หรือเพิ่ม mode ที่แยก “ลดขนาดไฟล์” กับ “ลด dynamic range” อย่างชัดเจน เพิ่ม preset `Voice`, `Music`, `Archive`, target-size preview และแสดง estimated output range ก่อนประมวลผล เพิ่ม before/after audio preview แบบ A/B และ warning เมื่อผลลัพธ์ใหญ่กว่า input หรือไม่ถึง target พร้อมคำอธิบายที่ผู้ใช้แก้ได้

**Definition of Done:** ผู้ใช้เลือก use case แทนการเดา sample rate, เห็นผลกระทบต่อ duration/channels/sample rate/size ก่อน export และระบบไม่ใช้คำว่า compression ในความหมายที่ทำให้เข้าใจผิด

### 3.3 `audio-finisher` — Audio Finisher

**จุดที่ทำให้ใช้งานยาก:** มี Gain, Normalize peak, Loudness target และ Fade in/out แต่คำว่า loudness target ใน UI เป็น peak-based ไม่ใช่ LUFS mastering ผู้ใช้ podcast/music จึงอาจนำค่าไปเทียบกับมาตรฐานที่เครื่องมือไม่ได้คำนวณให้ การมีตัวเลือกหลายตัวโดยไม่มี preset ทำให้ไม่รู้ว่าควรเริ่มจากค่าปัจจุบันหรือเปลี่ยนอะไร

**แนวทางปรับปรุง:** เพิ่ม preset `Voice safe`, `Podcast`, `Music preview` พร้อมแสดงผลลัพธ์เป็น “peak-based processing” อย่างเด่นชัด แยก metric ที่คำนวณได้จริงออกจากคำว่า loudness เพิ่ม clipping risk visualization, A/B preview และคำเตือนว่าไม่ใช่ mastering/LUFS normalization หากจะเพิ่ม LUFS ต้องทำเป็น core capability แยกและมี test vectors ไม่ควรเปลี่ยนชื่อ metric เฉย ๆ

**Definition of Done:** ทุก preset มีคำอธิบาย input/output ที่ตรวจสอบได้, warning ใช้ข้อความและ icon ไม่พึ่งสีอย่างเดียว, ผู้ใช้ฟัง source/result สลับกันได้ และผลลัพธ์ถูก revoke/cleanup เมื่อ process ใหม่หรือ unmount

### 3.4 `audio-merger` — Audio Merger Studio

**จุดที่ทำให้ใช้งานยาก:** ต้องเลือกหลายไฟล์, เข้าใจลำดับ, Gap, Crossfade และ output format พร้อมกัน รายการไฟล์มี Up/Down แต่ workflow ยังไม่ใช่ sortable queue ที่เห็นผลชัด ผู้ใช้เห็น waveform ของไฟล์แรกเป็นหลัก จึงประเมิน transition ระหว่างไฟล์ทั้งหมดได้ยาก นอกจากนี้ type contract ใน `operationFromForm()` จำกัดชนิด format เป็น WAV ใน TypeScript แม้ UI มี MP3 option และ E2E ตรวจ MP3 path แล้ว [6] ควรทำให้ type contract สะท้อน runtime จริง

**แนวทางปรับปรุง:** เพิ่ม drag-and-drop reorder, remove/duplicate, duration รวมแบบ live, per-file preview และ transition preview ระหว่างสองไฟล์ เพิ่ม preset `seamless`, `speech segments`, `music gap` และ validation ว่า crossfade ไม่เกินความยาว segment ปรับ union type ของ output format ให้ตรงกับ core/UI และแสดง codec/container ที่แท้จริงในผลลัพธ์

**Definition of Done:** ผู้ใช้รวม 3 ไฟล์ได้โดยเห็นลำดับและ duration รวมก่อน process, preview transition ได้, ยกเลิกแล้วไม่มี stale output, และ output extension/metadata/format ตรงกันทุกชั้น

### 3.5 `audio-speed-pitch` — Audio Speed & Pitch

**จุดที่ทำให้ใช้งานยาก:** UI อธิบายว่าเป็น resampling mode ซึ่ง speed และ pitch เปลี่ยนร่วมกัน ไม่ใช่ studio-grade time-stretch ผู้ใช้ทั่วไปมักคาดหวังให้เปลี่ยนความเร็วโดยคง pitch หรือเปลี่ยน pitch โดยคงความยาว แต่เครื่องมือนี้ไม่ให้ผลเช่นนั้น หากไม่อ่าน helper text จะเกิดความเข้าใจผิดสูง

**แนวทางปรับปรุง:** เปลี่ยน default interaction เป็น use-case presets เช่น `เร็วขึ้นสำหรับ lecture`, `ช้าลงสำหรับฝึกฟัง`, `เปลี่ยน key` และแสดงผล duration/pitch delta แบบ live เพิ่ม A/B preview และย้าย “independent time-stretch” ไปเป็น feature แยกเมื่อมี algorithm และ benchmark ที่เหมาะสม ไม่ควรโฆษณาความสามารถที่ core ยังไม่รองรับ

**Definition of Done:** หน้าหลักบอกชัดว่า speed/pitch เปลี่ยนร่วมกันตั้งแต่ก่อน upload, ผู้ใช้เห็น predicted duration ก่อน process และ output metadata ตรงกับค่าที่เลือก

### 3.6 `audio-trimmer` — Audio Trimmer

**จุดที่ทำให้ใช้งานยาก:** เครื่องมือนี้มี workflow สมบูรณ์กว่ากลุ่ม audio อื่น แต่ผู้ใช้ยังต้องควบคุม start/end/fade ผ่าน range และ number controls แยกกัน การเลือกช่วงจาก waveform ยังไม่ใช่ draggable handles โดยตรง และ fade settings เป็นตัวเลือกเพิ่มเติมที่ผู้ใช้ต้องรู้เอง การประมวลผลไฟล์นานต้องอ่าน progress และเข้าใจ cancel state

**แนวทางปรับปรุง:** ทำ selection handles บน waveform ที่ sync กับ numeric timecode, เพิ่ม preset `trim silence`, `intro/outro`, `clip 30 seconds`, preview เฉพาะช่วงที่เลือกแบบ loop และ keyboard nudge 0.01/0.1 วินาที เพิ่ม “ก่อน/หลัง” duration และ output size ที่อ่านง่าย พร้อม recover เมื่อ decode fail โดยไม่ล้าง input state ที่ผู้ใช้เพิ่งเลือก

**Definition of Done:** ผู้ใช้เลือกช่วงได้ทั้งเมาส์/คีย์บอร์ด/ตัวเลข, preview ตรงกับช่วงที่ export, cancel ไม่ทิ้ง source state และมี E2E ทดสอบ process ซ้ำหลัง output แล้ว

### 3.7 `community-mapping` — แผนที่ชุมชนภาคสนาม

**จุดที่ทำให้ใช้งานยาก:** เป็น application ขนาดใหญ่ในหน้าเดียว มี Map, Add, Layers, Records และ Analyze รวมกับ privacy mode, online basemap, import, backup, filters, custom schema และ geometry drawing ผู้ใช้ใหม่ไม่รู้ว่าควรเริ่มจากสร้าง layer, วาง Point หรือวาด Polygon ก่อน แม้มีข้อความแนะนำ แต่ไม่มี guided first-run/sample project ที่ทำให้เห็นผลในไม่กี่วินาที

**ความเสี่ยงที่ต้องสื่อสาร:** Offline Canvas ช่วย privacy แต่แผนที่ว่างอาจทำให้ผู้ใช้คิดว่าแอปเสีย การเปิด Online Basemap ทำให้ provider อาจเห็น viewport จึงต้องมี confirmation/notice ก่อนเปิด การกด locate ใช้ geolocation permission และควรอธิบายว่าไม่บันทึกพิกัดใดจนกว่าผู้ใช้จะสร้าง feature การ autosave ลง IndexedDB เป็นประโยชน์แต่ต้องแสดงสถานะและปุ่มล้างข้อมูลให้ผู้ใช้เข้าใจ

**แนวทางปรับปรุง:** เพิ่ม first-run wizard `สร้าง project → เลือก layer → วางจุดแรก → เพิ่ม properties → export`, sample project แบบไม่ใช่ข้อมูลจริง, undo drawing, point/line/polygon validation, visible layer/geometry legend และ confirmation ก่อน online basemap เพิ่ม “save locally” status ที่อธิบาย IndexedDB อย่างเป็นภาษาคน และทำ keyboard/mobile drawing fallback ให้ชัดเจน

**Definition of Done:** ผู้ใช้สร้างและ export project ทดลองได้ภายใน 3 นาที, แยก Offline Canvas/Online Basemap อย่างเห็นได้ชัด, permission denial มี recovery instruction และไม่มี tile request ใน default mode ตาม E2E contract [7]

### 3.8 `land-measurement` — วัดระยะและพื้นที่แปลง

**จุดที่ทำให้ใช้งานยาก:** ผู้ใช้ต้องเลือก mode distance/area/GPS, วางจุดบนแผนที่, เข้าใจหน่วยและความแม่นยำ, ใช้ fit/undo/recapture และเลือก export format ใน workflow เดียว ความผิดพลาดเพียงจุดเดียวเปลี่ยนผลลัพธ์ทั้งหมด แต่ UI ยังไม่ทำให้สถานะ “กำลังวัดอะไร” และ “ต้องวางจุดต่อหรือจบแล้ว” เด่นพอสำหรับผู้เริ่มต้น

**แนวทางปรับปรุง:** ใช้ mode-specific wizard, แสดงจำนวนจุดขั้นต่ำและ geometry preview, เพิ่ม undo จุดล่าสุด/แก้จุดด้วยพิกัด, unit presets ที่จำง่าย, accuracy notice สำหรับ GPS และ confirmation ก่อน export เพิ่ม sample parcel และ offline fallback explanation ก่อนผู้ใช้เริ่มงานจริง

**Definition of Done:** mode ปัจจุบัน, หน่วย, จำนวนจุด, ความยาว/พื้นที่ live และปุ่ม Finish/Undo อ่านได้จาก mobile viewport; การปฏิเสธ GPS ไม่ทำให้ workflow ค้าง; export มี metadata ของ mode/unit/coordinate assumptions [8]

### 3.9 `line-sticker-studio` — LINE Sticker Studio

**จุดที่ทำให้ใช้งานยาก:** เป็นเครื่องมือที่มีความสามารถมากที่สุดในกลุ่ม 2 แต่ความสามารถถูกวางเป็นลำดับ upload → split → edit → inspect → prompt → review → export ผู้ใช้ต้องเข้าใจ grid, safe margin, transparent background, per-sticker editing, validation, ZIP contents และข้อกำหนดของแพลตฟอร์มในเวลาเดียวกัน E2E แสดงว่าทำงานครบ แต่ความครอบคลุมสูงไม่ได้ลด onboarding burden [9]

การมี Prompt Studio และปุ่มเปิด ChatGPT เป็น branch ที่เพิ่ม cognitive load ผู้ใช้ต้องเลือกว่าจะสร้างภาพเอง, ใช้ภาพที่มีอยู่, copy prompt หรือส่งต่อภายนอก แม้ implementation ประกาศไม่ส่งภาพ/prompt ไปเองก็ตาม ควรเก็บเส้นแบ่งนี้ให้เด่นต่อไป

**แนวทางปรับปรุง:** เปลี่ยนเป็น wizard/checklist ที่มี progress และ “งานถัดไป” เพียงหนึ่งรายการต่อครั้ง เพิ่ม template `9/16/20 stickers`, sample pack, auto-detect grid พร้อม confidence, bulk edit, per-sticker undo, validation grouped by blocking/warning และ pre-export preview ของ ZIP เพิ่ม handoff screen ที่แยก “copy prompt” กับ “เปิดเว็บไซต์ภายนอก” และขอ action ชัดเจนก่อนเปิด external site

**Definition of Done:** ผู้ใช้ใหม่สร้างชุด static 9 ภาพจาก sample ได้โดยไม่ต้องค้นหา guide, เห็น blocking errors ก่อน export, เปิด external handoff เฉพาะหลังคลิก, ZIP มี manifest/validation report ตรงกับภาพจริง และ mobile ไม่มี horizontal overflow [9]

## 4. Roadmap กลุ่ม 3 ตามลำดับความสำคัญ

### Wave A — P0: ลดความผิดพลาดและเพิ่มคุณค่าที่ผู้ใช้เห็นทันที

เป้าหมายของ Wave A คือปรับเครื่องมือที่ใช้บ่อยหรือมี privacy/data correctness impact สูง โดยใช้ shared preview, batch, diagnostics และ export summary เป็นแกนร่วม ระยะนี้ควรทำก่อน feature ที่เพิ่มความซับซ้อนใหม่

| ลำดับ | เครื่องมือ | ความสามารถที่ควรเพิ่ม | Impact | Effort | เหตุผลที่มาก่อน |
|---:|---|---|---:|---:|---|
| 1 | `json-formatter` | error location ที่อ่านง่าย, JSON/JSONC mode แยกชัด, large-input benchmark | 5 | 2 | เป็น entry point ของงาน JSON และลด error ที่ผู้ใช้เจอบ่อย |
| 2 | `image-blur` | multi-region history, local assist สำหรับใบหน้า/วัตถุ, before/after privacy preview | 5 | 3 | ป้องกันการเปิดเผยข้อมูลส่วนตัวก่อนแชร์โดยตรง |
| 3 | `image-resizer` | batch resize, presets, aspect lock, target-size guidance และ EXIF policy | 5 | 2 | ใช้กว้างและ reuse กับ image pipeline หลายตัว |
| 4 | `image-compressor` | before/after preview, quality/target-size presets, batch queue และ output comparison | 5 | 3 | เพิ่มความมั่นใจให้ผลลัพธ์โดยไม่เปลี่ยนภารกิจหลัก |
| 5 | `pdf-organizer` | fast thumbnails, drag reorder, keyboard reorder, undo history และ selected-page summary | 5 | 3 | ลดความผิดพลาดในงานเอกสารที่ irreversible หากจัดหน้าผิด |
| 6 | `privacy-redactor` | confidence review, custom rules, redaction audit และ reversible preview | 5 | 3 | เป็น privacy utility โดยตรง ต้องทำให้ผู้ใช้ตรวจทานได้ก่อน export |
| 7 | `hash-verifier` | multi-file manifest, drag/drop comparison, algorithm presets และ copyable verification report | 4 | 2 | เพิ่มงาน batch ที่เกิดจริงและต่อยอด worker path เดิม |
| 8 | `csv-profiler` | column type inference, null/duplicate profile, delimiter preview และ report export | 4 | 2 | ทำให้ CSV tool กลายเป็น preflight step ที่นำไปใช้ต่อได้ |
| 9 | `qr-reader` | multi-code scan, explicit permission explainer, result validation และ opt-in session history | 4 | 2 | เพิ่ม reliability ของ camera/file workflow โดยไม่เก็บข้อมูลถาวร |
| 10 | `data-format-converter` | format presets, schema-aware warnings และ round-trip diff preview | 4 | 3 | ลดความเสี่ยงจาก conversion loss ก่อนใช้ output จริง |
| 11 | `json-visualizer` | focus/expand-to-match, richer path query, selected-subtree export และ graph truncation summary | 4 | 2 | ต่อยอดจาก P1 ล่าสุดและใช้ core เดิมได้ |
| 12 | `image-converter` | batch conversion, quality presets, metadata policy และ format compatibility warning | 4 | 2 | ใช้ร่วมกับ resize/compress pipeline และลดการลองผิดลองถูก |

**Acceptance gate ของ Wave A:** ทุก feature ต้องมี happy path/error path, before/after หรือ preview เมื่อ output เปลี่ยน, download/copy verification, mobile overflow test, no-storage/no-network assertion และ update guide/metadata หาก behavior เปลี่ยน

### Wave B — P1: เพิ่ม batch, interoperability และ output ที่นำไปใช้ต่อ

| ลำดับ | เครื่องมือ | ความสามารถที่ควรเพิ่ม | Impact | Effort | ผลลัพธ์ที่คาดหวัง |
|---:|---|---|---:|---:|---|
| 13 | `csv-encoding-repair` | delimiter detection, encoding confidence, preview diff และ batch repair | 4 | 2 | แก้ CSV ไทยหลายไฟล์ได้โดยตรวจผลก่อน export |
| 14 | `file-diff` | folder-aware diff, ignore rules, binary summary และ patch/report export | 4 | 3 | ใช้ตรวจ release/config changes ได้จริงขึ้น |
| 15 | `file-metadata` | privacy-risk grouping, batch inspection และ metadata report export | 4 | 2 | เปลี่ยนจาก viewer เป็น pre-share privacy check |
| 16 | `image-contact-sheet` | sort/filter, captions, layout presets และ PDF export | 3 | 2 | ทำ contact sheet สำหรับ review/archive ได้เร็วขึ้น |
| 17 | `image-crop` | aspect presets, safe-area guide, batch crop และ transparent-background preview | 3 | 2 | ลดความผิดพลาดจาก crop ที่ใช้กับ avatar/sticker |
| 18 | `image-watermark` | position presets, opacity preview, repeat/tile mode และ batch progress | 4 | 2 | ทำ batch branding ได้สม่ำเสมอและตรวจผลก่อน export |
| 19 | `images-to-pdf` | reorder UX, page-size presets, margins, quality summary และ output preview | 4 | 2 | ลดข้อผิดพลาดในการสร้างเอกสารจากภาพหลายไฟล์ |
| 20 | `json-i18n-mapper` | locale diff, missing/extra key report, placeholder validation และ patch export | 4 | 3 | ใช้เป็น localization QA workflow ได้จริง |
| 21 | `json-schema-generator` | draft selection, inferred constraints, required-field review และ schema diff | 4 | 3 | ผลลัพธ์เหมาะกับ API/test มากขึ้นโดยยังให้ผู้ใช้ตรวจทาน |
| 22 | `markdown-table-builder` | paste-from-CSV, alignment presets, malformed-row validation และ round-trip preview | 3 | 1 | ลดการจัดตารางด้วยมือและ reuse CSV parsing |
| 23 | `svg-asset-studio` | optimization profiles, attribute diff, accessibility checks และ regression preview | 4 | 3 | ต่อจาก P1 เดิมโดยเพิ่มความมั่นใจว่า optimize ไม่เปลี่ยน semantics |
| 24 | `qr-generator` | batch QR, error-correction presets, label templates และ print sheet | 4 | 2 | เพิ่ม production use โดยไม่เปลี่ยน local export boundary |

**Acceptance gate ของ Wave B:** batch operation ต้องมี queue/progress/cancel, output naming ที่ deterministic, partial-failure report และ memory/file-size guard; format interoperability ต้องมี explicit loss/warning message

### Wave C — P2: เพิ่มความลึกเฉพาะทางโดยรักษา simplicity

| ลำดับ | เครื่องมือ | ความสามารถที่ควรเพิ่ม | Impact | Effort | เงื่อนไขก่อนเริ่ม |
|---:|---|---|---:|---:|---|
| 25 | `jwt-inspector` | claim timeline, issuer/audience hints, safer redaction และ export redacted view | 4 | 2 | ต้องคงข้อความว่า decode ไม่ใช่ signature verification |
| 26 | `regex-playground` | explain mode, test-case sets และ catastrophic-backtracking warning | 4 | 3 | ต้องไม่ลด Worker timeout/DoS guard เดิม |
| 27 | `silence-remover` | threshold presets, waveform markers, preview selection และ batch processing | 3 | 3 | ต้อง benchmark main thread/worker และ preserve cancel |
| 28 | `base64` | file mode, URL-safe mode, strict validation detail และ line-wrap options | 3 | 1 | แยก binary/file output จาก text mode ให้ชัด |
| 29 | `color-contrast` | palette batch check, suggested colors และ WCAG context | 3 | 2 | ต้องสื่อว่า contrast pass ไม่ใช่ full accessibility audit |
| 30 | `flowchart-studio` | templates, import/export standard, keyboard graph editing และ validation | 3 | 3 | ต้องมี format contract และ avoid lossy round-trip ที่เงียบ |
| 31 | `json-ld-generator` | schema presets, validation hints, snippet preview และ copy-safe output | 3 | 2 | ต้องคง structured-data context และไม่อ้าง SEO guarantee |
| 32 | `pdf-merge` | reorder preview, bookmarks, large-file progress และ partial-failure handling | 4 | 3 | ต้องคุม memory และ PDF worker lifecycle |
| 33 | `pdf-split` | page-range presets, thumbnails, batch split และ naming preview | 3 | 2 | ต้อง test boundaries/rotated pages/large files |
| 34 | `pdf-to-image` | page range, quality presets, output-size estimate และ memory guidance | 4 | 3 | ต้องรักษา worker/cancel และ output-size limits |
| 35 | `text-formatter` | named presets, transform preview, keyboard shortcuts และ custom pipeline | 3 | 1 | custom pipeline ต้อง deterministic และ reversible ใน preview |
| 36 | `url-query-builder` | URL diff, array-encoding presets, import/export fixtures และ invalid URL guidance | 3 | 2 | ต้องไม่ leak URL input และต้องแสดง encoding semantics ชัด |

**Acceptance gate ของ Wave C:** feature เฉพาะทางต้องมี sample, plain-language explanation, explicit limitation, core tests และไม่เพิ่ม configuration จน first-run workflow ยาวขึ้นโดยไม่มี progressive disclosure

## 5. Cross-cutting implementation plan

### ระยะที่ 0 — ปิดช่องว่างคุณภาพก่อน feature ใหม่

สร้าง shared primitives สำหรับ `before/after preview`, `batch queue`, `progress/cancel`, `undo/reset`, `download verification`, `safe text rendering` และ `privacy boundary notice` จากนั้นเพิ่ม test helper สำหรับ no-network/no-storage และ mobile overflow การแก้ `innerHTML` ที่รับ filename/marker input ต้องอยู่ในระยะนี้

### ระยะที่ 1 — ทำ Wave A เป็น release slices

แบ่งงานเป็น slices เล็ก: JSON diagnostics, image preview/batch, PDF organizer, privacy review และ data/QR reliability แต่ละ slice ต้องมี unit, module contract และ Playwright case ของ success/error/download/mobile ก่อนรวม release ไม่ควรรวมเครื่องมือ 12 ตัวใน commit เดียว เพราะจะวิเคราะห์ regression ยาก

### ระยะที่ 2 — ทำ Wave B โดยเน้น reuse

ใช้ shared batch pipeline และ preview/report components ร่วมกับ CSV, image, QR และ document tools พร้อมวัด raw/gzip/lazy chunk ทุก slice หาก static catalog โตจน budget ถูกกระทบ ต้องลด payload หรือบันทึก budget change อย่างมีเหตุผลก่อน merge

### ระยะที่ 3 — ทำ Wave C เฉพาะเมื่อ demand ชัด

เครื่องมือใน Wave C มีคุณค่า แต่บางความสามารถต้องมี domain correctness สูง เช่น regex explanation, PDF rendering, JSON-LD hints และ audio silence detection จึงควรเริ่มหลังมี bug reports หรือ request ที่ชัดเจน และต้องมี test corpus ก่อนเพิ่ม algorithm

## 6. กติกาการตัดสินใจเลื่อน/หยุด

หากเครื่องมือกลุ่ม 3 เพิ่ม feature แล้ว workflow แรกยาวขึ้นเกินหนึ่งขั้นโดยไม่เพิ่มผลลัพธ์ที่ผู้ใช้เห็นทันที ให้ย้ายงานนั้นไปหลัง usability review หาก feature ทำให้ต้องส่งข้อมูลไป cloud, เพิ่ม telemetry, เก็บเนื้อหาใน storage หรือขอ permission ก่อน user action ให้หยุดและทำ privacy decision record ก่อน

หาก output เปลี่ยน semantics โดยผู้ใช้ตรวจไม่พบ เช่น SVG optimization, format conversion, image compression หรือ PDF reorder ต้องมี before/after preview หรือ diff ก่อน export หากงานใช้ CPU/memory สูงจน UI blocking ใกล้ limits ต้อง benchmark ก่อนเลือก Worker และต้องเพิ่ม cancellation/unmount tests ไม่ใช่เพิ่ม Worker เป็นค่าเริ่มต้นทุกกรณี

## References

[1]: ../../src/data/tools.ts "Tool registry and lazy-loading entries"
[2]: ../../src/data/guides.ts "Typed bilingual tool guides"
[3]: ../../src/core/tool-contract.ts "Tool metadata and module contract"
[4]: ../../tests/e2e/audio-tools.spec.ts "Audio production-contract and real-media E2E coverage"
[5]: ../../src/tools/audio-chapter-marker/index.ts "Audio Chapter Marker UI and marker rendering"
[6]: ../../src/tools/audio-workbench.ts "Shared audio workbench controls, processing and export"
[7]: ../../tests/e2e/community-mapping.spec.ts "Community Mapping E2E workflow and offline behavior"
[8]: ../../tests/e2e/land-measurement.spec.ts "Land Measurement E2E workflow and mobile/offline checks"
[9]: ../../tests/e2e/line-sticker-studio.spec.ts "LINE Sticker Studio workflow, handoff and export E2E"
