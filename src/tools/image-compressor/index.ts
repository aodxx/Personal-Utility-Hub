import { extensionForType, validateImageFile, type SupportedImageType } from '../../core/image-processing';
import { compressionSavingPercent, replaceFileExtension } from '../../core/file-processing';
import { compressImage } from '../../core/pdf-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

type CompressorType = Exclude<SupportedImageType, 'image/png'>;
let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let outputUrl = '';
let outputName = '';
let operationId = 0;

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  outputName = '';
  const result = panel?.querySelector<HTMLElement>('#compress-result');
  if (result) result.hidden = true;
  panel?.querySelector<HTMLImageElement>('#compress-preview')?.removeAttribute('src');
}

const handleFileChange = (event: Event): void => {
  if (!panel) return;
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  const status = requiredElement<HTMLOutputElement>(panel, '#compress-status');
  operationId += 1;
  clearOutput();
  try {
    if (!file) throw new Error('กรุณาเลือกรูปภาพ');
    validateImageFile(file);
    sourceFile = file;
    requiredElement<HTMLElement>(panel, '#compress-file-meta').textContent = `${file.name} · ${formatBytes(file.size)}`;
    setToolStatus(status, 'เลือกรูปภาพแล้ว ปรับคุณภาพและกดบีบอัด', 'success');
  } catch (error) {
    sourceFile = undefined;
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleQuality = (event: Event): void => {
  if (panel) requiredElement<HTMLOutputElement>(panel, '#compress-quality-value').textContent = `${(event.currentTarget as HTMLInputElement).value}%`;
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const request = ++operationId;
  const status = requiredElement<HTMLOutputElement>(panel, '#compress-status');
  try {
    if (!sourceFile) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่มบีบอัด');
    const file = sourceFile;
    const type = requiredElement<HTMLSelectElement>(panel, '#compress-type').value as CompressorType;
    const quality = Number(requiredElement<HTMLInputElement>(panel, '#compress-quality').value) / 100;
    const maxSide = Number(requiredElement<HTMLSelectElement>(panel, '#compress-max-side').value);
    setToolStatus(status, 'กำลังบีบอัดรูปภาพในอุปกรณ์…', 'working');
    const result = await compressImage(file, { maxSide, quality, type });
    if (!panel || request !== operationId) return;
    clearOutput();
    outputUrl = URL.createObjectURL(result.blob);
    const extension = extensionForType(type);
    outputName = replaceFileExtension(file.name, '-compressed', extension);
    const preview = requiredElement<HTMLImageElement>(panel, '#compress-preview');
    preview.src = outputUrl;
    preview.alt = 'รูปภาพหลังบีบอัด';
    requiredElement<HTMLElement>(panel, '#compress-result').hidden = false;
    const saving = compressionSavingPercent(file.size, result.blob.size);
    requiredElement<HTMLElement>(panel, '#compress-result-meta').textContent = `${result.width} × ${result.height} px · ${formatBytes(result.blob.size)} · ${saving >= 0 ? `เล็กลง ${saving}%` : `ใหญ่ขึ้น ${Math.abs(saving)}%`}`;
    setToolStatus(status, 'บีบอัดสำเร็จ ไฟล์พร้อมดาวน์โหลด', 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-compress-action="download"]') && outputUrl) downloadUrl(outputUrl, outputName);
};

const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Smaller images</p><h2>บีบอัดรูปภาพ</h2></div></div>
      <form id="compress-form" class="tool-form">
        <label class="file-drop" for="compress-file"><strong>เลือกรูปภาพ</strong><span id="compress-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span><input id="compress-file" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
        <div class="form-row">
          <label class="field" for="compress-type"><span>รูปแบบผลลัพธ์</span><select id="compress-type"><option value="image/webp" selected>WebP</option><option value="image/jpeg">JPEG</option></select></label>
          <label class="field" for="compress-max-side"><span>ด้านยาวสูงสุด</span><select id="compress-max-side"><option value="12000">คงขนาดเดิม</option><option value="2560">2,560 px</option><option value="1920" selected>1,920 px</option><option value="1280">1,280 px</option></select></label>
        </div>
        <label class="field" for="compress-quality"><span>คุณภาพ <output id="compress-quality-value">82%</output></span><input id="compress-quality" type="range" min="35" max="95" value="82" /></label>
        <button class="button button--primary" type="submit">บีบอัดรูปภาพ</button>
      </form>
      <section id="compress-result" class="image-result" hidden><img id="compress-preview" alt="รูปภาพผลลัพธ์" /><div><strong>ไฟล์ผลลัพธ์</strong><p id="compress-result-meta"></p><button class="button" type="button" data-compress-action="download">ดาวน์โหลดรูปภาพ</button></div></section>
      <output id="compress-status" class="tool-status" aria-live="polite">ไฟล์จะถูกประมวลผลด้วย Canvas ภายในอุปกรณ์</output>`;
    requiredElement<HTMLInputElement>(panel, '#compress-file').addEventListener('change', handleFileChange);
    requiredElement<HTMLInputElement>(panel, '#compress-quality').addEventListener('input', handleQuality);
    requiredElement<HTMLFormElement>(panel, '#compress-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    panel?.querySelector<HTMLInputElement>('#compress-file')?.removeEventListener('change', handleFileChange);
    panel?.querySelector<HTMLInputElement>('#compress-quality')?.removeEventListener('input', handleQuality);
    panel?.querySelector<HTMLFormElement>('#compress-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    clearOutput();
    sourceFile = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };

