// Enhanced IndexedDB storage for critical emergency data
const DB_NAME = 'EmergencyAppOfflineDB';
const DB_VERSION = 2;

// Store definitions
const STORES = {
  EMERGENCY_ALERTS: 'emergency_alerts',
  TEAM_MEMBERS: 'team_members', 
  SYSTEM_STATUS: 'system_status',
  USER_REPORTS: 'user_reports',
  INCIDENTS: 'incidents',
  CACHE_METADATA: 'cache_metadata',
  OFFLINE_QUEUE: 'offline_queue'
} as const;

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initDB();
    return this.initPromise;
  }

  private _initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔧 Upgrading IndexedDB schema...');

        // Emergency Alerts store
        if (!db.objectStoreNames.contains(STORES.EMERGENCY_ALERTS)) {
          const alertStore = db.createObjectStore(STORES.EMERGENCY_ALERTS, { keyPath: 'id' });
          alertStore.createIndex('createdAt', 'createdAt');
          alertStore.createIndex('priority', 'priority');
          alertStore.createIndex('isActive', 'isActive');
        }

        // Team Members store
        if (!db.objectStoreNames.contains(STORES.TEAM_MEMBERS)) {
          const teamStore = db.createObjectStore(STORES.TEAM_MEMBERS, { keyPath: 'id' });
          teamStore.createIndex('status', 'status');
          teamStore.createIndex('role', 'role');
        }

        // System Status store
        if (!db.objectStoreNames.contains(STORES.SYSTEM_STATUS)) {
          const statusStore = db.createObjectStore(STORES.SYSTEM_STATUS, { keyPath: 'id' });
          statusStore.createIndex('component', 'component');
          statusStore.createIndex('status', 'status');
        }

        // User Reports store
        if (!db.objectStoreNames.contains(STORES.USER_REPORTS)) {
          const reportsStore = db.createObjectStore(STORES.USER_REPORTS, { keyPath: 'id' });
          reportsStore.createIndex('type', 'type');
          reportsStore.createIndex('status', 'status');
          reportsStore.createIndex('createdAt', 'createdAt');
        }

        // Incidents store
        if (!db.objectStoreNames.contains(STORES.INCIDENTS)) {
          const incidentsStore = db.createObjectStore(STORES.INCIDENTS, { keyPath: 'id' });
          incidentsStore.createIndex('status', 'status');
          incidentsStore.createIndex('priority', 'priority');
          incidentsStore.createIndex('createdAt', 'createdAt');
        }

        // Cache metadata store
        if (!db.objectStoreNames.contains(STORES.CACHE_METADATA)) {
          db.createObjectStore(STORES.CACHE_METADATA, { keyPath: 'key' });
        }

        // Offline queue store
        if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('type', 'type');
        }

        console.log('✅ IndexedDB schema upgrade completed');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Generic data operations
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let completed = 0;
      const total = items.length;
      
      if (total === 0) {
        resolve();
        return;
      }

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async get<T>(storeName: string, key: any): Promise<T | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex<T>(storeName: string, indexName: string, indexValue: any): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(indexValue);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Emergency-specific methods
  async cacheEmergencyAlerts(alerts: any[]): Promise<void> {
    try {
      await this.putMany(STORES.EMERGENCY_ALERTS, alerts);
      await this.updateCacheMetadata('emergency_alerts', Date.now());
      console.log(`💾 Cached ${alerts.length} emergency alerts offline`);
    } catch (error) {
      console.error('❌ Failed to cache emergency alerts:', error);
    }
  }

  async getOfflineEmergencyAlerts(): Promise<any[]> {
    try {
      const alerts = await this.getAllByIndex(STORES.EMERGENCY_ALERTS, 'isActive', true);
      console.log(`📱 Retrieved ${alerts.length} emergency alerts from offline storage`);
      return alerts;
    } catch (error) {
      console.error('❌ Failed to get offline emergency alerts:', error);
      return [];
    }
  }

  async cacheTeamMembers(members: any[]): Promise<void> {
    try {
      await this.putMany(STORES.TEAM_MEMBERS, members);
      await this.updateCacheMetadata('team_members', Date.now());
      console.log(`💾 Cached ${members.length} team members offline`);
    } catch (error) {
      console.error('❌ Failed to cache team members:', error);
    }
  }

  async getOfflineTeamMembers(): Promise<any[]> {
    try {
      const members = await this.getAll(STORES.TEAM_MEMBERS);
      console.log(`📱 Retrieved ${members.length} team members from offline storage`);
      return members;
    } catch (error) {
      console.error('❌ Failed to get offline team members:', error);
      return [];
    }
  }

  async cacheSystemStatus(status: any[]): Promise<void> {
    try {
      await this.putMany(STORES.SYSTEM_STATUS, status);
      await this.updateCacheMetadata('system_status', Date.now());
      console.log(`💾 Cached ${status.length} system status items offline`);
    } catch (error) {
      console.error('❌ Failed to cache system status:', error);
    }
  }

  async getOfflineSystemStatus(): Promise<any[]> {
    try {
      const status = await this.getAll(STORES.SYSTEM_STATUS);
      console.log(`📱 Retrieved ${status.length} system status items from offline storage`);
      return status;
    } catch (error) {
      console.error('❌ Failed to get offline system status:', error);
      return [];
    }
  }

  // Incident management
  async cacheIncident(incident: any): Promise<void> {
    try {
      await this.put(STORES.INCIDENTS, incident);
      console.log(`💾 Cached incident ${incident.id} offline`);
    } catch (error) {
      console.error('❌ Failed to cache incident:', error);
    }
  }

  async getOfflineIncidents(): Promise<any[]> {
    try {
      const incidents = await this.getAll(STORES.INCIDENTS);
      console.log(`📱 Retrieved ${incidents.length} incidents from offline storage`);
      return incidents.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('❌ Failed to get offline incidents:', error);
      return [];
    }
  }

  // User report management
  async cacheUserReport(report: any): Promise<void> {
    try {
      await this.put(STORES.USER_REPORTS, report);
      console.log(`💾 Cached user report ${report.id} offline`);
    } catch (error) {
      console.error('❌ Failed to cache user report:', error);
    }
  }

  async getOfflineUserReports(): Promise<any[]> {
    try {
      const reports = await this.getAll(STORES.USER_REPORTS);
      console.log(`📱 Retrieved ${reports.length} user reports from offline storage`);
      return reports.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('❌ Failed to get offline user reports:', error);
      return [];
    }
  }

  // Queue management for offline submissions
  async queueOfflineSubmission(submission: any): Promise<void> {
    try {
      const queueItem = {
        ...submission,
        id: submission.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0
      };
      await this.put(STORES.OFFLINE_QUEUE, queueItem);
      
      // If this is an emergency report or help request, store it as an active report for operators
      if (submission.isEmergency && submission.body) {
        try {
          const reportData = JSON.parse(submission.body);
          const isHelpRequest = submission.url.includes('help-requests');
          
          const activeReport = {
            id: `offline-${queueItem.id}`,
            type: isHelpRequest ? 'help_request' : (reportData.type || 'emergency_report'),
            title: reportData.title || (isHelpRequest ? 'Help Request (Offline)' : 'Emergency Report (Offline)'),
            message: reportData.message || reportData.description,
            location: reportData.location,
            priority: reportData.priority || (isHelpRequest ? 'normal' : 'critical'),
            status: 'active', // Active status, not queued
            createdAt: new Date(queueItem.timestamp).toISOString(),
            assignedTo: null,
            metadata: {
              ...reportData.metadata,
              submittedOffline: true,
              originalSubmissionId: queueItem.id,
              syncStatus: 'pending'
            },
            __offline: true
          };
          
          // Store as an active user report that operators can work with immediately
          await this.cacheUserReport(activeReport);
          console.log(`📱 Created ${isHelpRequest ? 'help request' : 'active incident'} for operators:`, activeReport.id);
        } catch (parseError) {
          console.warn('⚠️ Failed to parse report data for operator display:', parseError);
        }
      }
      
      console.log(`📤 Queued submission ${queueItem.id} for offline sync`);
    } catch (error) {
      console.error('❌ Failed to queue offline submission:', error);
    }
  }

  async getOfflineQueue(): Promise<any[]> {
    try {
      const queue = await this.getAll(STORES.OFFLINE_QUEUE);
      return queue.sort((a: any, b: any) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Failed to get offline queue:', error);
      return [];
    }
  }

  async removeFromOfflineQueue(id: string): Promise<void> {
    try {
      await this.delete(STORES.OFFLINE_QUEUE, id);
      console.log(`✅ Removed submission ${id} from offline queue`);
    } catch (error) {
      console.error('❌ Failed to remove from offline queue:', error);
    }
  }

  // Cache metadata management
  async updateCacheMetadata(key: string, timestamp: number): Promise<void> {
    try {
      await this.put(STORES.CACHE_METADATA, { key, timestamp, version: DB_VERSION });
    } catch (error) {
      console.error('❌ Failed to update cache metadata:', error);
    }
  }

  async getCacheMetadata(key: string): Promise<{ timestamp: number; version: number } | undefined> {
    try {
      return await this.get(STORES.CACHE_METADATA, key);
    } catch (error) {
      console.error('❌ Failed to get cache metadata:', error);
      return undefined;
    }
  }

  // Check if data is stale (older than 30 minutes)
  async isDataStale(key: string, maxAge = 30 * 60 * 1000): Promise<boolean> {
    const metadata = await this.getCacheMetadata(key);
    if (!metadata) return true;
    return Date.now() - metadata.timestamp > maxAge;
  }

  // Clear all offline data
  async clearAllData(): Promise<void> {
    try {
      const stores = Object.values(STORES);
      await Promise.all(stores.map(store => this.clear(store)));
      console.log('🧹 Cleared all offline data');
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
    }
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{ used: number; quota: number; usage: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usage = quota > 0 ? (used / quota) * 100 : 0;
        
        console.log(`💾 Storage usage: ${(used / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${usage.toFixed(1)}%)`);
        
        return { used, quota, usage };
      }
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
    }
    
    return { used: 0, quota: 0, usage: 0 };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(error => {
    console.error('❌ Failed to initialize offline storage:', error);
  });
}

export { STORES };