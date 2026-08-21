import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, getErrorMessage, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

interface CsvData { headers: string[]; rows: string[][]; }
let panel: HTMLElement | undefined; let data: CsvData | undefined; let outputUrl = '';

export function parseCsv(text: string): CsvData {
  const source = text.replace(/^\uFEFF/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [';', '\t', ','].sort((a, b) => (firstLine.split(b).length - 1) - (firstLine.split(a).length - 1))[0]!;
  const records: string[][] = []; let row: string[] = []; let value = ''; let quoted = false;
  const pushValue = (): void => { row.push(value); value = ''; };
  const pushRow = (): void => { pushValue(); if (row.some((cell) => cell.length > 0)) records.push(row); row = []; };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (char === '"') { if (quoted && source[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) pushValue();
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && source[index + 1] === '\n') index += 1; pushRow(); }
    else value += char;
  }
  if (quoted) throw new Error('CSV มีเครื่องหมาย quote ไม่ครบ');
  if (value.length || row.length) pushRow();
  if (!records.length) throw new Error('CSV ไม่มีข้อมูล');
  const headers = records[0]!.map((header) => header.trim());
  const rows = records.slice(1).map((record) => headers.map((_, index) => record[index] ?? ''));
  return { headers, rows };
}
function csvEscape(value: string): string { return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value; }
export function cleanedRows(source: CsvData, trim: boolean, dedupe: boolean): string[][] { const rows = source.rows.map((row) => trim ? row.map((value) => value.trim()) : row); if (!dedupe) return rows; const seen = new Set<string>(); return rows.filter((row) => { const key = JSON.stringify(row); if (seen.has(key)) return false; seen.add(key); return true; }); }
function renderProfile(source: CsvData, rows: string[][]): void { const table = panel!.querySelector<HTMLElement>('#csv-profile'); const duplicateCount = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size; const cells = source.headers.map((header, index) => { const values = rows.map((row) => row[index] ?? ''); const missing = values.filter((value) => value === '').length; const numeric = values.filter((value) => value !== '' && Number.isFinite(Number(value))).length; const type = numeric === values.filter(Boolean).length && numeric > 0 ? 'number' : 'text'; return `<tr><th>${header}</th><td>${type}</td><td>${new Set(values).size}</td><td>${missing}</td></tr>`; }).join(''); if (table) table.innerHTML = `<caption>${rows.length} rows · ${duplicateCount} duplicates</caption><thead><tr><th>Column</th><th>Type</th><th>Unique</th><th>Missing</th></tr></thead><tbody>${cells}</tbody>`; }

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section'); panel.className = 'utility-panel';
    panel.innerHTML = `<div class="utility-panel__header"><div><p class="eyebrow">Private data utility</p><h2>ตรวจและทำความสะอาด CSV / CSV profiler</h2><p class="helper-text">ดูชนิดข้อมูล ค่าว่าง ค่าซ้ำ และ export ไฟล์ที่ทำความสะอาดแล้ว โดยข้อมูลไม่ออกจากเครื่อง</p></div></div><label class="file-drop" for="csv-file"><strong>เลือกไฟล์ CSV / Select CSV</strong><span>แนะนำไม่เกิน 25 MB สำหรับ browser preview</span><input id="csv-file" type="file" accept="text/csv,.csv" /></label><div class="form-row"><label class="field field--check" for="csv-trim"><span>Trim spaces</span><input id="csv-trim" type="checkbox" checked /></label><label class="field field--check" for="csv-dedupe"><span>Remove duplicates</span><input id="csv-dedupe" type="checkbox" /></label></div><div class="table-scroll"><table id="csv-profile" class="data-table"><caption>ยังไม่มีไฟล์ / No file</caption></table></div><div class="tool-actions"><button class="button button--primary" type="button" data-csv-action="profile">วิเคราะห์ / Profile</button><button class="button" type="button" data-csv-action="download" hidden>ดาวน์โหลด Clean CSV</button><button class="text-button" type="button" data-csv-action="clear">ล้างข้อมูล / Clear</button></div><output id="csv-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดประมวลผลในเครื่อง</output>`;
    panel.querySelector<HTMLInputElement>('#csv-file')?.addEventListener('change', async (event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; try { if (file.size > 25 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 25 MB กรุณาแบ่งไฟล์ก่อนใช้งาน'); data = parseCsv(await file.text()); renderProfile(data, data.rows); setToolStatus(panel!.querySelector<HTMLOutputElement>('#csv-status')!, `${data.rows.length} rows · ${data.headers.length} columns loaded`, 'success'); } catch (error) { setToolStatus(panel!.querySelector<HTMLOutputElement>('#csv-status')!, getErrorMessage(error), 'error'); } });
    panel.addEventListener('click', (event) => { const action = (event.target as HTMLElement).closest<HTMLElement>('[data-csv-action]')?.dataset.csvAction; if (!action) return; const status = panel!.querySelector<HTMLOutputElement>('#csv-status')!; try { if (action === 'profile') { if (!data) throw new Error('กรุณาเลือกไฟล์ CSV'); const rows = cleanedRows(data, (panel!.querySelector('#csv-trim') as HTMLInputElement).checked, (panel!.querySelector('#csv-dedupe') as HTMLInputElement).checked); renderProfile(data, rows); const csv = [data.headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'); if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); panel!.querySelector<HTMLButtonElement>('[data-csv-action="download"]')?.removeAttribute('hidden'); setToolStatus(status, `Profile complete · ${rows.length} rows ready`, 'success'); } if (action === 'download' && outputUrl) downloadUrl(outputUrl, 'cleaned-data.csv'); if (action === 'clear') { data = undefined; panel!.querySelector<HTMLElement>('#csv-profile')!.innerHTML = '<caption>No file / ยังไม่มีไฟล์</caption>'; } } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); } });
    container.append(panel);
  },
  unmount() { if (outputUrl) URL.revokeObjectURL(outputUrl); panel?.remove(); panel = undefined; data = undefined; outputUrl = ''; },
};

export const { mount, unmount } = tool;
export { metadata };
