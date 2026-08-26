import {
  extensionForType,
  loadImageBitmap,
  normalizeRedactionRegion,
  validateRedactionOptions,
  validateImageFile,
  type Dimensions,
  type RedactionPoint,
  type RedactionRegion,
  type RedactionEffect,
  type SupportedImageType,
} from '../../core/image-processing';
import { redactImageAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let sourceDimensions: Dimensions | undefined;
let sourceUrl = '';
let outputUrl = '';
let outputFilename = '';
let selectedRegion: RedactionRegion | undefined;
let dragStart: RedactionPoint | undefined;
let dragEnd: RedactionPoint | undefined;
let dragPointerId: number | undefined;
let operationId = 0;
let activeJob: AbortController | undefined;

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#blur-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-blur-action="cancel"]').hidden = !running;
  requiredElement<HTMLInputElement>(panel, '#blur-file').disabled = running;
  requiredElement<HTMLSelectElement>(panel, '#blur-effect').disabled = running;
  requiredElement<HTMLInputElement>(panel, '#blur-strength').disabled = running;
}

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputFilename = '';
  if (!panel) return;
  const result = panel.querySelector<HTMLElement>('#blur-result');
  if (result) result.hidden = true;
  const image = panel.querySelector<HTMLImageElement>('#blur-output-preview');
  if (image) image.removeAttribute('src');
}

function clearSourcePreview(): void {
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = '';
  panel?.querySelector<HTMLImageElement>('#blur-source-preview')?.removeAttribute('src');
}

function updateSelectionVisual(): void {
  if (!panel || !sourceDimensions) return;
  const selection = panel.querySelector<HTMLElement>('#blur-selection');
  if (!selection) return;
  if (!selectedRegion) {
    selection.hidden = true;
    return;
  }
  selection.hidden = false;
  selection.style.left = `${(selectedRegion.x / sourceDimensions.width) * 100}%`;
  selection.style.top = `${(selectedRegion.y / sourceDimensions.height) * 100}%`;
  selection.style.width = `${(selectedRegion.width / sourceDimensions.width) * 100}%`;
  selection.style.height = `${(selectedRegion.height / sourceDimensions.height) * 100}%`;
  selection.setAttribute('aria-label', `กรอบเซนเซอร์ ${selectedRegion.width} × ${selectedRegion.height} พิกเซล`);
}

function setSelection(start: RedactionPoint, end: RedactionPoint): void {
  if (!sourceDimensions) return;
  selectedRegion = normalizeRedactionRegion(start, end, sourceDimensions);
  updateSelectionVisual();
  if (panel) {
    requiredElement<HTMLElement>(panel, '#blur-selection-meta').textContent = `กรอบที่เลือก ${selectedRegion.width.toLocaleString()} × ${selectedRegion.height.toLocaleString()} px`;
  }
}

function pointFromPointer(event: PointerEvent): RedactionPoint | undefined {
  if (!panel || !sourceDimensions) return undefined;
  const image = requiredElement<HTMLImageElement>(panel, '#blur-source-preview');
  const bounds = image.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return undefined;
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * sourceDimensions.width,
    y: ((event.clientY - bounds.top) / bounds.height) * sourceDimensions.height,
  };
}

const handlePointerDown = (event: PointerEvent): void => {
  const point = pointFromPointer(event);
  const stage = event.currentTarget as HTMLElement;
  if (!point || !sourceFile || !sourceDimensions) return;
  clearOutput();
  dragPointerId = event.pointerId;
  dragStart = point;
  dragEnd = point;
  stage.setPointerCapture(event.pointerId);
  setSelection(point, point);
  setToolStatus(requiredElement<HTMLOutputElement>(panel!, '#blur-status'), 'ลากเพื่อกำหนดพื้นที่ที่ต้องการเบลอ / Drag to select an area', 'working');
};

const handlePointerMove = (event: PointerEvent): void => {
  if (dragPointerId !== event.pointerId || !dragStart) return;
  const point = pointFromPointer(event);
  if (!point) return;
  dragEnd = point;
  setSelection(dragStart, point);
};

const finishPointerSelection = (event: PointerEvent): void => {
  if (dragPointerId !== event.pointerId || !dragStart) return;
  const point = pointFromPointer(event) ?? dragEnd ?? dragStart;
  dragEnd = point;
  setSelection(dragStart, point);
  dragPointerId = undefined;
  dragStart = undefined;
  dragEnd = undefined;
  if (panel && selectedRegion) {
    setToolStatus(requiredElement<HTMLOutputElement>(panel, '#blur-status'), 'เลือกพื้นที่แล้ว ตั้งค่าเอฟเฟกต์และกดเริ่มทำงาน / Area selected; choose an effect and start processing', 'success');
  }
};

