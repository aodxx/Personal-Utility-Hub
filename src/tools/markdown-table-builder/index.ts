import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { buildTable } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
const sample = 'Name,Role,Active\nAod,Owner,true\nทีมงาน,Editor,true';

const handleClick = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-table-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#table-input');
  const output = requiredElement<HTMLTextAreaElement>(panel, '#table-output');
  const delimiter = requiredElement<HTMLSelectElement>(panel, '#table-delimiter');
  const status = requiredElement<HTMLOutputElement>(panel, '#table-status');
  try {
    switch (button.dataset.tableAction) {
      case 'sample': input.value = sample; setToolStatus(status, 'ใส่ข้อมูลตัวอย่างแล้ว / Sample loaded', 'success'); break;
      case 'build': output.value = buildTable(input.value, delimiter.value); setToolStatus(status, 'สร้าง Markdown table แล้ว / Table built locally', 'success'); break;
      case 'copy': await copyText(output.value); setToolStatus(status, 'คัดลอกตารางแล้ว / Table copied', 'success'); break;
      case 'clear': input.value = ''; output.value = ''; setToolStatus(status, 'ล้างข้อมูลแล้ว'); input.focus(); break;
      default: break;
    }
  } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Text / Data · Local only</p><h2>สร้าง Markdown Table จากข้อมูล</h2><p class="helper-text">วาง CSV, TSV หรือข้อมูลคั่นด้วย pipe แล้วสร้างตาราง Markdown โดยไม่อัปโหลดข้อมูล</p></div></div>
      <div class="editor-grid"><label class="field" for="table-delimiter"><span>ตัวคั่น / Delimiter</span><select id="table-delimiter"><option value=",">Comma (,)</option><option value="\t">Tab</option><option value="|">Pipe (|)</option></select></label></div>
      <label class="field" for="table-input"><span>ข้อมูลต้นฉบับ / Source data</span><textarea id="table-input" class="code-editor" rows="10" spellcheck="false" placeholder="Name,Role\nAod,Owner"></textarea></label>
      <div class="tool-actions"><button class="button button--primary" type="button" data-table-action="build">สร้างตาราง / Build</button><button class="button button--secondary" type="button" data-table-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button></div>
      <label class="field" for="table-output"><span>Markdown Table / ผลลัพธ์</span><textarea id="table-output" class="code-editor" rows="12" readonly spellcheck="false"></textarea></label>
      <div class="tool-actions"><button class="button" type="button" data-table-action="copy">คัดลอก / Copy</button><button class="text-button" type="button" data-table-action="clear">ล้างข้อมูล</button></div>
      <p class="helper-text">แถวแรกจะถูกใช้เป็น header; cell ที่มีเครื่องหมาย pipe จะถูก escape อัตโนมัติ</p>
      <output id="table-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ใน browser ของคุณ / Data stays in your browser.</output>
    `;
    panel.addEventListener('click', (event) => void handleClick(event));
    container.append(panel);
  },
  unmount() { panel?.remove(); panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
