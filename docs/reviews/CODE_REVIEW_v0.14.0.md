# Code Review — v0.14.0 Group 2 Audio Usability & Security Foundation

**วันที่:** 27 สิงหาคม 2026
**Scope:** shared audio workbench, Audio Chapter Marker, Audio Trimmer, regression tests, release metadata และเอกสารมาตรฐาน Group 2/3
**Reviewer:** Manus AI
**Repository:** `aodxx/Personal-Utility-Hub`

## Executive summary

การเปลี่ยนแปลงนี้เป็น implementation slice แรกของการยกระดับเครื่องมือกลุ่ม 2 โดยเริ่มจากส่วนที่ใช้ร่วมกันมากที่สุดใน Audio Tool Suite แก้ dynamic rendering ที่รับข้อมูลจากผู้ใช้, เพิ่ม accessible marker controls, ทำให้ Audio Merger MP3 mapping ตรงกับ core type และเพิ่ม regression tests สำหรับ hostile filename/marker text

ไม่เพิ่ม backend, telemetry, cloud upload หรือ persistent storage สำหรับเนื้อหา audio การประมวลผลยังอยู่ใน browser memory ผ่าน processing client/worker และ object URLs ถูกจัดการตาม lifecycle เดิม

## Changes reviewed

| Area | Review result |
|---|---|
| Shared audio file list | เปลี่ยนจาก `innerHTML` ที่แทรก filename เป็น DOM nodes และ `textContent` |
| Chapter Marker rows | เปลี่ยน marker rendering เป็น DOM nodes, `textContent`, และ accessible labels |
| Audio Merger format | UI/core/type รองรับ `wav`, `wav-compact` และ `mp3` สอดคล้องกัน |
| Tests | เพิ่ม hostile filename/marker regression และคง real-media/audio contract tests |
| Release contract | package/lock เป็น `0.14.0`; Service Worker namespace เป็น `v0.14.0-group2` |
| Documentation | อัปเดต README, PROGRESS, TEST_REPORT, docs index และ Group 2/3 roadmap |

## Security and privacy findings

ก่อน patch, shared audio workbench ใช้ `item.file.name` ใน dynamic `innerHTML` และ Chapter Marker ใช้ marker title/note ใน dynamic `innerHTML` การแก้ไขเปลี่ยนค่าทั้งสองจุดเป็น DOM property/text content จึงไม่เปิดให้ filename หรือ marker content ถูกตีความเป็น markup

การทดสอบ regression ใช้ค่าที่มี `<img ...>` และตรวจทั้งค่าที่ผู้ใช้เห็น/ถืออยู่ใน input และจำนวน `img` element ต้องเป็นศูนย์ การทดสอบผ่านบน Desktop Chromium, Android entry และ Android current

ขอบเขต privacy ยังคงเดิม: ไม่ upload file/content, ไม่เก็บ audio ใน LocalStorage/IndexedDB, ไม่เพิ่ม external processing และยังคง revoke object URLs/abort active processing เมื่อเปลี่ยนงานหรือ unmount

## Usability review

การแก้รอบนี้ลดความเสี่ยงและเพิ่มความชัดเจน แต่ยังไม่ถือว่าแก้ pain point กลุ่ม 2 ครบทั้งหมด งานที่ยังเหลือคือ waveform draggable handles, timecode keyboard nudging, audio presets, A/B preview, transition preview ใน merger, guided workflow สำหรับ map tools และ wizard/checklist สำหรับ LINE Sticker Studio ตาม roadmap [1]

Accessible labels ของ Chapter Marker ครอบคลุม seek, title, note และ remove แต่การควบคุมตำแหน่ง marker ยังต้องพึ่ง audio player/scrubber และยังไม่มี waveform zoom หรือ duplicate-marker warning จึงจัดเป็น incremental hardening ไม่ใช่ full UX redesign

## Validation evidence

| Gate | Result |
|---|---|
| `npm run typecheck` | ผ่าน |
| `npm test -- --run` | ผ่าน |
| Targeted audio E2E | `51/51` ผ่าน |
| Full Playwright | `285 passed`, `18 skipped` จาก `303` cases |
| `npm run build` | ผ่าน |
| Bundle | Entry gzip `60.2 KB`; largest lazy chunk `366.1 KB`; JavaScript gzip `1311.9 KB` จาก `64` chunks |
| Registry | `48` metadata modules ผ่าน |
| SVG library | `120` assets, duplicate `0`, warnings `0` |
| `npm audit --audit-level=high` | `0 vulnerabilities` |
| Service Worker syntax | ผ่าน |
| `git diff --check` | ผ่าน |

## Residual risks and follow-up

การประมวลผล audio ยังคงใช้ memory ตามขนาด decoded PCM และรองรับ codec ตาม browser capability; target-size ของ WAV เป็นค่าประมาณ; Audio Finisher เป็น peak-based; Speed & Pitch ยังเป็น resampling ไม่ใช่ independent time-stretch ความเสี่ยงเหล่านี้เป็นข้อจำกัดที่ UI ต้องสื่อสารต่อไป ไม่ควรแก้ด้วยการเปลี่ยนคำโฆษณาโดยไม่มี algorithm/test corpus รองรับ

ขั้นตอนถัดไปควรทำตามลำดับ: shared preview/progress/recovery primitives, Audio Chapter Marker waveform/timecode UX, Audio Trimmer draggable selection, audio presets/A-B preview และจึงค่อยขยายไป Community Mapping, Land Measurement และ LINE Sticker Studio

## References

[1]: ../reports/GROUP2_DEEP_ANALYSIS_AND_GROUP3_ROADMAP_v0.13.md "Group 2 deep analysis and Group 3 roadmap"
[2]: ../../src/tools/audio-workbench.ts "Shared audio workbench implementation"
[3]: ../../src/tools/audio-chapter-marker/index.ts "Audio Chapter Marker implementation"
[4]: ../../tests/e2e/audio-tools.spec.ts "Audio E2E and security regression coverage"
