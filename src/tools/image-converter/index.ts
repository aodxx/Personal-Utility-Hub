import {
  canvasToBlob,
  extensionForType,
  loadImageBitmap,
  renderBitmap,
  validateImageFile,
  type SupportedImageType,
} from '../../core/image-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let outputUrl = '';
let outputFilename = '';
let operationId = 0;

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputFilename = '';
  if (!panel) return;
  const result = panel.querySelector<HTMLElement>('#convert-result');
  if (result) result.hidden = true;
  panel.querySelector<HTMLImageElement>('#convert-preview')?.removeAttribute('src');
}

const handleFileChange = (event: Event): void => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#convert-status');
  operationId += 1;
  try {
    validateImageFile(file);
    sourceFile = file;
    clearOutput();
    requiredElement<HTMLElement>(panel, '#convert-file-meta').textContent = `${file.name} · ${formatBytes(file.size)}`;
    setToolStatus(status, 'เลือกรูปภาพแล้ว เลือกรูปแบบปลายทางและกดแปลงไฟล์', 'success');
  } catch (error) {
    sourceFile = undefined;
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleQualityInput = (event: Event): void => {
  if (!panel) return;
  const input = event.currentTarget as HTMLInputElement;
  requiredElement<HTMLOutputElement>(panel, '#convert-quality-value').textContent = `${input.value}%`;
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const currentOperation = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#convert-status');
  try {
    if (!sourceFile) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่มแปลงไฟล์');
    const file = sourceFile;
    const type = requiredElement<HTMLSelectElement>(panel, '#convert-type').value as SupportedImageType;
    const quality = Number(requiredElement<HTMLInputElement>(panel, '#convert-quality').value) / 100;
    setToolStatus(status, 'กำลังแปลงรูปภาพในเบราว์เซอร์…', 'working');
    const bitmap = await loadImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    let blob: Blob;
    try {
      const canvas = renderBitmap(bitmap, dimensions, type === 'image/jpeg' ? '#ffffff' : undefined);
      blob = await canvasToBlob(canvas, type, quality);
    } finally {
      bitmap.close();
    }
    if (!panel || currentOperation !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    const extension = extensionForType(type);
    outputFilename = `${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
    const preview = requiredElement<HTMLImageElement>(panel, '#convert-preview');
    preview.src = outputUrl;
    preview.alt = `รูปภาพที่แปลงเป็น ${extension.toUpperCase()} แล้ว`;
    requiredElement<HTMLElement>(panel, '#convert-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#convert-result-meta').textContent = `${extension.toUpperCase()} · ${dimensions.width} × ${dimensions.height} px · ${formatBytes(blob.size)}`;
    setToolStatus(status, 'แปลงรูปภาพสำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-convert-action]');
  if (button?.dataset.convertAction === 'download' && outputUrl) downloadUrl(outputUrl, outputFilename);
};

const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">PNG · JPEG · WebP</p><h2>แปลงรูปแบบรูปภาพ</h2></div></div>
      <form id="convert-form" class="tool-form">
        <label class="file-drop" for="convert-file"><strong>เลือกรูปภาพ</strong><span id="convert-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span>
          <input id="convert-file" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <div class="form-row">
          <label class="field" for="convert-type"><span>รูปแบบปลายทาง</span><select id="convert-type"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp" selected>WebP</option></select></label>
          <label class="field" for="convert-quality"><span>คุณภาพ <output id="convert-quality-value">92%</output></span><input id="convert-quality" type="range" min="40" max="100" value="92" /></label>
        </div>
        <button class="button button--primary" type="submit">แปลงรูปภาพ</button>
      </form>
      <section id="convert-result" class="image-result" hidden>
        <img id="convert-preview" alt="รูปภาพผลลัพธ์" />
        <div><strong>ไฟล์ผลลัพธ์</strong><p id="convert-result-meta"></p><button class="button" type="button" data-convert-action="download">ดาวน์โหลดรูปภาพ</button></div>
      </section>
      <output id="convert-status" class="tool-status" aria-live="polite">ไฟล์จะถูกแปลงด้วย Canvas ภายในอุปกรณ์</output>
    `;
    requiredElement<HTMLInputElement>(panel, '#convert-file').addEventListener('change', handleFileChange);
    requiredElement<HTMLInputElement>(panel, '#convert-quality').addEventListener('input', handleQualityInput);
    requiredElement<HTMLFormElement>(panel, '#convert-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    panel?.querySelector<HTMLInputElement>('#convert-file')?.removeEventListener('change', handleFileChange);
    panel?.querySelector<HTMLInputElement>('#convert-quality')?.removeEventListener('input', handleQualityInput);
    panel?.querySelector<HTMLFormElement>('#convert-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
