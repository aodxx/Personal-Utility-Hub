# Phase 8: Audio Reliability Recovery

**สถานะ:** Complete; production verified on GitHub Pages
**ขอบเขต:** การถอดรหัสไฟล์เสียงจริง, ความปลอดภัยด้านหน่วยความจำ, DSP artifact reduction, output contracts และการทดสอบบน browser profiles  
**ผู้จัดทำ:** Manus AI  
**วันที่:** 17 สิงหาคม 2026

## บทสรุปผู้บริหาร

Phase 8 เปลี่ยน Audio Suite จากการพึ่งพา fixture แบบสังเคราะห์และการโหลดไฟล์โดยตรง ไปสู่ decoder layer กลางที่ตรวจสอบไฟล์, จำกัดความเสี่ยงด้านหน่วยความจำ, ถอดรหัสเป็น PCM ภายในอุปกรณ์ และรายงานข้อผิดพลาดที่ผู้ใช้เข้าใจได้ [1] การประมวลผลยังคงเป็น **local-first 100%** ไม่มี backend, remote decoder หรือ cloud transcoding [1] [2]

Regression ที่พบใน Audio Chapter Marker ไม่ได้เกิดจาก WAV fixture เสีย แต่เกิดจากการเริ่มโหลด `<audio>` พร้อมกับการถอดรหัส Blob เดียวกันในช่วงเวลาเดียวกันบน headless Chromium การแก้ไขคือถอด media-element load ออกจาก critical path และกำหนด `src` หลัง `decodeAudioFile` สำเร็จ [3] หลังแก้ไข การทดสอบ Chapter Marker แบบแยกผ่าน และชุด Audio E2E ทั้งหมดผ่าน 42/42 เคสบน desktop, Android และ Pixel 7-class profiles [4]

## Reliability contract ที่ปิดแล้ว

| พื้นที่ | Contract สุดท้าย | หลักฐาน |
|---|---|---|
| Decoder | ตรวจ extension/MIME, จำกัดไฟล์ไม่เกิน 80 MB, จำกัด duration ไม่เกิน 30 นาที และป้องกัน decoded PCM เกิน 160 MB | [1] |
| Codec | รองรับ WAV, MP3, M4A/AAC, OGG และ WebM เมื่อ browser profile นั้นรองรับ native `decodeAudioData` | [1] [2] |
| Error handling | แสดง error ที่ actionable และแนะนำ WAV หรือ MP3 เมื่อ browser ถอดรหัสไม่ได้ โดยไม่อ้างว่ารองรับ universal | [1] [2] |
| DSP | ใช้ linear gain, overlap crossfade สำหรับ merge และ window/RMS silence removal เพื่อลด click/pop artifacts | [5] |
| Output | Audio Trimmer, Finisher, Merger และ Speed/Pitch ส่งออก WAV PCM 16-bit พร้อม duration, channels, sample rate และ byte size | [6] |
| Chapter Marker | decode ก่อนจึงเปิด playback และเพิ่ม marker/export cue sheet เป็น JSON, CSV หรือ TXT ได้ | [3] |
| Privacy | ไฟล์ไม่ถูกอัปโหลด และการ decode/process ทำบนอุปกรณ์ | [1] [2] |

> **Policy:** คำว่า “supported” ในเอกสารนี้หมายถึงผ่านใน browser profile ที่ทดสอบเท่านั้น ไม่ใช่คำรับรอง browser ทุกชนิดหรือทุกระบบปฏิบัติการ [2]

## ผลการทดสอบ codec corpus

Corpus จริงประกอบด้วย WAV PCM, MP3, M4A/AAC, OGG Vorbis และ WebM/Opus ซึ่งสร้างไว้ใน `tests/fixtures/audio/` และตรวจด้วย capability runner [2] ผลการทดสอบ local Chromium ผ่านครบทั้ง decode, playback hint และ play attempt สำหรับ Desktop Chromium, Android Chromium และ Pixel 7-class profiles รวม 15/15 profile-input combinations [2]

| Profile | WAV | MP3 | M4A | OGG | WebM |
|---|---:|---:|---:|---:|---:|
| Desktop Chromium | ผ่าน | ผ่าน | ผ่าน | ผ่าน | ผ่าน |
| Android Chromium | ผ่าน | ผ่าน | ผ่าน | ผ่าน | ผ่าน |
| Pixel 7 class | ผ่าน | ผ่าน | ผ่าน | ผ่าน | ผ่าน |

ผลดังกล่าวเป็น evidence ของ Chromium profiles ที่รันจริง ไม่ใช่การรับประกัน Safari, Firefox หรือ embedded WebView ที่มี codec policy แตกต่างกัน การสื่อสารใน UI จึงใช้คำว่า browser-dependent และแสดง fallback ที่ชัดเจน [2]

## ผลการทดสอบ Audio tools

ชุด E2E `tests/e2e/audio-tools.spec.ts` ผ่าน **42/42 tests** หลังแก้ Chapter Marker regression ครอบคลุม flow upload/decode/process/preview/export/download, real-media corpus, mobile viewport และ production contract checks [4]

