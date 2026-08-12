import { replaceFileExtension, validatePdfFile } from '../../core/file-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let pageCount = 0;
let outputUrl = '';
let outputName = '';
let operationId = 0;

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputName = '';
  const result = panel?.querySelector<HTMLElement>('#pdf-image-result');
  if (result) result.hidden = true;
  panel?.querySelector<HTMLImageElement>('#pdf-image-preview')?.removeAttribute('src');
}

const handleFileChange = async (event: Event): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#pdf-image-status');
  const request = ++operationId;
  sourceFile = undefined;
  pageCount = 0;
  clearOutput();
  try {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) throw new Error('กรุณาเลือกไฟล์ PDF');
    validatePdfFile(file);
    setToolStatus(status, 'กำลังอ่าน PDF…', 'working');
    const { getPdfPageCount } = await import('../../core/pdf-rendering');
    const pages = await getPdfPageCount(file);
    if (!panel || request !== operationId) return;
    sourceFile = file;
    pageCount = pages;
    const pageInput = requiredElement<HTMLInputElement>(panel, '#pdf-image-page');
    pageInput.max = String(pages);
    pageInput.value = '1';
    requiredElement<HTMLElement>(panel, '#pdf-image-file-meta').textContent = `${file.name} · ${pages} หน้า · ${formatBytes(file.size)}`;
    setToolStatus(status, 'อ่าน PDF สำเร็จ เลือกหน้าและความละเอียด', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const request = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#pdf-image-status');
  try {
    if (!sourceFile || !pageCount) throw new Error('กรุณาเลือก PDF ก่อนแปลงเป็นรูป');
    const file = sourceFile;
    const pageNumber = Number(requiredElement<HTMLInputElement>(panel, '#pdf-image-page').value);
    const scale = Number(requiredElement<HTMLSelectElement>(panel, '#pdf-image-scale').value);
    const type = requiredElement<HTMLSelectElement>(panel, '#pdf-image-type').value as 'image/png' | 'image/jpeg';
    setToolStatus(status, `กำลังเรนเดอร์หน้า ${pageNumber} ในอุปกรณ์…`, 'working');
    const { renderPdfPage } = await import('../../core/pdf-rendering');
    const result = await renderPdfPage(file, pageNumber, scale, type);
    if (!panel || request !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(result.blob);
    const extension = type === 'image/png' ? 'png' : 'jpg';
    outputName = replaceFileExtension(file.name, `-page-${pageNumber}`, extension);
    const preview = requiredElement<HTMLImageElement>(panel, '#pdf-image-preview');
    preview.src = outputUrl;
    preview.alt = `หน้า ${pageNumber} จาก PDF`;
    requiredElement<HTMLElement>(panel, '#pdf-image-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#pdf-image-result-meta').textContent = `หน้า ${pageNumber}/${result.pageCount} · ${result.width} × ${result.height} px · ${formatBytes(result.blob.size)}`;
    setToolStatus(status, 'แปลงหน้า PDF เป็นรูปภาพสำเร็จ', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-pdf-image-action="download"]') && outputUrl) downloadUrl(outputUrl, outputName);
};

const handleFileInput = (event: Event): void => void handleFileChange(event);
const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">PDF.js rendering</p><h2>แปลงหน้า PDF เป็นรูปภาพ</h2></div></div>
      <form id="pdf-image-form" class="tool-form">
        <label class="file-drop" for="pdf-image-file"><strong>เลือก PDF หนึ่งไฟล์</strong><span id="pdf-image-file-meta">ไม่เกิน 40 MB / 200 หน้า</span><input id="pdf-image-file" type="file" accept="application/pdf,.pdf" required /></label>
        <div class="form-row">
          <label class="field" for="pdf-image-page"><span>หมายเลขหน้า</span><input id="pdf-image-page" type="number" min="1" value="1" required /></label>
          <label class="field" for="pdf-image-scale"><span>ความละเอียด</span><select id="pdf-image-scale"><option value="1">มาตรฐาน 1×</option><option value="1.5" selected>คมชัด 1.5×</option><option value="2">สูง 2×</option></select></label>
        </div>
        <label class="field" for="pdf-image-type"><span>รูปแบบผลลัพธ์</span><select id="pdf-image-type"><option value="image/png" selected>PNG</option><option value="image/jpeg">JPEG</option></select></label>
        <button class="button button--primary" type="submit">แปลงหน้านี้เป็นรูป</button>
      </form>
      <section id="pdf-image-result" class="image-result" hidden><img id="pdf-image-preview" alt="รูปภาพจาก PDF" /><div><strong>รูปภาพผลลัพธ์</strong><p id="pdf-image-result-meta"></p><button class="button" type="button" data-pdf-image-action="download">ดาวน์โหลดรูปภาพ</button></div></section>
      <output id="pdf-image-status" class="tool-status" aria-live="polite">PDF จะถูกเรนเดอร์ภายในอุปกรณ์ด้วย PDF.js</output>`;
    requiredElement<HTMLInputElement>(panel, '#pdf-image-file').addEventListener('change', handleFileInput);
    requiredElement<HTMLFormElement>(panel, '#pdf-image-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    panel?.querySelector<HTMLInputElement>('#pdf-image-file')?.removeEventListener('change', handleFileInput);
    panel?.querySelector<HTMLFormElement>('#pdf-image-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    pageCount = 0;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
