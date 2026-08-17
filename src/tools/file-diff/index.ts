import type { ToolModule } from '../../core/tool-contract';
import { copyText, downloadUrl, getErrorMessage, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let outputUrl = '';

function parseLines(value: string): string[] { return value.replace(/\r\n/g, '\n').split('\n'); }
function compare(left: string, right: string): { report: string; added: number; removed: number; changed: number } {
  const a = parseLines(left); const b = parseLines(right); const max = Math.max(a.length, b.length); let added = 0; let removed = 0; let changed = 0; const rows: string[] = [];
  for (let index = 0; index < max; index += 1) { const before = a[index]; const after = b[index]; if (before === after) { rows.push(`  ${before ?? ''}`); continue; } if (before !== undefined) { removed += 1; rows.push(`- ${before}`); } if (after !== undefined) { added += 1; rows.push(`+ ${after}`); } if (before !== undefined && after !== undefined) changed += 1; }
  const report = `# File Diff Report\n\n- Added: ${added}\n- Removed: ${removed}\n- Changed lines: ${changed}\n\n## Diff\n\n${rows.join('\n')}`;
  return { report, added, removed, changed };
}

function loadFile(input: HTMLInputElement, target: HTMLTextAreaElement): void { const file = input.files?.[0]; if (!file) return; void file.text().then((text) => { target.value = text; }); }

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section'); panel.className = 'utility-panel';
    panel.innerHTML = `<div class="utility-panel__header"><div><p class="eyebrow">Compare locally</p><h2>ดูความเปลี่ยนแปลง / Change map</h2><p class="helper-text">เปรียบเทียบ Text หรือ JSON สองเวอร์ชันแบบ line-by-line พร้อมสรุปจำนวนบรรทัดที่เพิ่ม ลบ และเปลี่ยน</p></div></div><div class="editor-grid"><label class="field" for="diff-left"><span>เวอร์ชันก่อน / Before</span><input id="diff-left-file" type="file" accept="text/*,.json,.csv,.txt" /><textarea id="diff-left" class="code-editor" rows="14" spellcheck="false" placeholder="ก่อนแก้ไข"></textarea></label><label class="field" for="diff-right"><span>เวอร์ชันหลัง / After</span><input id="diff-right-file" type="file" accept="text/*,.json,.csv,.txt" /><textarea id="diff-right" class="code-editor" rows="14" spellcheck="false" placeholder="หลังแก้ไข"></textarea></label></div><div class="tool-actions"><button class="button button--primary" type="button" data-diff-action="compare">เปรียบเทียบ / Compare</button><button class="button" type="button" data-diff-action="copy">คัดลอกรายงาน / Copy report</button><button class="button" type="button" data-diff-action="download" hidden>ดาวน์โหลด Markdown</button><button class="text-button" type="button" data-diff-action="clear">ล้างข้อมูล / Clear</button></div><div class="stat-grid" id="diff-summary"><div><strong>0</strong><small>Added</small></div><div><strong>0</strong><small>Removed</small></div><div><strong>0</strong><small>Changed</small></div></div><label class="field" for="diff-result"><span>รายงาน / Report</span><textarea id="diff-result" class="code-editor" rows="12" readonly></textarea></label><output id="diff-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของคุณ</output>`;
    const left = panel.querySelector<HTMLTextAreaElement>('#diff-left')!; const right = panel.querySelector<HTMLTextAreaElement>('#diff-right')!; const report = panel.querySelector<HTMLTextAreaElement>('#diff-result')!;
    panel.querySelector<HTMLInputElement>('#diff-left-file')?.addEventListener('change', (event) => loadFile(event.currentTarget as HTMLInputElement, left)); panel.querySelector<HTMLInputElement>('#diff-right-file')?.addEventListener('change', (event) => loadFile(event.currentTarget as HTMLInputElement, right));
    panel.addEventListener('click', async (event) => { const action = (event.target as HTMLElement).closest<HTMLElement>('[data-diff-action]')?.dataset.diffAction; if (!action) return; const status = panel!.querySelector<HTMLOutputElement>('#diff-status')!; try { if (action === 'compare') { const result = compare(left.value, right.value); report.value = result.report; const values = panel!.querySelectorAll<HTMLElement>('#diff-summary strong'); [result.added, result.removed, result.changed].forEach((value, index) => { if (values[index]) values[index]!.textContent = String(value); }); if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = URL.createObjectURL(new Blob([result.report], { type: 'text/markdown;charset=utf-8' })); panel!.querySelector<HTMLButtonElement>('[data-diff-action="download"]')?.removeAttribute('hidden'); setToolStatus(status, 'เปรียบเทียบสำเร็จ / Comparison complete', 'success'); } if (action === 'copy') { await copyText(report.value); setToolStatus(status, 'คัดลอกรายงานแล้ว / Report copied', 'success'); } if (action === 'download' && outputUrl) downloadUrl(outputUrl, 'file-diff-report.md'); if (action === 'clear') { left.value = ''; right.value = ''; report.value = ''; } } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); } });
    container.append(panel);
  },
  unmount() { if (outputUrl) URL.revokeObjectURL(outputUrl); panel?.remove(); panel = undefined; outputUrl = ''; },
};

export const { mount, unmount } = tool;
export { metadata };
