import { regexLiteral, type RegexMatch, type RegexRunResult } from '../../core/regex';
import { replaceRegexAsync, runRegexAsync } from '../../core/regex-processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, isAbortError, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let liveTimer: number | undefined;
let activeRun: AbortController | undefined;
let activeReplacement: AbortController | undefined;
let runRequest = 0;
let replacementRequest = 0;
let latestResult: RegexRunResult | undefined;

const MAX_HIGHLIGHT_MATCHES = 1_000;
const SAMPLE_PATTERN = String.raw`(?<name>[A-Za-zก-๙]+)@(?<domain>[A-Za-z0-9.-]+)`;
const SAMPLE_INPUT = 'ติดต่อ team@example.com หรือ hello@utility-hub.local';

function flags(): string {
  if (!panel) return 'g';
  return ['g', 'i', 'm', 's', 'u', 'y'].filter((flag) => requiredElement<HTMLInputElement>(panel!, `#regex-flag-${flag}`).checked).join('');
}

function updateLiteral(): void {
  if (!panel) return;
  requiredElement<HTMLElement>(panel, '#regex-literal').textContent = regexLiteral(requiredElement<HTMLInputElement>(panel, '#regex-pattern').value || 'pattern', flags());
}

function renderHighlighted(input: string, matches: RegexMatch[]): void {
  if (!panel) return;
  const target = requiredElement<HTMLElement>(panel, '#regex-highlighted');
  target.replaceChildren();
  if (!matches.length) {
    target.textContent = input || 'ผลการ highlight จะแสดงที่นี่ / Highlighted preview';
    return;
  }
  let cursor = 0;
  const visibleMatches = matches.slice(0, MAX_HIGHLIGHT_MATCHES);
  visibleMatches.forEach((match) => {
    if (match.index > cursor) target.append(document.createTextNode(input.slice(cursor, match.index)));
    const mark = document.createElement('mark');
    mark.textContent = input.slice(match.index, match.end);
    mark.dataset.matchIndex = String(match.index);
    target.append(mark);
    cursor = match.end;
  });
  if (cursor < input.length) target.append(document.createTextNode(input.slice(cursor)));
  if (visibleMatches.length < matches.length) target.append(document.createTextNode(`\n… แสดง highlight ${MAX_HIGHLIGHT_MATCHES.toLocaleString()} จาก ${matches.length.toLocaleString()} matches / Highlight capped for performance`));
}

function renderMatches(result: RegexRunResult, input: string): void {
  if (!panel) return;
  latestResult = result;
  const summary = requiredElement<HTMLElement>(panel, '#regex-summary');
  summary.textContent = `${result.matches.length.toLocaleString()} matches · ${result.durationMs.toFixed(1)} ms${result.truncated ? ' · limit reached' : ''}`;
  const list = requiredElement<HTMLElement>(panel, '#regex-match-list');
  list.replaceChildren();
  result.matches.slice(0, 100).forEach((match, index) => {
    const item = document.createElement('li');
    const content = document.createElement('div');
    const title = document.createElement('strong');
    const detail = document.createElement('span');
    title.textContent = `#${index + 1} · ${match.index}–${match.end} · ${JSON.stringify(match.text)}`;
    const groupText = match.groups.length ? ` · groups: ${match.groups.map((group) => JSON.stringify(group)).join(', ')}` : '';
    const namedText = Object.keys(match.namedGroups).length ? ` · named: ${JSON.stringify(match.namedGroups)}` : '';
    detail.textContent = `${groupText}${namedText}`;
    content.append(title, detail);
    const focus = document.createElement('button');
    focus.type = 'button';
    focus.className = 'text-button';
    focus.dataset.regexMatchIndex = String(match.index);
    focus.textContent = 'ดูตำแหน่ง / Locate';
    item.append(content, focus);
    list.append(item);
  });
  if (result.matches.length > 100) {
    const more = document.createElement('li');
    more.textContent = `แสดง 100 จาก ${result.matches.length.toLocaleString()} matches / Showing first 100`;
    list.append(more);
  }
  renderHighlighted(input, result.matches);
  requiredElement<HTMLElement>(panel, '#regex-result').hidden = false;
}

async function updateReplacement(): Promise<void> {
  if (!panel || !latestResult) return;
  const replacement = requiredElement<HTMLTextAreaElement>(panel, '#regex-replacement').value;
  const output = requiredElement<HTMLTextAreaElement>(panel, '#regex-replace-output');
  if (!replacement) {
    replacementRequest += 1;
    activeReplacement?.abort();
    output.value = '';
    return;
  }

  const request = ++replacementRequest;
  activeReplacement?.abort();
  const controller = new AbortController();
  activeReplacement = controller;
  try {
    const pattern = requiredElement<HTMLInputElement>(panel, '#regex-pattern').value;
    const input = requiredElement<HTMLTextAreaElement>(panel, '#regex-input').value;
    const result = await replaceRegexAsync(pattern, flags(), input, replacement, controller.signal);
    if (panel && request === replacementRequest) output.value = result;
  } catch (error) {
    if (!panel || request !== replacementRequest || isAbortError(error)) return;
    output.value = '';
    setToolStatus(requiredElement<HTMLOutputElement>(panel, '#regex-status'), getErrorMessage(error), 'error');
  } finally {
    if (activeReplacement === controller) activeReplacement = undefined;
  }
}

