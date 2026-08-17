import { MAX_AUDIO_BYTES, MAX_AUDIO_DURATION_SECONDS, validateAudioFile, type AudioPcmData } from './audio-processing';

export const MAX_DECODED_PCM_BYTES = 160 * 1024 * 1024;

export type AudioDecodeSupport = 'supported' | 'browser-dependent' | 'unavailable';

export interface AudioDecodeOptions {
  signal?: AbortSignal;
  onProgress?: (progress: number, message: string) => void;
}

export interface DecodedAudioFile {
  file: File;
  pcm: AudioPcmData;
  duration: number;
  mimeType: string;
  playbackSupport: AudioDecodeSupport;
  estimatedPcmBytes: number;
}

export class AudioDecodeError extends Error {
  readonly code: 'invalid-file' | 'unsupported-codec' | 'memory-limit' | 'decode-failed' | 'aborted';
  readonly fileName: string;
  readonly mimeType: string;
  constructor(code: AudioDecodeError['code'], file: File, message: string) {
    super(message);
    this.name = 'AudioDecodeError';
    this.code = code;
    this.fileName = file.name;
    this.mimeType = file.type || 'unknown';
  }
}

function abortError(): DOMException { return new DOMException('ยกเลิกการอ่านไฟล์เสียงแล้ว', 'AbortError'); }
function assertNotAborted(signal?: AbortSignal): void { if (signal?.aborted) throw abortError(); }

function extensionMime(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.toLowerCase().split('.').pop();
  return extension === 'mp3' ? 'audio/mpeg' : extension === 'm4a' ? 'audio/mp4' : extension === 'ogg' ? 'audio/ogg' : extension === 'webm' ? 'audio/webm' : extension === 'wav' ? 'audio/wav' : 'audio/*';
}

function canPlayType(file: File): AudioDecodeSupport {
  if (typeof Audio !== 'function') return 'browser-dependent';
  const value = new Audio().canPlayType(extensionMime(file));
  return value === 'probably' ? 'supported' : value === 'maybe' ? 'browser-dependent' : 'unavailable';
}

export function audioCapabilityHint(): string {
  if (typeof Audio !== 'function') return 'WAV · MP3 · M4A/AAC · OGG · WebM: browser-dependent';
  const audio = new Audio();
  const probe = (mime: string): string => { const value = audio.canPlayType(mime); return value === 'probably' ? 'supported' : value === 'maybe' ? 'browser-dependent' : 'unavailable'; };
  return `WAV ${probe('audio/wav')} · MP3 ${probe('audio/mpeg')} · M4A/AAC ${probe('audio/mp4')} · OGG ${probe('audio/ogg')} · WebM/Opus ${probe('audio/webm')}`;
}

function pcmFromBuffer(buffer: AudioBuffer): AudioPcmData {
  return { sampleRate: buffer.sampleRate, channels: Array.from({ length: buffer.numberOfChannels }, (_, index) => new Float32Array(buffer.getChannelData(index))) };
}

function audioContextConstructor(): typeof AudioContext | undefined {
  if (typeof AudioContext === 'function') return AudioContext;
  const candidate = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return candidate;
}

export function estimatedDecodedBytes(duration: number, sampleRate: number, channels: number): number {
  return Math.ceil(Math.max(0, duration) * Math.max(1, sampleRate) * Math.max(1, channels) * Float32Array.BYTES_PER_ELEMENT);
}

export function audioMemoryError(file: File, estimatedBytes: number): AudioDecodeError {
  return new AudioDecodeError('memory-limit', file, `ไฟล์ ${file.name} อาจใช้หน่วยความจำมากเกินไปเมื่อถอดรหัส (${Math.round(estimatedBytes / 1024 / 1024)} MB PCM) · ลองใช้ไฟล์ที่สั้นลงหรือแปลงเป็น WAV/MP3 ที่เล็กลง`);
}

export async function decodeAudioFile(file: File, options: AudioDecodeOptions = {}): Promise<DecodedAudioFile> {
  try {
    validateAudioFile(file);
  } catch (error) {
    throw new AudioDecodeError('invalid-file', file, error instanceof Error ? error.message : 'ไฟล์เสียงไม่ถูกต้อง');
  }
  if (file.size > MAX_AUDIO_BYTES) throw new AudioDecodeError('memory-limit', file, 'ไฟล์เสียงมีขนาดใหญ่เกิน 80 MB สำหรับการประมวลผลใน Browser');
  assertNotAborted(options.signal);
  const Constructor = audioContextConstructor();
  if (!Constructor) throw new AudioDecodeError('unsupported-codec', file, `Browser นี้ไม่มี AudioContext สำหรับเปิดไฟล์ ${file.name} · ลองแปลงเป็น WAV หรือ MP3 ก่อน`);
  options.onProgress?.(20, 'กำลังตรวจสอบ codec และอ่านไฟล์เสียง');
  let context: AudioContext | undefined;
  try {
    context = new Constructor();
    const bytes = await file.arrayBuffer();
    assertNotAborted(options.signal);
    options.onProgress?.(45, 'กำลังถอดรหัสเสียงเป็น PCM ในอุปกรณ์');
    const buffer = await context.decodeAudioData(bytes.slice(0));
    assertNotAborted(options.signal);
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > MAX_AUDIO_DURATION_SECONDS) {
      throw new AudioDecodeError('invalid-file', file, 'รองรับไฟล์เสียงความยาวไม่เกิน 30 นาที');
    }
    const estimatedPcmBytes = estimatedDecodedBytes(buffer.duration, buffer.sampleRate, buffer.numberOfChannels);
    if (estimatedPcmBytes > MAX_DECODED_PCM_BYTES) throw audioMemoryError(file, estimatedPcmBytes);
    const pcm = pcmFromBuffer(buffer);
    options.onProgress?.(100, 'อ่านไฟล์เสียงสำเร็จ');
    return { file, pcm, duration: buffer.duration, mimeType: extensionMime(file), playbackSupport: canPlayType(file), estimatedPcmBytes };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof AudioDecodeError) throw error;
    throw new AudioDecodeError('decode-failed', file, `Browser นี้ไม่สามารถเปิดไฟล์ ${file.name} (${extensionMime(file)}) ได้ · ลองแปลงไฟล์เป็น WAV หรือ MP3 ก่อน`);
  } finally {
    await context?.close().catch(() => undefined);
  }
}
