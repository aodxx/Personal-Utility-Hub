import { evaluateContrast, formatContrastRatio, parseColor, toHex } from '../../core/color-contrast';
import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const DEFAULT_FOREGROUND = '#1F2937';
const DEFAULT_BACKGROUND = '#FFFFFF';

function input(id: string): HTMLInputElement {
  return requiredElement<HTMLInputElement>(panel!, id);
}

function syncColor(kind: 'foreground' | 'background', value: string, source: 'picker' | 'text'): void {
  if (!panel) return;
  const normalized = value.trim();
  const picker = input(`#contrast-${kind}-picker`);
  const text = input(`#contrast-${kind}-hex`);
  if (source === 'picker') text.value = normalized.toUpperCase();
  else if (/^#[0-9a-f]{6}$/i.test(normalized)) picker.value = normalized;
  const swatch = requiredElement<HTMLElement>(panel, `#contrast-${kind}-swatch`);
  swatch.style.backgroundColor = normalized;
  swatch.setAttribute('aria-label', `${kind} ${normalized}`);
}

function setDecision(id: string, label: string, pass: boolean, threshold: string): void {
  if (!panel) return;
  const row = requiredElement<HTMLElement>(panel, id);
  row.dataset.tone = pass ? 'success' : 'warning';
  requiredElement<HTMLElement>(row, '[data-contrast-label]').textContent = `${pass ? 'PASS' : 'FAIL'} · ${label}`;
  requiredElement<HTMLElement>(row, '[data-contrast-threshold]').textContent = threshold;
}

function calculate(): void {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#contrast-status');
  const foreground = parseColor(input('#contrast-foreground-hex').value);
  const background = parseColor(input('#contrast-background-hex').value);
  const result = evaluateContrast(foreground, background);
  const foregroundHex = toHex(foreground);
  const backgroundHex = toHex(background);
  syncColor('foreground', foregroundHex, 'text');
  syncColor('background', backgroundHex, 'text');
  requiredElement<HTMLElement>(panel, '#contrast-ratio').textContent = formatContrastRatio(result.ratio);
  requiredElement<HTMLElement>(panel, '#contrast-rating').textContent = result.ratio >= 7 ? 'Excellent · ดีมาก' : result.ratio >= 4.5 ? 'Good · ดี' : result.ratio >= 3 ? 'Needs review · ควรตรวจเพิ่ม' : 'Low contrast · Contrast ต่ำ';
  setDecision('#contrast-normal-aa', 'Normal text · AA', result.normalAa, '≥ 4.5:1');
  setDecision('#contrast-normal-aaa', 'Normal text · AAA', result.normalAaa, '≥ 7:1');
  setDecision('#contrast-large-aa', 'Large text · AA', result.largeAa, '≥ 3:1');
  setDecision('#contrast-large-aaa', 'Large text · AAA', result.largeAaa, '≥ 4.5:1');
  setDecision('#contrast-nontext-aa', 'UI / non-text · AA', result.nonTextAa, '≥ 3:1');
  const preview = requiredElement<HTMLElement>(panel, '#contrast-preview');
  preview.style.color = foregroundHex;
  preview.style.backgroundColor = backgroundHex;
  requiredElement<HTMLElement>(panel, '#contrast-result').hidden = false;
  setToolStatus(status, 'ตรวจสอบ Contrast ในเครื่องสำเร็จ / Contrast checked locally', result.normalAa ? 'success' : 'warning');
}

const handleColorInput = (event: Event): void => {
  const element = event.currentTarget as HTMLInputElement;
  const kind = element.id.includes('foreground') ? 'foreground' : 'background';
  syncColor(kind, element.value, element.id.endsWith('picker') ? 'picker' : 'text');
  try { calculate(); } catch { /* Keep the inline input error until the user finishes editing. */ }
};

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-contrast-action]');
  if (!button || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#contrast-status');
  try {
    switch (button.dataset.contrastAction) {
      case 'calculate':
        calculate();
        break;
      case 'swap': {
        const foreground = input('#contrast-foreground-hex').value;
        const background = input('#contrast-background-hex').value;
        syncColor('foreground', background, 'text');
        syncColor('background', foreground, 'text');
        calculate();
        break;
      }
      case 'sample':
        syncColor('foreground', '#1F2937', 'text');
        syncColor('background', '#FFFFFF', 'text');
        calculate();
        setToolStatus(status, 'ใส่ชุดสีตัวอย่างแล้ว / Sample colors loaded', 'success');
        break;
      case 'copy-css': {
        const foreground = toHex(parseColor(input('#contrast-foreground-hex').value));
        const background = toHex(parseColor(input('#contrast-background-hex').value));
        await copyText(`color: ${foreground};\nbackground-color: ${background};`);
        setToolStatus(status, 'คัดลอก CSS แล้ว / CSS copied', 'success');
        break;
      }
      case 'reset':
        syncColor('foreground', DEFAULT_FOREGROUND, 'text');
        syncColor('background', DEFAULT_BACKGROUND, 'text');
        requiredElement<HTMLElement>(panel, '#contrast-result').hidden = true;
        setToolStatus(status, 'ล้างข้อมูลแล้ว / Reset');
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
    panel.className = 'utility-panel p0-workbench p0-contrast';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">ACCESSIBILITY · COLOR</p><h2>Color Contrast Checker</h2><p class="helper-text">ตรวจสอบความเปรียบต่างของสีตาม WCAG พร้อม preview ในอุปกรณ์นี้</p></div><span class="privacy-badge">Local-only · ในเครื่อง</span></div>
      <div class="p0-grid"><section class="p0-input-card" aria-labelledby="contrast-input-title"><div class="p0-card-heading"><h3 id="contrast-input-title">Colors</h3><span class="p0-format-hint">HEX, RGB หรือ RGBA</span></div><div class="p0-color-control"><label class="field" for="contrast-foreground-hex"><span>Foreground · สีข้อความ</span><div class="p0-color-input"><span id="contrast-foreground-swatch" class="p0-color-swatch" aria-label="foreground color"></span><input id="contrast-foreground-picker" type="color" value="#1F2937" aria-label="เลือกสี foreground" /><input id="contrast-foreground-hex" type="text" value="#1F2937" spellcheck="false" inputmode="text" /></div></label></div><button class="button p0-swap-button" type="button" data-contrast-action="swap">สลับสี / Swap colors</button><div class="p0-color-control"><label class="field" for="contrast-background-hex"><span>Background · สีพื้นหลัง</span><div class="p0-color-input"><span id="contrast-background-swatch" class="p0-color-swatch" aria-label="background color"></span><input id="contrast-background-picker" type="color" value="#FFFFFF" aria-label="เลือกสี background" /><input id="contrast-background-hex" type="text" value="#FFFFFF" spellcheck="false" inputmode="text" /></div></label></div><div class="tool-actions tool-actions--wrap"><button class="button button--primary" type="button" data-contrast-action="calculate">ตรวจสอบ / Check</button><button class="button button--secondary" type="button" data-contrast-action="sample">ใช้ตัวอย่าง / Sample</button><button class="text-button" type="button" data-contrast-action="reset">ล้างข้อมูล / Reset</button></div></section><section id="contrast-result" class="p0-result-card" hidden aria-labelledby="contrast-result-title"><div class="p0-card-heading"><h3 id="contrast-result-title">Contrast result</h3><span id="contrast-rating" class="p0-count">—</span></div><div class="p0-ratio-card"><strong id="contrast-ratio">—</strong><span>contrast ratio</span></div><div class="p0-decision-list"><div id="contrast-normal-aa" class="p0-decision-row" data-tone="neutral"><span data-contrast-label>Normal text · AA</span><strong data-contrast-threshold>≥ 4.5:1</strong></div><div id="contrast-normal-aaa" class="p0-decision-row" data-tone="neutral"><span data-contrast-label>Normal text · AAA</span><strong data-contrast-threshold>≥ 7:1</strong></div><div id="contrast-large-aa" class="p0-decision-row" data-tone="neutral"><span data-contrast-label>Large text · AA</span><strong data-contrast-threshold>≥ 3:1</strong></div><div id="contrast-large-aaa" class="p0-decision-row" data-tone="neutral"><span data-contrast-label>Large text · AAA</span><strong data-contrast-threshold>≥ 4.5:1</strong></div><div id="contrast-nontext-aa" class="p0-decision-row" data-tone="neutral"><span data-contrast-label>UI / non-text · AA</span><strong data-contrast-threshold>≥ 3:1</strong></div></div><button class="button" type="button" data-contrast-action="copy-css">คัดลอก CSS / Copy CSS</button></section></div><section id="contrast-preview" class="p0-contrast-preview" aria-labelledby="contrast-preview-title"><h3 id="contrast-preview-title">Live preview / ตัวอย่าง</h3><h4>Heading / หัวข้อ</h4><p>ข้อความตัวอย่างสำหรับตรวจความอ่านง่ายของสีและขนาดตัวอักษร</p><a href="#contrast-preview">ลิงก์ตัวอย่าง / Example link</a><button type="button">ปุ่มตัวอย่าง / Example button</button></section><section class="p0-security-note"><strong>Accessibility note / ข้อควรทราบ</strong><span>Pass นี้หมายถึง contrast check ผ่าน ไม่ใช่การรับรอง accessibility ทั้งเว็บไซต์</span></section><output id="contrast-status" class="tool-status" aria-live="polite">ข้อมูลไม่ถูกส่งออกจากอุปกรณ์ / Data stays in this browser</output>`;
    panel.addEventListener('click', handlePanelClick);
    panel.querySelectorAll<HTMLInputElement>('#contrast-foreground-picker, #contrast-foreground-hex, #contrast-background-picker, #contrast-background-hex').forEach((element) => element.addEventListener('input', handleColorInput));
    syncColor('foreground', DEFAULT_FOREGROUND, 'text');
    syncColor('background', DEFAULT_BACKGROUND, 'text');
    container.append(panel);
  },
  unmount() {
    panel?.removeEventListener('click', handlePanelClick);
    panel?.querySelectorAll<HTMLInputElement>('#contrast-foreground-picker, #contrast-foreground-hex, #contrast-background-picker, #contrast-background-hex').forEach((element) => element.removeEventListener('input', handleColorInput));
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
