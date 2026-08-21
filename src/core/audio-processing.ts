import { replaceFileExtension } from './file-processing';
import lamejs from '../vendor/lame.all';

const Mp3Encoder = lamejs.Mp3Encoder;

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
  | { kind: 'compress'; targetBytes: number; quality?: 'small' | 'balanced' | 'high' }
  | { kind: 'merge'; segments: AudioPcmData[]; gap: number; crossfade: number; format: 'wav' | 'wav-compact' | 'mp3' }
  | { kind: 'silence'; thresholdDb: number; minimum: number; padding: number }
  | { kind: 'finish'; normalize: boolean; gainDb: number; fadeIn: number; fadeOut: number; loudness?: 'peak' | 'voice' }
  | { kind: 'speed-pitch'; speed: number; semitones: number };

export interface AudioProcessResult extends AudioTrimResult {
  inputBytes?: number;
  inputPeak: number;
  peak: number;
  inputRmsDb: number;
  rmsDb: number;
  truePeak: number;
  gainApplied: number;
  clipped: boolean;
  outputFormat: 'wav' | 'wav-compact' | 'mp3';
}

export function audioPeak(channels: Float32Array[]): number {
  let peak = 0;
  for (const channel of channels) for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

export function audioRmsDb(channels: Float32Array[]): number {
  let sum = 0; let count = 0;
  for (const channel of channels) for (const sample of channel) { sum += sample * sample; count += 1; }
  return count && sum > 0 ? 20 * Math.log10(Math.sqrt(sum / count)) : -Infinity;
}

/** 2x linear-interpolated peak estimate; it is a screening metric, not a mastering meter. */
export function audioTruePeak(channels: Float32Array[]): number {
  let peak = audioPeak(channels);
  for (const channel of channels) for (let index = 1; index < channel.length; index += 1) {
    const previous = channel[index - 1] ?? 0; const current = channel[index] ?? 0;
    peak = Math.max(peak, Math.abs((previous + current) / 2));
  }
  return peak;
}

function clonePcm(pcm: AudioPcmData): AudioPcmData { return { sampleRate: pcm.sampleRate, channels: pcm.channels.map((channel) => new Float32Array(channel)) }; }
function durationOf(pcm: AudioPcmData): number { return (pcm.channels[0]?.length ?? 0) / pcm.sampleRate; }
function resamplePcm(pcm: AudioPcmData, targetRate: number, onProgress?: (progress: number, message: string) => void, targetLengthOverride?: number): AudioPcmData {
  const sourceLength = pcm.channels[0]?.length ?? 0;
  const targetLength = Math.max(1, targetLengthOverride ?? Math.round(sourceLength * targetRate / pcm.sampleRate));
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

function timeStretchChannel(source: Float32Array, rate: number): Float32Array {
  const safeRate = Math.max(0.25, Math.min(4, rate));
  const outputLength = Math.max(1, Math.round(source.length / safeRate));
  if (source.length < 32 || outputLength < 32) return resamplePcm({ sampleRate: 1, channels: [source] }, 1, undefined, outputLength).channels[0]!;
  const grain = Math.min(1024, Math.max(32, 2 ** Math.floor(Math.log2(Math.min(source.length, 1024)))));
  const hopIn = Math.max(8, Math.floor(grain / 4));
  const hopOut = Math.max(8, Math.round(hopIn / safeRate));
  const output = new Float32Array(outputLength + grain);
  const weight = new Float32Array(output.length);
  for (let inputStart = 0, outputStart = 0; inputStart < source.length; inputStart += hopIn, outputStart += hopOut) {
    for (let offset = 0; offset < grain && inputStart + offset < source.length; offset += 1) {
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * offset) / Math.max(1, grain - 1));
      const position = outputStart + offset;
      if (position >= output.length) break;
      output[position] = (output[position] ?? 0) + (source[inputStart + offset] ?? 0) * window;
      weight[position] = (weight[position] ?? 0) + window;
    }
  }
  for (let index = 0; index < outputLength; index += 1) output[index] = (weight[index] ?? 0) > 1e-6 ? (output[index] ?? 0) / (weight[index] ?? 1) : 0;
  return output.subarray(0, outputLength);
}