async function runCurrent(): Promise<void> {
  if (!panel) return;
  const request = ++runRequest;
  activeRun?.abort();
  const controller = new AbortController();
  activeRun = controller;
  const pattern = requiredElement<HTMLInputElement>(panel, '#regex-pattern').value;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#regex-input').value;
  try {
    const result = await runRegexAsync(pattern, flags(), input, controller.signal);
    if (!panel || request !== runRequest) return;
    renderMatches(result, input);
    await updateReplacement();
  } finally {
    if (activeRun === controller) activeRun = undefined;
  }
}

const handleInput = (): void => {
  if (!panel) return;
  updateLiteral();
  if (!requiredElement<HTMLInputElement>(panel, '#regex-auto').checked) return;
  if (liveTimer !== undefined) window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => {
    liveTimer = undefined;
    void runCurrent()
      .then(() => {
        if (panel) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#regex-status'), 'อัปเดตผลแบบ live / Live result updated', 'success');
      })
      .catch((error: unknown) => {
        if (panel && !isAbortError(error)) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#regex-status'), getErrorMessage(error), 'error');
      });
  }, 160);
};

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-regex-action]');
  if (!button || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#regex-status');
  try {
    switch (button.dataset.regexAction) {
      case 'run':
        await runCurrent();
        setToolStatus(status, 'ทดสอบ Pattern ในเครื่องสำเร็จ / Pattern tested locally', 'success');
        break;
      case 'sample':
        requiredElement<HTMLInputElement>(panel, '#regex-pattern').value = SAMPLE_PATTERN;
        requiredElement<HTMLTextAreaElement>(panel, '#regex-input').value = SAMPLE_INPUT;
        requiredElement<HTMLInputElement>(panel, '#regex-flag-g').checked = true;
        updateLiteral();
        await runCurrent();
        setToolStatus(status, 'ใส่ข้อมูลตัวอย่างแล้ว / Sample loaded', 'success');
        break;
      case 'toggle-replace': {
        const replacePanel = requiredElement<HTMLElement>(panel, '#regex-replace-panel');
        replacePanel.hidden = !replacePanel.hidden;
        if (!replacePanel.hidden) requiredElement<HTMLTextAreaElement>(panel, '#regex-replacement').focus();
        break;
      }
      case 'copy-replace':
        await copyText(requiredElement<HTMLTextAreaElement>(panel, '#regex-replace-output').value);
        setToolStatus(status, 'คัดลอกผลลัพธ์ Replace แล้ว / Replacement copied', 'success');
        break;
      case 'clear':
        activeRun?.abort();
        activeReplacement?.abort();
        runRequest += 1;
        replacementRequest += 1;
        requiredElement<HTMLInputElement>(panel, '#regex-pattern').value = '';
        requiredElement<HTMLTextAreaElement>(panel, '#regex-input').value = '';
        requiredElement<HTMLTextAreaElement>(panel, '#regex-replacement').value = '';
        requiredElement<HTMLTextAreaElement>(panel, '#regex-replace-output').value = '';
        requiredElement<HTMLElement>(panel, '#regex-result').hidden = true;
        latestResult = undefined;
        updateLiteral();
        setToolStatus(status, 'ล้างข้อมูลแล้ว / Cleared');
        requiredElement<HTMLInputElement>(panel, '#regex-pattern').focus();
        break;
      default:
        break;
    }
  } catch (error) {
    if (!isAbortError(error)) setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleMatchLocate = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-regex-match-index]');
  if (!button || !panel || !latestResult) return;
  const target = requiredElement<HTMLElement>(panel, '#regex-highlighted').querySelector<HTMLElement>(`[data-match-index="${button.dataset.regexMatchIndex}"]`);
  target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  target?.classList.add('p0-highlight-focus');
  window.setTimeout(() => target?.classList.remove('p0-highlight-focus'), 700);
};

const handlePanelClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-regex-match-index]')) handleMatchLocate(event);
  else void handleAction(event);
};

