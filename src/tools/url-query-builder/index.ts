import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { buildUrl, formatQueryEntries, parseUrl } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-url-query-action]');
  if (!button || !panel) return;
  const url = requiredElement<HTMLInputElement>(panel, '#url-query-url');
  const base = requiredElement<HTMLInputElement>(panel, '#url-query-base');
  const params = requiredElement<HTMLTextAreaElement>(panel, '#url-query-params');
  const hash = requiredElement<HTMLInputElement>(panel, '#url-query-hash');
  const result = requiredElement<HTMLInputElement>(panel, '#url-query-result');
  const status = requiredElement<HTMLOutputElement>(panel, '#url-query-status');
  try {
    switch (button.dataset.urlQueryAction) {
      case 'parse': {
        const parsed = parseUrl(url.value);
        base.value = parsed.base;
        params.value = formatQueryEntries(parsed.entries);
        hash.value = parsed.hash;
        result.value = url.value.trim();
        setToolStatus(status, 'แยก URL และ query สำเร็จ / URL parsed locally', 'success');
        break;
      }
      case 'build':
        result.value = buildUrl(base.value, params.value, hash.value);
        setToolStatus(status, 'ประกอบ URL สำเร็จ / URL built locally', 'success');
        break;
      case 'swap':
        url.value = result.value;
        setToolStatus(status, 'ย้ายผลลัพธ์ไปช่อง URL แล้ว');
        url.focus();
        break;
      case 'copy':
        await copyText(result.value);
        setToolStatus(status, 'คัดลอก URL แล้ว / URL copied', 'success');
        break;
      case 'sample':
        url.value = 'https://example.com/search?q=ชุมชน&tag=a&tag=b#results';
        result.value = '';
        setToolStatus(status, 'ใส่ URL ตัวอย่างแล้ว / Sample URL loaded', 'success');
        url.focus();
        break;
      case 'clear':
        url.value = '';
        base.value = '';
        params.value = '';
        hash.value = '';
        result.value = '';
        setToolStatus(status, 'ล้างข้อมูลแล้ว');
        url.focus();
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
      <div class="utility-panel__header"><div><p class="eyebrow">Text / Data · Local only</p><h2>สร้างและแก้ไข URL Query String</h2><p class="helper-text">แยก query parameters, แก้ค่า แล้วประกอบ URL กลับ โดยไม่ส่งข้อมูลออกจาก browser</p></div></div>
      <label class="field" for="url-query-url"><span>URL ต้นฉบับ / Source URL</span><input id="url-query-url" type="url" placeholder="https://example.com/search?q=hello#results" /></label>
      <div class="tool-actions"><button class="button button--primary" type="button" data-url-query-action="parse">แยก URL / Parse</button><button class="button button--secondary" type="button" data-url-query-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button></div>
      <div class="editor-grid">
        <label class="field" for="url-query-base"><span>Base URL หรือ path</span><input id="url-query-base" type="text" placeholder="https://example.com/search" /></label>
        <label class="field" for="url-query-hash"><span>Hash fragment</span><input id="url-query-hash" type="text" placeholder="results" /></label>
      </div>
      <label class="field" for="url-query-params"><span>Query parameters / หนึ่งบรรทัดต่อหนึ่ง key=value</span><textarea id="url-query-params" class="code-editor" rows="7" spellcheck="false" placeholder="q=hello\ntag=one\ntag=two"></textarea></label>
      <div class="tool-actions"><button class="button button--primary" type="button" data-url-query-action="build">ประกอบ URL / Build</button><button class="button" type="button" data-url-query-action="swap">ย้ายผลลัพธ์กลับ</button><button class="button" type="button" data-url-query-action="copy">คัดลอก</button><button class="text-button" type="button" data-url-query-action="clear">ล้างข้อมูล</button></div>
      <label class="field" for="url-query-result"><span>ผลลัพธ์ / Result</span><input id="url-query-result" type="text" readonly placeholder="ผลลัพธ์จะแสดงที่นี่" /></label>
      <output id="url-query-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ใน browser ของคุณ / Data stays in your browser.</output>
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
