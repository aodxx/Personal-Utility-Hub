import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { generateSchema } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const sample = '{\n  "name": "ชุมชน",\n  "active": true,\n  "members": [{ "id": 1, "role": "admin" }]\n}';

const handleClick = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-schema-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#schema-input');
  const output = requiredElement<HTMLTextAreaElement>(panel, '#schema-output');
  const status = requiredElement<HTMLOutputElement>(panel, '#schema-status');
  try {
    switch (button.dataset.schemaAction) {
      case 'sample': input.value = sample; setToolStatus(status, 'ใส่ JSON ตัวอย่างแล้ว / Sample loaded', 'success'); break;
      case 'generate': output.value = generateSchema(input.value); setToolStatus(status, 'สร้าง JSON Schema แล้ว / Schema generated locally', 'success'); break;
      case 'copy': await copyText(output.value); setToolStatus(status, 'คัดลอก Schema แล้ว / Schema copied', 'success'); break;
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
      <div class="utility-panel__header"><div><p class="eyebrow">Text / Data · Local only</p><h2>สร้าง JSON Schema จากตัวอย่าง</h2><p class="helper-text">สร้าง schema แบบ inferred จาก JSON ตัวอย่าง โดยไม่ส่งข้อมูลออกจาก browser</p></div></div>
      <label class="field" for="schema-input"><span>ตัวอย่าง JSON / Sample JSON</span><textarea id="schema-input" class="code-editor" rows="12" spellcheck="false" placeholder="{\n  &quot;name&quot;: &quot;example&quot;\n}"></textarea></label>
      <div class="tool-actions"><button class="button button--primary" type="button" data-schema-action="generate">สร้าง Schema / Generate</button><button class="button button--secondary" type="button" data-schema-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button></div>
      <label class="field" for="schema-output"><span>JSON Schema / ผลลัพธ์</span><textarea id="schema-output" class="code-editor" rows="16" readonly spellcheck="false"></textarea></label>
      <div class="tool-actions"><button class="button" type="button" data-schema-action="copy">คัดลอก / Copy</button><button class="text-button" type="button" data-schema-action="clear">ล้างข้อมูล</button></div>
      <p class="helper-text">หมายเหตุ: required fields และ array item types มาจากตัวอย่างที่ให้มา ไม่ใช่ schema ที่รับรองความถูกต้องของข้อมูลทุกกรณี</p>
      <output id="schema-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ใน browser ของคุณ / Data stays in your browser.</output>
    `;
    panel.addEventListener('click', (event) => void handleClick(event));
    container.append(panel);
  },
  unmount() { panel?.remove(); panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
