import { describe, expect, it, vi } from 'vitest';
import { ToolLoadError, ToolNotFoundError } from '../src/core/errors';
import { ToolLoader } from '../src/core/tool-loader';
import type { ToolMetadata, ToolModule } from '../src/core/tool-contract';

const metadata: ToolMetadata = {
  id: 'test-tool', title: 'Test', description: 'Test tool', category: 'Developer Tools',
  route: '/tools/test-tool', tags: ['test'], processing: 'client-side', supportsOffline: false,
  requiresFile: false, status: 'beta', version: '0.1.0',
};

describe('ToolLoader', () => {
  it('loads, mounts and unmounts a module', async () => {
    const mount = vi.fn();
    const unmount = vi.fn();
    const module: ToolModule = { metadata, mount, unmount };
    const loader = new ToolLoader([{ metadata, load: async () => module }]);
    const container = document.createElement('div');

    await loader.load('test-tool', container);
    expect(mount).toHaveBeenCalledWith(container);
    await loader.clear();
    expect(unmount).toHaveBeenCalledOnce();
  });

  it('rejects an unknown tool', async () => {
    const loader = new ToolLoader([]);
    await expect(loader.load('missing', document.createElement('div'))).rejects.toBeInstanceOf(ToolNotFoundError);
  });

  it('wraps module loading failures', async () => {
    const loader = new ToolLoader([{ metadata, load: async () => { throw new Error('boom'); } }]);
    await expect(loader.load('test-tool', document.createElement('div'))).rejects.toBeInstanceOf(ToolLoadError);
  });
});
