export type ToolStatusTone = 'neutral' | 'success' | 'warning' | 'error' | 'working';

export function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`ไม่พบส่วนประกอบของเครื่องมือ: ${selector}`);
  return element;
}

export function setToolStatus(output: HTMLOutputElement, message: string, tone: ToolStatusTone = 'neutral'): void {
  output.textContent = message;
  output.dataset.tone = tone;
}

export function setProgressStatus(output: HTMLOutputElement, progress: number, message: string): void {
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  setToolStatus(output, `${message} · ${percent}%`, 'working');
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

export async function copyText(value: string): Promise<void> {
  if (!value) throw new Error('ยังไม่มีข้อมูลให้คัดลอก');
  await navigator.clipboard.writeText(value);
}

export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}
