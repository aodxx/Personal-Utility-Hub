export type CompatibilityLevel = 'required' | 'optional';

export interface CompatibilityItem {
  id: string;
  label: string;
  supported: boolean;
  level: CompatibilityLevel;
}

export interface CompatibilityEnvironment {
  serviceWorker: boolean;
  indexedDb: boolean;
  worker: boolean;
  canvas: boolean;
  fileApi: boolean;
  clipboard: boolean;
  camera: boolean;
}

export function detectCompatibility(): CompatibilityItem[] {
  const canvas = document.createElement('canvas');
  return compatibilityFromEnvironment({
    serviceWorker: 'serviceWorker' in navigator,
    indexedDb: 'indexedDB' in window,
    worker: 'Worker' in window,
    canvas: Boolean(canvas.getContext),
    fileApi: 'File' in window && 'Blob' in window,
    clipboard: 'clipboard' in navigator,
    camera: Boolean(navigator.mediaDevices?.getUserMedia),
  });
}

export function compatibilityFromEnvironment(environment: CompatibilityEnvironment): CompatibilityItem[] {
  return [
    { id: 'file-api', label: 'File / Blob API', supported: environment.fileApi, level: 'required' },
    { id: 'canvas', label: 'Canvas API', supported: environment.canvas, level: 'required' },
    { id: 'worker', label: 'Web Worker', supported: environment.worker, level: 'required' },
    { id: 'indexeddb', label: 'IndexedDB', supported: environment.indexedDb, level: 'optional' },
    { id: 'service-worker', label: 'Service Worker / Offline', supported: environment.serviceWorker, level: 'optional' },
    { id: 'clipboard', label: 'Clipboard API', supported: environment.clipboard, level: 'optional' },
    { id: 'camera', label: 'Camera API', supported: environment.camera, level: 'optional' },
  ];
}

export function requiredCompatibilityReady(items: readonly CompatibilityItem[]): boolean {
  return items.filter(({ level }) => level === 'required').every(({ supported }) => supported);
}
