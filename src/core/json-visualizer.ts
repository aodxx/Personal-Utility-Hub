export const JSON_VISUALIZER_LIMITS = {
  maxInputChars: 200_000,
  maxNodes: 500,
  maxDepth: 32,
  maxStringPreviewChars: 160,
  maxGraphNodes: 360,
} as const;

export type JsonNodeKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonTreeNode {
  id: string;
  path: string;
  label: string;
  kind: JsonNodeKind;
  depth: number;
  parentId?: string;
  valuePreview: string;
  childCount: number;
  children: JsonTreeNode[];
}

export interface JsonTreeModel {
  root: JsonTreeNode;
  nodes: JsonTreeNode[];
  maxDepth: number;
}

export interface JsonGraphDimensions {
  width: number;
  height: number;
}

const GRAPH_NODE_WIDTH = 184;
const GRAPH_NODE_HEIGHT = 68;
const GRAPH_X_GAP = 34;
const GRAPH_Y_GAP = 22;
const GRAPH_MARGIN = 32;

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character] ?? character));
}

function assertInputSize(source: string): void {
  if (!source.trim()) throw new Error('กรุณาวาง JSON ที่ต้องการแสดงผล / Paste JSON to visualize');
  if (source.length > JSON_VISUALIZER_LIMITS.maxInputChars) {
    throw new Error(`JSON ต้องมีขนาดไม่เกิน ${JSON_VISUALIZER_LIMITS.maxInputChars.toLocaleString()} ตัวอักษร / JSON must be ${JSON_VISUALIZER_LIMITS.maxInputChars.toLocaleString()} characters or smaller`);
  }
}

function kindOf(value: unknown): JsonNodeKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'object': return 'object';
    case 'string': return 'string';
    case 'number': return 'number';
    case 'boolean': return 'boolean';
    default: throw new Error('JSON มีชนิดข้อมูลที่ไม่รองรับ / JSON contains an unsupported value');
  }
}

function primitivePreview(value: unknown): string {
  if (typeof value === 'string') {
    const shortened = value.length > JSON_VISUALIZER_LIMITS.maxStringPreviewChars
      ? `${value.slice(0, JSON_VISUALIZER_LIMITS.maxStringPreviewChars - 1)}…`
      : value;
    return JSON.stringify(shortened);
  }
  return JSON.stringify(value) ?? 'null';
}

function pathForChild(parent: JsonTreeNode, label: string, arrayIndex?: number): string {
  if (arrayIndex !== undefined) return `${parent.path}[${arrayIndex}]`;
  return /^[A-Za-z_$][\w$]*$/u.test(label) ? `${parent.path}.${label}` : `${parent.path}[${JSON.stringify(label)}]`;
}

