import { replaceFileExtension } from './file-processing';

export const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
export const MAX_AUDIO_DURATION_SECONDS = 30 * 60;
export const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm'] as const;

export interface AudioPcmData {
  channels: Float32Array[];
  sampleRate: number;
}

export interface AudioTrimOptions {
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
}

export interface AudioTrimResult {
  bytes: Uint8Array;
  duration: number;
  sampleRate: number;
  channels: number;
}

export function validateAudioFile(file: File): void {
  if (!file) throw new Error('กรุณาเลือกไฟล์เสียง');
  if (file.size <= 0) throw new Error('ไฟล์เสียงว่างเปล่า');
  if (file.size > MAX_AUDIO_BYTES) throw new Error('ไฟล์เสียงต้องมีขนาดไม่เกิน 80 MB');
  const extension = file.name.toLowerCase().split('.').pop() ?? '';
  const acceptedExtension = ['mp3', 'wav', 'm4a', 'ogg', 'webm'].includes(extension);
  if (!SUPPORTED_AUDIO_TYPES.includes(file.type as (typeof SUPPORTED_AUDIO_TYPES)[number]) && !acceptedExtension) {
    throw new Error('รองรับไฟล์ MP3, WAV, M4A, OGG และ WebM');
  }
}

export function replaceAudioExtension(filename: string, suffix = '-trimmed'): string {
  return replaceFileExtension(filename, suffix, 'wav');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function validateTrimOptions(duration: number, options: AudioTrimOptions): AudioTrimOptions {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('ไม่พบความยาวไฟล์เสียง');
  const start = clamp(options.start, 0, duration);
  const end = clamp(options.end, 0, duration);
  if (end <= start) throw new Error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
  const selectionDuration = end - start;
  const fadeIn = clamp(options.fadeIn, 0, selectionDuration / 2);
  const fadeOut = clamp(options.fadeOut, 0, selectionDuration / 2);
  return { start, end, fadeIn, fadeOut };
}

export function trimPcm(pcm: AudioPcmData, options: AudioTrimOptions, onProgress?: (progress: number, message: string) => void): AudioTrimResult {
  const sourceChannels = pcm.channels.filter((channel) => channel.length > 0);
  if (!sourceChannels.length) throw new Error('ไม่พบข้อมูลเสียงสำหรับตัดต่อ');
  if (!Number.isFinite(pcm.sampleRate) || pcm.sampleRate <= 0) throw new Error('Sample rate ของไฟล์เสียงไม่ถูกต้อง');
  const primaryChannel = sourceChannels[0]!;
  const sourceDuration = primaryChannel.length / pcm.sampleRate;
  const validated = validateTrimOptions(sourceDuration, options);
  const startFrame = Math.floor(validated.start * pcm.sampleRate);
  const endFrame = Math.min(primaryChannel.length, Math.ceil(validated.end * pcm.sampleRate));
  const frameCount = endFrame - startFrame;
  const outputChannels = sourceChannels.map(() => new Float32Array(frameCount));
  const fadeInFrames = Math.floor(validated.fadeIn * pcm.sampleRate);
  const fadeOutFrames = Math.floor(validated.fadeOut * pcm.sampleRate);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let gain = 1;
    if (fadeInFrames > 0 && frame < fadeInFrames) gain *= frame / fadeInFrames;
    if (fadeOutFrames > 0 && frame >= frameCount - fadeOutFrames) gain *= (frameCount - 1 - frame) / fadeOutFrames;
    for (let channelIndex = 0; channelIndex < outputChannels.length; channelIndex += 1) {
      outputChannels[channelIndex]![frame] = (sourceChannels[channelIndex]![startFrame + frame] ?? 0) * gain;
    }
    if (frame % Math.max(1, Math.floor(frameCount / 10)) === 0) {
      onProgress?.(20 + Math.round((frame / frameCount) * 55), 'กำลังตัดและใส่ Fade ให้เสียง');
    }
  }

  onProgress?.(80, 'กำลังสร้างไฟล์ WAV');
  const bytes = encodeWav(outputChannels, pcm.sampleRate, onProgress);
  onProgress?.(100, 'ตัดเสียงเสร็จแล้ว');
  return { bytes, duration: frameCount / pcm.sampleRate, sampleRate: pcm.sampleRate, channels: outputChannels.length };
}

export type AudioOperation =
  | { kind: 'compress'; targetBytes: number; preset: 'speech' | 'music' | 'podcast'; quality?: 'small' | 'balanced' | 'high' }
  | { kind: 'merge'; segments: AudioPcmData[]; gap: number; crossfade: number; format: 'wav' | 'wav-compact' }
  | { kind: 'silence'; thresholdDb: number; minimum: number; padding: number }
  | { kind: 'finish'; normalize: boolean; gainDb: number; fadeIn: number; fadeOut: number; loudness?: 'peak' | 'voice' }
  | { kind: 'speed-pitch'; speed: number; semitones: number };

