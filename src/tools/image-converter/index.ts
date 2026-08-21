import {
  extensionForType,
  validateImageFile,
  type SupportedImageType,
} from '../../core/image-processing';
import { processImageAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let outputUrl = '';
let outputFilename = '';
let operationId = 0;
let activeJob: AbortController | undefined;

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#convert-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-convert-action="cancel"]').hidden = !running;
}

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
  activeJob?.abort();
  activeJob = undefined;
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

const handleTypeInput = (event: Event): void => {
  if (!panel) return;
  const type = (event.currentTarget as HTMLSelectElement).value;
  const qualityField = requiredElement<HTMLElement>(panel, '#convert-quality-field');
  qualityField.hidden = type === 'image/png';
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const currentOperation = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#convert-status');
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (!sourceFile) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่มแปลงไฟล์');
    const file = sourceFile;
    const type = requiredElement<HTMLSelectElement>(panel, '#convert-type').value as SupportedImageType;
    const quality = Number(requiredElement<HTMLInputElement>(panel, '#convert-quality').value) / 100;
    setRunning(true);
    const result = await processImageAsync(file, { type, quality, background: type === 'image/jpeg' ? '#ffffff' : undefined }, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, message),
    });
    const { blob } = result;
    const dimensions = { width: result.width, height: result.height };
    if (!panel || currentOperation !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    const extension = extensionForType(type);
    outputFilename = `${file.name.replace(/\.[^.]+$/, '')}.${extension}`;
    const preview = requiredElement<HTMLImageElement>(panel, '#convert-preview');
    preview.src = outputUrl;
    preview.alt = `รูปภาพที่แปลงเป็น ${extension.toUpperCase()} แล้ว`;
    requiredElement<HTMLElement>(panel, '#convert-result').hidden = false;
    const grew = blob.size > file.size;
    const change = Math.round(Math.abs((blob.size - file.size) / Math.max(1, file.size)) * 100);
    requiredElement<HTMLElement>(panel, '#convert-result-meta').textContent = `${extension.toUpperCase()} · ${dimensions.width} × ${dimensions.height} px · ${formatBytes(blob.size)} · ${grew ? `ใหญ่ขึ้น ${change}% — แนะนำใช้ไฟล์เดิม` : `เล็กลง ${change}%`}`;
    setToolStatus(status, grew ? 'ผลลัพธ์ใหญ่กว่าไฟล์เดิม กรุณาพิจารณาใช้ไฟล์เดิม / Output is larger; consider keeping the original' : 'แปลงรูปภาพสำเร็จ ไฟล์พร้อมดาวน์โหลด / Conversion complete', grew ? 'warning' : 'success');
  } catch (error) {
    if (!panel || currentOperation !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการแปลงรูปภาพแล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-convert-action]');
  if (button?.dataset.convertAction === 'download' && outputUrl) downloadUrl(outputUrl, outputFilename);
  if (button?.dataset.convertAction === 'cancel') activeJob?.abort();
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
          <label id="convert-quality-field" class="field" for="convert-quality"><span>คุณภาพ <output id="convert-quality-value">92%</output></span><input id="convert-quality" type="range" min="40" max="100" value="92" /></label>
        </div>
        <div class="tool-actions"><button id="convert-submit" class="button button--primary" type="submit">แปลงรูปภาพ</button><button class="button" type="button" data-convert-action="cancel" hidden>ยกเลิก</button></div>
      </form>
      <section id="convert-result" class="image-result" hidden>
        <img id="convert-preview" alt="รูปภาพผลลัพธ์" />
        <div><strong>ไฟล์ผลลัพธ์</strong><p id="convert-result-meta"></p><button class="button" type="button" data-convert-action="download">ดาวน์โหลดรูปภาพ</button></div>
      </section>
      <output id="convert-status" class="tool-status" aria-live="polite">ไฟล์จะถูกแปลงด้วย Canvas ภายในอุปกรณ์</output>
    `;
    requiredElement<HTMLInputElement>(panel, '#convert-file').addEventListener('change', handleFileChange);
    requiredElement<HTMLInputElement>(panel, '#convert-quality').addEventListener('input', handleQualityInput);
    requiredElement<HTMLSelectElement>(panel, '#convert-type').addEventListener('change', handleTypeInput);
    handleTypeInput({ currentTarget: requiredElement<HTMLSelectElement>(panel, '#convert-type') } as unknown as Event);
    requiredElement<HTMLFormElement>(panel, '#convert-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#convert-file')?.removeEventListener('change', handleFileChange);
    panel?.querySelector<HTMLInputElement>('#convert-quality')?.removeEventListener('input', handleQualityInput);
    panel?.querySelector<HTMLSelectElement>('#convert-type')?.removeEventListener('change', handleTypeInput);
    panel?.querySelector<HTMLFormElement>('#convert-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
