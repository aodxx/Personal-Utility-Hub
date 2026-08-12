import { MAX_BATCH_BYTES, MAX_BATCH_IMAGES, bytesToPdfBlob, replaceFileExtension, validateFileBatch } from '../../core/file-processing';
import { SUPPORTED_IMAGE_TYPES, validateImageFile } from '../../core/image-processing';
import { imagesToPdfAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let selectedFiles: File[] = [];
let outputUrl = '';
let operationId = 0;
let activeJob: AbortController | undefined;

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#images-pdf-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-images-pdf-action="cancel"]').hidden = !running;
}

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  const result = panel?.querySelector<HTMLElement>('#images-pdf-result');
  if (result) result.hidden = true;
}

const handleFileChange = (event: Event): void => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#images-pdf-status');
  operationId += 1;
  activeJob?.abort();
  activeJob = undefined;
  clearOutput();
  try {
    const files = Array.from((event.currentTarget as HTMLInputElement).files ?? []);
    validateFileBatch(files, { maxFiles: MAX_BATCH_IMAGES, maxBytes: MAX_BATCH_BYTES, acceptedTypes: SUPPORTED_IMAGE_TYPES, label: 'รูปภาพ' });
    files.forEach(validateImageFile);
    selectedFiles = files;
    requiredElement<HTMLElement>(panel, '#images-pdf-file-meta').textContent = `${files.length} รูป · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))} · เรียงตามลำดับที่เลือก`;
    setToolStatus(status, 'เลือกรูปภาพแล้ว กดสร้าง PDF เมื่อพร้อม', 'success');
  } catch (error) {
    selectedFiles = [];
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const request = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#images-pdf-status');
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (!selectedFiles.length) throw new Error('กรุณาเลือกรูปภาพก่อนสร้าง PDF');
    const files = [...selectedFiles];
    setRunning(true);
    const result = await imagesToPdfAsync(files, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, message),
    });
    const blob = bytesToPdfBlob(result.bytes);
    if (!panel || request !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    requiredElement<HTMLElement>(panel, '#images-pdf-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#images-pdf-result-meta').textContent = `${files.length} หน้า · ${formatBytes(blob.size)}`;
    setToolStatus(status, 'สร้าง PDF สำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการสร้าง PDF แล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-images-pdf-action]')?.dataset.imagesPdfAction;
  if (action === 'download' && outputUrl) {
    downloadUrl(outputUrl, replaceFileExtension(selectedFiles[0]?.name ?? 'images', '-combined', 'pdf'));
  }
  if (action === 'cancel') activeJob?.abort();
};

const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">A4 PDF</p><h2>รวมรูปภาพเป็น PDF</h2></div></div>
      <form id="images-pdf-form" class="tool-form">
        <label class="file-drop" for="images-pdf-files"><strong>เลือกรูปภาพหลายไฟล์</strong><span id="images-pdf-file-meta">PNG, JPEG หรือ WebP · สูงสุด 20 รูป / รวม 40 MB</span><input id="images-pdf-files" type="file" accept="image/png,image/jpeg,image/webp" multiple required /></label>
        <p class="helper-text">แต่ละรูปจะเป็นหนึ่งหน้า A4 และปรับแนวตั้ง/แนวนอนให้อัตโนมัติ ลำดับหน้าเป็นลำดับไฟล์ที่เลือก</p>
        <div class="tool-actions"><button id="images-pdf-submit" class="button button--primary" type="submit">สร้าง PDF</button><button class="button" type="button" data-images-pdf-action="cancel" hidden>ยกเลิก</button></div>
      </form>
      <section id="images-pdf-result" class="download-result" hidden><div><strong>PDF พร้อมดาวน์โหลด</strong><p id="images-pdf-result-meta"></p></div><button class="button" type="button" data-images-pdf-action="download">ดาวน์โหลด PDF</button></section>
      <output id="images-pdf-status" class="tool-status" aria-live="polite">รูปภาพจะถูกฝังลง PDF ภายในอุปกรณ์</output>`;
    requiredElement<HTMLInputElement>(panel, '#images-pdf-files').addEventListener('change', handleFileChange);
    requiredElement<HTMLFormElement>(panel, '#images-pdf-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#images-pdf-files')?.removeEventListener('change', handleFileChange);
    panel?.querySelector<HTMLFormElement>('#images-pdf-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    selectedFiles = [];
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