function speedPitchPcm(pcm: AudioPcmData, speed: number, semitones: number, onProgress?: (progress: number, message: string) => void): AudioPcmData {
  const safeSpeed = Math.max(0.25, Math.min(4, speed));
  const pitchRatio = 2 ** (Math.max(-12, Math.min(12, semitones)) / 12);
  const pitchShifted = pcm.channels.map((channel) => {
    const compressed = resamplePcm({ sampleRate: pcm.sampleRate, channels: [channel] }, pcm.sampleRate, undefined, Math.max(1, Math.round(channel.length / pitchRatio))).channels[0]!;
    return timeStretchChannel(compressed, 1 / pitchRatio);
  });
  const output = pitchShifted.map((channel) => timeStretchChannel(channel, safeSpeed));
  onProgress?.(62, 'กำลังแยกการเปลี่ยนความเร็วและโทนเสียง');
  return { channels: output, sampleRate: pcm.sampleRate };
}
export function applyLinearGain(channels: Float32Array[], gain: number): void {
  for (const channel of channels) for (let index = 0; index < channel.length; index += 1) channel[index] = (channel[index] ?? 0) * gain;
}

export function softClip(channels: Float32Array[], drive = 1): void {
  const safeDrive = Math.max(0, drive);
  if (safeDrive === 0) return;
  const normalizer = Math.tanh(safeDrive);
  for (const channel of channels) for (let index = 0; index < channel.length; index += 1) channel[index] = Math.tanh((channel[index] ?? 0) * safeDrive) / normalizer;
}
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
  const requestedCrossfade = Math.floor(Math.max(0, crossfade) * sampleRate);
  const overlaps = normalized.slice(1).map((segment, index) => Math.min(requestedCrossfade, normalized[index]!.channels[0]?.length ?? 0, segment.channels[0]?.length ?? 0));
  const totalFrames = normalized.reduce((sum, segment) => sum + (segment.channels[0]?.length ?? 0), 0) - overlaps.reduce((sum, value) => sum + value, 0) + gapFrames * Math.max(0, normalized.length - 1);
  const output = Array.from({ length: channels }, () => new Float32Array(Math.max(1, totalFrames)));
  let cursor = 0;
  normalized.forEach((segment, segmentIndex) => {
    const frames = segment.channels[0]?.length ?? 0;
    if (segmentIndex === 0) {
      for (let frame = 0; frame < frames; frame += 1) for (let channel = 0; channel < channels; channel += 1) output[channel]![cursor + frame] = segment.channels[channel]?.[frame] ?? segment.channels[0]?.[frame] ?? 0;
      cursor += frames;
    } else {
      const overlap = overlaps[segmentIndex - 1] ?? 0;
      const overlapStart = Math.max(0, cursor - overlap);
      for (let frame = 0; frame < overlap; frame += 1) {
        const fade = (frame + 1) / Math.max(1, overlap);
        for (let channel = 0; channel < channels; channel += 1) {
          const incoming = segment.channels[channel]?.[frame] ?? segment.channels[0]?.[frame] ?? 0;
          output[channel]![overlapStart + frame] = output[channel]![overlapStart + frame]! * (1 - fade) + incoming * fade;
        }
      }
      for (let frame = overlap; frame < frames; frame += 1) for (let channel = 0; channel < channels; channel += 1) output[channel]![cursor + frame - overlap] = segment.channels[channel]?.[frame] ?? segment.channels[0]?.[frame] ?? 0;
      cursor += frames - overlap;
    }
    if (segmentIndex < normalized.length - 1) cursor += gapFrames;
    onProgress?.(20 + Math.round(((segmentIndex + 1) / normalized.length) * 40), 'กำลังเรียงและผสานไฟล์เสียง');
  });
  return { channels: output, sampleRate };
}
function removeSilence(pcm: AudioPcmData, thresholdDb: number, minimum: number, padding: number, onProgress?: (progress: number, message: string) => void): AudioPcmData {
  const threshold = 10 ** (thresholdDb / 20);
  const frames = pcm.channels[0]?.length ?? 0;
  if (!frames) throw new Error('ไม่พบข้อมูลเสียงสำหรับตรวจช่วงเงียบ');
  const windowFrames = Math.max(1, Math.floor(pcm.sampleRate * 0.02));
  const blockCount = Math.ceil(frames / windowFrames);
  const minimumBlocks = Math.max(1, Math.ceil(Math.max(0, minimum) * pcm.sampleRate / windowFrames));
  const paddingBlocks = Math.ceil(Math.max(0, padding) * pcm.sampleRate / windowFrames);
  const active = new Uint8Array(blockCount);
  for (let block = 0; block < blockCount; block += 1) {
    const start = block * windowFrames;
    const end = Math.min(frames, start + windowFrames);
    let energy = 0;
    let count = 0;
    for (let index = start; index < end; index += 1) for (const channel of pcm.channels) { const sample = channel[index] ?? 0; energy += sample * sample; count += 1; }
    const rms = count ? Math.sqrt(energy / count) : 0;
    if (rms >= threshold) active[block] = 1;
  }
  const firstActive = active.findIndex(Boolean);
  if (firstActive < 0) {
    onProgress?.(60, 'ไม่พบเสียงที่ผ่าน threshold จึงคงไฟล์เดิมไว้');
    return { channels: pcm.channels.map((channel) => new Float32Array(channel)), sampleRate: pcm.sampleRate };
  }
  for (let block = firstActive; block < blockCount; block += 1) {
    if (!active[block]) continue;
    let next = block + 1;
    while (next < blockCount && !active[next]) next += 1;
    if (next < blockCount && next - block - 1 <= minimumBlocks) for (let bridge = block; bridge <= next; bridge += 1) active[bridge] = 1;
  }
  for (let block = 0; block < blockCount; block += 1) if (active[block]) for (let pad = Math.max(0, block - paddingBlocks); pad <= Math.min(blockCount - 1, block + paddingBlocks); pad += 1) active[pad] = 1;
  const chunks: Array<[number, number]> = [];
  let chunkStart = -1;
  for (let block = 0; block <= blockCount; block += 1) {
    const isActive = block < blockCount && active[block] === 1;
    if (isActive && chunkStart < 0) chunkStart = block * windowFrames;
    if (!isActive && chunkStart >= 0) {
      chunks.push([chunkStart, Math.min(frames, block * windowFrames)]);
      chunkStart = -1;
    }
  }
  const transitionFrames = Math.max(1, Math.min(Math.floor(pcm.sampleRate * 0.005), Math.floor(Math.max(1, minimum * pcm.sampleRate) / 4)));
  const totalFrames = chunks.reduce((sum, [start, end]) => sum + end - start, 0) - transitionFrames * Math.max(0, chunks.length - 1);
  const output = pcm.channels.map(() => new Float32Array(Math.max(1, totalFrames)));
  let cursor = 0;
  chunks.forEach(([start, end], chunkIndex) => {
    const length = end - start;
    if (chunkIndex === 0) {
      for (let frame = 0; frame < length; frame += 1) for (let channel = 0; channel < pcm.channels.length; channel += 1) output[channel]![frame] = pcm.channels[channel]![start + frame] ?? 0;
      cursor = length;
      return;
    }
    const overlap = Math.min(transitionFrames, cursor, length);
    for (let frame = 0; frame < overlap; frame += 1) {
      const fade = (frame + 1) / Math.max(1, overlap);
      for (let channel = 0; channel < pcm.channels.length; channel += 1) {
        const incoming = pcm.channels[channel]![start + frame] ?? 0;
        output[channel]![cursor - overlap + frame] = output[channel]![cursor - overlap + frame]! * (1 - fade) + incoming * fade;
      }
    }
    for (let frame = overlap; frame < length; frame += 1) for (let channel = 0; channel < pcm.channels.length; channel += 1) output[channel]![cursor + frame - overlap] = pcm.channels[channel]![start + frame] ?? 0;
    cursor += length - overlap;
  });
  onProgress?.(60, 'กำลังลบช่วงเงียบแบบ window และคง Padding');
  return { channels: output, sampleRate: pcm.sampleRate };
}

