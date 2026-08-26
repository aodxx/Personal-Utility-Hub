import type { ToolModule } from '../../core/tool-contract';
import { copyText, downloadUrl, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { defaultExpandedIds, graphNodeCount, jsonTreeToText, parseJsonTree, renderJsonGraphSvg, type JsonTreeModel } from '../../core/json-visualizer';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let model: JsonTreeModel | undefined;
let expandedIds = new Set<string>();
let graphUrl = '';

const sample = JSON.stringify({
  name: 'Utility Hub',
  privacy: { localOnly: true, storage: 'none' },
  tools: ['JSON Formatter', 'Data Converter', 'Graph Viewer'],
  release: { version: '0.13.0', beta: true },
}, null, 2);

function clearGraphUrl(): void {
  if (!graphUrl) return;
  URL.revokeObjectURL(graphUrl);
  graphUrl = '';
}

function status(): HTMLOutputElement | undefined {
  return panel?.querySelector<HTMLOutputElement>('#json-visualizer-status') ?? undefined;
}

function renderTree(): void {
  if (!panel || !model) return;
  const list = requiredElement<HTMLOListElement>(panel, '#json-visualizer-tree');
  const query = requiredElement<HTMLInputElement>(panel, '#json-visualizer-search').value;
  list.replaceChildren();
  const nodes = model.nodes.filter((node) => {
    const visible = node === model?.root || expandedIds.has(node.parentId ?? '') || !node.parentId;
    if (!visible) return false;
    let ancestor = node.parentId;
    while (ancestor) {
      if (!expandedIds.has(ancestor)) return false;
      ancestor = model?.nodes.find((candidate) => candidate.id === ancestor)?.parentId;
    }
    if (!query.trim()) return true;
    const term = query.trim().toLocaleLowerCase();
    return [node.path, node.label, node.valuePreview].some((value) => value.toLocaleLowerCase().includes(term));
  });
  for (const node of nodes) {
    const item = document.createElement('li');
    item.className = 'json-visualizer-tree__item';
    item.style.setProperty('--tree-depth', String(node.depth));
    const row = document.createElement('div');
    row.className = 'json-visualizer-tree__row';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'text-button json-visualizer-tree__toggle';
    toggle.dataset.jsonVisualizerAction = 'toggle';
    toggle.dataset.jsonVisualizerNode = node.id;
    toggle.disabled = node.children.length === 0;
    toggle.setAttribute('aria-expanded', String(expandedIds.has(node.id)));
    toggle.textContent = node.children.length === 0 ? '•' : expandedIds.has(node.id) ? '−' : '+';
    row.append(toggle);
    const label = document.createElement('strong');
    label.textContent = node.label;
    row.append(label);
    const kind = document.createElement('span');
    kind.className = 'json-visualizer-tree__kind';
    kind.textContent = node.kind;
    row.append(kind);
    const value = document.createElement('code');
    value.textContent = node.valuePreview;
    row.append(value);
    item.append(row);
    const path = document.createElement('small');
    path.textContent = node.path;
    item.append(path);
    list.append(item);
  }
  if (!nodes.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'ไม่พบ node ที่ตรงกับคำค้น / No matching nodes';
    list.append(empty);
  }
}

function renderGraph(): void {
  if (!panel || !model) return;
  const graph = requiredElement<HTMLElement>(panel, '#json-visualizer-graph');
  const query = requiredElement<HTMLInputElement>(panel, '#json-visualizer-search').value;
  graph.innerHTML = renderJsonGraphSvg(model, expandedIds, query);
}

function renderViews(): void {
  renderTree();
  renderGraph();
  if (model) {
    const count = graphNodeCount(model, expandedIds, requiredElement<HTMLInputElement>(panel!, '#json-visualizer-search').value);
    setToolStatus(status()!, `${model.nodes.length} nodes · ${count} visible / ${model.maxDepth} levels`, 'success');
  }
}

function build(): void {
  if (!panel) return;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#json-visualizer-input');
  const graph = requiredElement<HTMLElement>(panel, '#json-visualizer-graph');
  try {
    model = parseJsonTree(input.value);
    expandedIds = defaultExpandedIds(model);
    clearGraphUrl();
    renderViews();
  } catch (error) {
    model = undefined;
    expandedIds.clear();
    graph.replaceChildren();
    setToolStatus(status()!, getErrorMessage(error), 'error');
  }
}

async function exportPng(): Promise<void> {
  if (!model || !panel) return;
  const svg = renderJsonGraphSvg(model, expandedIds, requiredElement<HTMLInputElement>(panel, '#json-visualizer-search').value);
  const dimensions = svg.match(/<svg[^>]* width="(\d+)" height="(\d+)"/u);
  const width = Number(dimensions?.[1] ?? 720);
  const height = Number(dimensions?.[2] ?? 260);
  const sourceUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas สำหรับ export PNG / Canvas is unavailable');
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('สร้าง PNG ไม่สำเร็จ / PNG export failed')), 'image/png'));
    const url = URL.createObjectURL(png);
    downloadUrl(url, 'json-visualizer.png');
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToolStatus(status()!, 'ส่งออก PNG แล้ว / PNG exported', 'success');
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

