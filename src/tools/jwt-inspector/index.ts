import { formatJwtClaimValue, inspectJwt, type JwtInspection } from '../../core/jwt';
import type { ToolModule } from '../../core/tool-contract';
import { copyText, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dGlsaXR5LWh1YiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo0MTAyNDQ0ODAwLCJyb2xlIjoidmlld2VyIn0.demo-signature';

function jsonText(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

function setTone(element: HTMLElement, tone: string): void {
  element.dataset.tone = tone;
}

function addClaimRow(table: HTMLElement, key: string, value: string, readable = ''): void {
  const row = document.createElement('tr');
  const keyCell = document.createElement('th');
  const valueCell = document.createElement('td');
  const readableCell = document.createElement('td');
  keyCell.scope = 'row';
  keyCell.textContent = key;
  valueCell.textContent = value;
  readableCell.textContent = readable;
  row.append(keyCell, valueCell, readableCell);
  table.append(row);
}

function renderInspection(inspection: JwtInspection): void {
  if (!panel) return;
  requiredElement<HTMLTextAreaElement>(panel, '#jwt-header').value = jsonText(inspection.header);
  requiredElement<HTMLTextAreaElement>(panel, '#jwt-payload').value = jsonText(inspection.payload);
  const claims = requiredElement<HTMLElement>(panel, '#jwt-claims-body');
  claims.replaceChildren();
  inspection.claims.forEach((claim) => addClaimRow(claims, claim.key, formatJwtClaimValue(claim.value), claim.readable ?? ''));

  const expiry = requiredElement<HTMLElement>(panel, '#jwt-expiry');
  const expiryText = inspection.expiryStatus === 'valid'
    ? `ยังไม่หมดอายุ / Expires ${inspection.expiresAt}`
    : inspection.expiryStatus === 'expired'
      ? `หมดอายุแล้ว / Expired ${inspection.expiresAt}`
      : inspection.expiryStatus === 'invalid'
        ? 'ค่า exp ไม่ถูกต้อง / Invalid exp'
        : 'ไม่มี exp claim / No expiry claim';
  expiry.textContent = expiryText;
  setTone(expiry, inspection.expiryStatus === 'valid' ? 'success' : inspection.expiryStatus === 'expired' || inspection.expiryStatus === 'invalid' ? 'warning' : 'neutral');

  requiredElement<HTMLElement>(panel, '#jwt-summary-meta').textContent = `${inspection.segments} segments · ${inspection.algorithm} · ${inspection.tokenType}`;
  requiredElement<HTMLElement>(panel, '#jwt-claims-count').textContent = `${inspection.claims.length} claims`;
  const warnings = requiredElement<HTMLElement>(panel, '#jwt-warning-list');
  warnings.replaceChildren();
  inspection.warnings.forEach((warning) => {
    const item = document.createElement('li');
    item.textContent = warning;
    warnings.append(item);
  });
  requiredElement<HTMLTextAreaElement>(panel, '#jwt-claims-json').value = JSON.stringify(inspection.payload, null, 2);
  requiredElement<HTMLElement>(panel, '#jwt-result').hidden = false;
}

async function copyValue(value: string, message: string): Promise<void> {
  if (!value) throw new Error('ยังไม่มีผลลัพธ์ให้คัดลอก / Nothing to copy yet');
  await copyText(value);
  if (panel) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#jwt-status'), message, 'success');
}

const handleAction = async (event: Event): Promise<void> => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-jwt-action]');
  if (!button || !panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#jwt-input');
  const status = requiredElement<HTMLOutputElement>(panel, '#jwt-status');
  try {
    switch (button.dataset.jwtAction) {
      case 'inspect':
        renderInspection(inspectJwt(input.value));
        setToolStatus(status, 'ถอดโครงสร้าง JWT ในเครื่องสำเร็จ / JWT decoded locally', 'success');
        break;
      case 'sample':
        input.value = SAMPLE_JWT;
        input.focus();
        setToolStatus(status, 'ใส่ JWT ตัวอย่างแล้ว / Sample JWT loaded', 'success');
        break;
      case 'copy-header':
        await copyValue(requiredElement<HTMLTextAreaElement>(panel, '#jwt-header').value, 'คัดลอก Header แล้ว / Header copied');
        break;
      case 'copy-payload':
        await copyValue(requiredElement<HTMLTextAreaElement>(panel, '#jwt-payload').value, 'คัดลอก Payload แล้ว / Payload copied');
        break;
      case 'copy-claims':
        await copyValue(requiredElement<HTMLTextAreaElement>(panel, '#jwt-claims-json').value, 'คัดลอก Claims แล้ว / Claims copied');
        break;
      case 'clear':
        input.value = '';
        requiredElement<HTMLElement>(panel, '#jwt-result').hidden = true;
        setToolStatus(status, 'ล้างข้อมูลแล้ว / Cleared');
        input.focus();
        break;
      default:
        break;
    }
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleTab = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-jwt-tab]');
  if (!button || !panel) return;
  const tab = button.dataset.jwtTab;
  panel.querySelectorAll<HTMLButtonElement>('[data-jwt-tab]').forEach((item) => item.setAttribute('aria-selected', String(item === button)));
  panel.querySelectorAll<HTMLElement>('[data-jwt-tab-panel]').forEach((item) => { item.hidden = item.dataset.jwtTabPanel !== tab; });
};

const handlePanelClick = (event: Event): void => {
  if ((event.target as HTMLElement).closest('[data-jwt-tab]')) handleTab(event);
  else void handleAction(event);
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel p0-workbench p0-jwt';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">AUTH · TOKEN INSPECTION</p><h2>JWT Inspector</h2><p class="helper-text">ดู Header, Payload และ Claims ในอุปกรณ์นี้ โดยไม่ verify หรืออัปโหลด Token</p></div><span class="privacy-badge">Local-only · ในเครื่อง</span></div>
      <div class="p0-grid">
        <section class="p0-input-card" aria-labelledby="jwt-input-title"><div class="p0-card-heading"><h3 id="jwt-input-title">Encoded Token</h3><span class="p0-format-hint">xxxxx.yyyyy.zzzzz</span></div><label class="field" for="jwt-input"><span>JWT / Token</span><textarea id="jwt-input" class="code-editor p0-token-editor" spellcheck="false" placeholder="วาง JWT ที่นี่ / Paste a JWT here"></textarea></label><div class="tool-actions tool-actions--wrap"><button class="button button--primary" type="button" data-jwt-action="inspect">ตรวจสอบ Token / Inspect</button><button class="button button--secondary" type="button" data-jwt-action="sample">ใช้ตัวอย่าง / Sample</button><button class="text-button" type="button" data-jwt-action="clear">ล้างข้อมูล / Clear</button></div></section>
        <section id="jwt-result" class="p0-result-card" hidden aria-labelledby="jwt-result-title"><div class="p0-card-heading"><h3 id="jwt-result-title">Token Summary</h3><span id="jwt-claims-count" class="p0-count">0 claims</span></div><div class="p0-summary-strip"><strong id="jwt-summary-meta">—</strong><span id="jwt-expiry" data-tone="neutral">ยังไม่มีผลลัพธ์ / No result</span></div><div class="p0-tabs" role="tablist" aria-label="JWT result views"><button class="p0-tab" type="button" role="tab" aria-selected="true" data-jwt-tab="header">Header</button><button class="p0-tab" type="button" role="tab" aria-selected="false" data-jwt-tab="payload">Payload</button><button class="p0-tab" type="button" role="tab" aria-selected="false" data-jwt-tab="claims">Claims</button></div><div data-jwt-tab-panel="header"><label class="field" for="jwt-header"><span>Header JSON <button class="text-button" type="button" data-jwt-action="copy-header">คัดลอก / Copy</button></span><textarea id="jwt-header" class="code-editor p0-output-editor" readonly></textarea></label></div><div data-jwt-tab-panel="payload" hidden><label class="field" for="jwt-payload"><span>Payload JSON <button class="text-button" type="button" data-jwt-action="copy-payload">คัดลอก / Copy</button></span><textarea id="jwt-payload" class="code-editor p0-output-editor" readonly></textarea></label></div><div data-jwt-tab-panel="claims" hidden><div class="p0-table-wrap"><table class="p0-claims-table"><thead><tr><th scope="col">Claim</th><th scope="col">Value</th><th scope="col">Readable</th></tr></thead><tbody id="jwt-claims-body"></tbody></table></div><textarea id="jwt-claims-json" class="visually-hidden" aria-hidden="true" readonly></textarea><button class="text-button" type="button" data-jwt-action="copy-claims">คัดลอก JSON / Copy JSON</button></div></section>
      </div>
      <section class="p0-security-note" aria-labelledby="jwt-security-title"><strong id="jwt-security-title">Security note / ข้อควรระวัง</strong><span>Decoded ≠ cryptographically verified · การถอดข้อมูลไม่ใช่การยืนยันลายเซ็น</span><ul id="jwt-warning-list"><li>ยังไม่มีข้อมูล / No token inspected</li></ul></section>
      <output id="jwt-status" class="tool-status" aria-live="polite">ข้อมูลไม่ถูกส่งออกจากอุปกรณ์ / Data stays in this browser</output>`;
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
