import { replaceRegex, runRegex, type RegexRunResult } from './regex';
import regexWorkerUrl from '../workers/regex.worker.ts?worker&url';

export const REGEX_WORKER_URL = regexWorkerUrl;
export const REGEX_WORKER_TIMEOUT_MS = 2_000;
export const MAX_REGEX_SYNC_FALLBACK_CHARS = 20_000;

type RegexOperation =
  | { operation: 'run'; pattern: string; flags: string; input: string }
  | { operation: 'replace'; pattern: string; flags: string; input: string; replacement: string };

type RegexWorkerResult = { operation: 'run'; result: RegexRunResult } | { operation: 'replace'; result: string };
type RegexWorkerRequest = RegexOperation & { jobId: string };
interface RegexWorkerSuccess { type: 'success'; jobId: string; result: RegexWorkerResult }
interface RegexWorkerError { type: 'error'; jobId: string; message: string }
type RegexWorkerResponse = RegexWorkerSuccess | RegexWorkerError;

function abortError(): DOMException {
  return new DOMException('ยกเลิกการประมวลผลแล้ว', 'AbortError');
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError();
}

function syncFallback(operation: RegexOperation, signal?: AbortSignal): RegexWorkerResult {
  assertNotAborted(signal);
  if (operation.input.length > MAX_REGEX_SYNC_FALLBACK_CHARS) {
    throw new Error(`เบราว์เซอร์ไม่รองรับ Worker สำหรับข้อความเกิน ${MAX_REGEX_SYNC_FALLBACK_CHARS.toLocaleString()} ตัวอักษร / Worker is required above ${MAX_REGEX_SYNC_FALLBACK_CHARS.toLocaleString()} characters`);
  }
  if (operation.operation === 'run') return { operation: 'run', result: runRegex(operation.pattern, operation.flags, operation.input) };
  return { operation: 'replace', result: replaceRegex(operation.pattern, operation.flags, operation.input, operation.replacement) };
}

async function runWorker(operation: RegexOperation, signal?: AbortSignal): Promise<RegexWorkerResult> {
  assertNotAborted(signal);
  if (typeof Worker !== 'function') return syncFallback(operation, signal);

  return new Promise<RegexWorkerResult>((resolve, reject) => {
    const worker = new Worker(REGEX_WORKER_URL, { type: 'module' });
    const jobId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    let settled = false;
    let timer: number | undefined;

    const cleanup = (): void => {
      if (timer !== undefined) window.clearTimeout(timer);
      worker.terminate();
      signal?.removeEventListener('abort', handleAbort);
    };
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const handleAbort = (): void => finish(() => reject(abortError()));

    worker.onmessage = (event: MessageEvent<RegexWorkerResponse>): void => {
      const response = event.data;
      if (response.jobId !== jobId) return;
      if (response.type === 'error') finish(() => reject(new Error(response.message)));
      else finish(() => resolve(response.result));
    };
    worker.onerror = (event): void => finish(() => reject(new Error(event.message || 'Regex Worker ทำงานไม่สำเร็จ / Regex Worker failed')));
    signal?.addEventListener('abort', handleAbort, { once: true });
    timer = window.setTimeout(() => finish(() => reject(new Error('Pattern ใช้เวลานานเกินไป / Pattern timed out; try a simpler expression'))), REGEX_WORKER_TIMEOUT_MS);
    const request: RegexWorkerRequest = { ...operation, jobId };
    worker.postMessage(request);
  });
}

export async function runRegexAsync(pattern: string, flags: string, input: string, signal?: AbortSignal): Promise<RegexRunResult> {
  const response = await runWorker({ operation: 'run', pattern, flags, input }, signal);
  if (response.operation !== 'run') throw new Error('Regex Worker คืนผลลัพธ์ไม่ตรงชนิด / Regex Worker returned an unexpected result');
  return response.result;
}

export async function replaceRegexAsync(pattern: string, flags: string, input: string, replacement: string, signal?: AbortSignal): Promise<string> {
  const response = await runWorker({ operation: 'replace', pattern, flags, input, replacement }, signal);
  if (response.operation !== 'replace') throw new Error('Regex Worker คืนผลลัพธ์ไม่ตรงชนิด / Regex Worker returned an unexpected result');
  return response.result;
}
