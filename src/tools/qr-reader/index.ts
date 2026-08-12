import jsQR from 'jsqr';
import { fitWithin, loadImageBitmap } from '../../core/image-processing';
import type { ToolModule } from '../../core/tool-contract';
import { copyText, formatBytes, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

let panel: HTMLElement | undefined;
let cameraStream: MediaStream | undefined;
let animationFrame: number | undefined;
let lastScanAt = 0;
let readRequestId = 0;
let cameraRequestId = 0;
let cameraPending = false;

function showResult(value: string): void {
  if (!panel) return;
  const output = requiredElement<HTMLTextAreaElement>(panel, '#qr-reader-result');
  output.value = value;
  requiredElement<HTMLElement>(panel, '#qr-reader-output').hidden = false;
  setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), 'อ่าน QR Code สำเร็จ', 'success');
}

function decodeCanvas(canvas: HTMLCanvasElement): string | undefined {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('ไม่สามารถอ่านข้อมูลภาพจาก Canvas ได้');
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })?.data;
}

async function readFile(file: File): Promise<void> {
  if (!panel) return;
  const status = requiredElement<HTMLOutputElement>(panel, '#qr-reader-status');
  const currentRequest = ++readRequestId;
  setToolStatus(status, `กำลังอ่าน ${file.name} (${formatBytes(file.size)})…`, 'working');
  const bitmap = await loadImageBitmap(file);
  try {
    if (!panel || currentRequest !== readRequestId) return;
    const dimensions = fitWithin({ width: bitmap.width, height: bitmap.height }, 2_048);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('ไม่สามารถเปิด Canvas สำหรับอ่าน QR Code ได้');
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const value = decodeCanvas(canvas);
    if (!value) throw new Error('ไม่พบ QR Code ที่อ่านได้ในรูปภาพนี้');
    showResult(value);
  } finally {
    bitmap.close();
  }
}

function stopCamera(): void {
  cameraRequestId += 1;
  cameraPending = false;
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = undefined;
  if (!panel) return;
  const video = panel.querySelector<HTMLVideoElement>('#qr-camera');
  if (video) video.srcObject = null;
  const stage = panel.querySelector<HTMLElement>('#qr-camera-stage');
  if (stage) stage.hidden = true;
  const button = panel.querySelector<HTMLButtonElement>('#qr-camera-toggle');
  if (button) button.textContent = 'เปิดกล้องสแกน';
}

function scanCameraFrame(timestamp: number): void {
  if (!panel || !cameraStream) return;
  const video = requiredElement<HTMLVideoElement>(panel, '#qr-camera');
  const canvas = requiredElement<HTMLCanvasElement>(panel, '#qr-camera-canvas');
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && timestamp - lastScanAt > 220) {
    lastScanAt = timestamp;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const value = canvas.width && canvas.height ? decodeCanvas(canvas) : undefined;
    if (value) {
      showResult(value);
      stopCamera();
      return;
    }
  }
  animationFrame = requestAnimationFrame(scanCameraFrame);
}

async function startCamera(): Promise<void> {
  if (!panel) return;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง');
  readRequestId += 1;
  const currentRequest = ++cameraRequestId;
  cameraPending = true;
  const status = requiredElement<HTMLOutputElement>(panel, '#qr-reader-status');
  setToolStatus(status, 'กำลังขอสิทธิ์เปิดกล้อง…', 'working');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  if (!panel || currentRequest !== cameraRequestId) {
    stream.getTracks().forEach((track) => track.stop());
    return;
  }
  cameraPending = false;
  cameraStream = stream;
  const video = requiredElement<HTMLVideoElement>(panel, '#qr-camera');
  video.srcObject = cameraStream;
  await video.play();
  requiredElement<HTMLElement>(panel, '#qr-camera-stage').hidden = false;
  requiredElement<HTMLButtonElement>(panel, '#qr-camera-toggle').textContent = 'ปิดกล้อง';
  setToolStatus(status, 'หันกล้องไปที่ QR Code ระบบจะอ่านให้อัตโนมัติ', 'working');
  animationFrame = requestAnimationFrame(scanCameraFrame);
}

const handleFileChange = (event: Event): void => {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !panel) return;
  stopCamera();
  void readFile(file).catch((error: unknown) => {
    if (panel) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), getErrorMessage(error), 'error');
  });
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-reader-action]');
  if (!button || !panel) return;
  if (button.dataset.readerAction === 'camera') {
    if (cameraStream || cameraPending) {
      stopCamera();
      setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), 'ปิดกล้องแล้ว');
    } else {
      void startCamera().catch((error: unknown) => {
        stopCamera();
        if (panel) setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), getErrorMessage(error), 'error');
      });
    }
  }
  if (button.dataset.readerAction === 'copy') {
    const value = requiredElement<HTMLTextAreaElement>(panel, '#qr-reader-result').value;
    void copyText(value)
      .then(() => panel && setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), 'คัดลอกผลลัพธ์แล้ว', 'success'))
      .catch((error: unknown) => panel && setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-reader-status'), getErrorMessage(error), 'error'));
  }
};

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Image + Camera</p><h2>อ่าน QR Code ภายในอุปกรณ์</h2></div></div>
      <div class="reader-options">
        <label class="file-drop" for="qr-reader-file">
          <strong>เลือกรูป QR Code</strong><span>PNG, JPEG หรือ WebP · ไม่เกิน 15 MB</span>
          <input id="qr-reader-file" type="file" accept="image/png,image/jpeg,image/webp" />
        </label>
        <div class="camera-option"><strong>หรือใช้กล้องของอุปกรณ์</strong><span>ระบบจะขอสิทธิ์เมื่อคุณกดปุ่มเท่านั้น</span>
          <button id="qr-camera-toggle" class="button" type="button" data-reader-action="camera">เปิดกล้องสแกน</button>
        </div>
      </div>
      <div id="qr-camera-stage" class="camera-stage" hidden>
        <video id="qr-camera" playsinline muted aria-label="ภาพจากกล้องสำหรับสแกน QR Code"></video>
        <canvas id="qr-camera-canvas" hidden></canvas><span class="camera-stage__guide" aria-hidden="true"></span>
      </div>
      <section id="qr-reader-output" class="result-panel" hidden>
        <label class="field" for="qr-reader-result"><span>ข้อมูลที่อ่านได้</span><textarea id="qr-reader-result" readonly></textarea></label>
        <button class="button" type="button" data-reader-action="copy">คัดลอกผลลัพธ์</button>
      </section>
      <output id="qr-reader-status" class="tool-status" aria-live="polite">เลือกรูปภาพ หรือเปิดกล้องเมื่อพร้อม</output>
    `;
    requiredElement<HTMLInputElement>(panel, '#qr-reader-file').addEventListener('change', handleFileChange);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    readRequestId += 1;
    stopCamera();
    panel?.querySelector<HTMLInputElement>('#qr-reader-file')?.removeEventListener('change', handleFileChange);
    panel?.removeEventListener('click', handleClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
