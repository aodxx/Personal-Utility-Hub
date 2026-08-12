import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { decodeBase64, encodeBase64 } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-base64-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#base64-input');
  const result = requiredElement<HTMLTextAreaElement>(panel, '#base64-result');
  const status = requiredElement<HTMLOutputElement>(panel, '#base64-status');
  try {
    switch (button.dataset.base64Action) {
      case 'encode':
        result.value = encodeBase64(input.value);
        setToolStatus(status, 'เข้ารหัส Base64 สำเร็จ', 'success');
        break;
      case 'decode':
        result.value = decodeBase64(input.value);
        setToolStatus(status, 'ถอดรหัส Base64 สำเร็จ', 'success');
        break;
      case 'swap':
        input.value = result.value;
        result.value = '';
        setToolStatus(status, 'ย้ายผลลัพธ์กลับไปช่องข้อมูลแล้ว');
        input.focus();
        break;
      case 'copy':
        await copyText(result.value);
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
      <div class="utility-panel__header"><div><p class="eyebrow">Unicode safe</p><h2>เข้ารหัสหรือถอดรหัส Base64</h2></div></div>
      <div class="editor-grid">
        <label class="field" for="base64-input"><span>ข้อมูลต้นฉบับ</span>
          <textarea id="base64-input" class="code-editor" spellcheck="false" placeholder="รองรับภาษาไทยและอีโมจิ"></textarea>
        </label>
        <label class="field" for="base64-result"><span>ผลลัพธ์</span>
          <textarea id="base64-result" class="code-editor" readonly placeholder="ผลลัพธ์จะแสดงที่นี่"></textarea>
        </label>
      </div>
      <div class="tool-actions">
        <button class="button button--primary" type="button" data-base64-action="encode">เข้ารหัส</button>
        <button class="button" type="button" data-base64-action="decode">ถอดรหัส</button>
        <button class="button" type="button" data-base64-action="swap">ย้ายผลลัพธ์กลับ</button>
        <button class="button" type="button" data-base64-action="copy">คัดลอก</button>
        <button class="text-button" type="button" data-base64-action="clear">ล้างข้อมูล</button>
      </div>
      <output id="base64-status" class="tool-status" aria-live="polite">ไม่มีข้อมูลถูกส่งออกจากอุปกรณ์</output>
    `;
    panel.addEventListener('click', handlePanelClick);
    container.append(panel);
  },
  unmount() {
    panel?.removeEventListener('click', handlePanelClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
