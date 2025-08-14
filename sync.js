// Cross-device sync system for letters and bottles
// Provides offline-first storage with automatic background sync

class SyncManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.retryCount = 0;
    this.cursorKey = `sync-cursor-${CONFIG.sync.namespace}`;
    this.lastSyncCursor = localStorage.getItem(this.cursorKey) || '0';
    this.didBackfill = false; // one-time safety net for missed items
    
    // Initialize
    this.initDB();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  // Manual full backfill (fetch all and merge). Use sparingly.
  async backfillAll() {
    const resp = await fetch(
      `${CONFIG.sync.endpoint}/sync/${CONFIG.sync.namespace}?since=0`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    if (!resp.ok) throw new Error(`Backfill failed: ${resp.status}`);
    const data = await resp.json();
    let applied = 0;
    if (data.items && data.items.length > 0) {
      applied = await this.mergeRemoteChanges(data.items);
      console.log('[sync] Backfill applied', applied, 'item(s)');
    } else {
      console.log('[sync] Backfill found 0 item(s)');
    }
    if (data.cursor) {
      this.lastSyncCursor = data.cursor;
      localStorage.setItem(this.cursorKey, this.lastSyncCursor);
      console.log('[sync] Cursor (after backfill) ->', this.lastSyncCursor);
    }
    if (applied > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync:updated', {
        detail: { applied, cursor: this.lastSyncCursor }
      }));
    }
    this.didBackfill = true;
    return applied;
  }

  // Helper: promisify an IDBRequest
  _req(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Helper: iterate all records in a store, optionally limited
  _iterateStore(store, limit = Infinity) {
    return new Promise((resolve, reject) => {
      const results = [];
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ForYouDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Letters store
        if (!db.objectStoreNames.contains('letters')) {
          const lettersStore = db.createObjectStore('letters', { keyPath: 'id' });
          lettersStore.createIndex('updatedAt', 'updatedAt');
        }
        
        // Bottles store
        if (!db.objectStoreNames.contains('bottles')) {
          const bottlesStore = db.createObjectStore('bottles', { keyPath: 'id' });
          bottlesStore.createIndex('updatedAt', 'updatedAt');
        }
        
        // Outbox for pending sync operations
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
          outboxStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncNow();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncNow();
      }
    });
  }

  startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncNow();
      }
    }, CONFIG.sync.intervalMs);
  }

  // Encryption utilities
  _base64ToBytes(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async deriveKey() {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this._base64ToBytes(CONFIG.sync.encKey),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('for-you-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data) {
    const key = await this.deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    return {
      ciphertext: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  }

  async decrypt(encryptedData) {
    const key = await this.deriveKey();
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.ciphertext);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  // Local storage operations
  async saveLocal(type, item) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([type, 'outbox'], 'readwrite');
    const store = transaction.objectStore(type);
    const outboxStore = transaction.objectStore('outbox');
    
    // Add timestamp if not present
    if (!item.updatedAt) {
      item.updatedAt = Date.now();
    }
    
    // Save to local store
    await this._req(store.put(item));
    
    // Add to outbox for sync
    const outboxItem = {
      id: `${type}-${item.id}-${Date.now()}`,
      type,
      operation: 'upsert',
      data: item,
      timestamp: Date.now()
    };
    
    await this._req(outboxStore.put(outboxItem));
    
    // Try to sync if online
    if (this.isOnline) {
      setTimeout(() => this.syncNow(), 1000); // Debounced
    }
    
    return item;
  }

  async getLocal(type, id = null) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([type], 'readonly');
    const store = transaction.objectStore(type);
    
    if (id) {
      return await this._req(store.get(id));
    } else {
      const all = await this._iterateStore(store);
      return all.filter((x) => !x.deleted);
    }
  }

  async deleteLocal(type, id) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([type, 'outbox'], 'readwrite');
    const store = transaction.objectStore(type);
    const outboxStore = transaction.objectStore('outbox');
    
    // Mark as deleted (tombstone)
    const item = await this._req(store.get(id));
    if (item) {
      item.deleted = true;
      item.updatedAt = Date.now();
      await this._req(store.put(item));
      
      // Add to outbox
      const outboxItem = {
        id: `${type}-${id}-${Date.now()}`,
        type,
        operation: 'delete',
        data: item,
        timestamp: Date.now()
      };
      
      await this._req(outboxStore.put(outboxItem));
      
      // Try to sync if online
      if (this.isOnline) {
        setTimeout(() => this.syncNow(), 1000);
      }
    }
  }

  // Sync operations
  async syncNow() {
    if (!CONFIG.sync.enabled || this.syncInProgress || !this.isOnline) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // Push local changes
      await this.pushChanges();
      
      // Pull remote changes
      await this.pullChanges();
      
      this.retryCount = 0;
    } catch (error) {
      console.warn('Sync failed:', error);
      this.retryCount++;
      
      if (this.retryCount < CONFIG.sync.maxRetries) {
        setTimeout(() => {
          this.syncInProgress = false;
          this.syncNow();
        }, CONFIG.sync.retryDelayMs * this.retryCount);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async pushChanges() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['outbox'], 'readonly');
    const outboxStore = transaction.objectStore('outbox');
    const outboxItems = await this._iterateStore(outboxStore, CONFIG.sync.batchSize);
    await this.processPushBatch(outboxItems);
  }

  async processPushBatch(outboxItems) {
    if (outboxItems.length === 0) return;
    
    // Encrypt items
    const encryptedItems = [];
    for (const item of outboxItems) {
      const encrypted = await this.encrypt(item.data);
      encryptedItems.push({
        id: item.data.id,
        type: item.type,
        operation: item.operation,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        updatedAt: item.data.updatedAt
      });
    }
    
    // Send to server
    const response = await fetch(`${CONFIG.sync.endpoint}/sync/${CONFIG.sync.namespace}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: encryptedItems,
        cursor: this.lastSyncCursor
      })
    });
    
    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }
    
    console.log('[sync] Pushed', outboxItems.length, 'item(s)');

    // Clear outbox items that were successfully pushed
    const transaction = this.db.transaction(['outbox'], 'readwrite');
    const outboxStore = transaction.objectStore('outbox');
    
    for (const item of outboxItems) {
      await this._req(outboxStore.delete(item.id));
    }
  }

  async pullChanges() {
    // Use a small fudge (-1ms) to avoid missing items when serverTimestamp equals last cursor
    const last = Number(this.lastSyncCursor || '0');
    const effectiveSince = Math.max(0, last - 1);
    const baseUrl = `${CONFIG.sync.endpoint}/sync/${CONFIG.sync.namespace}`;

    let pageCursor = null;
    let serverCursor = null;
    let totalApplied = 0;
    let totalFetched = 0;
    const MAX_PAGES = 10; // safety bound per sync cycle
    const LIMIT = 500;    // server clamps to [1..1000]

    for (let i = 0; i < MAX_PAGES; i++) {
      const params = new URLSearchParams({ since: String(effectiveSince), limit: String(LIMIT) });
      if (pageCursor) params.set('pageCursor', pageCursor);
      const url = `${baseUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`);
      }

      const data = await response.json();
      serverCursor = data.cursor || serverCursor;

      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) {
        const applied = await this.mergeRemoteChanges(items);
        totalApplied += applied;
        totalFetched += items.length;
        console.log('[sync] Pulled page', i + 1, 'items', items.length, 'applied', applied);
      } else {
        console.log('[sync] Pulled page', i + 1, '0 item(s)');
      }

      if (data.hasMore && data.pageCursor) {
        pageCursor = data.pageCursor;
      } else {
        break;
      }
    }

    // One-time backfill if we suspect we missed items due to cursor skew
    if (totalFetched === 0 && !this.didBackfill && this.lastSyncCursor !== '0') {
      try {
        const fullResp = await fetch(
          `${CONFIG.sync.endpoint}/sync/${CONFIG.sync.namespace}?since=0`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        if (fullResp.ok) {
          const fullData = await fullResp.json();
          if (fullData.items && fullData.items.length > 0) {
            const appliedBackfill = await this.mergeRemoteChanges(fullData.items);
            if (appliedBackfill > 0) {
              console.log('[sync] Backfill applied', appliedBackfill, 'item(s)');
              totalApplied += appliedBackfill;
            } else {
              console.log('[sync] Backfill found items but none newer to apply');
            }
          }
          // Advance to server cursor from backfill to align with server
          if (fullData.cursor) {
            serverCursor = fullData.cursor;
            this.lastSyncCursor = serverCursor;
            localStorage.setItem(this.cursorKey, this.lastSyncCursor);
            console.log('[sync] Cursor (after backfill) ->', this.lastSyncCursor);
          }
        }
      } catch (e) {
        console.warn('[sync] Backfill failed', e);
      } finally {
        this.didBackfill = true;
      }
    }

    const shouldAdvance = (totalFetched > 0) || this.lastSyncCursor !== '0';
    if (serverCursor && shouldAdvance) {
      this.lastSyncCursor = serverCursor;
      localStorage.setItem(this.cursorKey, this.lastSyncCursor);
      console.log('[sync] Cursor ->', this.lastSyncCursor);
    } else if (serverCursor && !shouldAdvance) {
      console.log('[sync] Ignoring server cursor on empty initial pull');
    }

    if (totalApplied > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync:updated', {
        detail: { applied: totalApplied, cursor: this.lastSyncCursor }
      }));
    }
  }

  async mergeRemoteChanges(remoteItems) {
    if (!this.db) return 0;
    let applied = 0;
    for (const remoteItem of remoteItems) {
      try {
        const decryptedData = await this.decrypt({
          ciphertext: remoteItem.ciphertext,
          iv: remoteItem.iv
        });
        // Open a short-lived transaction per item to avoid auto-closure issues
        const tx = this.db.transaction([remoteItem.type], 'readwrite');
        const store = tx.objectStore(remoteItem.type);
        const localItem = await this._req(store.get(decryptedData.id));
        if (!localItem || decryptedData.updatedAt > localItem.updatedAt) {
          await this._req(store.put(decryptedData));
          applied++;
        }
      } catch (error) {
        console.warn('Failed to decrypt/merge item:', error);
      }
    }
    return applied;
  }

  // Reset the local sync cursor (for recovery or testing)
  resetCursor() {
    try {
      localStorage.removeItem(this.cursorKey);
    } catch (_) {}
    this.lastSyncCursor = '0';
    console.log('[sync] Cursor reset to 0');
  }
}

// Initialize sync manager
let syncManager = null;

// Public API for the app
window.SyncAPI = {
  async init() {
    if (CONFIG.sync.enabled) {
      syncManager = new SyncManager();
      await syncManager.initDB();
    }
  },
  
  async saveLetter(letter) {
    if (syncManager) {
      return await syncManager.saveLocal('letters', letter);
    } else {
      // Fallback to localStorage
      const letters = JSON.parse(localStorage.getItem(CONFIG.storage.letters) || '[]');
      letters.push(letter);
      localStorage.setItem(CONFIG.storage.letters, JSON.stringify(letters));
      return letter;
    }
  },
  
  async getLetters() {
    if (syncManager) {
      return await syncManager.getLocal('letters');
    } else {
      return JSON.parse(localStorage.getItem(CONFIG.storage.letters) || '[]');
    }
  },
  
  async deleteLetter(id) {
    if (syncManager) {
      await syncManager.deleteLocal('letters', id);
    } else {
      const letters = JSON.parse(localStorage.getItem(CONFIG.storage.letters) || '[]');
      const filtered = letters.filter(l => l.id !== id);
      localStorage.setItem(CONFIG.storage.letters, JSON.stringify(filtered));
    }
  },
  
  async saveBottle(bottle) {
    if (syncManager) {
      return await syncManager.saveLocal('bottles', bottle);
    } else {
      const bottles = JSON.parse(localStorage.getItem(CONFIG.storage.bottles) || '[]');
      bottles.push(bottle);
      localStorage.setItem(CONFIG.storage.bottles, JSON.stringify(bottles));
      return bottle;
    }
  },
  
  async getBottles() {
    if (syncManager) {
      return await syncManager.getLocal('bottles');
    } else {
      return JSON.parse(localStorage.getItem(CONFIG.storage.bottles) || '[]');
    }
  },
  
  async deleteBottle(id) {
    if (syncManager) {
      await syncManager.deleteLocal('bottles', id);
    } else {
      const bottles = JSON.parse(localStorage.getItem(CONFIG.storage.bottles) || '[]');
      const filtered = bottles.filter(b => b.id !== id);
      localStorage.setItem(CONFIG.storage.bottles, JSON.stringify(bottles));
    }
  },
  
  async syncNow() {
    if (syncManager) {
      await syncManager.syncNow();
    }
  }
  ,
  resetCursor() {
    if (syncManager) {
      syncManager.resetCursor();
    }
  }
  ,
  async backfillAll() {
    if (syncManager) {
      return await syncManager.backfillAll();
    }
    return 0;
  }
};