const handleAction = async (event: Event): Promise<void> => {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLButtonElement>('[data-json-visualizer-action]');
  if (!button || !panel) return;
  try {
    const action = button.dataset.jsonVisualizerAction;
    if (action === 'toggle') {
      const nodeId = button.dataset.jsonVisualizerNode;
      if (nodeId) {
        if (expandedIds.has(nodeId)) expandedIds.delete(nodeId);
        else expandedIds.add(nodeId);
        renderViews();
      }
    } else if (action === 'sample') {
      requiredElement<HTMLTextAreaElement>(panel, '#json-visualizer-input').value = sample;
      build();
    } else if (action === 'render') {
      build();
    } else if (action === 'expand-all' && model) {
      expandedIds = defaultExpandedIds(model);
      renderViews();
    } else if (action === 'collapse-all' && model) {
      expandedIds.clear();
      expandedIds.add(model.root.id);
      renderViews();
    } else if (action === 'copy-tree' && model) {
      await copyText(jsonTreeToText(model));
      setToolStatus(status()!, 'คัดลอก tree summary แล้ว / Tree summary copied', 'success');
    } else if (action === 'export-svg' && model) {
      clearGraphUrl();
      const svg = renderJsonGraphSvg(model, expandedIds, requiredElement<HTMLInputElement>(panel, '#json-visualizer-search').value);
      graphUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      downloadUrl(graphUrl, 'json-visualizer.svg');
      window.setTimeout(clearGraphUrl, 1000);
      setToolStatus(status()!, 'ส่งออก SVG แล้ว / SVG exported', 'success');
    } else if (action === 'export-png') {
      await exportPng();
    } else if (action === 'clear') {
      requiredElement<HTMLTextAreaElement>(panel, '#json-visualizer-input').value = '';
      requiredElement<HTMLElement>(panel, '#json-visualizer-tree').replaceChildren();
      requiredElement<HTMLElement>(panel, '#json-visualizer-graph').replaceChildren();
      model = undefined;
      expandedIds.clear();
      clearGraphUrl();
      setToolStatus(status()!, 'ล้างข้อมูลแล้ว / Cleared');
    }
  } catch (error) {
    setToolStatus(status()!, getErrorMessage(error), 'error');
  }
};

const handleInput = (): void => {
  if (!panel || !model) return;
  renderViews();
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">JSON · Local graph</p><h2>สำรวจ JSON / JSON Visualizer</h2><p class="helper-text">สำรวจโครงสร้าง JSON แบบ tree และ graph แล้ว export เป็น SVG หรือ PNG โดยไม่ส่งข้อมูลออกจากเครื่อง</p></div><span class="privacy-badge">Local-only</span></div>
      <label class="field" for="json-visualizer-input"><span>JSON ต้นฉบับ / JSON input</span><textarea id="json-visualizer-input" class="code-editor" spellcheck="false" placeholder='{"name":"Utility Hub","tools":[]}'></textarea></label>
      <div class="tool-actions tool-actions--wrap"><button class="button button--primary" type="button" data-json-visualizer-action="render">สร้างภาพ / Visualize</button><button class="button" type="button" data-json-visualizer-action="sample">ลองข้อมูลตัวอย่าง / Try sample</button><button class="text-button" type="button" data-json-visualizer-action="clear">ล้างข้อมูล / Clear</button></div>
      <div class="json-visualizer-controls"><label class="inline-field" for="json-visualizer-search">ค้นหา path, key หรือ value / Search<input id="json-visualizer-search" type="search" placeholder="เช่น tools หรือ $.privacy"></label><div class="tool-actions tool-actions--wrap"><button class="button" type="button" data-json-visualizer-action="expand-all">ขยายทั้งหมด / Expand all</button><button class="button" type="button" data-json-visualizer-action="collapse-all">ย่อทั้งหมด / Collapse all</button></div></div>
      <div class="json-visualizer-layout"><section class="json-visualizer-tree-panel" aria-labelledby="json-visualizer-tree-title"><div class="tool-section-heading"><h3 id="json-visualizer-tree-title">Tree view</h3><span class="helper-text">กด +/− เพื่อสำรวจระดับข้อมูล</span></div><ol id="json-visualizer-tree" class="json-visualizer-tree"></ol></section><section class="json-visualizer-graph-panel" aria-labelledby="json-visualizer-graph-title"><div class="tool-section-heading"><h3 id="json-visualizer-graph-title">Graph view</h3><span class="helper-text">Deterministic parent-child layout</span></div><div id="json-visualizer-graph" class="json-visualizer-graph" aria-label="JSON graph preview"></div></section></div>
      <div class="tool-actions tool-actions--wrap"><button class="button" type="button" data-json-visualizer-action="copy-tree">คัดลอก tree summary / Copy</button><button class="button" type="button" data-json-visualizer-action="export-svg">ส่งออก SVG / Export SVG</button><button class="button" type="button" data-json-visualizer-action="export-png">ส่งออก PNG / Export PNG</button></div>
      <output id="json-visualizer-status" class="tool-status" aria-live="polite">ข้อมูลจะถูกประมวลผลในเบราว์เซอร์ / Data stays in this browser</output>`;
    panel.addEventListener('click', handleAction);
    requiredElement<HTMLInputElement>(panel, '#json-visualizer-search').addEventListener('input', handleInput);
    container.append(panel);
    requiredElement<HTMLTextAreaElement>(panel, '#json-visualizer-input').focus();
  },
  unmount() {
    panel?.removeEventListener('click', handleAction);
    panel?.querySelector<HTMLInputElement>('#json-visualizer-search')?.removeEventListener('input', handleInput);
    clearGraphUrl();
    model = undefined;
    expandedIds.clear();
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
