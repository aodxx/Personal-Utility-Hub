import { extensionForType, processImageWatermarkOnMainThread, validateImageFile, type SupportedImageType, type WatermarkPosition } from '../../core/image-processing';
import { MAX_BATCH_BYTES, totalFileBytes } from '../../core/file-processing';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

interface WatermarkResult { name: string; url: string; size: number; }
let panel: HTMLElement | undefined;
let files: File[] = [];
let results: WatermarkResult[] = [];

function clearResults(): void { results.forEach((result) => URL.revokeObjectURL(result.url)); results = []; if (panel) requiredElement<HTMLElement>(panel, '#watermark-results').innerHTML = ''; }
function renderResults(): void {
  if (!panel) return;
  requiredElement<HTMLElement>(panel, '#watermark-results').innerHTML = results.map((result, index) => `<article class="result-card"><strong>${escapeHtml(result.name)}</strong><p>${formatBytes(result.size)}</p><button class="button" type="button" data-watermark-download="${index}">ดาวน์โหลด / Download</button></article>`).join('');
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char)); }

const handleFiles = (event: Event): void => {
  if (!panel) return;
  clearResults();
  files = Array.from((event.currentTarget as HTMLInputElement).files ?? []);
  requiredElement<HTMLElement>(panel, '#watermark-file-meta').textContent = files.length ? `${files.length} ไฟล์ · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}` : 'เลือกได้ไม่เกิน 20 ไฟล์';
};

const process = async (): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#watermark-status');
  clearResults();
  try {
    if (!files.length) throw new Error('กรุณาเลือกรูปภาพอย่างน้อยหนึ่งไฟล์');
    if (files.length > 20) throw new Error('เลือกได้ไม่เกิน 20 ไฟล์ต่อครั้ง');
    if (totalFileBytes(files) > MAX_BATCH_BYTES) throw new Error('ขนาดไฟล์รูปรวมต้องไม่เกิน 40 MB ต่อครั้ง');
    const text = requiredElement<HTMLInputElement>(panel, '#watermark-text').value;
    const type = requiredElement<HTMLSelectElement>(panel, '#watermark-type').value as SupportedImageType;
    const position = requiredElement<HTMLSelectElement>(panel, '#watermark-position').value as WatermarkPosition;
    const opacity = Number(requiredElement<HTMLInputElement>(panel, '#watermark-opacity').value) / 100;
    const scale = Number(requiredElement<HTMLInputElement>(panel, '#watermark-scale').value) / 100;
    for (const file of files) {
      validateImageFile(file);
      const result = await processImageWatermarkOnMainThread(file, { text, type, position, opacity, scale, quality: 0.9 });
      const extension = extensionForType(type);
      results.push({ name: file.name.replace(/\.[^.]+$/i, '') + '-watermarked.' + extension, url: URL.createObjectURL(result.blob), size: result.blob.size });
    }
    renderResults();
    setToolStatus(status, `ใส่ลายน้ำสำเร็จ ${results.length} ไฟล์ / Watermarked ${results.length} files`, 'success');
  } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Batch image · Local canvas</p><h2>ใส่ลายน้ำรูปภาพ</h2><p class="helper-text">ประมวลผลรูปภาพหลายไฟล์ในเครื่องด้วยข้อความลายน้ำ</p></div><span class="privacy-badge">Local-only</span></div>
      <label class="file-drop" for="watermark-files"><strong>เลือกรูปภาพ / Choose images</strong><span id="watermark-file-meta">PNG, JPEG หรือ WebP · ไม่เกิน 20 ไฟล์</span><input id="watermark-files" type="file" accept="image/png,image/jpeg,image/webp" multiple /></label>
      <div class="form-row"><label class="field" for="watermark-text"><span>ข้อความลายน้ำ / Text</span><input id="watermark-text" type="text" maxlength="80" value="Personal Utility Hub" /></label><label class="field" for="watermark-position"><span>ตำแหน่ง / Position</span><select id="watermark-position"><option value="bottom-right">ล่างขวา</option><option value="bottom-left">ล่างซ้าย</option><option value="top-right">บนขวา</option><option value="top-left">บนซ้าย</option><option value="center">กลาง</option></select></label></div>
      <div class="form-row"><label class="field" for="watermark-opacity"><span>ความโปร่งใส <output id="watermark-opacity-value">55%</output></span><input id="watermark-opacity" type="range" min="10" max="100" value="55" /></label><label class="field" for="watermark-scale"><span>ขนาด <output id="watermark-scale-value">100%</output></span><input id="watermark-scale" type="range" min="50" max="180" value="100" /></label></div>
      <label class="field" for="watermark-type"><span>รูปแบบผลลัพธ์ / Output</span><select id="watermark-type"><option value="image/png">PNG</option><option value="image/webp" selected>WebP</option><option value="image/jpeg">JPEG</option></select></label>
      <div class="tool-actions"><button id="watermark-submit" class="button button--primary" type="button">ใส่ลายน้ำ / Apply watermark</button></div>
      <div id="watermark-results" class="result-grid"></div>
      <output id="watermark-status" class="tool-status" aria-live="polite">รูปจะถูกประมวลผลในอุปกรณ์ / Images stay on this device</output>`;
    requiredElement<HTMLInputElement>(panel, '#watermark-files').addEventListener('change', handleFiles);
    requiredElement<HTMLButtonElement>(panel, '#watermark-submit').addEventListener('click', () => void process());
    requiredElement<HTMLInputElement>(panel, '#watermark-opacity').addEventListener('input', (event) => { requiredElement<HTMLElement>(panel!, '#watermark-opacity-value').textContent = `${(event.currentTarget as HTMLInputElement).value}%`; });
    requiredElement<HTMLInputElement>(panel, '#watermark-scale').addEventListener('input', (event) => { requiredElement<HTMLElement>(panel!, '#watermark-scale-value').textContent = `${(event.currentTarget as HTMLInputElement).value}%`; });
    panel.addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-watermark-download]'); if (!button) return; const result = results[Number(button.dataset.watermarkDownload)]; if (result) downloadUrl(result.url, result.name); });
    container.append(panel);
  },
  unmount() { clearResults(); files = []; panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