export function processAudio(pcm: AudioPcmData, operation: AudioOperation, onProgress?: (progress: number, message: string) => void): AudioProcessResult {
  const inputPeak = audioPeak(pcm.channels);
  const inputRmsDb = audioRmsDb(pcm.channels);
  let output: AudioPcmData;
  let outputFormat: 'wav' | 'wav-compact' | 'mp3' = 'wav';
  let gainApplied = 1;
  if (operation.kind === 'compress') {
    const duration = durationOf(pcm);
    const qualityFactor = operation.quality === 'small' ? 0.72 : operation.quality === 'high' ? 1.2 : 1;
    const targetRate = Math.max(8_000, Math.min(pcm.sampleRate, Math.floor(operation.targetBytes * 8 * qualityFactor / Math.max(1, duration * pcm.channels.length * 16))));
    output = resamplePcm(clonePcm(pcm), targetRate, onProgress);
  } else if (operation.kind === 'merge') {
    output = joinPcm(operation.segments, operation.gap, operation.crossfade, onProgress);
    outputFormat = operation.format;
  } else if (operation.kind === 'silence') {
    output = removeSilence(pcm, operation.thresholdDb, operation.minimum, operation.padding, onProgress);
  } else if (operation.kind === 'finish') {
    output = clonePcm(pcm);
    const requestedGain = 10 ** (operation.gainDb / 20);
    applyLinearGain(output.channels, requestedGain);
    gainApplied = requestedGain;
    if (operation.normalize) {
      const currentPeak = audioPeak(output.channels);
      const targetPeak = operation.loudness === 'voice' ? 0.9 : 0.98;
      const normalizeGain = currentPeak > 0 ? targetPeak / currentPeak : 1;
      applyLinearGain(output.channels, normalizeGain);
      gainApplied *= normalizeGain;
    }
    fadeChannels(output.channels, output.sampleRate, operation.fadeIn, operation.fadeOut);
  } else {
    output = speedPitchPcm(clonePcm(pcm), operation.speed, operation.semitones, onProgress);
  }
  onProgress?.(75, 'กำลังสร้างไฟล์ผลลัพธ์');
  const bytes = outputFormat === 'mp3' ? encodeMp3(output.channels, output.sampleRate, onProgress) : encodeWav(output.channels, output.sampleRate, onProgress, outputFormat === 'wav-compact' ? 8 : 16);
  const peak = audioPeak(output.channels);
  const rmsDb = audioRmsDb(output.channels);
  const truePeak = audioTruePeak(output.channels);
  return { bytes, duration: durationOf(output), sampleRate: output.sampleRate, channels: output.channels.length, inputPeak, peak, inputRmsDb, rmsDb, truePeak, gainApplied, clipped: truePeak > 1, outputFormat };
}

