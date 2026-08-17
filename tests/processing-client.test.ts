import { afterEach, describe, expect, it, vi } from 'vitest';
import { processAudioAsync } from '../src/core/processing-client';

const source = { sampleRate: 100, channels: [new Float32Array([0.1, -0.2, 0.3, -0.4])] };

describe('Phase 8 processing client reliability', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the fallback path when Worker is unavailable and reports a completed audio result', async () => {
    vi.stubGlobal('Worker', undefined);
    const progress: number[] = [];
    const result = await processAudioAsync(source, { kind: 'finish', normalize: false, gainDb: 0, fadeIn: 0, fadeOut: 0, loudness: 'peak' }, { onProgress: (value) => progress.push(value) });
    expect(result.bytes.length).toBeGreaterThan(44);
    expect(result.inputPeak).toBeCloseTo(0.4);
    expect(result.peak).toBeCloseTo(0.4);
    expect(progress.at(-1)).toBe(100);
  });

  it('rejects immediately when the caller signal is already aborted', async () => {
    vi.stubGlobal('Worker', undefined);
    const controller = new AbortController();
    controller.abort();
    await expect(processAudioAsync(source, { kind: 'finish', normalize: false, gainDb: 0, fadeIn: 0, fadeOut: 0, loudness: 'peak' }, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
