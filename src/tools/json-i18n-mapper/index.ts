import { compareI18nJson } from '../../core/json-i18n';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let reportUrl = '';

const sampleBase = JSON.stringify({ app: { title: 'Utility Hub', save: 'Save', cancel: 'Cancel' }, home: { welcome: 'Welcome', tools: 'Tools' } }, null, 2);
const sampleTarget = JSON.stringify({ app: { title: 'ศูนย์รวมเครื่องมือ', save: 'บันทึก' }, home: { welcome: 'ยินดีต้อนรับ', tools: 'เครื่องมือ' }, legacy: { old: 'เก่า' } }, null, 2);

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char)); }
function clearReport(): void { if (reportUrl) URL.revokeObjectURL(reportUrl); reportUrl = ''; }
function setList(id: string, values: string[]): void {
  const list = requiredElement<HTMLElement>(panel!, id);
  list.innerHTML = values.length ? values.map((value) => `<li><code>${escapeHtml(value)}</code></li>`).join('') : '<li class="muted">ไม่มี / None</li>';
}

const compare = (): void => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#i18n-status');
  clearReport();
  try {
    const result = compareI18nJson(requiredElement<HTMLTextAreaElement>(panel, '#i18n-base').value, requiredElement<HTMLTextAreaElement>(panel, '#i18n-target').value);
    setList('#i18n-missing', result.missingInTarget);
    setList('#i18n-extra', result.extraInTarget);
    setList('#i18n-shared', result.sharedKeys);
    requiredElement<HTMLTextAreaElement>(panel, '#i18n-skeleton').value = JSON.stringify(result.skeleton, null, 2);
    const report = JSON.stringify({ missingInTarget: result.missingInTarget, extraInTarget: result.extraInTarget, sharedKeys: result.sharedKeys, skeleton: result.skeleton }, null, 2);
    reportUrl = URL.createObjectURL(new Blob([report], { type: 'application/json' }));
    requiredElement<HTMLElement>(panel, '#i18n-result').hidden = false;
    setToolStatus(status, `เทียบสำเร็จ: ขาด ${result.missingInTarget.length} key, เกิน ${result.extraInTarget.length} key / Comparison complete`, 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Localization · Local JSON</p><h2>JSON i18n Mapper</h2><p class="helper-text">วาง JSON ภาษาต้นฉบับและภาษาเป้าหมายเพื่อตรวจ key ที่ขาดหรือเกิน</p></div><span class="privacy-badge">Local-only</span></div>
      <div class="tool-actions"><button id="i18n-sample" class="button" type="button">ใส่ตัวอย่าง / Sample</button><button id="i18n-compare" class="button button--primary" type="button">เปรียบเทียบ / Compare</button></div>
      <div class="form-row"><label class="field"><span>Base locale JSON</span><textarea id="i18n-base" rows="12" spellcheck="false" placeholder="{\"app\":{\"title\":\"...\"}}"></textarea></label><label class="field"><span>Target locale JSON</span><textarea id="i18n-target" rows="12" spellcheck="false" placeholder="{\"app\":{\"title\":\"...\"}}"></textarea></label></div>
      <section id="i18n-result" class="result-card" hidden><div class="form-row"><div><h3>Missing in target</h3><ul id="i18n-missing" class="compact-list"></ul></div><div><h3>Extra in target</h3><ul id="i18n-extra" class="compact-list"></ul></div><div><h3>Shared keys</h3><ul id="i18n-shared" class="compact-list"></ul></div></div><label class="field"><span>Skeleton / Mapped JSON</span><textarea id="i18n-skeleton" rows="12" readonly spellcheck="false"></textarea></label><button id="i18n-download" class="button" type="button">ดาวน์โหลดรายงาน / Download report</button></section>
      <output id="i18n-status" class="tool-status" aria-live="polite">JSON จะถูกวิเคราะห์ในเบราว์เซอร์ / JSON stays in this browser</output>`;
    requiredElement<HTMLButtonElement>(panel, '#i18n-sample').addEventListener('click', () => { requiredElement<HTMLTextAreaElement>(panel!, '#i18n-base').value = sampleBase; requiredElement<HTMLTextAreaElement>(panel!, '#i18n-target').value = sampleTarget; });
    requiredElement<HTMLButtonElement>(panel, '#i18n-compare').addEventListener('click', compare);
    requiredElement<HTMLButtonElement>(panel, '#i18n-download').addEventListener('click', () => { if (reportUrl) downloadUrl(reportUrl, 'i18n-map-report.json'); });
    container.append(panel);
  },
  unmount() { clearReport(); panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
