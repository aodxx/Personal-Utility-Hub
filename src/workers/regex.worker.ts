import { replaceRegex, runRegex } from '../core/regex';

interface RunRequest {
  jobId: string;
  operation: 'run';
  pattern: string;
  flags: string;
  input: string;
}
interface ReplaceRequest {
  jobId: string;
  operation: 'replace';
  pattern: string;
  flags: string;
  input: string;
  replacement: string;
}
type RegexRequest = RunRequest | ReplaceRequest;
type RegexResponse =
  | { type: 'success'; jobId: string; result: { operation: 'run'; result: ReturnType<typeof runRegex> } | { operation: 'replace'; result: string } }
  | { type: 'error'; jobId: string; message: string };

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null;
  postMessage(message: RegexResponse): void;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Regex Worker ทำงานไม่สำเร็จ / Regex Worker failed';
}

workerScope.onmessage = (event): void => {
  const request = event.data;
  try {
    if (request.operation === 'run') {
      workerScope.postMessage({ type: 'success', jobId: request.jobId, result: { operation: 'run', result: runRegex(request.pattern, request.flags, request.input) } });
    } else {
      workerScope.postMessage({ type: 'success', jobId: request.jobId, result: { operation: 'replace', result: replaceRegex(request.pattern, request.flags, request.input, request.replacement) } });
    }
  } catch (error) {
    workerScope.postMessage({ type: 'error', jobId: request.jobId, message: errorMessage(error) });
  }
};
