export type ProcessingMode = 'client-side' | 'hybrid' | 'server-side';
export type ToolStatus = 'active' | 'beta' | 'planned' | 'disabled';

export interface ToolMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  route: string;
  icon?: string;
  tags: string[];
  processing: ProcessingMode;
  supportsOffline: boolean;
  requiresFile: boolean;
  status: ToolStatus;
  version: string;
}

export interface ToolModule {
  metadata: ToolMetadata;
  mount(container: HTMLElement): void | Promise<void>;
  unmount?(): void | Promise<void>;
}

export interface ToolRegistryEntry {
  metadata: ToolMetadata;
  load: () => Promise<ToolModule>;
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function validateToolMetadata(metadata: ToolMetadata): string[] {
  const errors: string[] = [];

  if (!ID_PATTERN.test(metadata.id)) errors.push('id ต้องเป็น kebab-case');
  if (!metadata.title.trim()) errors.push('title ต้องไม่ว่าง');
  if (!metadata.description.trim()) errors.push('description ต้องไม่ว่าง');
  if (!metadata.category.trim()) errors.push('category ต้องไม่ว่าง');
  if (metadata.route !== `/tools/${metadata.id}`) errors.push('route ต้องตรงกับ /tools/<id>');
  if (!metadata.tags.length || metadata.tags.some((tag) => !tag.trim())) errors.push('tags ต้องมีค่าอย่างน้อยหนึ่งรายการ');
  if (!VERSION_PATTERN.test(metadata.version)) errors.push('version ต้องเป็น Semantic Version');

  return errors;
}

export function assertToolModule(module: ToolModule, expectedId: string): void {
  const metadataErrors = validateToolMetadata(module.metadata);
  if (metadataErrors.length) throw new TypeError(`Tool metadata ไม่ถูกต้อง: ${metadataErrors.join(', ')}`);
  if (module.metadata.id !== expectedId) throw new TypeError(`Tool id ไม่ตรงกับ Registry: ${expectedId}`);
  if (typeof module.mount !== 'function') throw new TypeError('Tool module ต้องมี mount()');
  if (module.unmount !== undefined && typeof module.unmount !== 'function') {
    throw new TypeError('Tool module unmount ต้องเป็นฟังก์ชัน');
  }
}

export function assertValidRegistry(entries: readonly ToolRegistryEntry[]): void {
  const ids = new Set<string>();
  const routes = new Set<string>();

  for (const entry of entries) {
    const errors = validateToolMetadata(entry.metadata);
    if (errors.length) throw new TypeError(`${entry.metadata.id || 'unknown'}: ${errors.join(', ')}`);
    if (ids.has(entry.metadata.id)) throw new TypeError(`Tool id ซ้ำ: ${entry.metadata.id}`);
    if (routes.has(entry.metadata.route)) throw new TypeError(`Tool route ซ้ำ: ${entry.metadata.route}`);
    ids.add(entry.metadata.id);
    routes.add(entry.metadata.route);
  }
}