const handleReplaceInput = (): void => {
  void updateReplacement();
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel p0-workbench p0-regex';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">TEXT · PATTERN TESTING</p><h2>Regex Playground</h2><p class="helper-text">ทดลอง Regular Expression, ดู Match และ Capture Groups ใน browser นี้</p></div><span class="privacy-badge">Local-only · ในเครื่อง</span></div>
      <section class="p0-pattern-bar" aria-labelledby="regex-pattern-title"><div class="p0-card-heading"><h3 id="regex-pattern-title">Pattern</h3><span id="regex-literal" class="p0-format-hint">/pattern/g</span></div><div class="p0-pattern-input"><span aria-hidden="true">/</span><label class="visually-hidden" for="regex-pattern">Regular expression pattern</label><input id="regex-pattern" type="text" spellcheck="false" placeholder="เช่น \\b[A-Z]\\w+\\b" /><span aria-hidden="true">/</span><div class="p0-flag-group" role="group" aria-label="Regular expression flags"><label class="check-field"><input id="regex-flag-g" type="checkbox" checked /><span>g</span></label><label class="check-field"><input id="regex-flag-i" type="checkbox" /><span>i</span></label><label class="check-field"><input id="regex-flag-m" type="checkbox" /><span>m</span></label><label class="check-field"><input id="regex-flag-s" type="checkbox" /><span>s</span></label><label class="check-field"><input id="regex-flag-u" type="checkbox" /><span>u</span></label><label class="check-field"><input id="regex-flag-y" type="checkbox" /><span>y</span></label></div></div><div class="tool-actions tool-actions--wrap"><button class="button button--primary" type="button" data-regex-action="run">ทดสอบ / Run</button><label class="check-field"><input id="regex-auto" type="checkbox" /><span>Auto-run</span></label><button class="button button--secondary" type="button" data-regex-action="sample">ใช้ตัวอย่าง / Sample</button><button class="text-button" type="button" data-regex-action="clear">ล้างข้อมูล / Clear</button></div></section>
      <div class="p0-grid"><section class="p0-input-card" aria-labelledby="regex-input-title"><div class="p0-card-heading"><h3 id="regex-input-title">Test string</h3><span class="p0-format-hint">รองรับหลายบรรทัด / Multiline</span></div><label class="field" for="regex-input"><span>ข้อความทดสอบ / Input</span><textarea id="regex-input" class="text-editor" spellcheck="false" placeholder="วางข้อความที่ต้องการทดสอบ / Paste text to test"></textarea></label><section id="regex-replace-panel" class="p0-subpanel" hidden><label class="field" for="regex-replacement"><span>Replacement</span><textarea id="regex-replacement" rows="3" placeholder="ข้อความแทนที่ / Replacement text"></textarea></label><label class="field" for="regex-replace-output"><span>Replace preview <span class="p0-optional">ไม่แก้ input ต้นฉบับ</span></span><textarea id="regex-replace-output" rows="5" readonly></textarea><button class="button" type="button" data-regex-action="copy-replace">คัดลอกผลลัพธ์ / Copy result</button></label></section><button class="text-button" type="button" data-regex-action="toggle-replace">เปิด Replace preview / Show replace preview</button></section><section id="regex-result" class="p0-result-card" hidden aria-labelledby="regex-result-title"><div class="p0-card-heading"><h3 id="regex-result-title">Match results</h3><span id="regex-summary" class="p0-count">0 matches</span></div><div id="regex-highlighted" class="p0-highlighted" aria-label="Highlighted match preview">ผลการ highlight จะแสดงที่นี่ / Highlighted preview</div><ol id="regex-match-list" class="p0-match-list"></ol></section></div>
      <section class="p0-security-note"><strong>Local processing / ประมวลผลในเครื่อง</strong><span>Pattern และข้อความไม่ถูกส่งออกจากอุปกรณ์ · Patterns and text never leave this browser</span></section>
      <output id="regex-status" class="tool-status" aria-live="polite">วาง Pattern และข้อความเพื่อเริ่ม / Paste a pattern and text to begin</output>`;
    panel.addEventListener('click', handlePanelClick);
    panel.querySelectorAll<HTMLInputElement>('#regex-pattern, #regex-input, #regex-flag-g, #regex-flag-i, #regex-flag-m, #regex-flag-s, #regex-flag-u, #regex-flag-y').forEach((element) => element.addEventListener('input', handleInput));
    requiredElement<HTMLTextAreaElement>(panel, '#regex-replacement').addEventListener('input', handleReplaceInput);
    updateLiteral();
    container.append(panel);
  },
  unmount() {
    if (liveTimer !== undefined) window.clearTimeout(liveTimer);
    activeRun?.abort();
    activeReplacement?.abort();
    runRequest += 1;
    replacementRequest += 1;
    panel?.removeEventListener('click', handlePanelClick);
    panel?.querySelectorAll<HTMLInputElement>('#regex-pattern, #regex-input, #regex-flag-g, #regex-flag-i, #regex-flag-m, #regex-flag-s, #regex-flag-u, #regex-flag-y').forEach((element) => element.removeEventListener('input', handleInput));
    panel?.querySelector<HTMLTextAreaElement>('#regex-replacement')?.removeEventListener('input', handleReplaceInput);
    latestResult = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
