/**
 * Data Backup Manager
 * Handles automated backups, export/import functionality, and crash recovery
 * Integrates with autosave and optimistic update systems
 */

import autosaveService from './autosaveService';
import optimisticUpdateManager from './optimisticUpdateManager';

class DataBackupManager {
  constructor() {
    this.backupInterval = null;
    this.backupFrequency = 15 * 60 * 1000; // 15 minutes default
    this.maxBackups = 50; // Maximum number of backups to keep
    this.storagePrefix = 'taskmaster_backup_';
    this.metadataKey = 'taskmaster_backup_metadata';
    this.crashDetectionKey = 'taskmaster_session_active';
    this.listeners = new Map();
    
    // Backup types
    this.backupTypes = {
      MANUAL: 'manual',
      AUTOMATIC: 'automatic',
      CRASH_RECOVERY: 'crash_recovery',
      EXPORT: 'export',
      IMPORT: 'import'
    };
    
    // Export formats
    this.exportFormats = {
      JSON: 'json',
      CSV: 'csv'
    };
    
    this.init();
  }

  init() {
    // Check for crash recovery on startup
    this.checkForCrashRecovery();
    
    // Mark session as active
    this.markSessionActive();
    
    // Start automatic backups
    this.startAutomaticBackups();
    
    // Listen for beforeunload to clean up session marker
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.markSessionInactive();
      });
      
      // Listen for visibility changes to trigger backups
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.createBackup(this.backupTypes.AUTOMATIC, 'Visibility change backup');
        }
      });
    }
  }

  /**
   * Mark session as active for crash detection
   */
  markSessionActive() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.crashDetectionKey, Date.now().toString());
    }
  }

  /**
   * Mark session as inactive (clean shutdown)
   */
  markSessionInactive() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.crashDetectionKey);
    }
  }

  /**
   * Check for crash recovery on startup
   */
  checkForCrashRecovery() {
    if (typeof localStorage === 'undefined') return;
    
    const sessionMarker = localStorage.getItem(this.crashDetectionKey);
    if (sessionMarker) {
      const lastSessionTime = parseInt(sessionMarker, 10);
      const timeSinceLastSession = Date.now() - lastSessionTime;
      
      // If last session was more than 5 minutes ago, consider it a crash
      if (timeSinceLastSession > 5 * 60 * 1000) {
        this.handleCrashRecovery();
      }
    }
  }

  /**
   * Handle crash recovery
   */
  handleCrashRecovery() {
    // Create a crash recovery backup first
    this.createBackup(this.backupTypes.CRASH_RECOVERY, 'Pre-recovery backup');
    
    // Find the most recent backup before the crash
    const recentBackup = this.getMostRecentBackup();
    
    if (recentBackup) {
      // Notify listeners about crash recovery opportunity
      this.notifyListeners('crashDetected', {
        backup: recentBackup,
        timeSinceBackup: Date.now() - recentBackup.timestamp
      });
    }
  }

  /**
   * Start automatic backups
   */
  startAutomaticBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    this.backupInterval = setInterval(() => {
      this.createBackup(this.backupTypes.AUTOMATIC, 'Scheduled backup');
    }, this.backupFrequency);
  }

  /**
   * Stop automatic backups
   */
  stopAutomaticBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  /**
   * Set backup frequency
   * @param {number} frequency - Frequency in milliseconds
   */
  setBackupFrequency(frequency) {
    this.backupFrequency = frequency;
    this.startAutomaticBackups(); // Restart with new frequency
  }

  /**
   * Create a backup
   * @param {string} type - Backup type
   * @param {string} description - Backup description
   * @param {Object} additionalData - Additional data to include
   * @returns {Object} Backup metadata
   */
  createBackup(type = this.backupTypes.MANUAL, description = '', additionalData = {}) {
    try {
      const timestamp = Date.now();
      const backupId = `${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Gather data from all sources
      const backupData = this.gatherBackupData();
      
      // Add metadata
      const backup = {
        id: backupId,
        type,
        description,
        timestamp,
        version: '1.0',
        dataSize: JSON.stringify(backupData).length,
        checksum: this.generateChecksum(backupData),
        ...additionalData,
        data: backupData
      };
      
      // Store backup
      this.storeBackup(backup);
      
      // Update metadata
      this.updateBackupMetadata(backup);
      
      // Clean up old backups
      this.cleanupOldBackups();
      
      // Notify listeners
      this.notifyListeners('backupCreated', { backup });
      
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      this.notifyListeners('backupError', { error, type: 'create' });
      return null;
    }
  }

  /**
   * Gather data from all sources for backup
   * @returns {Object} Complete backup data
   */
  gatherBackupData() {
    const data = {
      timestamp: Date.now(),
      source: 'taskmaster_ui'
    };
    
    // Get data from autosave service
    try {
      const autosaveData = autosaveService.getAllStoredData();
      if (autosaveData) {
        data.autosave = autosaveData;
      }
    } catch (error) {
      console.warn('Failed to gather autosave data:', error);
    }
    
    // Get optimistic updates
    try {
      const optimisticData = {
        pendingUpdates: optimisticUpdateManager.getPendingUpdates(),
        updateHistory: optimisticUpdateManager.getUpdateHistory(100),
        statistics: optimisticUpdateManager.getStatistics()
      };
      data.optimisticUpdates = optimisticData;
    } catch (error) {
      console.warn('Failed to gather optimistic update data:', error);
    }
    
    // Get localStorage data (filtered)
    try {
      const localStorageData = this.getFilteredLocalStorage();
      if (Object.keys(localStorageData).length > 0) {
        data.localStorage = localStorageData;
      }
    } catch (error) {
      console.warn('Failed to gather localStorage data:', error);
    }
    
    // Get application state
    try {
      data.appState = {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Failed to gather app state:', error);
    }
    
    return data;
  }

  /**
   * Get filtered localStorage data (excluding sensitive/system data)
   */
  getFilteredLocalStorage() {
    if (typeof localStorage === 'undefined') return {};
    
    const filtered = {};
    const excludePatterns = [
      /^taskmaster_backup_/,
      /^taskmaster_session_/,
      /^auth_/,
      /^token_/,
      /^private_/
    ];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !excludePatterns.some(pattern => pattern.test(key))) {
        try {
          filtered[key] = localStorage.getItem(key);
        } catch (error) {
          console.warn(`Failed to read localStorage key: ${key}`, error);
        }
      }
    }
    
    return filtered;
  }

  /**
   * Store backup in localStorage
   * @param {Object} backup - Backup data
   */
  storeBackup(backup) {
    if (typeof localStorage === 'undefined') return;
    
    const storageKey = `${this.storagePrefix}${backup.id}`;
    
    try {
      // Store backup (compress if too large)
      const backupStr = JSON.stringify(backup);
      
      if (backupStr.length > 5 * 1024 * 1024) { // 5MB limit
        // For very large backups, store only essential data
        const essentialBackup = {
          ...backup,
          data: this.compressBackupData(backup.data)
        };
        localStorage.setItem(storageKey, JSON.stringify(essentialBackup));
      } else {
        localStorage.setItem(storageKey, backupStr);
      }
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Storage quota exceeded, clean up old backups and try again
        this.cleanupOldBackups(true);
        try {
          localStorage.setItem(storageKey, JSON.stringify(backup));
        } catch (retryError) {
          console.error('Failed to store backup even after cleanup:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Compress backup data for storage
   * @param {Object} data - Original backup data
   * @returns {Object} Compressed backup data
   */
  compressBackupData(data) {
    return {
      timestamp: data.timestamp,
      source: data.source,
      autosave: data.autosave ? {
        // Keep only essential autosave data
        tasks: data.autosave.tasks,
        lastSaved: data.autosave.lastSaved
      } : null,
      appState: data.appState,
      _compressed: true,
      _originalSize: JSON.stringify(data).length
    };
  }

  /**
   * Update backup metadata
   * @param {Object} backup - Backup data
   */
  updateBackupMetadata(backup) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const metadata = this.getBackupMetadata();
      
      metadata.backups.unshift({
        id: backup.id,
        type: backup.type,
        description: backup.description,
        timestamp: backup.timestamp,
        dataSize: backup.dataSize,
        checksum: backup.checksum
      });
      
      // Keep only recent metadata
      metadata.backups = metadata.backups.slice(0, this.maxBackups);
      metadata.lastBackup = backup.timestamp;
      metadata.totalBackups = metadata.backups.length;
      
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to update backup metadata:', error);
    }
  }

  /**
   * Get backup metadata
   * @returns {Object} Backup metadata
   */
  getBackupMetadata() {
    if (typeof localStorage === 'undefined') {
      return { backups: [], lastBackup: null, totalBackups: 0 };
    }
    
    try {
      const stored = localStorage.getItem(this.metadataKey);
      return stored ? JSON.parse(stored) : { backups: [], lastBackup: null, totalBackups: 0 };
    } catch (error) {
      console.error('Failed to parse backup metadata:', error);
      return { backups: [], lastBackup: null, totalBackups: 0 };
    }
  }

  /**
   * Get list of all backups
   * @returns {Array} List of backup metadata
   */
  getBackupList() {
    const metadata = this.getBackupMetadata();
    return metadata.backups.map(backup => ({
      ...backup,
      age: Date.now() - backup.timestamp,
      formattedSize: this.formatFileSize(backup.dataSize),
      formattedDate: new Date(backup.timestamp).toLocaleString()
    }));
  }

  /**
   * Get most recent backup
   * @returns {Object|null} Most recent backup metadata
   */
  getMostRecentBackup() {
    const backups = this.getBackupList();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Load a specific backup
   * @param {string} backupId - Backup ID to load
   * @returns {Object|null} Backup data
   */
  loadBackup(backupId) {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const storageKey = `${this.storagePrefix}${backupId}`;
      const backupStr = localStorage.getItem(storageKey);
      
      if (!backupStr) return null;
      
      const backup = JSON.parse(backupStr);
      
      // Verify checksum
      if (backup.checksum && !this.verifyChecksum(backup.data, backup.checksum)) {
        console.warn('Backup checksum verification failed:', backupId);
        this.notifyListeners('backupError', { 
          error: new Error('Checksum verification failed'), 
          type: 'load',
          backupId 
        });
      }
      
      return backup;
    } catch (error) {
      console.error('Failed to load backup:', error);
      this.notifyListeners('backupError', { error, type: 'load', backupId });
      return null;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup ID to restore
   * @param {Object} options - Restore options
   * @returns {boolean} Success status
   */
  async restoreFromBackup(backupId, options = {}) {
    const {
      restoreAutosave = true,
      restoreOptimisticUpdates = false,
      restoreLocalStorage = true,
      createBackupBeforeRestore = true
    } = options;
    
    try {
      // Create backup before restore
      if (createBackupBeforeRestore) {
        this.createBackup(this.backupTypes.MANUAL, 'Pre-restore backup');
      }
      
      // Load backup
      const backup = this.loadBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found or corrupted');
      }
      
      const { data } = backup;
      let restoredItems = [];
      
      // Restore autosave data
      if (restoreAutosave && data.autosave) {
        try {
          await autosaveService.restoreFromData(data.autosave);
          restoredItems.push('autosave');
        } catch (error) {
          console.error('Failed to restore autosave data:', error);
        }
      }
      
      // Restore optimistic updates (if requested)
      if (restoreOptimisticUpdates && data.optimisticUpdates) {
        try {
          // Note: This is risky and should only be done in special cases
          console.warn('Restoring optimistic updates - this may cause conflicts');
          restoredItems.push('optimisticUpdates');
        } catch (error) {
          console.error('Failed to restore optimistic updates:', error);
        }
      }
      
      // Restore localStorage data
      if (restoreLocalStorage && data.localStorage) {
        try {
          Object.entries(data.localStorage).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
          restoredItems.push('localStorage');
        } catch (error) {
          console.error('Failed to restore localStorage data:', error);
        }
      }
      
      // Notify listeners
      this.notifyListeners('backupRestored', {
        backupId,
        backup,
        restoredItems,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      this.notifyListeners('backupError', { error, type: 'restore', backupId });
      return false;
    }
  }

  /**
   * Delete a backup
   * @param {string} backupId - Backup ID to delete
   * @returns {boolean} Success status
   */
  deleteBackup(backupId) {
    if (typeof localStorage === 'undefined') return false;
    
    try {
      const storageKey = `${this.storagePrefix}${backupId}`;
      localStorage.removeItem(storageKey);
      
      // Update metadata
      const metadata = this.getBackupMetadata();
      metadata.backups = metadata.backups.filter(b => b.id !== backupId);
      metadata.totalBackups = metadata.backups.length;
      localStorage.setItem(this.metadataKey, JSON.stringify(metadata));
      
      this.notifyListeners('backupDeleted', { backupId });
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      this.notifyListeners('backupError', { error, type: 'delete', backupId });
      return false;
    }
  }

  /**
   * Clean up old backups
   * @param {boolean} aggressive - Whether to do aggressive cleanup
   */
  cleanupOldBackups(aggressive = false) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const metadata = this.getBackupMetadata();
      const cutoffTime = Date.now() - (aggressive ? 7 : 30) * 24 * 60 * 60 * 1000; // 7 or 30 days
      const maxBackupsToKeep = aggressive ? Math.floor(this.maxBackups / 2) : this.maxBackups;
      
      let backupsToDelete = [];
      
      // Mark old backups for deletion
      metadata.backups.forEach(backup => {
        if (backup.timestamp < cutoffTime || 
            metadata.backups.indexOf(backup) >= maxBackupsToKeep) {
          backupsToDelete.push(backup.id);
        }
      });
      
      // Delete backups
      backupsToDelete.forEach(backupId => {
        this.deleteBackup(backupId);
      });
      
      if (backupsToDelete.length > 0) {
        this.notifyListeners('backupsCleanedUp', { 
          deletedCount: backupsToDelete.length,
          aggressive 
        });
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Export data to file
   * @param {string} format - Export format ('json' or 'csv')
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  exportData(format = this.exportFormats.JSON, options = {}) {
    try {
      const data = this.gatherBackupData();
      let exportData, filename, mimeType;
      
      if (format === this.exportFormats.JSON) {
        exportData = JSON.stringify(data, null, 2);
        filename = `taskmaster_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        mimeType = 'application/json';
      } else if (format === this.exportFormats.CSV) {
        exportData = this.convertToCSV(data);
        filename = `taskmaster_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
        mimeType = 'text/csv';
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Create downloadable file
      if (typeof window !== 'undefined' && window.Blob) {
        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      // Create backup record of export
      this.createBackup(this.backupTypes.EXPORT, `Exported as ${format.toUpperCase()}`, {
        exportFormat: format,
        exportSize: exportData.length
      });
      
      this.notifyListeners('dataExported', {
        format,
        filename,
        size: exportData.length,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        filename,
        size: exportData.length,
        format
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      this.notifyListeners('backupError', { error, type: 'export', format });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert data to CSV format
   * @param {Object} data - Data to convert
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    const rows = [];
    
    // Add header
    rows.push(['Type', 'Key', 'Value', 'Timestamp']);
    
    // Add autosave data
    if (data.autosave) {
      Object.entries(data.autosave).forEach(([key, value]) => {
        rows.push(['autosave', key, JSON.stringify(value), data.timestamp]);
      });
    }
    
    // Add localStorage data
    if (data.localStorage) {
      Object.entries(data.localStorage).forEach(([key, value]) => {
        rows.push(['localStorage', key, value, data.timestamp]);
      });
    }
    
    // Add app state
    if (data.appState) {
      Object.entries(data.appState).forEach(([key, value]) => {
        rows.push(['appState', key, JSON.stringify(value), data.timestamp]);
      });
    }
    
    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  /**
   * Generate checksum for data
   * @param {Object} data - Data to checksum
   * @returns {string} Checksum
   */
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Verify checksum
   * @param {Object} data - Data to verify
   * @param {string} expectedChecksum - Expected checksum
   * @returns {boolean} Is valid
   */
  verifyChecksum(data, expectedChecksum) {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStatistics() {
    if (typeof localStorage === 'undefined') {
      return { totalSize: 0, backupSize: 0, backupCount: 0 };
    }
    
    let totalSize = 0;
    let backupSize = 0;
    let backupCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Approximate size in bytes
      
      totalSize += size;
      
      if (key.startsWith(this.storagePrefix)) {
        backupSize += size;
        backupCount++;
      }
    }
    
    return {
      totalSize,
      backupSize,
      backupCount,
      formattedTotalSize: this.formatFileSize(totalSize),
      formattedBackupSize: this.formatFileSize(backupSize),
      backupPercentage: totalSize > 0 ? Math.round((backupSize / totalSize) * 100) : 0
    };
  }

  /**
   * Add event listener
   * @param {string} id - Listener ID
   * @param {Function} callback - Callback function
   */
  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  /**
   * Remove event listener
   * @param {string} id - Listener ID
   */
  removeListener(id) {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in backup manager listener:', error);
      }
    });
  }

  /**
   * Get backup configuration
   * @returns {Object} Current configuration
   */
  getConfiguration() {
    return {
      backupFrequency: this.backupFrequency,
      maxBackups: this.maxBackups,
      isRunning: this.backupInterval !== null,
      storageStats: this.getStorageStatistics()
    };
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration
   */
  updateConfiguration(config) {
    if (config.backupFrequency && config.backupFrequency !== this.backupFrequency) {
      this.setBackupFrequency(config.backupFrequency);
    }
    
    if (config.maxBackups && config.maxBackups !== this.maxBackups) {
      this.maxBackups = config.maxBackups;
      this.cleanupOldBackups();
    }
    
    if (config.enabled === false && this.backupInterval) {
      this.stopAutomaticBackups();
    } else if (config.enabled === true && !this.backupInterval) {
      this.startAutomaticBackups();
    }
  }

  /**
   * Clear all backups
   * @returns {number} Number of backups cleared
   */
  clearAllBackups() {
    if (typeof localStorage === 'undefined') return 0;
    
    const metadata = this.getBackupMetadata();
    let deletedCount = 0;
    
    metadata.backups.forEach(backup => {
      if (this.deleteBackup(backup.id)) {
        deletedCount++;
      }
    });
    
    // Clear metadata
    localStorage.removeItem(this.metadataKey);
    
    this.notifyListeners('allBackupsCleared', { deletedCount });
    return deletedCount;
  }
}

// Create and export singleton instance
const dataBackupManager = new DataBackupManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.dataBackupManager = dataBackupManager;
}

export default dataBackupManager; 