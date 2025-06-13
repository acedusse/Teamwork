/**
 * React hooks for Data Backup Manager
 * Provides state management and event handling for backup operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dataBackupManager from '../services/dataBackupManager';

/**
 * Main backup manager hook
 */
export function useBackupManager() {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [storageStats, setStorageStats] = useState(null);
  const listenerIdRef = useRef(`backup_${Date.now()}`);

  // Load initial data
  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    // Set up event listener
    dataBackupManager.addListener(listenerId, handleBackupEvent);
    
    // Load initial data
    loadBackups();
    loadConfiguration();
    loadStorageStats();
    
    return () => {
      dataBackupManager.removeListener(listenerId);
    };
  }, []);

  const handleBackupEvent = useCallback((event, data) => {
    switch (event) {
      case 'backupCreated':
        loadBackups();
        loadStorageStats();
        break;
      
      case 'backupDeleted':
        loadBackups();
        loadStorageStats();
        break;
      
      case 'backupRestored':
        setError(null);
        break;
      
      case 'backupError':
        setError(data.error?.message || 'Backup operation failed');
        break;
      
      case 'backupsCleanedUp':
        loadBackups();
        loadStorageStats();
        break;
      
      case 'allBackupsCleared':
        loadBackups();
        loadStorageStats();
        break;
      
      case 'dataExported':
        setError(null);
        break;
      
      case 'dataImported':
        setError(null);
        loadBackups();
        break;
      
      case 'crashDetected':
        // Handle crash detection - could show a modal or notification
        console.log('Crash detected, backup available:', data);
        break;
    }
  }, []);

  const loadBackups = useCallback(() => {
    try {
      const backupList = dataBackupManager.getBackupList();
      setBackups(backupList);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const loadConfiguration = useCallback(() => {
    try {
      const config = dataBackupManager.getConfiguration();
      setConfiguration(config);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const loadStorageStats = useCallback(() => {
    try {
      const stats = dataBackupManager.getStorageStatistics();
      setStorageStats(stats);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  const createBackup = useCallback(async (description = '', type = 'manual') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const backup = dataBackupManager.createBackup(type, description);
      return backup;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restoreBackup = useCallback(async (backupId, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await dataBackupManager.restoreFromBackup(backupId, options);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBackup = useCallback(async (backupId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = dataBackupManager.deleteBackup(backupId);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportData = useCallback(async (format = 'json') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = dataBackupManager.exportData(format);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfiguration = useCallback((newConfig) => {
    try {
      dataBackupManager.updateConfiguration(newConfig);
      loadConfiguration();
    } catch (error) {
      setError(error.message);
    }
  }, [loadConfiguration]);

  const clearAllBackups = useCallback(() => {
    try {
      const deletedCount = dataBackupManager.clearAllBackups();
      return deletedCount;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  const cleanupOldBackups = useCallback((aggressive = false) => {
    try {
      dataBackupManager.cleanupOldBackups(aggressive);
    } catch (error) {
      setError(error.message);
    }
  }, []);

  return {
    // State
    backups,
    isLoading,
    error,
    configuration,
    storageStats,
    
    // Actions
    createBackup,
    restoreBackup,
    deleteBackup,
    exportData,
    updateConfiguration,
    clearAllBackups,
    cleanupOldBackups,
    
    // Utilities
    loadBackups,
    loadConfiguration,
    loadStorageStats,
    clearError: () => setError(null)
  };
}

/**
 * Hook for backup import functionality
 */
export function useBackupImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const importData = useCallback(async (file, options = {}) => {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    
    try {
      // Create a file reader to handle the import
      const text = await readFileAsText(file);
      let data;
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        data = parseCSVData(text);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
      
      // Validate the data
      if (!validateImportData(data)) {
        throw new Error('Invalid backup file format.');
      }
      
      // Process the import
      const result = await processImportData(data, options);
      setImportResult(result);
      
      return result;
    } catch (error) {
      setImportError(error.message);
      throw error;
    } finally {
      setIsImporting(false);
    }
  }, []);

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const parseCSVData = (text) => {
    const lines = text.split('\n');
    const data = {
      autosave: {},
      localStorage: {},
      appState: {},
      timestamp: Date.now()
    };
    
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(cell => cell.replace(/^"|"$/g, ''));
      if (cells.length >= 4) {
        const [type, key, value] = cells;
        
        if (type === 'autosave') {
          try {
            data.autosave[key] = JSON.parse(value);
          } catch {
            data.autosave[key] = value;
          }
        } else if (type === 'localStorage') {
          data.localStorage[key] = value;
        } else if (type === 'appState') {
          try {
            data.appState[key] = JSON.parse(value);
          } catch {
            data.appState[key] = value;
          }
        }
      }
    }
    
    return data;
  };

  const validateImportData = (data) => {
    if (!data || typeof data !== 'object') return false;
    return !!(data.timestamp || data.autosave || data.localStorage);
  };

  const processImportData = async (data, options) => {
    const { mergeWithExisting = false } = options;
    const result = {
      imported: [],
      skipped: [],
      errors: []
    };
    
    // Import localStorage data
    if (data.localStorage) {
      Object.entries(data.localStorage).forEach(([key, value]) => {
        try {
          if (!mergeWithExisting || !localStorage.getItem(key)) {
            localStorage.setItem(key, value);
            result.imported.push(`localStorage:${key}`);
          } else {
            result.skipped.push(`localStorage:${key} (already exists)`);
          }
        } catch (error) {
          result.errors.push(`localStorage:${key} - ${error.message}`);
        }
      });
    }
    
    return result;
  };

  const resetImport = useCallback(() => {
    setImportResult(null);
    setImportError(null);
  }, []);

  return {
    isImporting,
    importError,
    importResult,
    importData,
    resetImport
  };
}

/**
 * Hook for crash recovery
 */
export function useCrashRecovery() {
  const [crashDetected, setCrashDetected] = useState(false);
  const [availableBackup, setAvailableBackup] = useState(null);
  const listenerIdRef = useRef(`crash_${Date.now()}`);

  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    dataBackupManager.addListener(listenerId, (event, data) => {
      if (event === 'crashDetected') {
        setCrashDetected(true);
        setAvailableBackup(data.backup);
      }
    });
    
    return () => {
      dataBackupManager.removeListener(listenerId);
    };
  }, []);

  const acceptRecovery = useCallback(async () => {
    if (!availableBackup) return false;
    
    try {
      const result = await dataBackupManager.restoreFromBackup(availableBackup.id, {
        createBackupBeforeRestore: true
      });
      
      setCrashDetected(false);
      setAvailableBackup(null);
      
      return result;
    } catch (error) {
      console.error('Failed to recover from crash:', error);
      return false;
    }
  }, [availableBackup]);

  const dismissRecovery = useCallback(() => {
    setCrashDetected(false);
    setAvailableBackup(null);
  }, []);

  return {
    crashDetected,
    availableBackup,
    acceptRecovery,
    dismissRecovery
  };
}

/**
 * Hook for backup scheduling
 */
export function useBackupScheduling() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [frequency, setFrequency] = useState(15 * 60 * 1000); // 15 minutes
  const [lastBackup, setLastBackup] = useState(null);

  useEffect(() => {
    const config = dataBackupManager.getConfiguration();
    setIsEnabled(config.isRunning);
    setFrequency(config.backupFrequency);
    
    const metadata = dataBackupManager.getBackupMetadata();
    setLastBackup(metadata.lastBackup);
  }, []);

  const updateSchedule = useCallback((newFrequency, enabled = true) => {
    dataBackupManager.updateConfiguration({
      backupFrequency: newFrequency,
      enabled
    });
    
    setFrequency(newFrequency);
    setIsEnabled(enabled);
  }, []);

  const toggleScheduling = useCallback(() => {
    const newEnabled = !isEnabled;
    dataBackupManager.updateConfiguration({
      enabled: newEnabled
    });
    setIsEnabled(newEnabled);
  }, [isEnabled]);

  const getNextBackupTime = useCallback(() => {
    if (!isEnabled || !lastBackup) return null;
    return new Date(lastBackup + frequency);
  }, [isEnabled, lastBackup, frequency]);

  const getTimeUntilNextBackup = useCallback(() => {
    const nextBackup = getNextBackupTime();
    if (!nextBackup) return null;
    
    const now = Date.now();
    const timeUntil = nextBackup.getTime() - now;
    
    return timeUntil > 0 ? timeUntil : 0;
  }, [getNextBackupTime]);

  return {
    isEnabled,
    frequency,
    lastBackup,
    updateSchedule,
    toggleScheduling,
    getNextBackupTime,
    getTimeUntilNextBackup
  };
} 