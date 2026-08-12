import {
  canvasToBlob,
  extensionForType,
  loadImageBitmap,
  proportionalHeight,
  renderBitmap,
  validateDimensions,
  validateImageFile,
  type Dimensions,
  type SupportedImageType,
} from '../../core/image-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let sourceDimensions: Dimensions | undefined;
let outputUrl = '';
let outputFilename = '';
let operationId = 0;

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputFilename = '';
  if (!panel) return;
  const preview = panel.querySelector<HTMLElement>('#resize-result');
  if (preview) preview.hidden = true;
  const image = panel.querySelector<HTMLImageElement>('#resize-preview');
  if (image) image.removeAttribute('src');
}

const handleFileChange = async (event: Event): Promise<void> => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#resize-status');
  const currentOperation = ++operationId;
  try {
    sourceFile = undefined;
    sourceDimensions = undefined;
    clearOutput();
    validateImageFile(file);
    setToolStatus(status, 'กำลังอ่านขนาดรูปภาพ…', 'working');
    const bitmap = await loadImageBitmap(file);
    if (!panel || currentOperation !== operationId) {
      bitmap.close();
      return;
    }
    sourceDimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    sourceFile = file;
    clearOutput();
    requiredElement<HTMLInputElement>(panel, '#resize-width').value = String(sourceDimensions.width);
    requiredElement<HTMLInputElement>(panel, '#resize-height').value = String(sourceDimensions.height);
    requiredElement<HTMLElement>(panel, '#resize-file-meta').textContent = `${file.name} · ${sourceDimensions.width} × ${sourceDimensions.height} px · ${formatBytes(file.size)}`;
    setToolStatus(status, 'เลือกรูปภาพแล้ว ปรับขนาดเป้าหมายและกดเริ่มทำงาน', 'success');
  } catch (error) {
    sourceFile = undefined;
    sourceDimensions = undefined;
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleWidthInput = (): void => {
  if (!panel || !sourceDimensions || !requiredElement<HTMLInputElement>(panel, '#resize-lock-ratio').checked) return;
  const width = Number(requiredElement<HTMLInputElement>(panel, '#resize-width').value);
  if (Number.isFinite(width) && width > 0) {
    requiredElement<HTMLInputElement>(panel, '#resize-height').value = String(proportionalHeight(sourceDimensions, Math.round(width)));
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const currentOperation = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#resize-status');
  try {
    if (!sourceFile) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่มปรับขนาด');
    const file = sourceFile;
    const width = Math.round(Number(requiredElement<HTMLInputElement>(panel, '#resize-width').value));
    const height = Math.round(Number(requiredElement<HTMLInputElement>(panel, '#resize-height').value));
    validateDimensions({ width, height });
    setToolStatus(status, 'กำลังปรับขนาดรูปภาพในเบราว์เซอร์…', 'working');
    const bitmap = await loadImageBitmap(file);
    let blob: Blob;
    try {
      const canvas = renderBitmap(bitmap, { width, height });
      blob = await canvasToBlob(canvas, file.type as SupportedImageType, 0.92);
    } finally {
      bitmap.close();
    }
    if (!panel || currentOperation !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    const extension = extensionForType(file.type as SupportedImageType);
    outputFilename = `${file.name.replace(/\.[^.]+$/, '')}-${width}x${height}.${extension}`;
    const preview = requiredElement<HTMLImageElement>(panel, '#resize-preview');
    preview.src = outputUrl;
    preview.alt = `รูปผลลัพธ์ขนาด ${width} × ${height} พิกเซล`;
    requiredElement<HTMLElement>(panel, '#resize-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#resize-result-meta').textContent = `${width} × ${height} px · ${formatBytes(blob.size)}`;
    setToolStatus(status, 'ปรับขนาดสำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-resize-action]');
  if (!button || !panel) return;
  if (button.dataset.resizeAction === 'download' && outputUrl) downloadUrl(outputUrl, outputFilename);
};

const handleFileInput = (event: Event): void => void handleFileChange(event);
const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Canvas processing</p><h2>ปรับขนาดรูปภาพ</h2></div></div>
      <form id="resize-form" class="tool-form">
        <label class="file-drop" for="resize-file"><strong>เลือกรูปภาพ</strong><span id="resize-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span>
          <input id="resize-file" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <div class="dimension-grid">
          <label class="field" for="resize-width"><span>ความกว้าง (px)</span><input id="resize-width" type="number" min="1" max="12000" required /></label>
          <label class="field" for="resize-height"><span>ความสูง (px)</span><input id="resize-height" type="number" min="1" max="12000" required /></label>
        </div>
        <label class="check-field"><input id="resize-lock-ratio" type="checkbox" checked /> รักษาอัตราส่วนเมื่อเปลี่ยนความกว้าง</label>
        <button class="button button--primary" type="submit">ปรับขนาดรูปภาพ</button>
      </form>
      <section id="resize-result" class="image-result" hidden>
        <img id="resize-preview" alt="รูปภาพผลลัพธ์" />
        <div><strong>ไฟล์ผลลัพธ์</strong><p id="resize-result-meta"></p><button class="button" type="button" data-resize-action="download">ดาวน์โหลดรูปภาพ</button></div>
      </section>
      <output id="resize-status" class="tool-status" aria-live="polite">ไฟล์จะถูกประมวลผลด้วย Canvas ภายในอุปกรณ์</output>
    `;
    requiredElement<HTMLInputElement>(panel, '#resize-file').addEventListener('change', handleFileInput);
    requiredElement<HTMLInputElement>(panel, '#resize-width').addEventListener('input', handleWidthInput);
    requiredElement<HTMLFormElement>(panel, '#resize-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    panel?.querySelector<HTMLInputElement>('#resize-file')?.removeEventListener('change', handleFileInput);
    panel?.querySelector<HTMLInputElement>('#resize-width')?.removeEventListener('input', handleWidthInput);
    panel?.querySelector<HTMLFormElement>('#resize-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    sourceDimensions = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
