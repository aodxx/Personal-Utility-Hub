import { afterEach, describe, expect, it, vi } from 'vitest';
import { replaceRegexAsync, runRegexAsync } from '../src/core/regex-processing-client';
import { runRegex } from '../src/core/regex';

class FakeRegexWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  postMessage(request: { jobId: string; operation: 'run' | 'replace'; pattern: string; flags: string; input: string; replacement?: string }): void {
    window.setTimeout(() => {
      if (this.terminated) return;
      const result = request.operation === 'run'
        ? { operation: 'run', result: runRegex(request.pattern, request.flags, request.input) }
        : { operation: 'replace', result: request.input.replace(new RegExp(request.pattern, request.flags), request.replacement ?? '') };
      this.onmessage?.({ data: { type: 'success', jobId: request.jobId, result } } as MessageEvent);
    }, 0);
  }

  terminate(): void {
    this.terminated = true;
  }
}

describe('Regex processing client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses bounded synchronous fallback when Worker is unavailable', async () => {
    vi.stubGlobal('Worker', undefined);
    await expect(runRegexAsync('foo', 'g', 'foo foo')).resolves.toMatchObject({ matches: [{ text: 'foo' }, { text: 'foo' }] });
    await expect(replaceRegexAsync('foo', 'g', 'foo foo', 'bar')).resolves.toBe('bar bar');
    await expect(runRegexAsync('foo', 'g', 'x'.repeat(20_001))).rejects.toThrow('Worker is required');
  });

  it('rejects an already-aborted request without constructing a Worker', async () => {
    vi.stubGlobal('Worker', FakeRegexWorker);
    const controller = new AbortController();
    controller.abort();
    await expect(runRegexAsync('foo', 'g', 'foo', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('times out a Worker that does not respond', async () => {
    vi.useFakeTimers();
    class HangingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage(): void {}
      terminate(): void {}
    }
    vi.stubGlobal('Worker', HangingWorker);
    try {
      const promise = runRegexAsync('a', 'g', 'a');
      const assertion = expect(promise).rejects.toThrow('timed out');
      await vi.advanceTimersByTimeAsync(2_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('terminates an active Worker when the caller aborts', async () => {
    const workerInstances: FakeRegexWorker[] = [];
    class TrackingWorker extends FakeRegexWorker {
      constructor() {
        super();
        workerInstances.push(this);
      }
    }
    vi.stubGlobal('Worker', TrackingWorker);
    const controller = new AbortController();
    const promise = runRegexAsync('foo', 'g', 'foo', controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(workerInstances[0]?.terminated).toBe(true);
  });
});
