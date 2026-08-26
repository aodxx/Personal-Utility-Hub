import { extensionForType, processImageCropOnMainThread, validateImageFile, type CropShape, type SupportedImageType } from '../../core/image-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let outputUrl = '';
let outputName = '';

function clearOutput(): void { if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = ''; outputName = ''; if (panel) requiredElement<HTMLElement>(panel, '#crop-result').hidden = true; }
const handleFile = (event: Event): void => {
  if (!panel) return;
  clearOutput();
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  try { if (!file) throw new Error('กรุณาเลือกรูปภาพ'); validateImageFile(file); sourceFile = file; requiredElement<HTMLElement>(panel, '#crop-file-meta').textContent = `${file.name} · ${formatBytes(file.size)}`; setToolStatus(requiredElement<HTMLOutputElement>(panel, '#crop-status'), 'พร้อมครอบรูป / Image ready', 'success'); }
  catch (error) { sourceFile = undefined; setToolStatus(requiredElement<HTMLOutputElement>(panel, '#crop-status'), getErrorMessage(error), 'error'); }
};
const process = async (): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#crop-status');
  clearOutput();
  try {
    if (!sourceFile) throw new Error('กรุณาเลือกรูปภาพก่อนเริ่ม crop');
    const type = requiredElement<HTMLSelectElement>(panel, '#crop-type').value as SupportedImageType;
    const shape = requiredElement<HTMLSelectElement>(panel, '#crop-shape').value as CropShape;
    const result = await processImageCropOnMainThread(sourceFile, { shape, radius: Number(requiredElement<HTMLInputElement>(panel, '#crop-radius').value), outputSize: Number(requiredElement<HTMLSelectElement>(panel, '#crop-size').value), quality: 0.92, type });
    outputUrl = URL.createObjectURL(result.blob);
    outputName = sourceFile.name.replace(/\.[^.]+$/i, '') + `-${shape}.${extensionForType(type)}`;
    requiredElement<HTMLImageElement>(panel, '#crop-preview').src = outputUrl;
    requiredElement<HTMLElement>(panel, '#crop-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#crop-result-meta').textContent = `${result.width} × ${result.height} px · ${formatBytes(result.blob.size)}`;
    setToolStatus(status, 'ครอบรูปสำเร็จ / Crop complete', 'success');
  } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Image shape · Transparent canvas</p><h2>Circle & Rounded Crop</h2><p class="helper-text">ครอบส่วนกลางของรูปเป็นวงกลมหรือขอบมนสำหรับ avatar และ sticker</p></div><span class="privacy-badge">Local-only</span></div>
      <label class="file-drop" for="crop-file"><strong>เลือกรูปภาพ / Choose image</strong><span id="crop-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span><input id="crop-file" type="file" accept="image/png,image/jpeg,image/webp" /></label>
      <div class="form-row"><label class="field" for="crop-shape"><span>ทรง / Shape</span><select id="crop-shape"><option value="circle">วงกลม / Circle</option><option value="rounded">ขอบมน / Rounded</option></select></label><label class="field" for="crop-size"><span>ขนาด / Output size</span><select id="crop-size"><option value="256">256 px</option><option value="512" selected>512 px</option><option value="1024">1024 px</option></select></label></div>
      <div class="form-row"><label class="field" for="crop-radius"><span>รัศมีขอบมน / Radius</span><input id="crop-radius" type="range" min="0" max="256" value="64" /></label><label class="field" for="crop-type"><span>รูปแบบผลลัพธ์ / Output</span><select id="crop-type"><option value="image/png" selected>PNG โปร่งใส</option><option value="image/webp">WebP</option></select></label></div>
      <div class="tool-actions"><button id="crop-submit" class="button button--primary" type="button">ครอบรูป / Create crop</button></div>
      <section id="crop-result" class="image-result" hidden><img id="crop-preview" alt="รูปภาพที่ครอบแล้ว" /><div><strong>ผลลัพธ์ / Result</strong><p id="crop-result-meta"></p><button id="crop-download" class="button" type="button">ดาวน์โหลด / Download</button></div></section>
      <output id="crop-status" class="tool-status" aria-live="polite">รูปจะถูกประมวลผลในอุปกรณ์ / Image stays on this device</output>`;
    requiredElement<HTMLInputElement>(panel, '#crop-file').addEventListener('change', handleFile);
    requiredElement<HTMLButtonElement>(panel, '#crop-submit').addEventListener('click', () => void process());
    requiredElement<HTMLButtonElement>(panel, '#crop-download').addEventListener('click', () => { if (outputUrl) downloadUrl(outputUrl, outputName); });
    container.append(panel);
  },
  unmount() { clearOutput(); sourceFile = undefined; panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
