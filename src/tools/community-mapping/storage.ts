import type { MappingProject } from './schema';

const DB_NAME = 'personal-utility-hub-community-mapping';
const STORE = 'projects';
let memoryProject: MappingProject | undefined;

export class ProjectStore {
  async get(): Promise<MappingProject | undefined> {
    if (typeof indexedDB === 'undefined') return memoryProject;
    const db = await this.open();
    return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get('current'); request.onsuccess = () => resolve(request.result as MappingProject | undefined); request.onerror = () => reject(request.error); });
  }
  async put(project: MappingProject): Promise<void> {
    memoryProject = structuredClone(project);
    if (typeof indexedDB === 'undefined') return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(project, 'current'); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  }
  private open(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
}

export class AutosaveController {
  private timer: ReturnType<typeof setTimeout> | undefined;
  constructor(private readonly store: ProjectStore, private readonly onSaved?: () => void) {}
  schedule(project: MappingProject): void { if (this.timer) clearTimeout(this.timer); this.timer = setTimeout(() => { void this.store.put(project).then(() => this.onSaved?.()); }, 250); }
  dispose(): void { if (this.timer) clearTimeout(this.timer); }
}
