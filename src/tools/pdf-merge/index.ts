import { MAX_BATCH_BYTES, MAX_PDF_FILES, PDF_MIME_TYPE, bytesToPdfBlob, replaceFileExtension, validateFileBatch } from '../../core/file-processing';
import { mergePdfsAsync } from '../../core/processing-client';
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
  requiredElement<HTMLButtonElement>(panel, '#merge-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-merge-action="cancel"]').hidden = !running;
}

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  const result = panel?.querySelector<HTMLElement>('#merge-result');
  if (result) result.hidden = true;
}

const handleFileChange = (event: Event): void => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#merge-status');
  operationId += 1;
  activeJob?.abort();
  activeJob = undefined;
  clearOutput();
  try {
    const files = Array.from((event.currentTarget as HTMLInputElement).files ?? []);
    validateFileBatch(files, { maxFiles: MAX_PDF_FILES, maxBytes: MAX_BATCH_BYTES, acceptedTypes: [PDF_MIME_TYPE], label: 'ไฟล์ PDF' });
    selectedFiles = files;
    requiredElement<HTMLElement>(panel, '#merge-file-meta').textContent = `${files.length} ไฟล์ · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))} · รวมตามลำดับที่เลือก`;
    setToolStatus(status, 'เลือก PDF แล้ว กดรวมไฟล์เมื่อพร้อม', 'success');
  } catch (error) {
    selectedFiles = [];
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const request = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#merge-status');
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (selectedFiles.length < 2) throw new Error('กรุณาเลือก PDF อย่างน้อย 2 ไฟล์');
    const files = [...selectedFiles];
    setRunning(true);
    const result = await mergePdfsAsync(files, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, message),
    });
    const blob = bytesToPdfBlob(result.bytes);
    if (!panel || request !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    requiredElement<HTMLElement>(panel, '#merge-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#merge-result-meta').textContent = `${result.pageCount} หน้า · ${formatBytes(blob.size)}`;
    setToolStatus(status, 'รวม PDF สำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการรวม PDF แล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-merge-action]')?.dataset.mergeAction;
  if (action === 'download' && outputUrl) {
    downloadUrl(outputUrl, replaceFileExtension(selectedFiles[0]?.name ?? 'documents', '-merged', 'pdf'));
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
      <div class="utility-panel__header"><div><p class="eyebrow">Combine documents</p><h2>รวมไฟล์ PDF</h2></div></div>
      <form id="merge-form" class="tool-form">
        <label class="file-drop" for="merge-files"><strong>เลือก PDF อย่างน้อย 2 ไฟล์</strong><span id="merge-file-meta">สูงสุด 10 ไฟล์ / รวม 40 MB / ไม่เกิน 200 หน้า</span><input id="merge-files" type="file" accept="application/pdf,.pdf" multiple required /></label>
        <p class="helper-text">หน้าทั้งหมดจะถูกต่อกันตามลำดับไฟล์ที่เลือก PDF ที่ล็อกรหัสผ่านไม่รองรับ</p>
        <div class="tool-actions"><button id="merge-submit" class="button button--primary" type="submit">รวม PDF</button><button class="button" type="button" data-merge-action="cancel" hidden>ยกเลิก</button></div>
      </form>
      <section id="merge-result" class="download-result" hidden><div><strong>PDF ที่รวมแล้ว</strong><p id="merge-result-meta"></p></div><button class="button" type="button" data-merge-action="download">ดาวน์โหลด PDF</button></section>
      <output id="merge-status" class="tool-status" aria-live="polite">เอกสารจะถูกประมวลผลภายในอุปกรณ์</output>`;
    requiredElement<HTMLInputElement>(panel, '#merge-files').addEventListener('change', handleFileChange);
    requiredElement<HTMLFormElement>(panel, '#merge-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#merge-files')?.removeEventListener('change', handleFileChange);
    panel?.querySelector<HTMLFormElement>('#merge-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    selectedFiles = [];
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
