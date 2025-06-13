/**
 * Autosave Service
 * Provides centralized autosave management, localStorage backup, and data persistence utilities
 */

class AutosaveService {
  constructor() {
    this.storagePrefix = 'taskmaster_autosave_';
    this.maxStorageAge = 24 * 60 * 60 * 1000; // 24 hours
    this.instances = new Map(); // Track active autosave instances
    
    // Initialize service
    this.init();
  }

  init() {
    // Clean up old localStorage entries on startup
    this.cleanupOldEntries();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Generate storage key for a specific context
   * @param {string} context - Context identifier (e.g., 'task-123', 'prd-editor')
   * @param {string} field - Field name (optional)
   * @returns {string} Storage key
   */
  getStorageKey(context, field = 'data') {
    return `${this.storagePrefix}${context}_${field}`;
  }

  /**
   * Save data to localStorage with timestamp
   * @param {string} context - Context identifier
   * @param {*} data - Data to save
   * @param {string} field - Field name
   */
  saveToStorage(context, data, field = 'data') {
    try {
      const key = this.getStorageKey(context, field);
      const entry = {
        data,
        timestamp: Date.now(),
        context,
        field
      };
      
      localStorage.setItem(key, JSON.stringify(entry));
      
      // Emit storage event for other tabs/components
      window.dispatchEvent(new CustomEvent('autosave-updated', {
        detail: { context, field, data, timestamp: entry.timestamp }
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load data from localStorage
   * @param {string} context - Context identifier
   * @param {string} field - Field name
   * @returns {Object|null} Stored data with metadata or null if not found
   */
  loadFromStorage(context, field = 'data') {
    try {
      const key = this.getStorageKey(context, field);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const entry = JSON.parse(stored);
      
      // Check if entry is too old
      if (Date.now() - entry.timestamp > this.maxStorageAge) {
        this.removeFromStorage(context, field);
        return null;
      }
      
      return entry;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} context - Context identifier
   * @param {string} field - Field name
   */
  removeFromStorage(context, field = 'data') {
    try {
      const key = this.getStorageKey(context, field);
      localStorage.removeItem(key);
      
      // Emit removal event
      window.dispatchEvent(new CustomEvent('autosave-removed', {
        detail: { context, field }
      }));
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Get all stored contexts
   * @returns {Array} Array of context identifiers
   */
  getAllStoredContexts() {
    const contexts = new Set();
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          const contextPart = key.substring(this.storagePrefix.length);
          const contextId = contextPart.split('_')[0];
          contexts.add(contextId);
        }
      }
    } catch (error) {
      console.warn('Failed to get stored contexts:', error);
    }
    
    return Array.from(contexts);
  }

  /**
   * Clean up old localStorage entries
   */
  cleanupOldEntries() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(this.storagePrefix)) continue;
        
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored);
            if (Date.now() - entry.timestamp > this.maxStorageAge) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // If we can't parse it, it's probably corrupted, so remove it
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old autosave entries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old entries:', error);
    }
  }

  /**
   * Register an autosave instance
   * @param {string} instanceId - Unique identifier for the instance
   * @param {Object} config - Configuration object
   */
  registerInstance(instanceId, config) {
    this.instances.set(instanceId, {
      ...config,
      registeredAt: Date.now()
    });
  }

  /**
   * Unregister an autosave instance
   * @param {string} instanceId - Instance identifier
   */
  unregisterInstance(instanceId) {
    this.instances.delete(instanceId);
  }

  /**
   * Get all registered instances
   * @returns {Map} Map of instance configurations
   */
  getInstances() {
    return new Map(this.instances);
  }

  /**
   * Create a save function that automatically backs up to localStorage
   * @param {string} context - Context identifier
   * @param {Function} originalSaveFunction - Original save function
   * @returns {Function} Enhanced save function
   */
  createBackupSaveFunction(context, originalSaveFunction) {
    return async (data, isAutoSave = false) => {
      // Always backup to localStorage before attempting network save
      this.saveToStorage(context, data);
      
      try {
        // Attempt the original save
        const result = await originalSaveFunction(data, isAutoSave);
        
        // If successful, we can remove the backup after a delay
        setTimeout(() => {
          const stored = this.loadFromStorage(context);
          if (stored && JSON.stringify(stored.data) === JSON.stringify(data)) {
            this.removeFromStorage(context);
          }
        }, 5000); // Remove backup after 5 seconds if save was successful
        
        return result;
      } catch (error) {
        // Keep the backup if save failed
        console.log(`Save failed for ${context}, backup preserved in localStorage`);
        throw error;
      }
    };
  }

  /**
   * Restore data from localStorage backup
   * @param {string} context - Context identifier
   * @returns {Object|null} Restored data or null if no backup exists
   */
  restoreFromBackup(context) {
    const backup = this.loadFromStorage(context);
    return backup ? backup.data : null;
  }

  /**
   * Check if backup exists for a context
   * @param {string} context - Context identifier
   * @returns {boolean} Whether backup exists
   */
  hasBackup(context) {
    return this.loadFromStorage(context) !== null;
  }

  /**
   * Get backup info for a context
   * @param {string} context - Context identifier
   * @returns {Object|null} Backup metadata or null
   */
  getBackupInfo(context) {
    const backup = this.loadFromStorage(context);
    if (!backup) return null;
    
    return {
      timestamp: backup.timestamp,
      age: Date.now() - backup.timestamp,
      context: backup.context,
      field: backup.field,
      hasData: !!backup.data
    };
  }

  /**
   * Export all autosave data for backup purposes
   * @returns {Object} All autosave data
   */
  exportAllData() {
    const data = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            data[key] = JSON.parse(stored);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to export autosave data:', error);
    }
    
    return data;
  }

  /**
   * Import autosave data
   * @param {Object} data - Data to import
   */
  importData(data) {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(this.storagePrefix)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
    } catch (error) {
      console.warn('Failed to import autosave data:', error);
    }
  }

  /**
   * Clear all autosave data
   */
  clearAllData() {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`Cleared ${keysToRemove.length} autosave entries`);
    } catch (error) {
      console.warn('Failed to clear autosave data:', error);
    }
  }
}

// Create and export singleton instance
const autosaveService = new AutosaveService();

export default autosaveService; 