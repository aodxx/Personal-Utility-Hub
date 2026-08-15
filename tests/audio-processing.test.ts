import { describe, expect, it } from 'vitest';
import { encodeWav, replaceAudioExtension, trimPcm, validateAudioFile, validateTrimOptions } from '../src/core/audio-processing';

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
});
