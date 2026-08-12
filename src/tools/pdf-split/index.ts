import { bytesToPdfBlob, replaceFileExtension, validatePdfFile } from '../../core/file-processing';
import { inspectPdfAsync, splitPdfAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let pageCount = 0;
let outputUrl = '';
let operationId = 0;
let activeJob: AbortController | undefined;

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#split-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-split-action="cancel"]').hidden = !running;
}

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  const result = panel?.querySelector<HTMLElement>('#split-result');
  if (result) result.hidden = true;
}

const handleFileChange = async (event: Event): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#split-status');
  const request = ++operationId;
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  sourceFile = undefined;
  pageCount = 0;
  clearOutput();
  try {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) throw new Error('กรุณาเลือกไฟล์ PDF');
    validatePdfFile(file);
    setRunning(true);
    const info = await inspectPdfAsync(file, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, message),
    });
    if (!panel || request !== operationId) return;
    sourceFile = file;
    pageCount = info.pageCount;
    const pages = requiredElement<HTMLInputElement>(panel, '#split-pages');
    pages.placeholder = `เช่น 1-3,5 (ทั้งหมด ${pageCount} หน้า)`;
    pages.maxLength = Math.max(20, String(pageCount).length * pageCount);
    requiredElement<HTMLElement>(panel, '#split-file-meta').textContent = `${file.name} · ${pageCount} หน้า · ${formatBytes(file.size)}`;
    setToolStatus(status, 'อ่าน PDF สำเร็จ ระบุหน้าที่ต้องการแล้วกดแยกไฟล์', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการอ่าน PDF แล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const request = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#split-status');
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (!sourceFile || !pageCount) throw new Error('กรุณาเลือก PDF ก่อนแยกหน้า');
    const file = sourceFile;
    const selection = requiredElement<HTMLInputElement>(panel, '#split-pages').value;
    setRunning(true);
    const result = await splitPdfAsync(file, selection, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, message),
    });
    const blob = bytesToPdfBlob(result.bytes);
    if (!panel || request !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    requiredElement<HTMLElement>(panel, '#split-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#split-result-meta').textContent = `${result.selectedPages.length} หน้า จากทั้งหมด ${result.totalPages} หน้า · ${formatBytes(blob.size)}`;
    setToolStatus(status, 'แยก PDF สำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการแยก PDF แล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-split-action]')?.dataset.splitAction;
  if (action === 'download' && outputUrl && sourceFile) {
    downloadUrl(outputUrl, replaceFileExtension(sourceFile.name, '-selected-pages', 'pdf'));
  }
  if (action === 'cancel') activeJob?.abort();
};

const handleFileInput = (event: Event): void => void handleFileChange(event);
const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Extract pages</p><h2>แยกหน้าจาก PDF</h2></div></div>
      <form id="split-form" class="tool-form">
        <label class="file-drop" for="split-file"><strong>เลือก PDF หนึ่งไฟล์</strong><span id="split-file-meta">ไม่เกิน 40 MB / 200 หน้า</span><input id="split-file" type="file" accept="application/pdf,.pdf" required /></label>
        <label class="field" for="split-pages"><span>หน้าที่ต้องการ</span><input id="split-pages" inputmode="numeric" placeholder="เช่น 1-3,5" required /></label>
        <p class="helper-text">ใช้จุลภาคคั่นแต่ละหน้า และขีดกลางสำหรับช่วงหน้า ผลลัพธ์จะเป็น PDF เดียวที่มีเฉพาะหน้าที่เลือก</p>
        <div class="tool-actions"><button id="split-submit" class="button button--primary" type="submit">แยก PDF</button><button class="button" type="button" data-split-action="cancel" hidden>ยกเลิก</button></div>
      </form>
      <section id="split-result" class="download-result" hidden><div><strong>PDF ที่แยกแล้ว</strong><p id="split-result-meta"></p></div><button class="button" type="button" data-split-action="download">ดาวน์โหลด PDF</button></section>
      <output id="split-status" class="tool-status" aria-live="polite">เอกสารจะไม่ออกจากอุปกรณ์</output>`;
    requiredElement<HTMLInputElement>(panel, '#split-file').addEventListener('change', handleFileInput);
    requiredElement<HTMLFormElement>(panel, '#split-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#split-file')?.removeEventListener('change', handleFileInput);
    panel?.querySelector<HTMLFormElement>('#split-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    pageCount = 0;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
