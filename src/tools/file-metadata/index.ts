import { MAX_PDF_BYTES, validatePdfFile } from '../../core/file-processing';
import { SUPPORTED_IMAGE_TYPES, loadImageBitmap } from '../../core/image-processing';
import { inspectPdf } from '../../core/pdf-processing';
import type { ToolModule } from '../../core/tool-contract';
import { formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let operationId = 0;

function addMetadataRow(list: HTMLElement, label: string, value: string): void {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const detail = document.createElement('dd');
  term.textContent = label;
  detail.textContent = value;
  row.append(term, detail);
  list.append(row);
}

async function sha256(file: File): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const handleFileChange = async (event: Event): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#metadata-status');
  const list = requiredElement<HTMLElement>(panel, '#metadata-list');
  const result = requiredElement<HTMLElement>(panel, '#metadata-result');
  const request = ++operationId;
  list.replaceChildren();
  result.hidden = true;
  try {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) throw new Error('กรุณาเลือกไฟล์');
    if (file.size <= 0) throw new Error('ไม่รองรับไฟล์ว่างเปล่า');
    if (file.size > MAX_PDF_BYTES) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 40 MB');
    setToolStatus(status, 'กำลังอ่าน Metadata และคำนวณ SHA-256…', 'working');
    const rows: Array<[string, string]> = [
      ['ชื่อไฟล์', file.name],
      ['ชนิด MIME', file.type || 'ไม่ระบุ'],
      ['ขนาด', `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`],
      ['แก้ไขล่าสุด', file.lastModified ? new Date(file.lastModified).toLocaleString('th-TH') : 'ไม่ระบุ'],
      ['SHA-256', await sha256(file)],
    ];

    if (SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      const bitmap = await loadImageBitmap(file);
      rows.push(['ขนาดรูปภาพ', `${bitmap.width} × ${bitmap.height} px`], ['จำนวนพิกเซล', (bitmap.width * bitmap.height).toLocaleString()]);
      bitmap.close();
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      validatePdfFile(file);
      const info = await inspectPdf(file);
      rows.push(['จำนวนหน้า', `${info.pageCount} หน้า`]);
      if (info.title) rows.push(['ชื่อเรื่อง PDF', info.title]);
      if (info.author) rows.push(['ผู้เขียน PDF', info.author]);
      if (info.subject) rows.push(['หัวเรื่อง PDF', info.subject]);
      if (info.creator) rows.push(['โปรแกรมผู้สร้าง', info.creator]);
      if (info.producer) rows.push(['PDF Producer', info.producer]);
    }

    if (!panel || request !== operationId) return;
    rows.forEach(([label, value]) => addMetadataRow(list, label, value));
    result.hidden = false;
    setToolStatus(status, 'อ่านข้อมูลไฟล์สำเร็จ ไม่มีข้อมูลใดถูกส่งออกจากอุปกรณ์', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleFileInput = (event: Event): void => void handleFileChange(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Local inspection</p><h2>ดูข้อมูล Metadata ของไฟล์</h2></div></div>
      <label class="file-drop" for="metadata-file"><strong>เลือกไฟล์ที่ต้องการตรวจ</strong><span>ไฟล์ทั่วไป รูปภาพ หรือ PDF · ไม่เกิน 40 MB</span><input id="metadata-file" type="file" /></label>
      <section id="metadata-result" class="metadata-result" hidden><h3>ข้อมูลที่อ่านได้</h3><dl id="metadata-list" class="metadata-list"></dl></section>
      <output id="metadata-status" class="tool-status" aria-live="polite">พร้อมอ่านข้อมูลทั่วไป, SHA-256 และข้อมูลเฉพาะของรูปภาพ/PDF</output>`;
    requiredElement<HTMLInputElement>(panel, '#metadata-file').addEventListener('change', handleFileInput);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    panel?.querySelector<HTMLInputElement>('#metadata-file')?.removeEventListener('change', handleFileInput);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
