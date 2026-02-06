// Offline authentication storage using IndexedDB
// Stores encrypted session data for offline access

const DB_NAME = 'offline-auth';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

interface CachedSession {
  userId: string;
  email: string;
  passwordHash: string; // Stored as PBKDF2-derived key
  salt: string; // Random salt (hex-encoded)
  profile: any;
  roles: string[];
  cachedAt: number;
  expiresAt: number;
}

class OfflineAuthStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'email' });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Generate a random salt
  private generateSalt(): string {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Hash password using PBKDF2 (Web Crypto API) - resistant to brute-force
  private async hashPassword(password: string, saltHex: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const passwordKey = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      passwordKey, 256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Save session for offline use after successful online login
  async cacheSession(
    email: string,
    password: string,
    userId: string,
    profile: any,
    roles: string[]
  ): Promise<void> {
    const db = await this.getDB();
    
    // Generate random salt for PBKDF2
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);
    
    const cachedSession: CachedSession = {
      userId,
      email,
      passwordHash,
      salt,
      profile,
      roles,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cachedSession);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Verify offline credentials
  async verifyOfflineCredentials(
    email: string,
    password: string
  ): Promise<{ success: boolean; session: CachedSession | null }> {
    const db = await this.getDB();
    
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(email);
      
      request.onsuccess = async () => {
        const cachedSession = request.result as CachedSession | undefined;
        
        if (!cachedSession) {
          resolve({ success: false, session: null });
          return;
        }
        
        // Check if session has expired
        if (cachedSession.expiresAt < Date.now()) {
          await this.clearSession(email);
          resolve({ success: false, session: null });
          return;
        }
        
        // Verify password hash using stored salt
        const passwordHash = await this.hashPassword(password, cachedSession.salt);
        
        if (passwordHash === cachedSession.passwordHash) {
          resolve({ success: true, session: cachedSession });
        } else {
          resolve({ success: false, session: null });
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached session by email
  async getCachedSession(email: string): Promise<CachedSession | null> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(email);
      
      request.onsuccess = () => {
        const session = request.result as CachedSession | undefined;
        if (session && session.expiresAt > Date.now()) {
          resolve(session);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Clear cached session
  async clearSession(email: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(email);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all cached sessions
  async clearAllSessions(): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check if any cached session exists
  async hasCachedSessions(): Promise<boolean> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineAuth = new OfflineAuthStorage();
