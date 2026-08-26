export interface FlowNode { id: string; label: string; x: number; y: number; }
export interface FlowEdge { from: string; to: string; }
export interface FlowchartModel { nodes: FlowNode[]; edges: FlowEdge[]; }

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));
}

export function parseFlowchartDsl(input: string): FlowchartModel {
  const edges: FlowEdge[] = [];
  const labels = new Map<string, string>();
  const labelIds = new Map<string, string>();
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error('กรุณาระบุขั้นตอนอย่างน้อยหนึ่งบรรทัด');
  for (const line of lines) {
    const parts = line.split(/\s*(?:->|→)\s*/).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 1) continue;
    const ids = parts.map((label) => {
      const existing = labelIds.get(label);
      if (existing) return existing;
      const base = label.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-|-$/g, '') || `node-${labels.size + 1}`;
      let id = base;
      let suffix = 2;
      while (labels.has(id)) { id = `${base}-${suffix}`; suffix += 1; }
      labelIds.set(label, id);
      labels.set(id, label);
      return id;
    });
    for (let index = 1; index < ids.length; index += 1) edges.push({ from: ids[index - 1]!, to: ids[index]! });
  }
  const uniqueEdges = edges.filter((edge, index, all) => all.findIndex((item) => item.from === edge.from && item.to === edge.to) === index);
  const ids = [...labels.keys()];
  const nodes = ids.map((id, index) => ({ id, label: labels.get(id) ?? id, x: 80 + (index % 3) * 250, y: 80 + Math.floor(index / 3) * 130 }));
  return { nodes, edges: uniqueEdges };
}

export function flowchartToSvg(model: FlowchartModel): string {
  const width = Math.max(720, Math.max(...model.nodes.map((node) => node.x), 0) + 220);
  const height = Math.max(260, Math.max(...model.nodes.map((node) => node.y), 0) + 120);
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const edgeSvg = model.edges.map((edge) => {
    const from = byId.get(edge.from); const to = byId.get(edge.to);
    if (!from || !to) return '';
    return `<path d="M ${from.x + 160} ${from.y + 40} C ${from.x + 210} ${from.y + 40}, ${to.x - 50} ${to.y + 40}, ${to.x} ${to.y + 40}" fill="none" stroke="#7f70d8" stroke-width="4" marker-end="url(#arrow)"/>`;
  }).join('');
  const nodeSvg = model.nodes.map((node) => `<g><rect x="${node.x}" y="${node.y}" width="160" height="80" rx="16" fill="#ffffff" stroke="#267fa9" stroke-width="3"/><text x="${node.x + 80}" y="${node.y + 46}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#172033">${escapeXml(node.label.slice(0, 32))}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Flowchart"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#7f70d8"/></marker></defs><rect width="100%" height="100%" fill="#f7f8fc"/>${edgeSvg}${nodeSvg}</svg>`;
}

export function flowchartToJson(model: FlowchartModel): string { return JSON.stringify(model, null, 2); }
