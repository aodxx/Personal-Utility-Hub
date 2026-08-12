import QRCode from 'qrcode';
import type { ToolModule } from '../../core/tool-contract';
import { downloadUrl, getErrorMessage, requiredElement, setToolStatus } from '../../core/tool-ui';
import { metadata } from './metadata';

const MAX_QR_CHARACTERS = 2_048;
let panel: HTMLElement | undefined;
let qrDataUrl = '';
let requestId = 0;

const handleSubmit = async (event: SubmitEvent): Promise<void> => {
  event.preventDefault();
  if (!panel) return;
  const currentRequest = ++requestId;
  const input = requiredElement<HTMLTextAreaElement>(panel, '#qr-content');
  const size = Number(requiredElement<HTMLSelectElement>(panel, '#qr-size').value);
  const status = requiredElement<HTMLOutputElement>(panel, '#qr-status');
  const preview = requiredElement<HTMLElement>(panel, '#qr-preview');
  const image = requiredElement<HTMLImageElement>(panel, '#qr-image');
  const download = requiredElement<HTMLButtonElement>(panel, '#qr-download');
  const value = input.value.trim();

  try {
    if (!value) throw new Error('กรุณากรอกข้อความหรือลิงก์ที่ต้องการสร้าง QR Code');
    if (Array.from(value).length > MAX_QR_CHARACTERS) throw new Error(`ข้อความต้องไม่เกิน ${MAX_QR_CHARACTERS.toLocaleString()} ตัวอักษร`);
    setToolStatus(status, 'กำลังสร้าง QR Code…', 'working');
    const dataUrl = await QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827ff', light: '#ffffffff' },
    });
    if (currentRequest !== requestId || !panel) return;
    qrDataUrl = dataUrl;
    image.src = dataUrl;
    image.alt = `QR Code สำหรับ ${value.slice(0, 80)}`;
    preview.hidden = false;
    download.disabled = false;
    setToolStatus(status, `สร้าง QR Code ขนาด ${size} × ${size} พิกเซลแล้ว`, 'success');
  } catch (error) {
    setToolStatus(status, getErrorMessage(error), 'error');
  }
};

const handleClick = (event: Event): void => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-qr-action]');
  if (!button || !panel) return;
  if (button.dataset.qrAction === 'download' && qrDataUrl) {
    downloadUrl(qrDataUrl, 'utility-hub-qr-code.png');
  }
  if (button.dataset.qrAction === 'clear') {
    requestId += 1;
    qrDataUrl = '';
    requiredElement<HTMLTextAreaElement>(panel, '#qr-content').value = '';
    requiredElement<HTMLImageElement>(panel, '#qr-image').removeAttribute('src');
    requiredElement<HTMLElement>(panel, '#qr-preview').hidden = true;
    requiredElement<HTMLButtonElement>(panel, '#qr-download').disabled = true;
    setToolStatus(requiredElement<HTMLOutputElement>(panel, '#qr-status'), 'ล้างข้อมูลแล้ว');
  }
};

const handleFormSubmit = (event: SubmitEvent): void => void handleSubmit(event);

const tool: ToolModule = {
  metadata,
  mount(container) {
    panel = document.createElement('section');
    panel.className = 'utility-panel';
    panel.innerHTML = `
      <div class="utility-panel__header"><div><p class="eyebrow">Offline QR</p><h2>สร้าง QR Code ในเบราว์เซอร์</h2></div></div>
      <form id="qr-form" class="tool-form">
        <label class="field" for="qr-content"><span>ข้อความหรือลิงก์</span>
          <textarea id="qr-content" maxlength="2048" required placeholder="https://example.com หรือข้อความที่ต้องการ"></textarea>
        </label>
        <div class="form-row">
          <label class="field" for="qr-size"><span>ขนาดไฟล์ PNG</span>
            <select id="qr-size"><option value="256">256 × 256</option><option value="512" selected>512 × 512</option><option value="1024">1024 × 1024</option></select>
          </label>
        </div>
        <div class="tool-actions">
          <button class="button button--primary" type="submit">สร้าง QR Code</button>
          <button id="qr-download" class="button" type="button" data-qr-action="download" disabled>ดาวน์โหลด PNG</button>
          <button class="text-button" type="button" data-qr-action="clear">ล้างข้อมูล</button>
        </div>
      </form>
      <figure id="qr-preview" class="qr-preview" hidden>
        <img id="qr-image" alt="QR Code ที่สร้างแล้ว" />
        <figcaption>สแกนตรวจสอบได้ทันที ภาพนี้สร้างภายในอุปกรณ์</figcaption>
      </figure>
      <output id="qr-status" class="tool-status" aria-live="polite">พร้อมสร้าง QR Code โดยไม่เชื่อมต่อ API</output>
    `;
    requiredElement<HTMLFormElement>(panel, '#qr-form').addEventListener('submit', handleFormSubmit);
    panel.addEventListener('click', handleClick);
    container.append(panel);
  },
  unmount() {
    requestId += 1;
    qrDataUrl = '';
    panel?.querySelector<HTMLFormElement>('#qr-form')?.removeEventListener('submit', handleFormSubmit);
    panel?.removeEventListener('click', handleClick);
    panel = undefined;
  },
};

export const { mount, unmount } = tool;
export { metadata };
