import { generateJsonLd, jsonLdScript, type JsonLdFields, type JsonLdType } from '../../core/json-ld';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let outputUrl = '';

function fields(): JsonLdFields {
  return {
    name: requiredElement<HTMLInputElement>(panel!, '#ld-name').value,
    description: requiredElement<HTMLTextAreaElement>(panel!, '#ld-description').value,
    url: requiredElement<HTMLInputElement>(panel!, '#ld-url').value,
    image: requiredElement<HTMLInputElement>(panel!, '#ld-image').value,
    author: requiredElement<HTMLInputElement>(panel!, '#ld-author').value,
    price: requiredElement<HTMLInputElement>(panel!, '#ld-price').value,
    currency: requiredElement<HTMLInputElement>(panel!, '#ld-currency').value,
    faq: requiredElement<HTMLTextAreaElement>(panel!, '#ld-faq').value,
    breadcrumbs: requiredElement<HTMLTextAreaElement>(panel!, '#ld-breadcrumbs').value,
  };
}
function clearOutput(): void { if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = ''; }
function updateFields(type: JsonLdType): void {
  if (!panel) return;
  requiredElement<HTMLElement>(panel, '#ld-author-row').hidden = type !== 'Article';
  requiredElement<HTMLElement>(panel, '#ld-price-row').hidden = type !== 'Product';
  requiredElement<HTMLElement>(panel, '#ld-faq-row').hidden = type !== 'FAQPage';
  requiredElement<HTMLElement>(panel, '#ld-breadcrumb-row').hidden = type !== 'BreadcrumbList';
}
const generate = (): void => {
  if (!panel) return;
  clearOutput();
  const status = requiredElement<HTMLOutputElement>(panel, '#ld-status');
  try {
    const type = requiredElement<HTMLSelectElement>(panel, '#ld-type').value as JsonLdType;
    const json = generateJsonLd(type, fields());
    const pretty = JSON.stringify(json, null, 2);
    requiredElement<HTMLTextAreaElement>(panel, '#ld-output').value = pretty;
    requiredElement<HTMLTextAreaElement>(panel, '#ld-script').value = jsonLdScript(json);
    requiredElement<HTMLElement>(panel, '#ld-result').hidden = false;
    outputUrl = URL.createObjectURL(new Blob([pretty], { type: 'application/ld+json' }));
    setToolStatus(status, 'สร้าง JSON-LD สำเร็จ / JSON-LD generated', 'success');
  } catch (error) { setToolStatus(status, getErrorMessage(error), 'error'); }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">SEO · Structured data</p><h2>JSON-LD Generator</h2><p class="helper-text">สร้าง structured data ในเครื่องสำหรับ Schema.org และตรวจ URL ก่อน export</p></div><span class="privacy-badge">Local-only</span></div>
      <div class="form-row"><label class="field" for="ld-type"><span>Schema type</span><select id="ld-type"><option>Article</option><option>Product</option><option>Organization</option><option>FAQPage</option><option>BreadcrumbList</option></select></label><div></div></div>
      <div class="form-row"><label class="field" for="ld-name"><span>Name / Title</span><input id="ld-name" type="text" /></label><label class="field" for="ld-url"><span>URL</span><input id="ld-url" type="url" placeholder="https://example.com/page" /></label></div>
      <label class="field" for="ld-description"><span>Description</span><textarea id="ld-description" rows="3"></textarea></label>
      <div class="form-row"><label class="field" for="ld-image"><span>Image URL</span><input id="ld-image" type="url" /></label><div id="ld-author-row"><label class="field" for="ld-author"><span>Author</span><input id="ld-author" type="text" /></label></div></div>
      <div id="ld-price-row" class="form-row" hidden><label class="field" for="ld-price"><span>Price</span><input id="ld-price" type="number" min="0" step="0.01" /></label><label class="field" for="ld-currency"><span>Currency</span><input id="ld-currency" value="THB" maxlength="3" /></label></div>
      <label id="ld-faq-row" class="field" hidden for="ld-faq"><span>FAQ lines: คำถาม::คำตอบ</span><textarea id="ld-faq" rows="5"></textarea></label>
      <label id="ld-breadcrumb-row" class="field" hidden for="ld-breadcrumbs"><span>Breadcrumb lines: ชื่อ::URL</span><textarea id="ld-breadcrumbs" rows="5"></textarea></label>
      <div class="tool-actions"><button id="ld-generate" class="button button--primary" type="button">สร้าง JSON-LD / Generate</button></div>
      <section id="ld-result" class="result-card" hidden><label class="field"><span>JSON</span><textarea id="ld-output" rows="10" readonly></textarea></label><label class="field"><span>Script tag</span><textarea id="ld-script" rows="8" readonly></textarea></label><div class="tool-actions"><button id="ld-copy" class="button" type="button">คัดลอก / Copy</button><button id="ld-download" class="button" type="button">ดาวน์โหลด / Download</button></div></section>
      <output id="ld-status" class="tool-status" aria-live="polite">ข้อมูลจะถูกสร้างในเบราว์เซอร์ / Data stays in this browser</output>`;
    const type = requiredElement<HTMLSelectElement>(panel, '#ld-type');
    type.addEventListener('change', () => updateFields(type.value as JsonLdType));
    requiredElement<HTMLButtonElement>(panel, '#ld-generate').addEventListener('click', generate);
    requiredElement<HTMLButtonElement>(panel, '#ld-copy').addEventListener('click', async () => { await navigator.clipboard?.writeText(requiredElement<HTMLTextAreaElement>(panel!, '#ld-output').value); setToolStatus(requiredElement<HTMLOutputElement>(panel!, '#ld-status'), 'คัดลอกแล้ว / Copied', 'success'); });
    requiredElement<HTMLButtonElement>(panel, '#ld-download').addEventListener('click', () => { if (outputUrl) downloadUrl(outputUrl, 'schema.jsonld'); });
    updateFields('Article');
    container.append(panel);
  },
  unmount() { clearOutput(); panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
