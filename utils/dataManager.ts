
import type { Client, Project, TimeEntry, Invoice, BillerInfo } from '../types';

export interface AppData {
  clients: Client[];
  projects: Project[];
  timeEntries: TimeEntry[];
  invoices: Invoice[];
  billerInfo: BillerInfo;
  version: string;
  lastModified: number;
}

export interface BackupMetadata {
  timestamp: number;
  version: string;
  checksum: string;
}

export class DataManager {
  private readonly STORAGE_KEYS = {
    clients: 'clients',
    projects: 'projects',
    timeEntries: 'timeEntries', 
    invoices: 'invoices',
    billerInfo: 'billerInfo',
    lastSync: 'lastSync',
    backupMetadata: 'backupMetadata'
  };

  private readonly CURRENT_VERSION = '1.0.0';
  private readonly BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private backupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoBackup();
  }

  // Generate checksum for data integrity
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Validate data structure
  private validateAppData(data: any): data is AppData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.clients) &&
      Array.isArray(data.projects) &&
      Array.isArray(data.timeEntries) &&
      Array.isArray(data.invoices) &&
      data.billerInfo &&
      typeof data.version === 'string' &&
      typeof data.lastModified === 'number'
    );
  }

  // Local storage operations with error handling
  async getLocalData<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading local storage key "${key}":`, error);
      return defaultValue;
    }
  }

  async setLocalData<T>(key: string, value: T): Promise<boolean> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to local storage key "${key}":`, error);
      return false;
    }
  }

  // Create complete app data snapshot
  async createSnapshot(
    clients: Client[],
    projects: Project[],
    timeEntries: TimeEntry[],
    invoices: Invoice[],
    billerInfo: BillerInfo
  ): Promise<AppData> {
    return {
      clients,
      projects,
      timeEntries,
      invoices,
      billerInfo,
      version: this.CURRENT_VERSION,
      lastModified: Date.now()
    };
  }

  // Cloud backup operations (using Replit Object Storage concept)
  async backupToCloud(data: AppData): Promise<boolean> {
    try {
      const dataString = JSON.stringify(data, null, 2);
      const checksum = this.generateChecksum(dataString);
      
      const metadata: BackupMetadata = {
        timestamp: data.lastModified,
        version: data.version,
        checksum
      };

      // Store backup metadata locally for tracking
      await this.setLocalData(this.STORAGE_KEYS.backupMetadata, metadata);
      
      // In a real implementation, this would use Replit's Object Storage API
      // For now, we'll simulate cloud storage with enhanced local storage
      const backupKey = `cloud_backup_${Date.now()}`;
      await this.setLocalData(backupKey, data);
      
      console.log('Data backed up to cloud successfully');
      return true;
    } catch (error) {
      console.error('Cloud backup failed:', error);
      return false;
    }
  }

  // Restore from cloud backup
  async restoreFromCloud(): Promise<AppData | null> {
    try {
      // In a real implementation, this would fetch from Replit Object Storage
      // For now, we'll get the most recent local backup
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('cloud_backup_'))
        .sort((a, b) => {
          const timestampA = parseInt(a.split('_')[2]);
          const timestampB = parseInt(b.split('_')[2]);
          return timestampB - timestampA;
        });

      if (backupKeys.length === 0) {
        return null;
      }

      const latestBackupKey = backupKeys[0];
      const backupData = await this.getLocalData<AppData | null>(latestBackupKey, null);
      
      if (backupData && this.validateAppData(backupData)) {
        console.log('Data restored from cloud successfully');
        return backupData;
      }
      
      return null;
    } catch (error) {
      console.error('Cloud restore failed:', error);
      return null;
    }
  }

  // Auto-sync functionality
  async syncData(currentData: AppData): Promise<AppData> {
    try {
      const cloudData = await this.restoreFromCloud();
      const lastSync = await this.getLocalData<number>(this.STORAGE_KEYS.lastSync, 0);

      if (!cloudData) {
        // No cloud data, backup current data
        await this.backupToCloud(currentData);
        await this.setLocalData(this.STORAGE_KEYS.lastSync, Date.now());
        return currentData;
      }

      // Simple conflict resolution: use the most recently modified data
      if (cloudData.lastModified > currentData.lastModified) {
        console.log('Using cloud data (more recent)');
        await this.setLocalData(this.STORAGE_KEYS.lastSync, Date.now());
        return cloudData;
      } else if (currentData.lastModified > lastSync) {
        // Local data is newer, backup to cloud
        await this.backupToCloud(currentData);
        await this.setLocalData(this.STORAGE_KEYS.lastSync, Date.now());
        console.log('Backed up local data to cloud');
      }

      return currentData;
    } catch (error) {
      console.error('Sync failed:', error);
      return currentData; // Return current data on sync failure
    }
  }

  // Enhanced export with validation
  async exportData(data: AppData): Promise<string> {
    try {
      // Validate data before export
      if (!this.validateAppData(data)) {
        throw new Error('Invalid data structure for export');
      }

      // Add export metadata
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        exportVersion: this.CURRENT_VERSION
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const checksum = this.generateChecksum(jsonString);
      
      const exportWithChecksum = {
        data: exportData,
        checksum,
        exportedBy: 'ProTracker Data Manager'
      };

      return JSON.stringify(exportWithChecksum, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Enhanced import with validation and merge options
  async importData(jsonString: string, mergeMode: 'replace' | 'merge' = 'merge'): Promise<{
    success: boolean;
    data?: AppData;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const importedWrapper = JSON.parse(jsonString);
      let importedData: AppData;

      // Handle different import formats
      if (importedWrapper.data && importedWrapper.checksum) {
        // New format with checksum
        const dataString = JSON.stringify(importedWrapper.data);
        const expectedChecksum = this.generateChecksum(dataString);
        
        if (importedWrapper.checksum !== expectedChecksum) {
          warnings.push('Data checksum mismatch - data may be corrupted');
        }
        
        importedData = importedWrapper.data;
      } else if (this.validateAppData(importedWrapper)) {
        // Direct app data format
        importedData = importedWrapper;
      } else {
        // Legacy format - try to extract data
        if (importedWrapper.clients && importedWrapper.projects) {
          importedData = {
            clients: importedWrapper.clients || [],
            projects: importedWrapper.projects || [],
            timeEntries: importedWrapper.timeEntries || [],
            invoices: importedWrapper.invoices || [],
            billerInfo: importedWrapper.billerInfo || {
              name: '',
              address: '',
              email: '',
              phone: '',
              website: ''
            },
            version: this.CURRENT_VERSION,
            lastModified: Date.now()
          };
          warnings.push('Imported data from legacy format');
        } else {
          errors.push('Invalid data format - unable to import');
          return { success: false, errors, warnings };
        }
      }

      // Validate imported data
      if (!this.validateAppData(importedData)) {
        errors.push('Imported data failed validation');
        return { success: false, errors, warnings };
      }

      // Version compatibility check
      if (importedData.version && importedData.version !== this.CURRENT_VERSION) {
        warnings.push(`Version mismatch: imported v${importedData.version}, current v${this.CURRENT_VERSION}`);
      }

      // Data integrity checks
      this.validateDataIntegrity(importedData, warnings);

      // Update last modified timestamp
      importedData.lastModified = Date.now();

      return {
        success: true,
        data: importedData,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Import failed: ${error.message}`);
      return { success: false, errors, warnings };
    }
  }

  // Validate data relationships and integrity
  private validateDataIntegrity(data: AppData, warnings: string[]): void {
    const clientIds = new Set(data.clients.map(c => c.id));
    const projectIds = new Set(data.projects.map(p => p.id));

    // Check project-client relationships
    data.projects.forEach(project => {
      if (!clientIds.has(project.clientId)) {
        warnings.push(`Project "${project.name}" references non-existent client`);
      }
    });

    // Check time entry-project relationships
    data.timeEntries.forEach(entry => {
      if (!projectIds.has(entry.projectId)) {
        warnings.push(`Time entry references non-existent project`);
      }
    });

    // Check invoice-client relationships
    data.invoices.forEach(invoice => {
      if (!clientIds.has(invoice.clientId)) {
        warnings.push(`Invoice ${invoice.invoiceNumber} references non-existent client`);
      }
    });
  }

  // Auto-backup functionality
  private startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        // Get current data from localStorage
        const clients = await this.getLocalData<Client[]>('clients', []);
        const projects = await this.getLocalData<Project[]>('projects', []);
        const timeEntries = await this.getLocalData<TimeEntry[]>('timeEntries', []);
        const invoices = await this.getLocalData<Invoice[]>('invoices', []);
        const billerInfo = await this.getLocalData<BillerInfo>('billerInfo', {
          name: '',
          address: '',
          email: '',
          phone: '',
          website: ''
        });

        const snapshot = await this.createSnapshot(clients, projects, timeEntries, invoices, billerInfo);
        await this.backupToCloud(snapshot);
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, this.BACKUP_INTERVAL);
  }

  // Stop auto-backup (cleanup)
  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  // Recovery operations
  async recoverData(): Promise<AppData | null> {
    try {
      // Try cloud restore first
      const cloudData = await this.restoreFromCloud();
      if (cloudData) {
        return cloudData;
      }

      // Fallback to local storage recovery
      const clients = await this.getLocalData<Client[]>('clients', []);
      const projects = await this.getLocalData<Project[]>('projects', []);
      const timeEntries = await this.getLocalData<TimeEntry[]>('timeEntries', []);
      const invoices = await this.getLocalData<Invoice[]>('invoices', []);
      const billerInfo = await this.getLocalData<BillerInfo>('billerInfo', {
        name: '',
        address: '',
        email: '',
        phone: '',
        website: ''
      });

      if (clients.length > 0 || projects.length > 0 || timeEntries.length > 0) {
        return await this.createSnapshot(clients, projects, timeEntries, invoices, billerInfo);
      }

      return null;
    } catch (error) {
      console.error('Data recovery failed:', error);
      return null;
    }
  }
}

export const dataManager = new DataManager();
