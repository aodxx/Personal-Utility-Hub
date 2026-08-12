import { MAX_PDF_BYTES, validatePdfFile } from '../../core/file-processing';
import { SUPPORTED_IMAGE_TYPES, loadImageBitmap } from '../../core/image-processing';
import { inspectPdfAsync, sha256Async } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let operationId = 0;
let activeJob: AbortController | undefined;

function addMetadataRow(list: HTMLElement, label: string, value: string): void {
  const row = document.createElement('div');
  const term = document.createElement('dt');
  const detail = document.createElement('dd');
  term.textContent = label;
  detail.textContent = value;
  row.append(term, detail);
  list.append(row);
}

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '[data-metadata-action="cancel"]').hidden = !running;
}

const handleFileChange = async (event: Event): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#metadata-status');
  const list = requiredElement<HTMLElement>(panel, '#metadata-list');
  const result = requiredElement<HTMLElement>(panel, '#metadata-result');
  const request = ++operationId;
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  list.replaceChildren();
  result.hidden = true;
  try {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) throw new Error('กรุณาเลือกไฟล์');
    if (file.size <= 0) throw new Error('ไม่รองรับไฟล์ว่างเปล่า');
    if (file.size > MAX_PDF_BYTES) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 40 MB');
    setRunning(true);
    const rows: Array<[string, string]> = [
      ['ชื่อไฟล์', file.name],
      ['ชนิด MIME', file.type || 'ไม่ระบุ'],
      ['ขนาด', `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`],
      ['แก้ไขล่าสุด', file.lastModified ? new Date(file.lastModified).toLocaleString('th-TH') : 'ไม่ระบุ'],
      ['SHA-256', await sha256Async(file, {
        signal: controller.signal,
        onProgress: (progress, message) => setProgressStatus(status, progress * 0.6, message),
      })],
    ];

    if (SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      const bitmap = await loadImageBitmap(file);
      rows.push(['ขนาดรูปภาพ', `${bitmap.width} × ${bitmap.height} px`], ['จำนวนพิกเซล', (bitmap.width * bitmap.height).toLocaleString()]);
      bitmap.close();
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      validatePdfFile(file);
      const info = await inspectPdfAsync(file, {
        signal: controller.signal,
        onProgress: (progress, message) => setProgressStatus(status, 60 + progress * 0.4, message),
      });
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
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการตรวจไฟล์แล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-metadata-action="cancel"]')) activeJob?.abort();
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
      <div class="tool-actions"><button class="button" type="button" data-metadata-action="cancel" hidden>ยกเลิกการตรวจ</button></div>
      <section id="metadata-result" class="metadata-result" hidden><h3>ข้อมูลที่อ่านได้</h3><dl id="metadata-list" class="metadata-list"></dl></section>
      <output id="metadata-status" class="tool-status" aria-live="polite">พร้อมอ่านข้อมูลทั่วไป, SHA-256 และข้อมูลเฉพาะของรูปภาพ/PDF</output>`;
    requiredElement<HTMLInputElement>(panel, '#metadata-file').addEventListener('change', handleFileInput);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#metadata-file')?.removeEventListener('change', handleFileInput);
    panel?.removeEventListener('click', handleClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
