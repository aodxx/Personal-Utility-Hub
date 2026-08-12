import { describe, expect, it, vi } from 'vitest';
import { OfflineToolStore } from '../src/core/offline-store';
import { OFFLINE_CACHE_VERSION, OfflineToolManager } from '../src/core/offline-tools';
import { runProcessingJob, sha256Async } from '../src/core/processing-client';
import type { ToolMetadata, ToolModule, ToolRegistryEntry } from '../src/core/tool-contract';

const metadata: ToolMetadata = {
  id: 'offline-test',
  title: 'Offline Test',
  description: 'ทดสอบการเตรียมเครื่องมือแบบ Offline',
  category: 'อื่น ๆ',
  route: '/tools/offline-test',
  tags: ['offline'],
  processing: 'client-side',
  supportsOffline: true,
  requiresFile: false,
  status: 'active',
  version: '1.0.0',
};

const module: ToolModule = { metadata, mount: () => undefined };
const registry: readonly ToolRegistryEntry[] = [{ metadata, load: async () => module, prepareOffline: async () => [`${location.origin}/Personal-Utility-Hub/assets/offline-test.js`] }];

describe('Phase 4 performance and offline foundation', () => {
  it('stores per-tool offline readiness with a memory fallback when IndexedDB is unavailable', async () => {
    const store = new OfflineToolStore(undefined);
    await store.put({ toolId: metadata.id, toolVersion: metadata.version, cacheVersion: OFFLINE_CACHE_VERSION, cachedAt: 1, resourceCount: 3 });
    await expect(store.get(metadata.id)).resolves.toMatchObject({ toolId: metadata.id, resourceCount: 3 });
  });

  it('preloads a tool, requests Service Worker caching and records the current version', async () => {
    const store = new OfflineToolStore(undefined);
    const cacheRequester = vi.fn(async () => 4);
    const manager = new OfflineToolManager(registry, store, cacheRequester);
    await expect(manager.getStatus(metadata.id)).resolves.toBe('not-ready');
    await expect(manager.prepare(metadata.id)).resolves.toBe(4);
    expect(cacheRequester).toHaveBeenCalledWith(metadata.id, expect.arrayContaining([expect.stringContaining('offline-test.js')]));
    await expect(manager.getStatus(metadata.id)).resolves.toBe('ready');
  });

  it('falls back safely when Worker is unavailable and supports cancellation before work starts', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await expect(sha256Async(file)).resolves.toHaveLength(64);
    const controller = new AbortController();
    controller.abort();
    await expect(runProcessingJob('sha256', { file }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
