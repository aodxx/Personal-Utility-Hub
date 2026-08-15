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

export function encodeWav(channels: Float32Array[], sampleRate: number, onProgress?: (progress: number, message: string) => void): Uint8Array {
  const channelCount = channels.length;
  const frameCount = channels[0]?.length ?? 0;
  if (!channelCount || !frameCount) throw new Error('ไม่มีข้อมูลเสียงสำหรับสร้างไฟล์ WAV');
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, value: string): void => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)); };
  writeAscii(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
  writeAscii(36, 'data'); view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = clamp(channels[channel]![frame] ?? 0, -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
    if (frame % Math.max(1, Math.floor(frameCount / 10)) === 0) onProgress?.(80 + Math.round((frame / frameCount) * 20), 'กำลังเข้ารหัส WAV');
  }
  return new Uint8Array(buffer);
}
