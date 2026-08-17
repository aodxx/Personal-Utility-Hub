import type { ToolModule } from '../../core/tool-contract';
import { copyText, downloadUrl, getErrorMessage, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

const patterns = [
  { key: 'email', label: 'Email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { key: 'phone', label: 'Phone', regex: /(?:\+?\d[\d\s().-]{7,}\d)/g },
  { key: 'ip', label: 'IP address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { key: 'token', label: 'API/token-like value', regex: /\b(?:sk|pk|token|secret|key)[_-]?[A-Za-z0-9_-]{12,}\b/gi },
] as const;

function redactText(value: string): { output: string; counts: Record<string, number>; total: number } {
  const counts: Record<string, number> = {};
  let output = value;
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let count = 0;
    output = output.replace(pattern.regex, () => { count += 1; return `[REDACTED:${pattern.key.toUpperCase()}]`; });
    counts[pattern.label] = count;
  }
  return { output, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

let panel: HTMLElement | undefined;
let sourceName = 'redacted.txt';
let outputUrl = '';

function update(panelElement: HTMLElement): void {
  const input = panelElement.querySelector<HTMLTextAreaElement>('#redactor-input');
  const result = panelElement.querySelector<HTMLTextAreaElement>('#redactor-result');
  const report = panelElement.querySelector<HTMLElement>('#redactor-report');
  const source = input?.value ?? '';
  const redacted = redactText(source);
  if (result) result.value = redacted.output;
  if (report) report.textContent = `${redacted.total} matches · ${Object.entries(redacted.counts).filter(([, count]) => count > 0).map(([label, count]) => `${label}: ${count}`).join(' · ') || 'No sensitive patterns found'}`;
}

function setDownload(panelElement: HTMLElement, text: string): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const button = panelElement.querySelector<HTMLButtonElement>('#redactor-download');
  if (button) button.removeAttribute('hidden');
}

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `<div class="utility-panel__header"><div><p class="eyebrow">Privacy workflow</p><h2>ปิดบังข้อมูลก่อนแชร์ / Redact before sharing</h2><p class="helper-text">ตรวจจับ email, เบอร์โทร, IP และ token-like values ในเครื่องของคุณ พร้อม preview และ audit count</p></div></div><div class="file-drop"><strong>นำเข้าไฟล์ข้อความ (ไม่บังคับ) / Import text file</strong><span>รองรับ TXT, JSON, CSV และไฟล์ข้อความทั่วไป</span><input id="redactor-file" type="file" accept="text/*,.json,.csv,.log" /></div><div class="editor-grid"><label class="field" for="redactor-input"><span>ต้นฉบับ / Original</span><textarea id="redactor-input" class="code-editor" rows="12" spellcheck="false" placeholder="name@example.com\nPhone: +66 81 234 5678"></textarea></label><label class="field" for="redactor-result"><span>ผลลัพธ์ / Redacted preview</span><textarea id="redactor-result" class="code-editor" rows="12" readonly></textarea></label></div><div class="tool-actions"><button class="button button--primary" type="button" data-redactor-action="scan">ตรวจจับและปิดบัง / Redact</button><button class="button" type="button" data-redactor-action="copy">คัดลอกผลลัพธ์ / Copy</button><button id="redactor-download" class="button" type="button" data-redactor-action="download" hidden>ดาวน์โหลด / Download</button><button class="text-button" type="button" data-redactor-action="clear">ล้างข้อมูล / Clear</button></div><div class="privacy-note"><span aria-hidden="true">✓</span><div><strong>Local-only privacy scan</strong><small id="redactor-report">ยังไม่มีการตรวจข้อมูล / No scan yet</small></div></div><output id="redactor-status" class="tool-status" aria-live="polite">ไฟล์และข้อความไม่ออกจากอุปกรณ์ของคุณ</output>`;
    const input = panel.querySelector<HTMLTextAreaElement>('#redactor-input')!;
    panel.querySelector<HTMLInputElement>('#redactor-file')?.addEventListener('change', async (event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; try { sourceName = file.name; input.value = await file.text(); setToolStatus(panel!.querySelector<HTMLOutputElement>('#redactor-status')!, 'โหลดไฟล์สำเร็จ / File loaded', 'success'); } catch (error) { setToolStatus(panel!.querySelector<HTMLOutputElement>('#redactor-status')!, getErrorMessage(error), 'error'); } });
    panel.addEventListener('click', async (event) => { const action = (event.target as HTMLElement).closest<HTMLElement>('[data-redactor-action]')?.dataset.redactorAction; if (!action) return; const status = panel!.querySelector<HTMLOutputElement>('#redactor-status')!; try { if (action === 'scan') { update(panel!); const text = panel!.querySelector<HTMLTextAreaElement>('#redactor-result')!.value; setDownload(panel!, text); setToolStatus(status, 'ปิดบังข้อมูลสำเร็จ / Redaction complete', 'success'); } if (action === 'copy') { await copyText(panel!.querySelector<HTMLTextAreaElement>('#redactor-result')!.value); setToolStatus(status, 'คัดลอกผลลัพธ์แล้ว / Copied', 'success'); } if (action === 'download' && outputUrl) downloadUrl(outputUrl, `redacted-${sourceName.replace(/\.[^.]+$/, '')}.txt`); if (action === 'clear') { input.value = ''; panel!.querySelector<HTMLTextAreaElement>('#redactor-result')!.value = ''; panel!.querySelector<HTMLElement>('#redactor-report')!.textContent = 'ยังไม่มีการตรวจข้อมูล / No scan yet'; } } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); } });
    container.append(panel);
  },
  unmount() { if (outputUrl) URL.revokeObjectURL(outputUrl); panel?.remove(); panel = undefined; outputUrl = ''; },
};

export const { mount, unmount } = tool;
export { metadata };
