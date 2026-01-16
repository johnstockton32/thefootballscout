// IndexedDB wrapper for offline storage
const DB_NAME = 'football-scout-offline';
const DB_VERSION = 1;

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

interface OfflineRecord {
  id: string;
  table: string;
  data: any;
  lastModified: number;
  isLocal: boolean;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for sync queue
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: ['table', 'id'] });
          cacheStore.createIndex('table', 'table', { unique: false });
          cacheStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Store for offline-created records
        if (!db.objectStoreNames.contains('localRecords')) {
          const localStore = db.createObjectStore('localRecords', { keyPath: ['table', 'id'] });
          localStore.createIndex('table', 'table', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async getDB(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // Sync Queue Operations
  async addToSyncQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const db = await this.getDB();
    const id = `${operation.table}-${operation.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const op: OfflineOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(op);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markOperationSynced(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const op = getRequest.result;
        if (op) {
          op.synced = true;
          const putRequest = store.put(op);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSyncedOperations(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Cache Operations
  async cacheRecord(table: string, id: string, data: any): Promise<void> {
    const db = await this.getDB();
    const record: OfflineRecord = {
      id,
      table,
      data,
      lastModified: Date.now(),
      isLocal: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheRecords(table: string, records: any[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      
      records.forEach((record) => {
        const cacheRecord: OfflineRecord = {
          id: record.id,
          table,
          data: record,
          lastModified: Date.now(),
          isLocal: false,
        };
        store.put(cacheRecord);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedRecord(table: string, id: string): Promise<any | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get([table, id]);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedRecords(table: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const index = store.index('table');
      const request = index.getAll(IDBKeyRange.only(table));
      request.onsuccess = () => resolve(request.result.map(r => r.data));
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCachedRecord(table: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete([table, id]);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Local Records (created while offline)
  async saveLocalRecord(table: string, id: string, data: any): Promise<void> {
    const db = await this.getDB();
    const record = { table, id, data, lastModified: Date.now() };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['localRecords'], 'readwrite');
      const store = transaction.objectStore('localRecords');
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLocalRecords(table: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['localRecords'], 'readonly');
      const store = transaction.objectStore('localRecords');
      const index = store.index('table');
      const request = index.getAll(IDBKeyRange.only(table));
      request.onsuccess = () => resolve(request.result.map(r => r.data));
      request.onerror = () => reject(request.error);
    });
  }

  async deleteLocalRecord(table: string, id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['localRecords'], 'readwrite');
      const store = transaction.objectStore('localRecords');
      const request = store.delete([table, id]);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<number> {
    const ops = await this.getPendingOperations();
    return ops.length;
  }
}

export const offlineStorage = new OfflineStorage();
