import type { ToolModule } from '../../core/tool-contract';
import { copyText, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { DATA_FORMATS, convertData, formatDataError, type DataFormat } from './logic';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const formatNames: Record<DataFormat, string> = { json: 'JSON', yaml: 'YAML', toml: 'TOML', xml: 'XML' };
const samples: Record<DataFormat, string> = {
  json: '{\n  "name": "Utility Hub",\n  "enabled": true,\n  "items": [1, 2, 3]\n}',
  yaml: 'name: Utility Hub\nenabled: true\nitems:\n  - 1\n  - 2\n  - 3\n',
  toml: 'name = "Utility Hub"\nenabled = true\nitems = [1, 2, 3]\n',
  xml: '<config>\n  <name>Utility Hub</name>\n  <enabled>true</enabled>\n  <item>1</item>\n  <item>2</item>\n  <item>3</item>\n</config>',
};

function optionMarkup(selected: DataFormat): string {
  return DATA_FORMATS.map((format) => `<option value="${format}" ${format === selected ? 'selected' : ''}>${formatNames[format]}</option>`).join('');
}

function renderWarnings(root: ParentNode, warnings: string[]): void {
  const section = root.querySelector<HTMLElement>('#data-format-warnings');
  const list = root.querySelector<HTMLUListElement>('#data-format-warning-list');
  if (!section || !list) return;
  list.replaceChildren();
  for (const warning of warnings) {
    const item = document.createElement('li');
    item.textContent = warning;
    list.append(item);
  }
  section.hidden = warnings.length === 0;
}

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-data-format-action]');
  if (!button || !panel) return;
  const source = requiredElement<HTMLTextAreaElement>(panel, '#data-format-source');
  const result = requiredElement<HTMLTextAreaElement>(panel, '#data-format-result');
  const sourceFormat = requiredElement<HTMLSelectElement>(panel, '#data-format-source-format');
  const targetFormat = requiredElement<HTMLSelectElement>(panel, '#data-format-target-format');
  const status = requiredElement<HTMLOutputElement>(panel, '#data-format-status');
  try {
    switch (button.dataset.dataFormatAction) {
      case 'convert': {
        const conversion = convertData(source.value, sourceFormat.value, targetFormat.value);
        result.value = conversion.output;
        renderWarnings(panel, conversion.warnings);
        setToolStatus(status, `แปลง ${formatNames[conversion.sourceFormat]} → ${formatNames[conversion.targetFormat]} สำเร็จ · ${formatBytes(new TextEncoder().encode(conversion.output).byteLength)} / Converted locally`, 'success');
        break;
      }
      case 'swap': {
        const previousSourceFormat = sourceFormat.value;
        sourceFormat.value = targetFormat.value;
        targetFormat.value = previousSourceFormat;
        if (result.value.trim()) {
          source.value = result.value;
          result.value = '';
          renderWarnings(panel, []);
          setToolStatus(status, 'สลับทิศทางและย้ายผลลัพธ์เป็นข้อมูลต้นฉบับแล้ว / Direction swapped locally');
        } else {
          setToolStatus(status, 'สลับทิศทางการแปลงแล้ว / Direction swapped');
        }
        source.focus();
        break;
      }
      case 'copy':
        await copyText(result.value);
        setToolStatus(status, 'คัดลอกผลลัพธ์แล้ว / Result copied', 'success');
        break;
      case 'sample':
        source.value = samples[sourceFormat.value as DataFormat];
        result.value = '';
        renderWarnings(panel, []);
        setToolStatus(status, `ใส่ข้อมูลตัวอย่าง ${formatNames[sourceFormat.value as DataFormat]} แล้ว / Sample loaded`);
        source.focus();
        break;
      case 'clear':
        source.value = '';
        result.value = '';
        renderWarnings(panel, []);
        setToolStatus(status, 'ล้างข้อมูลแล้ว / Cleared');
        source.focus();
        break;
      default:
        break;
    }
  } catch (error) {
    setToolStatus(status, formatDataError(error) || getErrorMessage(error), 'error');
  }
};

const handlePanelClick = (event: Event): void => void handleAction(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Text / Data · Local only</p><h2>แปลงรูปแบบข้อมูล / Data Format Converter</h2><p class="helper-text">แปลง JSON, YAML, TOML และ XML ใน browser โดยใช้ JSON เป็นรูปแบบกลาง</p></div></div>
      <div class="data-format-controls">
        <label class="inline-field" for="data-format-source-format">จาก / From<select id="data-format-source-format">${optionMarkup('json')}</select></label>
        <span class="data-format-arrow" aria-hidden="true">→</span>
        <label class="inline-field" for="data-format-target-format">เป็น / To<select id="data-format-target-format">${optionMarkup('yaml')}</select></label>
      </div>
      <div class="editor-grid">
        <label class="field" for="data-format-source"><span>ข้อมูลต้นฉบับ / Source data</span><textarea id="data-format-source" class="code-editor" rows="13" spellcheck="false" placeholder="วาง JSON, YAML, TOML หรือ XML ที่นี่"></textarea></label>
        <label class="field" for="data-format-result"><span>ผลลัพธ์ / Converted result</span><textarea id="data-format-result" class="code-editor" rows="13" readonly spellcheck="false" placeholder="ผลลัพธ์จะแสดงที่นี่"></textarea></label>
      </div>
      <div class="tool-actions"><button class="button button--primary" type="button" data-data-format-action="convert">แปลงข้อมูล / Convert</button><button class="button" type="button" data-data-format-action="swap">สลับทิศทาง / Swap</button><button class="button button--secondary" type="button" data-data-format-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button><button class="button" type="button" data-data-format-action="copy">คัดลอกผลลัพธ์ / Copy</button><button class="text-button" type="button" data-data-format-action="clear">ล้างข้อมูล / Clear</button></div>
      <section id="data-format-warnings" class="data-format-warnings" hidden aria-labelledby="data-format-warning-title"><h3 id="data-format-warning-title">Conversion notes</h3><ul id="data-format-warning-list"></ul></section>
      <output id="data-format-status" class="tool-status" aria-live="polite">ข้อมูลทั้งหมดอยู่ใน browser ของคุณ / Data stays in your browser.</output>
    `;
    panel.addEventListener('click', handlePanelClick);
    container.append(panel);
    requiredElement<HTMLTextAreaElement>(panel, '#data-format-source').focus();
  },
  unmount() {
    panel?.removeEventListener('click', handlePanelClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
