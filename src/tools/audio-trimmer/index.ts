import { validateAudioFile, validateTrimOptions, type AudioPcmData } from '../../core/audio-processing';
import { trimAudioAsync } from '../../core/processing-client';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, formatBytes, getErrorMessage, isAbortError, requiredElement, setProgressStatus, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let sourceFile: File | undefined;
let sourceUrl = '';
let outputUrl = '';
let audioContext: AudioContext | undefined;
let audioBuffer: AudioBuffer | undefined;
let operationId = 0;
let activeJob: AbortController | undefined;

function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe - minutes * 60;
  return `${String(minutes).padStart(2, '0')}:${remainder.toFixed(2).padStart(5, '0')}`;
}

function setRunning(running: boolean): void {
  if (!panel) return;
  requiredElement<HTMLButtonElement>(panel, '#trim-submit').disabled = running;
  requiredElement<HTMLButtonElement>(panel, '[data-trim-action="cancel"]').hidden = !running;
  requiredElement<HTMLInputElement>(panel, '#trim-file').disabled = running;
}

function clearOutput(): void {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = '';
  const result = panel?.querySelector<HTMLElement>('#trim-result');
  if (result) result.hidden = true;
}

function drawWaveform(): void {
  if (!panel || !audioBuffer) return;
  const canvas = requiredElement<HTMLCanvasElement>(panel, '#trim-waveform');
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = Math.max(320, Math.floor(canvas.clientWidth * window.devicePixelRatio));
  const height = Math.max(110, Math.floor(canvas.clientHeight * window.devicePixelRatio));
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#eef0ff';
  context.fillRect(0, 0, width, height);
  const channel = audioBuffer.getChannelData(0);
  const step = Math.max(1, Math.floor(channel.length / width));
  const middle = height / 2;
  context.strokeStyle = '#5364c7';
  context.lineWidth = Math.max(1, window.devicePixelRatio);
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    let min = 1;
    let max = -1;
    const start = x * step;
    const end = Math.min(channel.length, start + step);
    for (let index = start; index < end; index += 1) {
      min = Math.min(min, channel[index] ?? 0);
      max = Math.max(max, channel[index] ?? 0);
    }
    context.moveTo(x, middle + min * middle * 0.88);
    context.lineTo(x, middle + max * middle * 0.88);
  }
  context.stroke();
  updateSelectionOverlay();
}

function updateSelectionOverlay(): void {
  if (!panel || !audioBuffer) return;
  const canvas = requiredElement<HTMLCanvasElement>(panel, '#trim-waveform');
  const context = canvas.getContext('2d');
  if (!context) return;
  const start = Number(requiredElement<HTMLInputElement>(panel, '#trim-start').value);
  const end = Number(requiredElement<HTMLInputElement>(panel, '#trim-end').value);
  const duration = audioBuffer.duration || 1;
  const startX = Math.round((start / duration) * canvas.width);
  const endX = Math.round((end / duration) * canvas.width);
  context.fillStyle = 'rgb(104 83 198 / 16%)';
  context.fillRect(0, 0, startX, canvas.height);
  context.fillRect(endX, 0, canvas.width - endX, canvas.height);
  context.strokeStyle = '#d95d9b';
  context.lineWidth = Math.max(2, window.devicePixelRatio);
  context.beginPath();
  context.moveTo(startX, 0); context.lineTo(startX, canvas.height);
  context.moveTo(endX, 0); context.lineTo(endX, canvas.height);
  context.stroke();
}

function updateRange(source: 'start' | 'end'): void {
  if (!panel || !audioBuffer) return;
  const start = requiredElement<HTMLInputElement>(panel, '#trim-start');
  const end = requiredElement<HTMLInputElement>(panel, '#trim-end');
  if (source === 'start') start.value = String(Math.min(Number(start.value), Number(end.value) - 0.01));
  else end.value = String(Math.max(Number(end.value), Number(start.value) + 0.01));
  requiredElement<HTMLElement>(panel, '#trim-start-value').textContent = formatTime(Number(start.value));
  requiredElement<HTMLElement>(panel, '#trim-end-value').textContent = formatTime(Number(end.value));
  updateSelectionOverlay();
}

function pcmFromAudioBuffer(buffer: AudioBuffer): AudioPcmData {
  return { sampleRate: buffer.sampleRate, channels: Array.from({ length: buffer.numberOfChannels }, (_, index) => new Float32Array(buffer.getChannelData(index))) };
}

async function decodeAudio(file: File): Promise<AudioBuffer> {
  audioContext ??= new AudioContext();
  const bytes = await file.arrayBuffer();
  return audioContext.decodeAudioData(bytes.slice(0));
}