export function parseJsonTree(source: string): JsonTreeModel {
  assertInputSize(source);
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch (error) {
    const detail = error instanceof SyntaxError ? error.message : 'รูปแบบ JSON ไม่ถูกต้อง / Invalid JSON';
    throw new Error(`JSON ไม่ถูกต้อง: ${detail}`);
  }

  const nodes: JsonTreeNode[] = [];
  let maxDepth = 0;
  function build(value: unknown, label: string, path: string, depth: number, parentId?: string): JsonTreeNode {
    if (depth > JSON_VISUALIZER_LIMITS.maxDepth) {
      throw new Error(`JSON มีความลึกเกิน ${JSON_VISUALIZER_LIMITS.maxDepth} ระดับ / JSON depth exceeds ${JSON_VISUALIZER_LIMITS.maxDepth} levels`);
    }
    if (nodes.length >= JSON_VISUALIZER_LIMITS.maxNodes) {
      throw new Error(`JSON มี nodes เกิน ${JSON_VISUALIZER_LIMITS.maxNodes} รายการ / JSON exceeds ${JSON_VISUALIZER_LIMITS.maxNodes} nodes`);
    }
    const kind = kindOf(value);
    const children: JsonTreeNode[] = [];
    const node: JsonTreeNode = {
      id: `json-node-${nodes.length + 1}`,
      path,
      label,
      kind,
      depth,
      parentId,
      valuePreview: kind === 'object'
        ? `object · ${Object.keys(value as Record<string, unknown>).length} keys`
        : kind === 'array'
          ? `array · ${(value as unknown[]).length} items`
          : primitivePreview(value),
      childCount: 0,
      children,
    };
    nodes.push(node);
    maxDepth = Math.max(maxDepth, depth);

    if (kind === 'object') {
      const objectValue = value as Record<string, unknown>;
      for (const childLabel of Object.keys(objectValue)) {
        children.push(build(objectValue[childLabel], childLabel, pathForChild(node, childLabel), depth + 1, node.id));
      }
    } else if (kind === 'array') {
      const arrayValue = value as unknown[];
      arrayValue.forEach((childValue, index) => {
        children.push(build(childValue, `[${index}]`, pathForChild(node, `[${index}]`, index), depth + 1, node.id));
      });
    }
    node.childCount = children.length;
    return node;
  }

  const root = build(parsed, '$', '$', 0);
  return { root, nodes, maxDepth };
}

export function isExpandable(node: JsonTreeNode): boolean {
  return node.children.length > 0;
}