export function encodeMp3(channels: Float32Array[], sampleRate: number, onProgress?: (progress: number, message: string) => void, kbps = 128): Uint8Array {
  const channelCount = Math.min(2, channels.length);
  const frameCount = channels[0]?.length ?? 0;
  if (!channelCount || !frameCount) throw new Error('ไม่มีข้อมูลเสียงสำหรับสร้างไฟล์ MP3');
  const encoder = new Mp3Encoder(channelCount, sampleRate, Math.max(32, Math.min(320, kbps)));
  const blockSize = 1152; const chunks: number[] = [];
  for (let start = 0; start < frameCount; start += blockSize) {
    const end = Math.min(frameCount, start + blockSize); const left = new Int16Array(end - start); const right = channelCount > 1 ? new Int16Array(end - start) : undefined;
    for (let index = 0; index < left.length; index += 1) { left[index] = Math.round(clamp(channels[0]![start + index] ?? 0, -1, 1) * 32767); if (right) right[index] = Math.round(clamp(channels[1]![start + index] ?? channels[0]![start + index] ?? 0, -1, 1) * 32767); }
    const encoded = encoder.encodeBuffer(left, right); for (const byte of encoded) chunks.push(byte & 255);
    onProgress?.(80 + Math.round((end / frameCount) * 15), 'กำลังเข้ารหัส MP3');
  }
  const tail = encoder.flush(); for (const byte of tail) chunks.push(byte & 255);
  return Uint8Array.from(chunks);
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