const handleFileChange = async (event: Event): Promise<void> => {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#trim-status');
  const request = ++operationId;
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  sourceFile = undefined;
  audioBuffer = undefined;
  clearOutput();
  if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  sourceUrl = '';
  try {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) throw new Error('กรุณาเลือกไฟล์เสียง');
    validateAudioFile(file);
    setRunning(true);
    setProgressStatus(status, 10, 'กำลังอ่านไฟล์เสียง');
    const decoded = await decodeAudio(file);
    if (controller.signal.aborted) throw new DOMException('ยกเลิกการอ่านไฟล์เสียงแล้ว', 'AbortError');
    if (decoded.duration > 30 * 60) throw new Error('รองรับไฟล์เสียงความยาวไม่เกิน 30 นาที');
    if (!panel || request !== operationId) return;
    sourceFile = file;
    audioBuffer = decoded;
    sourceUrl = URL.createObjectURL(file);
    const start = requiredElement<HTMLInputElement>(panel, '#trim-start');
    const end = requiredElement<HTMLInputElement>(panel, '#trim-end');
    start.max = String(decoded.duration);
    end.max = String(decoded.duration);
    start.value = '0';
    end.value = String(decoded.duration.toFixed(2));
    requiredElement<HTMLElement>(panel, '#trim-start-value').textContent = formatTime(0);
    requiredElement<HTMLElement>(panel, '#trim-end-value').textContent = formatTime(decoded.duration);
    requiredElement<HTMLElement>(panel, '#trim-file-meta').textContent = `${file.name} · ${formatTime(decoded.duration)} · ${decoded.numberOfChannels} ch · ${decoded.sampleRate.toLocaleString()} Hz · ${formatBytes(file.size)}`;
    requiredElement<HTMLAudioElement>(panel, '#trim-preview').src = sourceUrl;
    requiredElement<HTMLElement>(panel, '#trim-editor').hidden = false;
    drawWaveform();
    setToolStatus(status, 'อ่านไฟล์เสียงสำเร็จ เลือกช่วงที่ต้องการแล้วกดตัดเสียง', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการอ่านไฟล์เสียงแล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handlePreviewTimeUpdate = (event: Event): void => {
  if (!panel) return;
  const audio = event.currentTarget as HTMLAudioElement;
  const end = Number(requiredElement<HTMLInputElement>(panel, '#trim-end').value);
  if (audio.currentTime >= end) {
    audio.pause();
    audio.currentTime = Number(requiredElement<HTMLInputElement>(panel, '#trim-start').value);
  }
};

const handlePreview = (): void => {
  if (!panel || !sourceUrl) return;
  const audio = requiredElement<HTMLAudioElement>(panel, '#trim-preview');
  audio.currentTime = Number(requiredElement<HTMLInputElement>(panel, '#trim-start').value);
  void audio.play();
};

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#trim-status');
  const request = ++operationId;
  activeJob?.abort();
  const controller = new AbortController();
  activeJob = controller;
  try {
    if (!sourceFile || !audioBuffer) throw new Error('กรุณาเลือกไฟล์เสียงก่อนตัด');
    const start = Number(requiredElement<HTMLInputElement>(panel, '#trim-start').value);
    const end = Number(requiredElement<HTMLInputElement>(panel, '#trim-end').value);
    const fadeIn = Number(requiredElement<HTMLInputElement>(panel, '#trim-fade-in').value);
    const fadeOut = Number(requiredElement<HTMLInputElement>(panel, '#trim-fade-out').value);
    const options = validateTrimOptions(audioBuffer.duration, { start, end, fadeIn, fadeOut });
    setRunning(true);
    setProgressStatus(status, 5, 'กำลังเตรียมเสียงสำหรับตัด');
    const result = await trimAudioAsync(pcmFromAudioBuffer(audioBuffer), options, { signal: controller.signal, onProgress: (progress, message) => setProgressStatus(status, progress, message) });
    if (controller.signal.aborted) throw new DOMException('ยกเลิกการตัดเสียงแล้ว', 'AbortError');
    if (!panel || request !== operationId) return;
    clearOutput();
    const outputBytes = new Uint8Array(result.bytes);
    outputUrl = URL.createObjectURL(new Blob([outputBytes.buffer as ArrayBuffer], { type: 'audio/wav' }));
    requiredElement<HTMLElement>(panel, '#trim-result').hidden = false;
    requiredElement<HTMLElement>(panel, '#trim-result-meta').textContent = `${formatTime(result.duration)} · WAV PCM 16-bit · ${result.channels} ch · ${result.sampleRate.toLocaleString()} Hz · ${formatBytes(result.bytes.byteLength)}`;
    requiredElement<HTMLAudioElement>(panel, '#trim-output-preview').src = outputUrl;
    setToolStatus(status, 'ตัดเสียงสำเร็จ ไฟล์พร้อม Preview และดาวน์โหลด', 'success');
  } catch (error) {
    if (!panel || request !== operationId) return;
    setToolStatus(status, isAbortError(error) ? 'ยกเลิกการตัดเสียงแล้ว' : getErrorMessage(error), isAbortError(error) ? 'neutral' : 'error');
  } finally {
    if (activeJob === controller) {
      activeJob = undefined;
      if (panel) setRunning(false);
    }
  }
};

const handleClick = (event: Event): void => {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-trim-action]')?.dataset.trimAction;
  if (action === 'preview') handlePreview();
  if (action === 'download' && outputUrl && sourceFile) downloadUrl(outputUrl, `${sourceFile.name.replace(/\.[^.]+$/, '')}-trimmed.wav`);
  if (action === 'cancel') activeJob?.abort();
};

