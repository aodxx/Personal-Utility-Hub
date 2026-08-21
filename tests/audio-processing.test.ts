import { describe, expect, it } from 'vitest';
import { encodeWav, processAudio, replaceAudioExtension, trimPcm, validateAudioFile, validateTrimOptions } from '../src/core/audio-processing';

describe('Audio processing', () => {
  it('validates audio file size and extensions', () => {
    expect(() => validateAudioFile(new File(['audio'], 'voice.mp3', { type: 'audio/mpeg' }))).not.toThrow();
    expect(() => validateAudioFile(new File(['audio'], 'voice.txt', { type: 'text/plain' }))).toThrow('รองรับไฟล์');
    expect(replaceAudioExtension('voice.m4a')).toBe('voice-trimmed.wav');
  });

  it('normalizes trim bounds and limits fades to half the selection', () => {
    expect(validateTrimOptions(10, { start: -2, end: 20, fadeIn: 8, fadeOut: 8 })).toEqual({ start: 0, end: 10, fadeIn: 5, fadeOut: 5 });
    expect(() => validateTrimOptions(10, { start: 5, end: 5, fadeIn: 0, fadeOut: 0 })).toThrow('เวลาสิ้นสุด');
  });

  it('trims channels and applies fade without changing channel count', () => {
    const result = trimPcm({ sampleRate: 10, channels: [new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])] }, { start: 0.2, end: 0.8, fadeIn: 0.2, fadeOut: 0.2 });
    expect(result.duration).toBeCloseTo(0.6);
    expect(result.channels).toBe(2);
    expect(result.sampleRate).toBe(10);
    expect(result.bytes.slice(0, 4)).toEqual(new Uint8Array([82, 73, 70, 70]));
    expect(result.bytes.slice(8, 12)).toEqual(new Uint8Array([87, 65, 86, 69]));
  });

  it('writes a valid PCM16 WAV header', () => {
    const bytes = encodeWav([new Float32Array([0, 1, -1])], 8);
    const view = new DataView(bytes.buffer as ArrayBuffer);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(8);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(6);
  });

  it('runs the five production audio operations with real output metrics', () => {
    const source = { sampleRate: 100, channels: [new Float32Array(Array.from({ length: 100 }, (_, index) => index % 20 < 10 ? 0.7 : 0))] };
    const compressor = processAudio(source, { kind: 'compress', targetBytes: 500, quality: 'small' });
    const merger = processAudio(source, { kind: 'merge', segments: [source, source], gap: 0.1, crossfade: 0, format: 'wav-compact' });
    const silence = processAudio(source, { kind: 'silence', thresholdDb: -30, minimum: 0.01, padding: 0 });
    const finisher = processAudio(source, { kind: 'finish', normalize: true, gainDb: 3, fadeIn: 0.05, fadeOut: 0.05, loudness: 'voice' });
    const speedPitch = processAudio(source, { kind: 'speed-pitch', speed: 1.5, semitones: 2 });
    expect(compressor.bytes.length).toBeGreaterThan(44);
    expect(merger.outputFormat).toBe('wav-compact');
    expect(merger.duration).toBeGreaterThan(1.9);
    expect(silence.duration).toBeLessThan(1);
    expect(finisher.peak).toBeLessThanOrEqual(1);
    expect(speedPitch.sampleRate).toBe(source.sampleRate);
    expect(speedPitch.duration).toBeLessThan(1);
    expect(speedPitch.channels).toBe(source.channels.length);
    const highQuality = processAudio(source, { kind: 'compress', targetBytes: 500, quality: 'high' });
    expect(highQuality.sampleRate).toBeGreaterThanOrEqual(compressor.sampleRate);
  });
});


describe('Phase 8 audio reliability contracts', () => {
  it('keeps 0 dB linear gain close to identity and applies dB amplitude correctly', async () => {
    const { applyLinearGain } = await import('../src/core/audio-processing');
    const samples = new Float32Array([0.25, -0.5, 1]);
    applyLinearGain([samples], 1);
    expect(Array.from(samples)).toEqual([0.25, -0.5, 1]);
    applyLinearGain([samples], 10 ** (-6 / 20));
    expect(samples[0]).toBeCloseTo(0.1253, 3);
    expect(samples[1]).toBeCloseTo(-0.251, 3);
  });

  it('uses target peak for peak-safe and voice-safe normalization', () => {
    const source = { sampleRate: 100, channels: [new Float32Array([0.25, -0.5, 0.2, -0.1])] };
    const peakSafe = processAudio(source, { kind: 'finish', normalize: true, gainDb: 0, fadeIn: 0, fadeOut: 0, loudness: 'peak' });
    const voiceSafe = processAudio(source, { kind: 'finish', normalize: true, gainDb: 0, fadeIn: 0, fadeOut: 0, loudness: 'voice' });
    expect(peakSafe.inputPeak).toBeCloseTo(0.5);
    expect(peakSafe.peak).toBeCloseTo(0.98, 3);
    expect(voiceSafe.peak).toBeCloseTo(0.9, 3);
    expect(peakSafe.gainApplied).toBeCloseTo(1.96, 2);
  });

  it('performs real overlap crossfade without truncating or creating negative output length', () => {
    const first = { sampleRate: 10, channels: [new Float32Array(10).fill(1)] };
    const second = { sampleRate: 10, channels: [new Float32Array(10).fill(0)] };
    const result = processAudio(first, { kind: 'merge', segments: [first, second], gap: 0, crossfade: 0.4, format: 'wav' });
    expect(result.duration).toBeCloseTo(1.6);
    expect(result.bytes.length).toBeGreaterThan(44);
    const mergedPcm = result;
    expect(mergedPcm.channels).toBe(1);
    const noNegative = processAudio(first, { kind: 'merge', segments: [first, second], gap: 0, crossfade: 9, format: 'wav' });
    expect(noNegative.duration).toBeGreaterThan(0);
  });

  it('resamples different sample rates to the first segment rate before merge', () => {
    const first = { sampleRate: 10, channels: [new Float32Array(10).fill(0.5)] };
    const second = { sampleRate: 20, channels: [new Float32Array(20).fill(0.25)] };
    const result = processAudio(first, { kind: 'merge', segments: [first, second], gap: 0.2, crossfade: 0, format: 'wav' });
    expect(result.sampleRate).toBe(10);
    expect(result.duration).toBeCloseTo(2.2);
  });
});

describe('Phase 8 decoder contracts', () => {
  it('estimates decoded PCM memory from duration, rate and channels', async () => {
    const { estimatedDecodedBytes } = await import('../src/core/audio-decoder');
    expect(estimatedDecodedBytes(10, 48_000, 2)).toBe(3_840_000);
  });

  it('reports a meaningful unsupported-browser error instead of a raw DOMException', async () => {
    const { decodeAudioFile, AudioDecodeError } = await import('../src/core/audio-decoder');
    const file = new File(['audio'], 'voice.m4a', { type: 'audio/mp4' });
    await expect(decodeAudioFile(file)).rejects.toSatisfy((error: unknown) => error instanceof AudioDecodeError && error.code === 'unsupported-codec' && error.message.includes('WAV หรือ MP3'));
  });
});
