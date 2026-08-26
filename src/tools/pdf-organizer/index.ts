import { inspectPdf, organizePdf, parsePageOrder } from '../../core/pdf-processing';
import { parsePageSelection, validatePdfFile } from '../../core/file-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let outputUrl = '';
let outputName = '';
let pageCount = 0;

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputName = '';
  const result = panel?.querySelector<HTMLElement>('#pdf-organizer-result');
  if (result) result.hidden = true;
}

function setBusy(busy: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#pdf-organizer-submit').disabled = busy;
  requiredElement<HTMLInputElement>(panel, '#pdf-organizer-file').disabled = busy;
}

const handleFile = async (event: Event): Promise<void> => {
  if (!panel) return;
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  const status = requiredElement<HTMLOutputElement>(panel, '#pdf-organizer-status');
  clearOutput();
  try {
    if (!file) throw new Error('กรุณาเลือกไฟล์ PDF');
    validatePdfFile(file);
    const info = await inspectPdf(file);
    sourceFile = file;
    pageCount = info.pageCount;
    requiredElement<HTMLElement>(panel, '#pdf-organizer-file-meta').textContent = `${file.name} · ${pageCount} หน้า · ${formatBytes(file.size)}`;
    requiredElement<HTMLInputElement>(panel, '#pdf-organizer-order').value = Array.from({ length: pageCount }, (_, index) => index + 1).join(',');
    setToolStatus(status, `พร้อมจัดการ PDF ${pageCount} หน้า / PDF ready`, 'success');
  } catch (error) {
    sourceFile = undefined;
    pageCount = 0;
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#pdf-organizer-status');
  clearOutput();
  try {
    if (!sourceFile || !pageCount) throw new Error('กรุณาเลือกไฟล์ PDF ก่อนเริ่มจัดการ');
    setBusy(true);
    const deleteText = requiredElement<HTMLInputElement>(panel, '#pdf-organizer-delete').value.trim();
    const deleted = deleteText ? new Set(parsePageSelection(deleteText, pageCount)) : new Set<number>();
    const requested = parsePageOrder(requiredElement<HTMLInputElement>(panel, '#pdf-organizer-order').value, pageCount);
    const order = requested.filter((index) => !deleted.has(index));
    if (!order.length) throw new Error('ต้องเหลืออย่างน้อยหนึ่งหน้า');
    const rotation = Number(requiredElement<HTMLSelectElement>(panel, '#pdf-organizer-rotation').value);
    const rotations: Record<number, number> = {};
    order.forEach((index) => { rotations[index] = rotation; });
    const result = await organizePdf(sourceFile, {
      order,
      rotations,
      addPageNumbers: requiredElement<HTMLInputElement>(panel, '#pdf-organizer-numbers').checked,
      watermark: requiredElement<HTMLInputElement>(panel, '#pdf-organizer-watermark').value,
    });
    outputUrl = URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: 'application/pdf' }));
    outputName = sourceFile.name.replace(/\.pdf$/i, '') + '-organized.pdf';
    requiredElement<HTMLElement>(panel, '#pdf-organizer-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#pdf-organizer-result-meta').textContent = `${result.pageCount} หน้า · ${formatBytes(result.bytes.byteLength)}`;
    setToolStatus(status, 'จัดการ PDF สำเร็จ ตรวจผลลัพธ์แล้วดาวน์โหลดได้ / PDF organized', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  } finally {
    setBusy(false);
  }
};

const handleClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-pdf-organizer-action="download"]') && outputUrl) downloadUrl(outputUrl, outputName);
};

const handleSubmitEvent = (event: SubmitEvent): void => void handleSubmit(event);
const handleFileEvent = (event: Event): void => void handleFile(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">PDF workflow · Local processing</p><h2>จัดการหน้า PDF</h2><p class="helper-text">ลบ จัดเรียง หมุน ใส่เลขหน้า และใส่ลายน้ำ โดยไม่อัปโหลดเอกสาร</p></div><span class="privacy-badge">Local-only</span></div>
      <form id="pdf-organizer-form" class="tool-form">
        <label class="file-drop" for="pdf-organizer-file"><strong>เลือกไฟล์ PDF / Choose a PDF</strong><span id="pdf-organizer-file-meta">รองรับไม่เกิน 200 หน้า</span><input id="pdf-organizer-file" type="file" accept="application/pdf,.pdf" required /></label>
        <div class="form-row"><label class="field" for="pdf-organizer-order"><span>ลำดับหน้าผลลัพธ์ / Page order</span><input id="pdf-organizer-order" type="text" placeholder="เช่น 3,1,2" /></label><label class="field" for="pdf-organizer-delete"><span>หน้าที่ต้องการลบ / Delete pages</span><input id="pdf-organizer-delete" type="text" placeholder="เช่น 4-5" /></label></div>
        <div class="form-row"><label class="field" for="pdf-organizer-rotation"><span>หมุนหน้าทั้งหมด / Rotate all</span><select id="pdf-organizer-rotation"><option value="0">ไม่หมุน / None</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><label class="field" for="pdf-organizer-watermark"><span>ลายน้ำ / Watermark</span><input id="pdf-organizer-watermark" type="text" maxlength="80" placeholder="เอกสารภายใน" /></label></div>
        <label class="checkbox-row"><input id="pdf-organizer-numbers" type="checkbox" checked /> <span>ใส่เลขหน้าผลลัพธ์ / Add page numbers</span></label>
        <div class="tool-actions"><button id="pdf-organizer-submit" class="button button--primary" type="submit">จัดการ PDF / Organize PDF</button></div>
      </form>
      <section id="pdf-organizer-result" class="result-card" hidden><strong>ผลลัพธ์ / Result</strong><p id="pdf-organizer-result-meta"></p><button class="button" type="button" data-pdf-organizer-action="download">ดาวน์โหลด PDF / Download</button></section>
      <output id="pdf-organizer-status" class="tool-status" aria-live="polite">ไฟล์จะถูกประมวลผลภายในอุปกรณ์ / Your PDF stays on this device</output>`;
    const file = requiredElement<HTMLInputElement>(panel, '#pdf-organizer-file');
    const form = requiredElement<HTMLFormElement>(panel, '#pdf-organizer-form');
    file.addEventListener('change', handleFileEvent);
    form.addEventListener('submit', handleSubmitEvent);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    panel?.querySelector<HTMLInputElement>('#pdf-organizer-file')?.removeEventListener('change', handleFileEvent);
    panel?.querySelector<HTMLFormElement>('#pdf-organizer-form')?.removeEventListener('submit', handleSubmitEvent);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    pageCount = 0;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
