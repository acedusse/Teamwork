import { useState, useEffect, useCallback, useRef } from 'react';
import optimisticUpdateManager from '../services/optimisticUpdateManager';

/**
 * React hook for optimistic updates with conflict resolution
 * @param {Object} options - Hook options
 * @returns {Object} Hook interface
 */
export function useOptimisticUpdates(options = {}) {
  const {
    autoResolveConflicts = false,
    defaultConflictStrategy = 'manual',
    enableRollback = true,
    trackHistory = true
  } = options;

  // State management
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for stable callbacks
  const listenerId = useRef(`use-optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  const mounted = useRef(true);

  // Update state from manager
  const updateState = useCallback(() => {
    if (!mounted.current) return;
    
    const pending = optimisticUpdateManager.getPendingUpdates();
    const conflicted = pending.filter(u => u.state === 'conflicted');
    const stats = optimisticUpdateManager.getStatistics();
    
    setPendingUpdates(pending);
    setConflicts(conflicted);
    setStatistics(stats);
  }, []);

  // Event handler for optimistic update manager
  const handleOptimisticEvent = useCallback((event, data) => {
    if (!mounted.current) return;
    
    switch (event) {
      case 'optimisticUpdate':
      case 'updateConfirmed':
      case 'updateRejected':
      case 'updateRolledBack':
      case 'updateConflicted':
      case 'conflictResolved':
      case 'updateRetrying':
        updateState();
        break;
      default:
        break;
    }
  }, [updateState]);

  // Setup effect
  useEffect(() => {
    mounted.current = true;
    
    // Add listener
    optimisticUpdateManager.addListener(listenerId.current, handleOptimisticEvent);
    
    // Initial state update
    updateState();
    
    // Cleanup
    return () => {
      mounted.current = false;
      optimisticUpdateManager.removeListener(listenerId.current);
    };
  }, [handleOptimisticEvent, updateState]);

  /**
   * Perform optimistic update
   * @param {string} itemId - Item ID
   * @param {Object} currentData - Current data
   * @param {Object} updateData - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  const performOptimisticUpdate = useCallback(async (itemId, currentData, updateData, updateOptions = {}) => {
    const mergedOptions = {
      conflictStrategy: defaultConflictStrategy,
      retryOnFailure: enableRollback,
      immediate: true,
      ...updateOptions
    };

    try {
      setIsProcessing(true);
      
      const result = optimisticUpdateManager.optimisticUpdate(
        itemId,
        currentData,
        updateData,
        mergedOptions
      );
      
      return result;
    } catch (error) {
      console.error('Optimistic update failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [defaultConflictStrategy, enableRollback]);

  /**
   * Get optimistic data for an item
   * @param {string} itemId - Item ID
   * @param {Object} baseData - Base data
   * @returns {Object} Data with optimistic updates applied
   */
  const getOptimisticData = useCallback((itemId, baseData) => {
    return optimisticUpdateManager.getOptimisticData(itemId, baseData);
  }, []);

  /**
   * Check if item has pending updates
   * @param {string} itemId - Item ID
   * @returns {boolean} True if item has pending updates
   */
  const hasPendingUpdates = useCallback((itemId) => {
    return optimisticUpdateManager.hasPendingUpdates(itemId);
  }, []);

  /**
   * Get pending updates for specific item
   * @param {string} itemId - Item ID
   * @returns {Array} Array of pending updates
   */
  const getPendingUpdatesForItem = useCallback((itemId) => {
    return optimisticUpdateManager.getPendingUpdatesForItem(itemId);
  }, []);

  /**
   * Resolve a conflict
   * @param {string} updateId - Update ID
   * @param {string} strategy - Resolution strategy
   * @param {Object} mergedData - Custom merged data (optional)
   */
  const resolveConflict = useCallback(async (updateId, strategy, mergedData = null) => {
    try {
      setIsProcessing(true);
      await optimisticUpdateManager.resolveConflict(updateId, strategy, mergedData);
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Rollback an update
   * @param {string} updateId - Update ID
   */
  const rollbackUpdate = useCallback((updateId) => {
    optimisticUpdateManager.rollbackUpdate(updateId);
  }, []);

  /**
   * Confirm an update manually
   * @param {string} updateId - Update ID
   */
  const confirmUpdate = useCallback((updateId) => {
    optimisticUpdateManager.confirmUpdate(updateId);
  }, []);

  /**
   * Reject an update manually
   * @param {string} updateId - Update ID
   * @param {string} reason - Rejection reason
   */
  const rejectUpdate = useCallback((updateId, reason) => {
    optimisticUpdateManager.rejectUpdate(updateId, reason);
  }, []);

  /**
   * Get update history
   * @param {number} limit - Maximum number of records
   * @returns {Array} Update history
   */
  const getUpdateHistory = useCallback((limit = 50) => {
    return optimisticUpdateManager.getUpdateHistory(limit);
  }, []);

  /**
   * Clear all pending updates and rollback
   */
  const clearAllUpdates = useCallback(() => {
    optimisticUpdateManager.rollbackAllPendingUpdates();
  }, []);

  /**
   * Retry failed updates
   */
  const retryFailedUpdates = useCallback(() => {
    optimisticUpdateManager.retryFailedUpdates();
  }, []);

  return {
    // State
    pendingUpdates,
    conflicts,
    statistics,
    isProcessing,
    
    // Core operations
    performOptimisticUpdate,
    getOptimisticData,
    hasPendingUpdates,
    getPendingUpdatesForItem,
    
    // Conflict management
    resolveConflict,
    
    // Manual controls
    rollbackUpdate,
    confirmUpdate,
    rejectUpdate,
    
    // Utilities
    getUpdateHistory,
    clearAllUpdates,
    retryFailedUpdates,
    
    // Helper functions
    canRollback: enableRollback,
    hasConflicts: conflicts.length > 0,
    pendingCount: pendingUpdates.length,
    conflictCount: conflicts.length
  };
}

/**
 * Hook for managing optimistic updates for a specific item
 * @param {string} itemId - Item ID
 * @param {Object} baseData - Base data for the item
 * @param {Object} options - Hook options
 * @returns {Object} Item-specific hook interface
 */
export function useOptimisticItem(itemId, baseData, options = {}) {
  const optimisticHook = useOptimisticUpdates(options);
  
  // Get optimistic data for this specific item
  const optimisticData = optimisticHook.getOptimisticData(itemId, baseData);
  
  // Get pending updates for this item
  const pendingUpdates = optimisticHook.getPendingUpdatesForItem(itemId);
  
  // Get conflicts for this item
  const conflicts = optimisticHook.conflicts.filter(c => c.itemId === itemId);
  
  // Check if this item has pending updates
  const hasPending = optimisticHook.hasPendingUpdates(itemId);
  
  // Item-specific update function
  const updateItem = useCallback(async (updateData, updateOptions = {}) => {
    return optimisticHook.performOptimisticUpdate(itemId, baseData, updateData, updateOptions);
  }, [optimisticHook, itemId, baseData]);
  
  return {
    // Item data
    data: optimisticData,
    originalData: baseData,
    
    // Item state
    hasPendingUpdates: hasPending,
    pendingUpdates,
    conflicts,
    hasConflicts: conflicts.length > 0,
    
    // Item operations
    updateItem,
    
    // Pass through global operations
    resolveConflict: optimisticHook.resolveConflict,
    rollbackUpdate: optimisticHook.rollbackUpdate,
    confirmUpdate: optimisticHook.confirmUpdate,
    rejectUpdate: optimisticHook.rejectUpdate,
    
    // Status
    isProcessing: optimisticHook.isProcessing
  };
}

/**
 * Hook for conflict resolution management
 * @param {Object} options - Resolution options
 * @returns {Object} Conflict resolution interface
 */
export function useConflictResolver(options = {}) {
  const {
    autoMergeCompatible = true,
    preferLocal = false,
    preferRemote = false
  } = options;
  
  const optimisticHook = useOptimisticUpdates(options);
  
  /**
   * Auto-resolve conflicts based on options
   */
  const autoResolveConflicts = useCallback(async () => {
    const conflicts = optimisticHook.conflicts;
    
    for (const conflict of conflicts) {
      const update = conflict;
      
      try {
        if (autoMergeCompatible && canAutoMerge(update)) {
          await optimisticHook.resolveConflict(update.id, 'merge');
        } else if (preferLocal) {
          await optimisticHook.resolveConflict(update.id, 'local');
        } else if (preferRemote) {
          await optimisticHook.resolveConflict(update.id, 'remote');
        }
      } catch (error) {
        console.error('Auto-resolution failed for conflict:', update.id, error);
      }
    }
  }, [optimisticHook, autoMergeCompatible, preferLocal, preferRemote]);
  
  /**
   * Check if conflict can be auto-merged
   * @param {Object} update - Update record with conflict
   * @returns {boolean} True if can be auto-merged
   */
  const canAutoMerge = useCallback((update) => {
    if (!update.conflict) return false;
    
    const local = update.optimisticData;
    const remote = update.conflict.serverVersion;
    const original = update.originalData;
    
    // Check for non-conflicting changes
    const localChanges = getChangedFields(original, local);
    const remoteChanges = getChangedFields(original, remote);
    
    // If no overlapping changes, can auto-merge
    const overlappingFields = localChanges.filter(field => remoteChanges.includes(field));
    return overlappingFields.length === 0;
  }, []);
  
  /**
   * Get list of changed fields between two objects
   * @param {Object} original - Original object
   * @param {Object} modified - Modified object
   * @returns {Array} Array of changed field names
   */
  const getChangedFields = useCallback((original, modified) => {
    const changes = [];
    
    for (const key in modified) {
      if (key.startsWith('_')) continue; // Skip metadata fields
      
      if (JSON.stringify(original[key]) !== JSON.stringify(modified[key])) {
        changes.push(key);
      }
    }
    
    return changes;
  }, []);
  
  /**
   * Create merge preview
   * @param {Object} update - Update record with conflict
   * @param {string} strategy - Merge strategy
   * @returns {Object} Merge preview
   */
  const createMergePreview = useCallback((update, strategy) => {
    if (!update.conflict) return null;
    
    const local = update.optimisticData;
    const remote = update.conflict.serverVersion;
    const original = update.originalData;
    
    let preview;
    
    switch (strategy) {
      case 'local':
        preview = local;
        break;
      case 'remote':
        preview = remote;
        break;
      case 'merge':
        preview = optimisticUpdateManager.autoMergeConflict(update);
        break;
      default:
        preview = local;
    }
    
    return {
      preview,
      changes: {
        local: getChangedFields(original, local),
        remote: getChangedFields(original, remote),
        merged: getChangedFields(original, preview)
      }
    };
  }, [getChangedFields]);
  
  return {
    // State
    conflicts: optimisticHook.conflicts,
    hasConflicts: optimisticHook.conflicts.length > 0,
    conflictCount: optimisticHook.conflicts.length,
    
    // Resolution operations
    resolveConflict: optimisticHook.resolveConflict,
    autoResolveConflicts,
    
    // Utilities
    canAutoMerge,
    createMergePreview,
    getChangedFields,
    
    // Status
    isProcessing: optimisticHook.isProcessing
  };
}

export default useOptimisticUpdates; 