const handleFileChange = async (event: Event): Promise<void> => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#blur-status');
  const currentOperation = ++operationId;
  activeJob?.abort();
  activeJob = undefined;
  try {
    setRunning(false);
    sourceFile = undefined;
    sourceDimensions = undefined;
    selectedRegion = undefined;
    clearOutput();
    clearSourcePreview();
    validateImageFile(file);
    setToolStatus(status, 'กำลังอ่านรูปภาพในอุปกรณ์… / Reading image on this device…', 'working');
    const bitmap = await loadImageBitmap(file);
    if (!panel || currentOperation !== operationId) {
      bitmap.close();
      return;
    }
    sourceDimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    sourceFile = file;
    sourceUrl = URL.createObjectURL(file);
    requiredElement<HTMLImageElement>(panel, '#blur-source-preview').src = sourceUrl;
    requiredElement<HTMLElement>(panel, '#blur-file-meta').textContent = `${file.name} · ${sourceDimensions.width.toLocaleString()} × ${sourceDimensions.height.toLocaleString()} px · ${formatBytes(file.size)}`;
    requiredElement<HTMLElement>(panel, '#blur-selection-meta').textContent = 'ลากบนรูปเพื่อเลือกพื้นที่ / Drag on the image to select an area';
    updateSelectionVisual();
    setToolStatus(status, 'เลือกรูปภาพแล้ว ลากเลือกพื้นที่ที่ต้องการเซนเซอร์ / Image ready; drag to select an area', 'success');
  } catch (error) {
    sourceFile = undefined;
    sourceDimensions = undefined;
    selectedRegion = undefined;
    clearSourcePreview();
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const currentOperation = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#blur-status');
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (!sourceFile || !sourceDimensions) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่มเซนเซอร์');
    if (!selectedRegion) throw new Error('กรุณาลากเลือกพื้นที่ที่ต้องการเบลอหรือทำพิกเซล');
    const effect = requiredElement<HTMLSelectElement>(panel, '#blur-effect').value as RedactionEffect;
    const strength = Math.round(Number(requiredElement<HTMLInputElement>(panel, '#blur-strength').value));
    const options = { region: selectedRegion, effect, strength, quality: 0.92, type: sourceFile.type as SupportedImageType };
    validateRedactionOptions(options, sourceDimensions);
    setRunning(true);
    const { blob } = await redactImageAsync(sourceFile, options, {
      signal: controller.signal,
      onProgress: (progress, message) => setProgressStatus(status, progress, `${message} / Processing`),
    });
    if (!panel || currentOperation !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(blob);
    const extension = extensionForType(sourceFile.type as SupportedImageType);
    const suffix = effect === 'blur' ? 'blurred' : 'pixelated';
    outputFilename = `${sourceFile.name.replace(/\.[^.]+$/, '')}-${suffix}.${extension}`;
    const preview = requiredElement<HTMLImageElement>(panel, '#blur-output-preview');
    preview.src = outputUrl;
    preview.alt = `รูปผลลัพธ์แบบ ${effect === 'blur' ? 'เบลอ' : 'พิกเซล'}`;
    requiredElement<HTMLElement>(panel, '#blur-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#blur-result-meta').textContent = `${sourceDimensions.width.toLocaleString()} × ${sourceDimensions.height.toLocaleString()} px · ${formatBytes(blob.size)} · ${effect === 'blur' ? 'Blur' : 'Pixelate'} ${strength}`;
    setToolStatus(status, 'เซนเซอร์สำเร็จ ตรวจภาพผลลัพธ์ก่อนดาวน์โหลด / Redaction complete; review before downloading', 'success');
  } catch (error) {
    if (!panel || currentOperation !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการเซนเซอร์แล้ว / Redaction cancelled' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-blur-action]');
  if (!button || !panel) return;
  if (button.dataset.blurAction === 'download' && outputUrl) downloadUrl(outputUrl, outputFilename);
  if (button.dataset.blurAction === 'cancel') activeJob?.abort();
};

const handleInput = (): void => {
  if (!panel) return;
  clearOutput();
  const strength = requiredElement<HTMLInputElement>(panel, '#blur-strength').value;
  requiredElement<HTMLElement>(panel, '#blur-strength-value').textContent = strength;
  if (selectedRegion) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#blur-status'), 'ตั้งค่าใหม่แล้ว กดเริ่มทำงานเพื่อสร้างผลลัพธ์ / Settings changed; process again for a new result', 'neutral');
};

const handleFileInput = (event: Event): void => void handleFileChange(event);
const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel image-blur-tool';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Image privacy · Local processing</p><h2>เบลอและเซนเซอร์รูปภาพเฉพาะจุด</h2><p class="helper-text">ลากกรอบบนรูปเพื่อเลือกพื้นที่ ข้อมูลไม่ถูกอัปโหลดออกจากอุปกรณ์</p></div><span class="privacy-badge">Local-only</span></div>
      <form id="blur-form" class="tool-form">
        <label class="file-drop" for="blur-file"><strong>เลือกรูปภาพ / Choose an image</strong><span id="blur-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span>
          <input id="blur-file" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>
        <div class="image-blur-stage" id="blur-stage" aria-label="พื้นที่เลือกส่วนของรูปภาพด้วยการลาก"><div class="image-blur-canvas-wrap"><img id="blur-source-preview" alt="รูปภาพต้นฉบับสำหรับเลือกพื้นที่" /><span id="blur-selection" class="image-blur-selection" hidden></span></div><span class="image-blur-stage__hint">ลากเพื่อเลือกพื้นที่ / Drag to select</span></div>
        <p id="blur-selection-meta" class="helper-text">เลือกรูปภาพก่อน แล้วลากบนรูปเพื่อเลือกพื้นที่ / Choose an image, then drag on it to select an area</p>
        <div class="form-row image-blur-controls">
          <label class="field" for="blur-effect"><span>เอฟเฟกต์ / Effect</span><select id="blur-effect"><option value="blur">เบลอ / Blur</option><option value="pixelate">พิกเซล / Pixelate</option></select></label>
          <label class="field" for="blur-strength"><span>ความแรง / Strength <output id="blur-strength-value">16</output></span><input id="blur-strength" type="range" min="2" max="64" value="16" step="1" /></label>
        </div>
        <div class="tool-actions"><button id="blur-submit" class="button button--primary" type="submit">เบลอพื้นที่ที่เลือก / Process selection</button><button class="button" type="button" data-blur-action="cancel" hidden>ยกเลิก / Cancel</button></div>
      </form>
      <section id="blur-result" class="image-result" hidden><img id="blur-output-preview" alt="รูปภาพผลลัพธ์" /><div><strong>ไฟล์ผลลัพธ์ / Result</strong><p id="blur-result-meta"></p><button class="button" type="button" data-blur-action="download">ดาวน์โหลดรูปภาพ / Download</button></div></section>
      <output id="blur-status" class="tool-status" aria-live="polite">ไฟล์จะถูกประมวลผลด้วย Canvas ภายในอุปกรณ์ / Your image stays on this device</output>
    `;
    const fileInput = requiredElement<HTMLInputElement>(panel, '#blur-file');
    const form = requiredElement<HTMLFormElement>(panel, '#blur-form');
    const stage = requiredElement<HTMLElement>(panel, '#blur-stage');
    const effect = requiredElement<HTMLSelectElement>(panel, '#blur-effect');
    const strength = requiredElement<HTMLInputElement>(panel, '#blur-strength');
    fileInput.addEventListener('change', handleFileInput);
    form.addEventListener('submit', handleFormSubmit);
    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerup', finishPointerSelection);
    stage.addEventListener('pointercancel', finishPointerSelection);
    effect.addEventListener('input', handleInput);
    strength.addEventListener('input', handleInput);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#blur-file')?.removeEventListener('change', handleFileInput);
    panel?.querySelector<HTMLFormElement>('#blur-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.querySelector<HTMLElement>('#blur-stage')?.removeEventListener('pointerdown', handlePointerDown);
    panel?.querySelector<HTMLElement>('#blur-stage')?.removeEventListener('pointermove', handlePointerMove);
    panel?.querySelector<HTMLElement>('#blur-stage')?.removeEventListener('pointerup', finishPointerSelection);
    panel?.querySelector<HTMLElement>('#blur-stage')?.removeEventListener('pointercancel', finishPointerSelection);
    panel?.querySelector<HTMLSelectElement>('#blur-effect')?.removeEventListener('input', handleInput);
    panel?.querySelector<HTMLInputElement>('#blur-strength')?.removeEventListener('input', handleInput);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    clearSourcePreview();
    sourceFile = undefined;
    sourceDimensions = undefined;
    selectedRegion = undefined;
    dragStart = undefined;
    dragEnd = undefined;
    dragPointerId = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
