import { csvPreviewRows, decodeCsvBytes, detectCsvEncoding, encodeUtf8Bom, type CsvEncoding } from '../../core/csv-encoding';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let sourceBytes: Uint8Array | undefined;
let decodedText = '';
let outputUrl = '';

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  const result = panel?.querySelector<HTMLElement>('#csv-repair-result');
  if (result) result.hidden = true;
}

function renderPreview(text: string): void {
  if (!panel) return;
  const rows = csvPreviewRows(text);
  const table = requiredElement<HTMLTableElement>(panel, '#csv-repair-preview');
  table.innerHTML = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`
    : '<tbody><tr><td>ไม่พบข้อมูล / No rows</td></tr></tbody>';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

function refreshDecoded(): void {
  if (!panel || !sourceBytes) return;
  const encoding = requiredElement<HTMLSelectElement>(panel, '#csv-repair-encoding').value as CsvEncoding | 'auto';
  decodedText = encoding === 'auto' ? detectCsvEncoding(sourceBytes).text : decodeCsvBytes(sourceBytes, encoding);
  requiredElement<HTMLElement>(panel, '#csv-repair-char-count').textContent = `${decodedText.length.toLocaleString()} ตัวอักษร`;
  renderPreview(decodedText);
}

const handleFile = async (event: Event): Promise<void> => {
  if (!panel) return;
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  const status = requiredElement<HTMLOutputElement>(panel, '#csv-repair-status');
  clearOutput();
  try {
    if (!file) throw new Error('กรุณาเลือกไฟล์ CSV');
    if (file.size > 20 * 1024 * 1024) throw new Error('ไฟล์ CSV ต้องมีขนาดไม่เกิน 20 MB');
    sourceFile = file;
    sourceBytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectCsvEncoding(sourceBytes);
    requiredElement<HTMLSelectElement>(panel, '#csv-repair-encoding').value = detected.encoding;
    requiredElement<HTMLElement>(panel, '#csv-repair-file-meta').textContent = `${file.name} · ${formatBytes(file.size)} · ตรวจพบ ${detected.encoding}`;
    refreshDecoded();
    setToolStatus(status, 'อ่านไฟล์แล้ว ตรวจตัวอย่างก่อนดาวน์โหลด / File decoded; review the preview', 'success');
  } catch (error) {
    sourceFile = undefined;
    sourceBytes = undefined;
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleEncoding = (): void => {
  clearOutput();
  refreshDecoded();
};

const handleDownload = (): void => {
  if (!panel || !sourceFile) return;
  clearOutput();
  const blob = encodeUtf8Bom(decodedText);
  outputUrl = URL.createObjectURL(blob);
  requiredElement<HTMLElement>(panel, '#csv-repair-result').hidden = false;
  requiredElement<HTMLElement>(panel, '#csv-repair-result-meta').textContent = `${formatBytes(blob.size)} · UTF-8 BOM · ${decodedText.split(/\r?\n/).length} บรรทัด`;
  downloadUrl(outputUrl, sourceFile.name.replace(/\.[^.]+$/i, '') + '-utf8.csv');
  setToolStatus(requiredElement<HTMLOutputElement>(panel, '#csv-repair-status'), 'สร้าง CSV UTF-8 สำเร็จ / UTF-8 CSV created', 'success');
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">CSV repair · Local processing</p><h2>ซ่อม CSV ภาษาไทย</h2><p class="helper-text">ตรวจ encoding และแปลงเป็น UTF-8 BOM สำหรับ Excel โดยไม่อัปโหลดไฟล์</p></div><span class="privacy-badge">Local-only</span></div>
      <label class="file-drop" for="csv-repair-file"><strong>เลือกไฟล์ CSV / Choose CSV</strong><span id="csv-repair-file-meta">CSV หรือ TXT · ไม่เกิน 20 MB</span><input id="csv-repair-file" type="file" accept=".csv,.txt,text/csv,text/plain" /></label>
      <div class="form-row"><label class="field" for="csv-repair-encoding"><span>Encoding</span><select id="csv-repair-encoding"><option value="auto">Auto detect</option><option value="utf-8">UTF-8</option><option value="windows-874">Windows-874 / Thai</option><option value="windows-1252">Windows-1252</option></select></label><p class="helper-text" id="csv-repair-char-count">ยังไม่มีข้อมูล / No data</p></div>
      <div class="table-scroll"><table id="csv-repair-preview" class="data-table" aria-label="CSV preview"><tbody><tr><td>เลือกไฟล์เพื่อดูตัวอย่าง / Choose a file</td></tr></tbody></table></div>
      <div class="tool-actions"><button id="csv-repair-download" class="button button--primary" type="button">ส่งออก UTF-8 BOM / Export</button></div>
      <section id="csv-repair-result" class="result-card" hidden><strong>ผลลัพธ์ / Result</strong><p id="csv-repair-result-meta"></p></section>
      <output id="csv-repair-status" class="tool-status" aria-live="polite">ไฟล์จะถูกอ่านภายในอุปกรณ์ / Your CSV stays on this device</output>`;
    requiredElement<HTMLInputElement>(panel, '#csv-repair-file').addEventListener('change', (event) => void handleFile(event));
    requiredElement<HTMLSelectElement>(panel, '#csv-repair-encoding').addEventListener('change', handleEncoding);
    requiredElement<HTMLButtonElement>(panel, '#csv-repair-download').addEventListener('click', handleDownload);
    container.append(panel);
  },
  unmount() {
    clearOutput();
    sourceFile = undefined;
    sourceBytes = undefined;
    decodedText = '';
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
