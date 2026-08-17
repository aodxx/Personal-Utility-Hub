import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { countText, transformText, type TextTransform } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const updateStats = (): void => {
  if (!panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#text-input');
  const stats = countText(input.value);
  requiredElement<HTMLOutputElement>(panel, '#text-stats').textContent = `${stats.characters} ตัวอักษร · ${stats.words} คำ · ${stats.lines} บรรทัด`;
};

const handleInput = (): void => updateStats();

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-text-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#text-input');
  const status = requiredElement<HTMLOutputElement>(panel, '#text-status');
  const action = button.dataset.textAction;
  try {
    if (action === 'copy') {
      await copyText(input.value);
      setToolStatus(status, 'คัดลอกข้อความแล้ว', 'success');
    } else if (action === 'sample') {
      input.value = '  Personal Utility Hub  \n\n  Local processing   keeps files on your device.  ';
      updateStats();
      setToolStatus(status, 'ใส่ข้อมูลตัวอย่างแล้ว / Sample data loaded', 'success');
      input.focus();
    } else if (action === 'clear') {
      input.value = '';
      updateStats();
      setToolStatus(status, 'ล้างข้อความแล้ว');
      input.focus();
    } else if (action) {
      input.value = transformText(input.value, action as TextTransform);
      updateStats();
      setToolStatus(status, 'จัดรูปแบบข้อความสำเร็จ', 'success');
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
        <div><p class="eyebrow">Text cleanup</p><h2>จัดระเบียบข้อความ</h2></div>
        <output id="text-stats" class="result-count" aria-live="polite">0 ตัวอักษร · 0 คำ · 0 บรรทัด</output>
      </div>
      <label class="field" for="text-input"><span>ข้อความ</span>
        <textarea id="text-input" class="text-editor" placeholder="วางหรือพิมพ์ข้อความที่นี่"></textarea>
      </label>
      <div class="tool-actions tool-actions--wrap">
        <button class="button button--primary" type="button" data-text-action="trim-lines">ตัดช่องว่างหัว–ท้าย</button>
        <button class="button" type="button" data-text-action="collapse-spaces">รวมช่องว่างซ้ำ</button>
        <button class="button" type="button" data-text-action="remove-blank-lines">ลบบรรทัดว่าง</button>
        <button class="button" type="button" data-text-action="uppercase">ตัวพิมพ์ใหญ่</button>
        <button class="button" type="button" data-text-action="lowercase">ตัวพิมพ์เล็ก</button>
        <button class="button" type="button" data-text-action="copy">คัดลอก</button>
        <button class="button button--secondary" type="button" data-text-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button>
        <button class="text-button" type="button" data-text-action="clear">ล้างข้อมูล</button>
      </div>
      <output id="text-status" class="tool-status" aria-live="polite">พร้อมจัดรูปแบบข้อความในอุปกรณ์</output>
    `;
    const input = requiredElement<HTMLTextAreaElement>(panel, '#text-input');
    input.addEventListener('input', handleInput);
    panel.addEventListener('click', handlePanelClick);
    container.append(panel);
  },
  unmount() {
    panel?.querySelector<HTMLTextAreaElement>('#text-input')?.removeEventListener('input', handleInput);
    panel?.removeEventListener('click', handlePanelClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