const handleInput = (event: Event): void => {
  const id = (event.target as HTMLInputElement).id;
  if (id === 'trim-start') updateRange('start');
  if (id === 'trim-end') updateRange('end');
};
const handleResize = (): void => drawWaveform();
const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Precise local editing</p><h2>ตัดไฟล์เสียง</h2></div></div>
      <form id="trim-form" class="tool-form">
        <label class="file-drop" for="trim-file"><strong>เลือกไฟล์เสียง</strong><span id="trim-file-meta">MP3, WAV, M4A, OGG หรือ WebM · ไม่เกิน 80 MB / 30 นาที</span><input id="trim-file" type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,.mp3,.wav,.m4a,.ogg,.webm" required /></label>
        <section id="trim-editor" class="audio-editor" hidden>
          <canvas id="trim-waveform" class="audio-waveform" aria-label="Waveform ของไฟล์เสียง"></canvas>
          <div class="audio-preview-row"><audio id="trim-preview" controls preload="metadata"></audio><button class="button" type="button" data-trim-action="preview">Preview ช่วงที่เลือก</button></div>
          <div class="form-row">
            <label class="field" for="trim-start"><span>เริ่ม <output id="trim-start-value">00:00.00</output></span><input id="trim-start" type="range" min="0" max="1" step="0.01" value="0" /></label>
            <label class="field" for="trim-end"><span>จบ <output id="trim-end-value">00:00.00</output></span><input id="trim-end" type="range" min="0.01" max="1" step="0.01" value="1" /></label>
          </div>
          <div class="form-row">
            <label class="field" for="trim-fade-in"><span>Fade in (วินาที)</span><input id="trim-fade-in" type="number" min="0" max="30" step="0.1" value="0" /></label>
            <label class="field" for="trim-fade-out"><span>Fade out (วินาที)</span><input id="trim-fade-out" type="number" min="0" max="30" step="0.1" value="0" /></label>
          </div>
        </section>
        <div class="tool-actions"><button id="trim-submit" class="button button--primary" type="submit">ตัดเสียงและสร้าง WAV</button><button class="button" type="button" data-trim-action="cancel" hidden>ยกเลิก</button></div>
      </form>
      <section id="trim-result" class="download-result" hidden><div><strong>ไฟล์เสียงที่ตัดแล้ว</strong><p id="trim-result-meta"></p><audio id="trim-output-preview" controls preload="metadata"></audio></div><button class="button" type="button" data-trim-action="download">ดาวน์โหลด WAV</button></section>
      <output id="trim-status" class="tool-status" aria-live="polite">ไฟล์จะไม่ออกจากอุปกรณ์ และผลลัพธ์เป็น WAV เพื่อรักษาคุณภาพการตัดต่อ</output>`;
    requiredElement<HTMLInputElement>(panel, '#trim-file').addEventListener('change', (event) => void handleFileChange(event));
    requiredElement<HTMLInputElement>(panel, '#trim-start').addEventListener('input', handleInput);
    requiredElement<HTMLInputElement>(panel, '#trim-end').addEventListener('input', handleInput);
    requiredElement<HTMLAudioElement>(panel, '#trim-preview').addEventListener('timeupdate', handlePreviewTimeUpdate);
    requiredElement<HTMLFormElement>(panel, '#trim-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);
    container.append(panel);
  },
  unmount() {
    operationId += 1;
    activeJob?.abort();
    activeJob = undefined;
    panel?.querySelector<HTMLAudioElement>('#trim-preview')?.pause();
    panel?.querySelector<HTMLAudioElement>('#trim-output-preview')?.pause();
    panel?.removeEventListener('click', handleClick);
    window.removeEventListener('resize', handleResize);
    clearOutput();
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    sourceUrl = '';
    sourceFile = undefined;
    audioBuffer = undefined;
    audioContext?.close();
    audioContext = undefined;
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
