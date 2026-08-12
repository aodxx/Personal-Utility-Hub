import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { formatJson, minifyJson, parseJson } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-json-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#json-input');
  const result = requiredElement<HTMLTextAreaElement>(panel, '#json-result');
  const status = requiredElement<HTMLOutputElement>(panel, '#json-status');

  try {
    switch (button.dataset.jsonAction) {
      case 'format': {
        const spaces = requiredElement<HTMLSelectElement>(panel, '#json-indent').value === '4' ? 4 : 2;
        result.value = formatJson(input.value, spaces);
        setToolStatus(status, 'จัดรูปแบบ JSON สำเร็จ', 'success');
        break;
      }
      case 'minify':
        result.value = minifyJson(input.value);
        setToolStatus(status, 'ย่อ JSON สำเร็จ', 'success');
        break;
      case 'validate':
        parseJson(input.value);
        setToolStatus(status, 'JSON ถูกต้องและพร้อมใช้งาน', 'success');
        break;
      case 'copy':
        await copyText(result.value || input.value);
        setToolStatus(status, 'คัดลอกผลลัพธ์แล้ว', 'success');
        break;
      case 'clear':
        input.value = '';
        result.value = '';
        setToolStatus(status, 'ล้างข้อมูลแล้ว');
        input.focus();
        break;
      default:
        break;
    }
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handlePanelClick = (event: Event): void => void handleAction(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header">
        <div><p class="eyebrow">Developer tool</p><h2>จัดรูปแบบและตรวจสอบ JSON</h2></div>
        <label class="inline-field" for="json-indent">ย่อหน้า
          <select id="json-indent"><option value="2">2 ช่อง</option><option value="4">4 ช่อง</option></select>
        </label>
      </div>
      <div class="editor-grid">
        <label class="field" for="json-input"><span>JSON ต้นฉบับ</span>
          <textarea id="json-input" class="code-editor" spellcheck="false" placeholder='{"name":"Utility Hub"}'></textarea>
        </label>
        <label class="field" for="json-result"><span>ผลลัพธ์</span>
          <textarea id="json-result" class="code-editor" readonly placeholder="ผลลัพธ์จะแสดงที่นี่"></textarea>
        </label>
      </div>
      <div class="tool-actions">
        <button class="button button--primary" type="button" data-json-action="format">จัดรูปแบบ</button>
        <button class="button" type="button" data-json-action="validate">ตรวจสอบ</button>
        <button class="button" type="button" data-json-action="minify">ย่อ JSON</button>
        <button class="button" type="button" data-json-action="copy">คัดลอก</button>
        <button class="text-button" type="button" data-json-action="clear">ล้างข้อมูล</button>
      </div>
      <output id="json-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของคุณ</output>
    `;
    panel.addEventListener('click', handlePanelClick);
    container.append(panel);
    requiredElement<HTMLTextAreaElement>(panel, '#json-input').focus();
  },
  unmount() {
    panel?.removeEventListener('click', handlePanelClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
