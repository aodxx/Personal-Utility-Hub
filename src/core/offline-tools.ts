import { assertToolModule, type ToolRegistryEntry } from './tool-contract';
import { OfflineToolStore } from './offline-store';

export const OFFLINE_CACHE_VERSION = '0.6.0-performance-offline';

interface CacheWorkerResponse {
  ok: boolean;
  cached: number;
  error?: string;
}

export type OfflinePreparationStatus = 'not-ready' | 'ready';

function sameAppResource(url: string): boolean {
  try {
    const parsed = new URL(url, document.baseURI);
    const scope = new URL(import.meta.env.BASE_URL, location.origin);
    return parsed.origin === scope.origin && parsed.pathname.startsWith(scope.pathname);
  } catch {
    return false;
  }
}

function loadedAppResources(): string[] {
  if (typeof performance?.getEntriesByType !== 'function') return [];
  return performance.getEntriesByType('resource')
    .map(({ name }) => name)
    .filter((url) => sameAppResource(url));
}

async function cacheWithServiceWorker(toolId: string, urls: readonly string[]): Promise<number> {
  if (!('serviceWorker' in navigator)) throw new Error('เบราว์เซอร์นี้ไม่รองรับ Offline Cache');
  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error('Service Worker ยังไม่พร้อม กรุณารีโหลดหน้าแล้วลองอีกครั้ง');

  return new Promise<number>((resolve, reject) => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      callback();
    };
    const timeout = window.setTimeout(() => finish(() => reject(new Error('เตรียม Offline ใช้เวลานานเกินไป'))), 20_000);
    channel.port1.onmessage = (event: MessageEvent<CacheWorkerResponse>): void => {
      if (event.data.ok) finish(() => resolve(event.data.cached));
      else finish(() => reject(new Error(event.data.error ?? 'Service Worker เตรียม Offline ไม่สำเร็จ')));
    };
    worker.postMessage({ type: 'CACHE_TOOL', toolId, urls }, [channel.port2]);
  });
}

export class OfflineToolManager {
  constructor(
    private readonly registry: readonly ToolRegistryEntry[],
    private readonly store = new OfflineToolStore(),
    private readonly cacheRequester: (toolId: string, urls: readonly string[]) => Promise<number> = cacheWithServiceWorker,
  ) {}

  async getStatus(toolId: string): Promise<OfflinePreparationStatus> {
    const entry = this.registry.find(({ metadata }) => metadata.id === toolId);
    if (!entry) return 'not-ready';
    const record = await this.store.get(toolId);
    return record?.cacheVersion === OFFLINE_CACHE_VERSION && record.toolVersion === entry.metadata.version ? 'ready' : 'not-ready';
  }

  async prepare(toolId: string): Promise<number> {
    const entry = this.registry.find(({ metadata }) => metadata.id === toolId);
    if (!entry || !entry.metadata.supportsOffline) throw new Error('เครื่องมือนี้ไม่รองรับการเตรียม Offline');

    const module = await entry.load();
    assertToolModule(module, entry.metadata.id);
    const additional = await entry.prepareOffline?.() ?? [];
    const resources = [...new Set([...loadedAppResources(), ...additional])].filter((url) => sameAppResource(url));
    const cached = await this.cacheRequester(toolId, resources);
    await this.store.put({
      toolId,
      toolVersion: entry.metadata.version,
      cacheVersion: OFFLINE_CACHE_VERSION,
      cachedAt: Date.now(),
      resourceCount: cached,
    });
    return cached;
  }
}
