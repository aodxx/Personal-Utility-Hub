export interface OfflineToolRecord {
  toolId: string;
  toolVersion: string;
  cacheVersion: string;
  cachedAt: number;
  resourceCount: number;
}

const DATABASE_NAME = 'personal-utility-hub';
const STORE_NAME = 'offline-tools';
const DATABASE_VERSION = 1;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request ไม่สำเร็จ'));
  });
}

export class OfflineToolStore {
  private readonly memory = new Map<string, OfflineToolRecord>();
  private databasePromise: Promise<IDBDatabase> | undefined;

  constructor(private readonly factory: IDBFactory | undefined = globalThis.indexedDB) {}

  async get(toolId: string): Promise<OfflineToolRecord | undefined> {
    const database = await this.open().catch(() => undefined);
    if (!database) return this.memory.get(toolId);
    const transaction = database.transaction(STORE_NAME, 'readonly');
    return requestResult(transaction.objectStore(STORE_NAME).get(toolId) as IDBRequest<OfflineToolRecord | undefined>)
      .catch(() => this.memory.get(toolId));
  }

  async put(record: OfflineToolRecord): Promise<void> {
    this.memory.set(record.toolId, record);
    const database = await this.open().catch(() => undefined);
    if (!database) return;
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    await requestResult(transaction.objectStore(STORE_NAME).put(record));
  }

  private open(): Promise<IDBDatabase> {
    if (!this.factory) return Promise.reject(new Error('เบราว์เซอร์นี้ไม่รองรับ IndexedDB'));
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.factory?.open(DATABASE_NAME, DATABASE_VERSION);
        if (!request) {
          reject(new Error('ไม่สามารถเปิด IndexedDB ได้'));
          return;
        }
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'toolId' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('ไม่สามารถเปิด IndexedDB ได้'));
        request.onblocked = () => reject(new Error('IndexedDB ถูกบล็อกโดยแท็บอื่น'));
      });
    }
    return this.databasePromise;
  }
}