export function defaultExpandedIds(model: JsonTreeModel): Set<string> {
  return new Set(model.nodes.filter(isExpandable).map(({ id }) => id));
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function matchingNodeIds(model: JsonTreeModel, query: string): Set<string> {
  const term = normalized(query);
  if (!term) return new Set();
  return new Set(model.nodes.filter((node) => [node.path, node.label, node.valuePreview].some((value) => normalized(value).includes(term))).map(({ id }) => id));
}

function ancestorIds(model: JsonTreeModel, ids: ReadonlySet<string>): Set<string> {
  const byId = new Map(model.nodes.map((node) => [node.id, node]));
  const result = new Set(ids);
  for (const id of ids) {
    let parentId = byId.get(id)?.parentId;
    while (parentId) {
      result.add(parentId);
      parentId = byId.get(parentId)?.parentId;
    }
  }
  return result;
}

export function visibleNodes(model: JsonTreeModel, expandedIds: ReadonlySet<string>, query = ''): JsonTreeNode[] {
  const matches = matchingNodeIds(model, query);
  const allowed = query.trim() ? ancestorIds(model, matches) : undefined;
  const visible: JsonTreeNode[] = [];
  function visit(node: JsonTreeNode): void {
    if (allowed && !allowed.has(node.id)) return;
    visible.push(node);
    if (isExpandable(node) && (expandedIds.has(node.id) || Boolean(query.trim()))) {
      node.children.forEach(visit);
    }
  }
  visit(model.root);
  return visible;
}

export function graphDimensions(nodes: readonly JsonTreeNode[]): JsonGraphDimensions {
  const counts = new Map<number, number>();
  for (const node of nodes) counts.set(node.depth, (counts.get(node.depth) ?? 0) + 1);
  const maxRows = Math.max(...counts.values(), 1);
  const maxDepth = Math.max(...counts.keys(), 0);
  return {
    width: GRAPH_MARGIN * 2 + (maxDepth + 1) * GRAPH_NODE_WIDTH + maxDepth * GRAPH_X_GAP,
    height: GRAPH_MARGIN * 2 + maxRows * GRAPH_NODE_HEIGHT + Math.max(0, maxRows - 1) * GRAPH_Y_GAP,
  };
}

function graphColor(kind: JsonNodeKind): { fill: string; stroke: string } {
  switch (kind) {
    case 'object': return { fill: '#e0e7ff', stroke: '#4f46e5' };
    case 'array': return { fill: '#cffafe', stroke: '#0891b2' };
    case 'string': return { fill: '#dcfce7', stroke: '#16a34a' };
    case 'number': return { fill: '#fef3c7', stroke: '#d97706' };
    case 'boolean': return { fill: '#fce7f3', stroke: '#db2777' };
    case 'null': return { fill: '#f1f5f9', stroke: '#64748b' };
  }
}

function shorten(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function renderJsonGraphSvg(model: JsonTreeModel, expandedIds: ReadonlySet<string>, query = ''): string {
  const nodes = visibleNodes(model, expandedIds, query).slice(0, JSON_VISUALIZER_LIMITS.maxGraphNodes);
  const truncated = visibleNodes(model, expandedIds, query).length > nodes.length;
  const dimensions = graphDimensions(nodes);
  const positions = new Map<string, { x: number; y: number }>();
  const depthIndex = new Map<number, number>();
  for (const node of nodes) {
    const row = depthIndex.get(node.depth) ?? 0;
    depthIndex.set(node.depth, row + 1);
    positions.set(node.id, {
      x: GRAPH_MARGIN + node.depth * (GRAPH_NODE_WIDTH + GRAPH_X_GAP),
      y: GRAPH_MARGIN + row * (GRAPH_NODE_HEIGHT + GRAPH_Y_GAP),
    });
  }
  const matches = matchingNodeIds(model, query);
  const edgeSvg = nodes.filter((node) => node.parentId && positions.has(node.parentId)).map((node) => {
    const parent = positions.get(node.parentId!);
    const child = positions.get(node.id);
    if (!parent || !child) return '';
    const startX = parent.x + GRAPH_NODE_WIDTH;
    const startY = parent.y + GRAPH_NODE_HEIGHT / 2;
    const endX = child.x;
    const endY = child.y + GRAPH_NODE_HEIGHT / 2;
    const control = Math.max(20, (endX - startX) / 2);
    return `<path d="M ${startX} ${startY} C ${startX + control} ${startY}, ${endX - control} ${endY}, ${endX} ${endY}" fill="none" stroke="#94a3b8" stroke-width="2"/>`;
  }).join('');
  const nodeSvg = nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return '';
    const colors = graphColor(node.kind);
    const matched = matches.has(node.id);
    const label = escapeXml(shorten(node.label, 28));
    const preview = escapeXml(shorten(node.valuePreview, 26));
    return `<g data-node-id="${escapeXml(node.id)}"><rect x="${position.x}" y="${position.y}" width="${GRAPH_NODE_WIDTH}" height="${GRAPH_NODE_HEIGHT}" rx="12" fill="${colors.fill}" stroke="${matched ? '#b45309' : colors.stroke}" stroke-width="${matched ? 4 : 2}"/><text x="${position.x + 12}" y="${position.y + 23}" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" font-size="13" font-weight="700" fill="#172033">${label}</text><text x="${position.x + 12}" y="${position.y + 42}" font-family="sans-serif" font-size="11" fill="#475569">${escapeXml(node.kind)} · ${preview}</text></g>`;
  }).join('');
  const notice = truncated ? `<text x="${GRAPH_MARGIN}" y="${dimensions.height - 10}" font-family="sans-serif" font-size="12" fill="#92400e">Graph truncated at ${JSON_VISUALIZER_LIMITS.maxGraphNodes} visible nodes</text>` : '';
  const safeWidth = Math.max(720, dimensions.width);
  const safeHeight = Math.max(260, dimensions.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}" role="img" aria-label="JSON graph"><rect width="100%" height="100%" fill="#f8fafc"/>${edgeSvg}${nodeSvg}${notice}</svg>`;
}

export function graphNodeCount(model: JsonTreeModel, expandedIds: ReadonlySet<string>, query = ''): number {
  return visibleNodes(model, expandedIds, query).length;
}

export function jsonTreeToText(model: JsonTreeModel): string {
  return model.nodes.map((node) => `${'  '.repeat(node.depth)}${node.path} · ${node.kind} · ${node.valuePreview}`).join('\n');
}
