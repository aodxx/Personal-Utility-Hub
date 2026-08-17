import type { ToolMetadata } from '../core/tool-contract';
import type { LocalizedText, ToolGuide } from '../core/tool-guide';
import { toolCatalog } from './tools';

const text = (th: string, en: string): LocalizedText => ({ th, en });

const audioLimitations: LocalizedText[] = [
  text('ไฟล์เสียงประมวลผลเป็น WAV ตาม output ที่ระบุในหน้าเครื่องมือ; ขนาดและคุณภาพขึ้นกับการตั้งค่า', 'Audio tools export WAV according to the tool controls; size and quality depend on the selected settings.'),
  text('การประมวลผลเกิดในเบราว์เซอร์และอาจใช้หน่วยความจำมากกับไฟล์ขนาดใหญ่', 'Processing happens in the browser and may use significant memory for large files.'),
];

const audioFaq = [
  { question: text('ไฟล์ถูกส่งขึ้นเซิร์ฟเวอร์หรือไม่?', 'Are my files uploaded?'), answer: text('ไม่ ไฟล์ถูกอ่านและประมวลผลในเบราว์เซอร์ของอุปกรณ์นี้', 'No. Files are read and processed in this device browser.') },
  { question: text('ทำไมการ Export ใช้เวลานาน?', 'Why can Export take time?'), answer: text('ไฟล์เสียงถูกประมวลผลภายในอุปกรณ์ เวลาอาจขึ้นกับความยาวเสียงและประสิทธิภาพเครื่อง', 'Audio is processed on-device; time depends on duration and device performance.') },
];

function makeGuide(tool: ToolMetadata): ToolGuide {
  const isAudio = tool.category === 'เสียงและวิดีโอ';
  const sampleAvailable = ['json-formatter', 'base64', 'text-formatter', 'file-diff', 'privacy-redactor', 'csv-profiler'].includes(tool.id);
  const steps = isAudio
    ? [
      text('เลือกไฟล์เสียงที่รองรับ แล้วรอให้ Browser อ่าน duration และ waveform', 'Choose a supported audio file and wait for the browser to read its duration and waveform.'),
      text('ตั้งค่าหรือเลือกช่วงที่ต้องการ แล้วกด Preview เพื่อตรวจผลก่อน Export', 'Set the controls or range, then use Preview to inspect the result before Export.'),
      text('ตรวจ metrics และสถานะ Processing complete แล้วกด Download WAV', 'Check the metrics and Processing complete state, then choose Download WAV.'),
    ]
    : [
      text('เปิดเครื่องมือและอ่านคำอธิบาย input/output ก่อนเริ่ม', 'Open the tool and review its input/output description before starting.'),
      text('ใส่ข้อความหรือเลือกไฟล์ที่เครื่องมือรองรับ แล้วตั้งค่าที่จำเป็น', 'Enter text or choose a supported file, then set the required options.'),
      text('ตรวจผลลัพธ์และข้อความแจ้งสถานะก่อนคัดลอกหรือดาวน์โหลด', 'Review the result and status message before copying or downloading.'),
    ];
  const limitations = isAudio ? audioLimitations : [
    text('ผลลัพธ์และรูปแบบไฟล์ขึ้นกับความสามารถที่ระบุในหน้าเครื่องมือ; ไม่มีการรับประกันเกิน implementation จริง', 'Results and file formats follow the capability shown on the tool page; no behavior beyond the implementation is promised.'),
    text('การประมวลผลในเบราว์เซอร์อาจได้รับผลจากขนาด input และหน่วยความจำของอุปกรณ์', 'Browser processing can be affected by input size and available device memory.'),
  ];
  return {
    toolId: tool.id,
    overview: text(`${tool.description} ข้อมูลหลักถูกประมวลผลภายในอุปกรณ์`, `${tool.description} Core processing happens on this device.`),
    useCases: [
      text(`เหมาะสำหรับงาน ${tool.title} ที่ต้องการผลลัพธ์ทันทีโดยไม่ส่งไฟล์ไปยังบริการภายนอก`, `Useful for ${tool.title} workflows where you want an immediate result without sending files to an external service.`),
    ],
    supportedInputs: text(tool.requiresFile ? 'ไฟล์ตามชนิดและขนาดที่ระบุในหน้าเครื่องมือ' : 'ข้อความหรือข้อมูลที่ใส่ในช่องของเครื่องมือ', tool.requiresFile ? 'The file types and size limits shown on the tool page.' : 'Text or data entered into the tool fields.'),
    outputs: text('ผลลัพธ์ที่แสดงในหน้าเครื่องมือและไฟล์ดาวน์โหลดตาม format ที่ระบุจริง', 'The result shown in the tool and a download in the format actually stated on the page.'),
    steps,
    limitations,
    privacy: text('ไฟล์หรือข้อมูลหลักถูกประมวลผลใน Browser ของคุณ และไม่มีการอัปโหลดไปยัง Personal Utility Hub server ตามสถาปัตยกรรมปัจจุบัน', 'Primary files or data are processed in your browser and are not uploaded to the Personal Utility Hub server under the current architecture.'),
    faq: isAudio ? audioFaq : [
      { question: text('ข้อมูลของฉันถูกส่งออกจากอุปกรณ์หรือไม่?', 'Does my data leave this device?'), answer: text('เครื่องมือออกแบบให้ประมวลผลใน Browser และไม่ใช้ Backend สำหรับเก็บไฟล์ผู้ใช้', 'The tool is designed to process in the browser and does not use a backend to store user files.') },
      { question: text('ถ้าผลลัพธ์ไม่ถูกต้องควรทำอย่างไร?', 'What should I do if the result is unexpected?'), answer: text('ตรวจชนิด input, ตัวเลือก และข้อจำกัดในคู่มือนี้ แล้วลองล้างข้อมูลหรือเริ่มใหม่', 'Review the input type, options, and limitations in this guide, then clear the tool or start again.') },
    ],
    tips: [
      text('เริ่มจาก input ขนาดเล็กเพื่อทำความเข้าใจ workflow ก่อนใช้ไฟล์จริง', 'Start with a small input to understand the workflow before using important files.'),
    ],
    sampleAvailable,
  };
}

export const toolGuides: readonly ToolGuide[] = toolCatalog.map(makeGuide);

export function getToolGuide(toolId: string): ToolGuide | undefined {
  return toolGuides.find((guide) => guide.toolId === toolId);
}
