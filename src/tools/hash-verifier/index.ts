import { assertHashFile, compareDigest, hashText, MAX_EXPECTED_DIGEST_CHARS, normalizeDigest, type HashAlgorithm } from '../../core/hash';
import { hashAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { copyText, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let activeJob: AbortController | undefined;
let operationId = 0;
let selectedFile: File | undefined;

function currentAlgorithm(): HashAlgorithm {
  return requiredElement<HTMLSelectElement>(panel!, '#hash-algorithm').value as HashAlgorithm;
}

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#hash-calculate').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '#hash-cancel').hidden = !running;
  requiredElement<HTMLButtonElement>(panel, '#hash-reset').disabled = running;
}

function setMode(mode: 'text' | 'file'): void {
  if (!panel) return;
  activeJob?.abort();
  operationId += 1;
  if (mode === 'text') {
    selectedFile = undefined;
    requiredElement<HTMLInputElement>(panel, '#hash-file').value = '';
    requiredElement<HTMLElement>(panel, '#hash-file-meta').textContent = 'ไฟล์ทั่วไป · ไม่เกิน 40 MB / Any file · up to 40 MB';
  }
  requiredElement<HTMLElement>(panel, '#hash-text-panel').hidden = mode !== 'text';
  requiredElement<HTMLElement>(panel, '#hash-file-panel').hidden = mode !== 'file';
  panel.querySelectorAll<HTMLButtonElement>('[data-hash-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.hashMode === mode)));
}

function renderResult(algorithm: HashAlgorithm, value: string, byteLength: number, expected: string, sourceFileName?: string): void {
  if (!panel) return;
  requiredElement<HTMLElement>(panel, '#hash-result').hidden = false;
  requiredElement<HTMLElement>(panel, '#hash-digest').textContent = value;
  requiredElement<HTMLElement>(panel, '#hash-algorithm-result').textContent = algorithm;
  requiredElement<HTMLElement>(panel, '#hash-input-meta').textContent = sourceFileName ? `${sourceFileName} · ${formatBytes(byteLength)}` : `${byteLength.toLocaleString()} bytes · UTF-8 text`;
  const verdict = requiredElement<HTMLElement>(panel, '#hash-verdict');
  const expectedValue = requiredElement<HTMLElement>(panel, '#hash-expected-result');
  const normalizedExpected = expected.length > MAX_EXPECTED_DIGEST_CHARS ? '' : normalizeDigest(expected);
  expectedValue.textContent = expected.length > MAX_EXPECTED_DIGEST_CHARS
    ? 'ค่าเปรียบเทียบยาวเกินกำหนด / Expected digest too long'
    : normalizedExpected
      ? normalizedExpected.length > 160 ? `${normalizedExpected.slice(0, 160)}…` : normalizedExpected
      : 'ไม่ได้ระบุ / Not provided';
  const comparison = compareDigest(value, expected, algorithm);
  verdict.dataset.tone = comparison === 'match' ? 'success' : comparison === 'mismatch' || comparison === 'invalid-expected' ? 'warning' : 'neutral';
  verdict.textContent = comparison === 'match'
    ? 'MATCH · ตรงกัน'
    : comparison === 'mismatch'
      ? 'MISMATCH · ไม่ตรงกัน'
      : comparison === 'invalid-expected'
        ? 'INVALID EXPECTED · ค่าเปรียบเทียบไม่ถูกต้อง'
        : 'HASH READY · คำนวณแล้ว';
}

const handleFileChange = (event: Event): void => {
  if (!panel) return;
  selectedFile = (event.currentTarget as HTMLInputElement).files?.[0];
  const meta = requiredElement<HTMLElement>(panel, '#hash-file-meta');
  if (!selectedFile) {
    meta.textContent = 'ไฟล์ทั่วไป · ไม่เกิน 40 MB / Any file · up to 40 MB';
    return;
  }
  meta.textContent = `${selectedFile.name} · ${formatBytes(selectedFile.size)} · พร้อมคำนวณ / Ready to hash`;
  setToolStatus(requiredElement<HTMLOutputElement>(panel, '#hash-status'), 'เลือกไฟล์แล้ว / File selected', 'success');
};

const handleCalculate = async (): Promise<void> => {
  if (!panel) return;
  const request = ++operationId;
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  const status = requiredElement<HTMLOutputElement>(panel, '#hash-status');
  const expected = requiredElement<HTMLInputElement>(panel, '#hash-expected').value;
  const algorithm = currentAlgorithm();
  try {
    setRunning(true);
    let value: string;
    let byteLength: number;
    let sourceFileName: string | undefined;
    const mode = panel.querySelector<HTMLButtonElement>('[data-hash-mode][aria-pressed="true"]')?.dataset.hashMode ?? 'text';
    if (mode === 'file') {
      const file = selectedFile;
      if (!file) throw new Error('กรุณาเลือกไฟล์ก่อนคำนวณ / Choose a file before hashing');
      sourceFileName = file.name;
      assertHashFile(file);
      const result = await hashAsync(file, algorithm, { signal: controller.signal, onProgress: (progress, message) => setProgressStatus(status, progress, message) });
      value = result.value;
      byteLength = result.byteLength;
    } else {
      const text = requiredElement<HTMLTextAreaElement>(panel, '#hash-text').value;
      if (!text) throw new Error('กรุณาวางข้อความก่อนคำนวณ / Paste text before hashing');
      setProgressStatus(status, 45, `กำลังคำนวณ ${algorithm}`);
      const result = await hashText(text, algorithm);
      value = result.value;
      byteLength = result.byteLength;
    }
    if (!panel || request !== operationId) return;
    renderResult(algorithm, value, byteLength, expected, sourceFileName);
    setToolStatus(status, 'คำนวณ Hash ในเครื่องสำเร็จ / Hash calculated locally', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการคำนวณแล้ว / Hashing cancelled' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-hash-action]');
  if (!button || !panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#hash-status');
  try {
    switch (button.dataset.hashAction) {
      case 'calculate':
        await handleCalculate();
        break;
      case 'copy':
        await copyText(requiredElement<HTMLElement>(panel, '#hash-digest').textContent ?? '');
        setToolStatus(status, 'คัดลอก Digest แล้ว / Digest copied', 'success');
        break;
      case 'cancel':
        activeJob?.abort();
        break;
      case 'reset':
        activeJob?.abort();
        operationId += 1;
        selectedFile = undefined;
        requiredElement<HTMLTextAreaElement>(panel, '#hash-text').value = '';
        requiredElement<HTMLInputElement>(panel, '#hash-file').value = '';
        requiredElement<HTMLInputElement>(panel, '#hash-expected').value = '';
        requiredElement<HTMLElement>(panel, '#hash-file-meta').textContent = 'ไฟล์ทั่วไป · ไม่เกิน 40 MB / Any file · up to 40 MB';
        requiredElement<HTMLElement>(panel, '#hash-result').hidden = true;
        setToolStatus(status, 'ล้างข้อมูลแล้ว / Cleared');
        break;
      default:
        break;
    }
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleMode = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-hash-mode]');
  if (button?.dataset.hashMode === 'text' || button?.dataset.hashMode === 'file') setMode(button.dataset.hashMode);
};

const handlePanelClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-hash-mode]')) handleMode(event);
  else void handleAction(event);
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel p0-workbench p0-hash';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">FILE INTEGRITY · HASHING</p><h2>Hash &amp; Checksum Verifier</h2><p class="helper-text">คำนวณและเปรียบเทียบ SHA-256, SHA-384 หรือ SHA-512 ในอุปกรณ์นี้</p></div><span class="privacy-badge">Local-only · ในเครื่อง</span></div>
      <div class="p0-mode-switch" role="group" aria-label="Hash input mode"><button class="button button--secondary" type="button" data-hash-mode="text" aria-pressed="true">ข้อความ / Text</button><button class="button" type="button" data-hash-mode="file" aria-pressed="false">ไฟล์ / File</button></div>
      <div class="p0-grid">
        <section class="p0-input-card" aria-labelledby="hash-input-title"><div class="p0-card-heading"><h3 id="hash-input-title">Input</h3><span class="p0-format-hint">UTF-8 หรือไฟล์ทั่วไป</span></div><div id="hash-text-panel"><label class="field" for="hash-text"><span>ข้อความต้นฉบับ / Text</span><textarea id="hash-text" class="code-editor" spellcheck="false" placeholder="วางข้อความที่ต้องการคำนวณ / Paste text to hash"></textarea></label></div><div id="hash-file-panel" hidden><label class="file-drop" for="hash-file"><strong>เลือกไฟล์ / Choose a file</strong><span id="hash-file-meta">ไฟล์ทั่วไป · ไม่เกิน 40 MB / Any file · up to 40 MB</span><input id="hash-file" type="file" /></label></div><div class="form-row"><label class="field" for="hash-algorithm"><span>Algorithm</span><select id="hash-algorithm"><option value="SHA-256" selected>SHA-256 · แนะนำ</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select></label><label class="field" for="hash-expected"><span>Expected digest <span class="p0-optional">Optional</span></span><input id="hash-expected" type="text" spellcheck="false" placeholder="วาง checksum เพื่อเปรียบเทียบ" /></label></div><div class="tool-actions tool-actions--wrap"><button id="hash-calculate" class="button button--primary" type="button" data-hash-action="calculate">คำนวณ Hash / Calculate</button><button id="hash-cancel" class="button" type="button" data-hash-action="cancel" hidden>ยกเลิก / Cancel</button><button id="hash-reset" class="text-button" type="button" data-hash-action="reset">ล้างข้อมูล / Reset</button></div></section>
        <section id="hash-result" class="p0-result-card" hidden aria-labelledby="hash-result-title"><div class="p0-card-heading"><h3 id="hash-result-title">Result</h3><span id="hash-verdict" data-tone="neutral">ยังไม่มีผลลัพธ์ / No result</span></div><div class="p0-hash-digest"><span id="hash-algorithm-result">SHA-256</span><code id="hash-digest">—</code><button class="button" type="button" data-hash-action="copy">คัดลอก Digest / Copy</button></div><dl class="p0-metric-list"><div><dt>Input</dt><dd id="hash-input-meta">—</dd></div><div><dt>Expected</dt><dd id="hash-expected-result">ไม่ได้ระบุ / Not provided</dd></div></dl></section>
      </div>
      <section class="p0-security-note"><strong>Integrity note / ข้อควรทราบ</strong><span>Hash ใช้เปรียบเทียบข้อมูล ไม่ใช่การเข้ารหัสเพื่อความลับ / A hash checks integrity; it is not encryption</span></section>
      <output id="hash-status" class="tool-status" aria-live="polite">ข้อมูลไม่ถูกส่งออกจากอุปกรณ์ / Data stays in this browser</output>`;
    panel.querySelector<HTMLInputElement>('#hash-file')?.addEventListener('change', handleFileChange);
    panel.addEventListener('click', handlePanelClick);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLInputElement>('#hash-file')?.removeEventListener('change', handleFileChange);
    panel?.removeEventListener('click', handlePanelClick);
    selectedFile = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