| Workflow | ผลลัพธ์ | Output contract |
|---|---:|---|
| Audio Trimmer | ผ่าน | WAV PCM 16-bit พร้อม metadata และ RIFF/WAVE signature |
| Audio Finisher | ผ่าน | WAV พร้อม normalize/gain/fade และ peak/clipping metrics |
| Audio Merger | ผ่าน | WAV พร้อม gap/crossfade และ playlist order |
| Audio Speed & Pitch | ผ่าน | WAV จาก local resampling |
| Audio Resampler (WAV) | ผ่าน | ชื่อสอดคล้องกับ implementation; output เป็น WAV |
| Audio Chapter Marker | ผ่านหลัง lifecycle fix | JSON/CSV/TXT cue sheet พร้อม marker timing |

Unit tests ด้าน DSP และ decoder ผ่านทั้งหมดใน local suite รวมถึงการทดสอบ cancellation, memory guard, invalid file, fade/crossfade และ output header [1] [5] [7]

## Product naming และ status policy

ชื่อ **Audio Compressor Pro** ถูกเปลี่ยนเป็น **Audio Resampler (WAV)** เพราะ implementation เป็นการลด sample rate และสร้าง WAV ไม่ใช่ compressor แบบ dynamic-range และไม่ควรสื่อว่าเป็น lossless compression [6] หมวดผลิตภัณฑ์ถูกปรับจาก “Audio & Video” เป็น **Audio** ให้ตรงกับขอบเขตจริง [8]

จากหลักฐาน Phase 8 เครื่องมือเสียงทั้งหกตัวคงสถานะ **active** ได้ เนื่องจากมี local processing, output contract, real-media corpus coverage และ E2E workflow ครบตามขอบเขตที่ประกาศไว้ ไม่มีเครื่องมือใดควรถูกติดป้าย beta เพียงเพราะ native codec support เป็น browser-dependent; ข้อจำกัดดังกล่าวถูกสื่อสารตรงไปตรงมาและมี fallback แล้ว [2] อย่างไรก็ตาม สถานะ active ไม่ควรตีความว่า codec support เป็นสากลทุก browser หรือว่า output lossy input จะถูกคืนเป็น lossless source เดิม

## Quality gate และ production verification

| Gate | ผลล่าสุด |
|---|---:|
| `npm run typecheck` | ผ่าน |
| `npm run build` | ผ่าน |
| `npm run check:bundle` | ผ่าน; entry gzip 35.0 KB, all JavaScript gzip 981.8 KB / 38 chunks |
| `npm run test` | ผ่าน 16 files / 69 tests |
| `npx playwright test` | ผ่าน 119/129; skipped 10 ตาม profile contract |
| `npm audit --omit=dev --audit-level=high` | ผ่าน; 0 vulnerabilities |
| Phase 8 production smoke บน GitHub Pages | ผ่าน 60/60 checks หลัง deploy commit `8d5a695` |

Production smoke ผ่าน 60/60 checks บน viewport 360×740, Pixel-7-class และ desktop โดยใช้ corpus จริงทุก format, Audio Trimmer export/download WAV, Audio Resampler naming, Chapter Marker ready state และ horizontal-overflow contract [9] การตรวจพบ false negative ครั้งแรกใน WAV เพราะ harness อ่านสถานะก่อน asynchronous decode เสร็จ จึงแก้ harness ให้รอ `#trim-editor` จน visible แล้วรันซ้ำผ่านครบ 60/60; ไม่ใช่ product failure [9]

## Known limitations และ release policy

Native browser decoding ยังขึ้นกับ browser/OS codec policy ดังนั้น M4A, OGG และ WebM ต้องใช้ข้อความ “browser-dependent” และไม่ควรแสดงคำว่า “รองรับทุก browser” [2] การประมวลผลไฟล์ใหญ่ถูก guard ด้วย file-size, duration และ estimated decoded PCM limits เพื่อป้องกัน browser memory exhaustion แต่ข้อจำกัดนี้หมายความว่าไฟล์ยาวมากอาจต้องตัดหรือแปลงภายนอกก่อน

ผลลัพธ์ที่ส่งออกจากเครื่องมือที่ decode เป็น PCM แล้ว encode ใหม่เป็น WAV ไม่ควรถูกเรียกว่า **lossless** ในความหมายว่าเหมือน source bit-for-bit เพราะการ resample, gain, fade, trim หรือ re-encode เปลี่ยน sample data ได้ ชื่อและคำอธิบายสุดท้ายจึงระบุ format จริงและไม่ใช้ claim ที่เกิน implementation [6]

## References

[1]: ../src/core/audio-decoder.ts "Shared local audio decoder and memory guards"
[2]: ./audio-codec-capability-matrix.md "Audio Codec Capability Matrix"
[3]: ../src/tools/audio-chapter-marker/index.ts "Audio Chapter Marker lifecycle"
[4]: ../tests/e2e/audio-tools.spec.ts "Audio production contract and real-media E2E tests"
[5]: ../src/core/audio-processing.ts "Audio DSP processing algorithms"
[6]: ../src/tools/audio-trimmer/index.ts "Audio output contract and WAV export"
[7]: ../tests/audio-processing.test.ts "Audio processing unit tests"
[8]: ../src/data/categories.ts "Product category definitions"
[9]: ../scripts/phase8-production-smoke.mjs "Phase 8 GitHub Pages production smoke runner"
