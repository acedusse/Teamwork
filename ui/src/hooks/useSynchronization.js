/**
 * useSynchronization Hook
 * Provides React integration for the synchronization service
 * Manages sync state, progress, and provides controls for sync operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import synchronizationService from '../services/synchronizationService';

const useSynchronization = () => {
  const [syncStatus, setSyncStatus] = useState(synchronizationService.getSyncStatus());
  const [syncHistory, setSyncHistory] = useState(synchronizationService.getSyncHistory());
  const [conflictedItems, setConflictedItems] = useState(synchronizationService.getConflictedItems());
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const listenerIdRef = useRef(`sync-hook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Sync event handler
  const handleSyncEvent = useCallback((event, data) => {
    switch (event) {
      case 'syncStarted':
        setSyncStatus(data);
        setError(null);
        break;
        
      case 'syncProgress':
        setSyncStatus(data);
        break;
        
      case 'syncCompleted':
        setSyncStatus(data);
        setSyncHistory(synchronizationService.getSyncHistory());
        setConflictedItems(synchronizationService.getConflictedItems());
        setError(null);
        break;
        
      case 'syncError':
        setSyncStatus(data.syncState);
        setError(data.error);
        break;
        
      case 'syncPaused':
        setSyncStatus(data);
        break;
        
      case 'syncResumed':
        setSyncStatus(data);
        break;
        
      case 'syncCancelled':
        setSyncStatus(data);
        break;
        
      case 'conflictDetected':
        setConflictedItems(synchronizationService.getConflictedItems());
        setSyncStatus(prev => ({ ...prev, conflictedItems: prev.conflictedItems + 1 }));
        break;
        
      case 'conflictResolved':
        setConflictedItems(synchronizationService.getConflictedItems());
        setSyncStatus(synchronizationService.getSyncStatus());
        break;
        
      case 'conflictResolutionFailed':
        setError(data.error);
        break;
        
      case 'syncItemProcessed':
        setSyncStatus(data.syncState);
        break;
        
      default:
        console.log('Unknown sync event:', event, data);
    }
  }, []);

  // Initialize hook
  useEffect(() => {
    const listenerId = listenerIdRef.current;
    
    // Add listener
    synchronizationService.addListener(listenerId, handleSyncEvent);
    
    // Update initial state
    setSyncStatus(synchronizationService.getSyncStatus());
    setSyncHistory(synchronizationService.getSyncHistory());
    setConflictedItems(synchronizationService.getConflictedItems());
    setIsInitialized(true);

    // Cleanup
    return () => {
      synchronizationService.removeListener(listenerId);
    };
  }, [handleSyncEvent]);

  // Start synchronization
  const startSync = useCallback(async (options = {}) => {
    try {
      setError(null);
      await synchronizationService.startSync(options);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Start auto synchronization
  const startAutoSync = useCallback(async () => {
    try {
      setError(null);
      await synchronizationService.startAutoSync();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Pause synchronization
  const pauseSync = useCallback(() => {
    try {
      synchronizationService.pauseSync();
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Resume synchronization
  const resumeSync = useCallback(async () => {
    try {
      setError(null);
      await synchronizationService.resumeSync();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Cancel synchronization
  const cancelSync = useCallback(() => {
    try {
      synchronizationService.cancelSync();
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Resolve conflict
  const resolveConflict = useCallback(async (itemId, resolution, mergedData = null) => {
    try {
      setError(null);
      await synchronizationService.resolveConflict(itemId, resolution, mergedData);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear sync history
  const clearSyncHistory = useCallback(() => {
    try {
      synchronizationService.clearSyncHistory();
      setSyncHistory([]);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear all sync data
  const clearAllSyncData = useCallback(() => {
    try {
      synchronizationService.clearAllSyncData();
      setSyncStatus(synchronizationService.getSyncStatus());
      setSyncHistory([]);
      setConflictedItems([]);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Refresh sync state
  const refreshSyncState = useCallback(() => {
    setSyncStatus(synchronizationService.getSyncStatus());
    setSyncHistory(synchronizationService.getSyncHistory());
    setConflictedItems(synchronizationService.getConflictedItems());
  }, []);

  // Format sync duration
  const formatSyncDuration = useCallback((startTime, endTime) => {
    if (!startTime) return null;
    
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  // Format estimated time remaining
  const formatEstimatedTimeRemaining = useCallback((timeRemaining) => {
    if (!timeRemaining) return null;
    
    const seconds = Math.ceil(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `~${minutes}m ${seconds % 60}s`;
    } else {
      return `~${seconds}s`;
    }
  }, []);

  // Get sync status message
  const getSyncStatusMessage = useCallback(() => {
    const { status, progress, totalItems, processedItems, failedItems, conflictedItems } = syncStatus;
    
    switch (status) {
      case 'idle':
        return 'Ready to synchronize';
      case 'syncing':
        if (totalItems === 0) {
          return 'Preparing synchronization...';
        }
        return `Synchronizing ${processedItems}/${totalItems} items (${progress}%)`;
      case 'paused':
        return `Synchronization paused (${processedItems}/${totalItems} completed)`;
      case 'completed':
        const issues = failedItems + conflictedItems;
        if (issues === 0) {
          return `Synchronization completed successfully (${processedItems} items)`;
        } else {
          return `Synchronization completed with ${issues} issue${issues === 1 ? '' : 's'} (${processedItems} items synced)`;
        }
      case 'error':
        return 'Synchronization failed';
      case 'cancelled':
        return 'Synchronization cancelled';
      default:
        return 'Unknown synchronization status';
    }
  }, [syncStatus]);

  // Check if sync is active
  const isSyncActive = useCallback(() => {
    return syncStatus.status === 'syncing';
  }, [syncStatus.status]);

  // Check if sync can be started
  const canStartSync = useCallback(() => {
    return ['idle', 'completed', 'error', 'cancelled'].includes(syncStatus.status);
  }, [syncStatus.status]);

  // Check if sync can be paused
  const canPauseSync = useCallback(() => {
    return syncStatus.status === 'syncing';
  }, [syncStatus.status]);

  // Check if sync can be resumed
  const canResumeSync = useCallback(() => {
    return syncStatus.status === 'paused';
  }, [syncStatus.status]);

  // Check if sync can be cancelled
  const canCancelSync = useCallback(() => {
    return ['syncing', 'paused'].includes(syncStatus.status);
  }, [syncStatus.status]);

  // Get sync statistics
  const getSyncStatistics = useCallback(() => {
    const totalSyncs = syncHistory.length;
    const successfulSyncs = syncHistory.filter(h => h.status === 'completed').length;
    const failedSyncs = syncHistory.filter(h => h.status === 'error').length;
    const totalItemsSynced = syncHistory.reduce((sum, h) => sum + (h.processedItems || 0), 0);
    const totalItemsFailed = syncHistory.reduce((sum, h) => sum + (h.failedItems || 0), 0);
    
    const lastSync = syncHistory[0];
    const lastSyncTime = lastSync ? lastSync.endTime || lastSync.startTime : null;
    
    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0,
      totalItemsSynced,
      totalItemsFailed,
      lastSyncTime,
      averageSyncDuration: totalSyncs > 0 ? 
        syncHistory
          .filter(h => h.startTime && h.endTime)
          .reduce((sum, h) => sum + (h.endTime - h.startTime), 0) / totalSyncs
        : 0
    };
  }, [syncHistory]);

  return {
    // State
    syncStatus,
    syncHistory,
    conflictedItems,
    error,
    isInitialized,
    
    // Actions
    startSync,
    startAutoSync,
    pauseSync,
    resumeSync,
    cancelSync,
    resolveConflict,
    clearSyncHistory,
    clearAllSyncData,
    refreshSyncState,
    
    // Utilities
    formatSyncDuration,
    formatEstimatedTimeRemaining,
    getSyncStatusMessage,
    getSyncStatistics,
    
    // State checks
    isSyncActive,
    canStartSync,
    canPauseSync,
    canResumeSync,
    canCancelSync,
    
    // Computed values
    isOnline: syncStatus.isOnline,
    hasConflicts: conflictedItems.length > 0,
    hasErrors: !!error || syncStatus.status === 'error',
    syncProgress: syncStatus.progress,
    queueLength: syncStatus.queueLength
  };
};

export default useSynchronization; 