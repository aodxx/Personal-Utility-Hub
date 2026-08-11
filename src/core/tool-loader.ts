import { ToolLoadError, ToolNotFoundError } from './errors';
import { assertToolModule, type ToolModule, type ToolRegistryEntry } from './tool-contract';

export class ToolLoader {
  private activeModule: ToolModule | undefined;
  private requestId = 0;

  constructor(private readonly registry: readonly ToolRegistryEntry[]) {}

  async load(toolId: string, container: HTMLElement): Promise<void> {
    const requestId = ++this.requestId;
    await this.unmountActive();

    const entry = this.registry.find(({ metadata }) => metadata.id === toolId);
    if (!entry) throw new ToolNotFoundError(toolId);

    let module: ToolModule;
    try {
      module = await entry.load();
      assertToolModule(module, entry.metadata.id);
    } catch (error) {
      if (error instanceof ToolNotFoundError) throw error;
      throw new ToolLoadError(toolId, { cause: error });
    }

    if (requestId !== this.requestId) {
      await module.unmount?.();
      return;
    }

    container.replaceChildren();
    this.activeModule = module;

    try {
      await module.mount(container);
    } catch (error) {
      this.activeModule = undefined;
      await module.unmount?.();
      throw new ToolLoadError(toolId, { cause: error });
    }
  }

  async clear(): Promise<void> {
    ++this.requestId;
    await this.unmountActive();
  }

  private async unmountActive(): Promise<void> {
    const module = this.activeModule;
    this.activeModule = undefined;
    await module?.unmount?.();
  }
}
