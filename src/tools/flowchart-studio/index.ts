import { flowchartToJson, flowchartToSvg, parseFlowchartDsl, type FlowchartModel } from '../../core/flowchart';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let model: FlowchartModel | undefined;
let svgUrl = '';

const sample = 'รับคำขอ -> ตรวจสอบข้อมูล -> ประมวลผล\nประมวลผล -> ส่งผลลัพธ์';
function clearUrl(): void { if (svgUrl) URL.revokeObjectURL(svgUrl); svgUrl = ''; }
function render(): void {
  if (!panel || !model) return;
  const svg = flowchartToSvg(model);
  requiredElement<HTMLElement>(panel, '#flowchart-preview').innerHTML = svg;
  clearUrl();
  svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}
function build(): void {
  if (!panel) return;
  try { model = parseFlowchartDsl(requiredElement<HTMLTextAreaElement>(panel, '#flowchart-dsl').value); render(); setToolStatus(requiredElement<HTMLOutputElement>(panel, '#flowchart-status'), `สร้างแผนผัง ${model.nodes.length} nodes / ${model.edges.length} edges สำเร็จ`, 'success'); }
  catch (error) { model = undefined; requiredElement<HTMLElement>(panel, '#flowchart-preview').innerHTML = ''; setToolStatus(requiredElement<HTMLOutputElement>(panel, '#flowchart-status'), getErrorMessage(error), 'error'); }
}
async function exportPng(): Promise<void> {
  if (!model || !panel) return;
  const svg = flowchartToSvg(model);
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = blobUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('สร้าง PNG ไม่สำเร็จ')), 'image/png'));
    const url = URL.createObjectURL(png); downloadUrl(url, 'flowchart.png'); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally { URL.revokeObjectURL(blobUrl); }
}

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Diagram · Local SVG</p><h2>Flowchart Studio</h2><p class="helper-text">เขียนขั้นตอนด้วยลูกศร แล้วสร้างแผนผังที่ export ได้โดยไม่ใช้ server</p></div><span class="privacy-badge">Local-only</span></div>
      <label class="field" for="flowchart-dsl"><span>ขั้นตอน / Workflow DSL</span><textarea id="flowchart-dsl" rows="8" spellcheck="false" placeholder="เริ่มต้น -> ตรวจสอบ -> เสร็จสิ้น"></textarea></label>
      <div class="tool-actions"><button id="flowchart-sample" class="button" type="button">ตัวอย่าง / Sample</button><button id="flowchart-build" class="button button--primary" type="button">สร้างแผนผัง / Render</button></div>
      <div id="flowchart-preview" class="flowchart-preview" aria-label="Flowchart preview"></div>
      <div class="tool-actions"><button id="flowchart-svg" class="button" type="button">SVG</button><button id="flowchart-png" class="button" type="button">PNG</button><button id="flowchart-json" class="button" type="button">JSON</button></div>
      <output id="flowchart-status" class="tool-status" aria-live="polite">ข้อมูลแผนผังจะอยู่ในเบราว์เซอร์ / Diagram stays in this browser</output>`;
    requiredElement<HTMLButtonElement>(panel, '#flowchart-sample').addEventListener('click', () => { requiredElement<HTMLTextAreaElement>(panel!, '#flowchart-dsl').value = sample; build(); });
    requiredElement<HTMLButtonElement>(panel, '#flowchart-build').addEventListener('click', build);
    requiredElement<HTMLButtonElement>(panel, '#flowchart-svg').addEventListener('click', () => { if (svgUrl) downloadUrl(svgUrl, 'flowchart.svg'); });
    requiredElement<HTMLButtonElement>(panel, '#flowchart-png').addEventListener('click', () => void exportPng());
    requiredElement<HTMLButtonElement>(panel, '#flowchart-json').addEventListener('click', () => { if (model) { const url = URL.createObjectURL(new Blob([flowchartToJson(model)], { type: 'application/json' })); downloadUrl(url, 'flowchart.json'); setTimeout(() => URL.revokeObjectURL(url), 1000); } });
    container.append(panel);
  },
  unmount() { clearUrl(); model = undefined; panel = undefined; },
};

export const { mount, unmount } = tool;
export { metadata };