export interface AudioProcessResult extends AudioTrimResult {
  inputBytes?: number;
  peak: number;
  clipped: boolean;
  outputFormat: 'wav' | 'wav-compact';
}

export function audioPeak(channels: Float32Array[]): number {
  let peak = 0;
  for (const channel of channels) for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

function clonePcm(pcm: AudioPcmData): AudioPcmData { return { sampleRate: pcm.sampleRate, channels: pcm.channels.map((channel) => new Float32Array(channel)) }; }
function durationOf(pcm: AudioPcmData): number { return (pcm.channels[0]?.length ?? 0) / pcm.sampleRate; }
function resamplePcm(pcm: AudioPcmData, targetRate: number, onProgress?: (progress: number, message: string) => void): AudioPcmData {
  const sourceLength = pcm.channels[0]?.length ?? 0;
  const targetLength = Math.max(1, Math.round(sourceLength * targetRate / pcm.sampleRate));
  const channels = pcm.channels.map((source) => {
    const output = new Float32Array(targetLength);
    for (let index = 0; index < targetLength; index += 1) {
      const position = index * (source.length - 1) / Math.max(1, targetLength - 1);
      const left = Math.floor(position); const right = Math.min(source.length - 1, left + 1); const blend = position - left;
      output[index] = (source[left] ?? 0) * (1 - blend) + (source[right] ?? 0) * blend;
    }
    return output;
  });
  onProgress?.(42, 'กำลังปรับอัตราสุ่มตัวอย่าง');
  return { channels, sampleRate: targetRate };
}
function applyGain(channels: Float32Array[], gain: number): void { for (const channel of channels) for (let index = 0; index < channel.length; index += 1) channel[index] = Math.tanh((channel[index] ?? 0) * gain); }
function fadeChannels(channels: Float32Array[], sampleRate: number, fadeIn: number, fadeOut: number): void {
  const length = channels[0]?.length ?? 0; const inFrames = Math.min(length / 2, Math.floor(Math.max(0, fadeIn) * sampleRate)); const outFrames = Math.min(length / 2, Math.floor(Math.max(0, fadeOut) * sampleRate));
  for (let index = 0; index < length; index += 1) { let gain = 1; if (inFrames && index < inFrames) gain *= index / inFrames; if (outFrames && index >= length - outFrames) gain *= (length - 1 - index) / outFrames; for (const channel of channels) channel[index] = (channel[index] ?? 0) * gain; }
}
function joinPcm(segments: AudioPcmData[], gap: number, crossfade: number, onProgress?: (progress: number, message: string) => void): AudioPcmData {
  if (!segments.length) throw new Error('กรุณาเลือกไฟล์เสียงอย่างน้อยหนึ่งไฟล์');
  const sampleRate = segments[0]!.sampleRate;
  const normalized = segments.map((segment) => segment.sampleRate === sampleRate ? segment : resamplePcm(segment, sampleRate));
  const channels = Math.max(...normalized.map(({ channels: values }) => values.length));
  const gapFrames = Math.floor(Math.max(0, gap) * sampleRate);
  const crossfadeFrames = Math.floor(Math.max(0, crossfade) * sampleRate);
  const totalFrames = normalized.reduce((sum, segment) => sum + (segment.channels[0]?.length ?? 0), 0) + gapFrames * Math.max(0, normalized.length - 1) - Math.min(crossfadeFrames, gapFrames) * Math.max(0, normalized.length - 1);
  const output = Array.from({ length: channels }, () => new Float32Array(Math.max(1, totalFrames)));
  let cursor = 0;
  normalized.forEach((segment, segmentIndex) => {
    const frames = segment.channels[0]?.length ?? 0;
    for (let frame = 0; frame < frames; frame += 1) {
      const overlap = segmentIndex > 0 && frame < crossfadeFrames ? frame / Math.max(1, crossfadeFrames) : 1;
      for (let channel = 0; channel < channels; channel += 1) output[channel]![cursor + frame] = (segment.channels[channel]?.[frame] ?? segment.channels[0]?.[frame] ?? 0) * overlap;
    }
    cursor += frames;
    if (segmentIndex < normalized.length - 1) cursor += gapFrames;
    onProgress?.(20 + Math.round(((segmentIndex + 1) / normalized.length) * 40), 'กำลังเรียงและผสานไฟล์เสียง');
  });
  return { channels: output, sampleRate };
}
function removeSilence(pcm: AudioPcmData, thresholdDb: number, minimum: number, padding: number, onProgress?: (progress: number, message: string) => void): AudioPcmData {
  const threshold = 10 ** (thresholdDb / 20); const frames = pcm.channels[0]?.length ?? 0; const minFrames = Math.floor(minimum * pcm.sampleRate); const padFrames = Math.floor(padding * pcm.sampleRate); const keep = new Uint8Array(frames);
  let run = 0;
  for (let index = 0; index < frames; index += 1) { let peak = 0; for (const channel of pcm.channels) peak = Math.max(peak, Math.abs(channel[index] ?? 0)); if (peak >= threshold) { for (let pad = Math.max(0, index - padFrames); pad <= index; pad += 1) keep[pad] = 1; run = 0; } else { run += 1; if (run < minFrames) for (let pad = Math.max(0, index - run); pad <= index; pad += 1) keep[pad] = 1; } }
  const count = keep.reduce((sum, value) => sum + value, 0); const output = pcm.channels.map(() => new Float32Array(Math.max(1, count))); let cursor = 0;
  for (let index = 0; index < frames; index += 1) if (keep[index]) { for (let channel = 0; channel < pcm.channels.length; channel += 1) output[channel]![cursor] = pcm.channels[channel]![index] ?? 0; cursor += 1; }
  onProgress?.(60, 'กำลังลบช่วงเงียบและคง Padding'); return { channels: output, sampleRate: pcm.sampleRate };
}

export function processAudio(pcm: AudioPcmData, operation: AudioOperation, onProgress?: (progress: number, message: string) => void): AudioProcessResult {
  let output: AudioPcmData; let outputFormat: 'wav' | 'wav-compact' = 'wav';
  if (operation.kind === 'compress') { const duration = durationOf(pcm); const presetGain = operation.preset === 'speech' ? 2.4 : operation.preset === 'podcast' ? 1.8 : 1.35; const qualityFactor = operation.quality === 'small' ? 0.72 : operation.quality === 'high' ? 1.2 : 1; const targetRate = Math.max(8_000, Math.min(pcm.sampleRate, Math.floor(operation.targetBytes * 8 * qualityFactor / Math.max(1, duration * pcm.channels.length * 16)))); output = resamplePcm(clonePcm(pcm), targetRate, onProgress); applyGain(output.channels, presetGain); }
  else if (operation.kind === 'merge') { output = joinPcm(operation.segments, operation.gap, operation.crossfade, onProgress); outputFormat = operation.format; }
  else if (operation.kind === 'silence') output = removeSilence(pcm, operation.thresholdDb, operation.minimum, operation.padding, onProgress);
  else if (operation.kind === 'finish') { output = clonePcm(pcm); applyGain(output.channels, 10 ** (operation.gainDb / 20)); if (operation.normalize) { const peak = audioPeak(output.channels); if (peak > 0) applyGain(output.channels, Math.min(1 / peak, operation.loudness === 'voice' ? 0.9 / peak : 1 / peak)); } fadeChannels(output.channels, output.sampleRate, operation.fadeIn, operation.fadeOut); }
  else { const ratio = Math.max(.25, Math.min(4, operation.speed * 2 ** (operation.semitones / 12))); output = resamplePcm(pcm, Math.max(8_000, Math.round(pcm.sampleRate * ratio)), onProgress); }
  onProgress?.(75, 'กำลังสร้างไฟล์ผลลัพธ์'); const bytes = encodeWav(output.channels, output.sampleRate, onProgress, outputFormat === 'wav-compact' ? 8 : 16); const peak = audioPeak(output.channels);
  return { bytes, duration: durationOf(output), sampleRate: output.sampleRate, channels: output.channels.length, peak, clipped: peak > 0.99, outputFormat };
}

export function encodeWav(channels: Float32Array[], sampleRate: number, onProgress?: (progress: number, message: string) => void, bitDepth: 8 | 16 = 16): Uint8Array {
  const channelCount = channels.length;
  const frameCount = channels[0]?.length ?? 0;
  if (!channelCount || !frameCount) throw new Error('ไม่มีข้อมูลเสียงสำหรับสร้างไฟล์ WAV');
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, value: string): void => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)); };
  writeAscii(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, bitDepth, true);
  writeAscii(36, 'data'); view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = clamp(channels[channel]![frame] ?? 0, -1, 1);
      if (bitDepth === 8) view.setUint8(offset, Math.round((sample + 1) * 127.5));
      else view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
    if (frame % Math.max(1, Math.floor(frameCount / 10)) === 0) onProgress?.(80 + Math.round((frame / frameCount) * 20), 'กำลังเข้ารหัส WAV');
  }
  return new Uint8Array(buffer);
}
