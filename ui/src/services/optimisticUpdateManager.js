/**
 * Optimistic Update Manager
 * Handles immediate UI updates with rollback capabilities for better UX
 * Manages pending operations and provides conflict resolution support
 */

import synchronizationService from './synchronizationService';
import autosaveService from './autosaveService';

class OptimisticUpdateManager {
  constructor() {
    this.pendingUpdates = new Map(); // id -> update details
    this.originalStates = new Map(); // id -> original state before update
    this.updateHistory = []; // history of all updates
    this.listeners = new Map();
    this.conflictResolvers = new Map();
    this.maxHistorySize = 100;
    this.storageKey = 'taskmaster_optimistic_updates';
    
    // Update states
    this.updateStates = {
      PENDING: 'pending',
      CONFIRMED: 'confirmed',
      FAILED: 'failed',
      ROLLED_BACK: 'rolled_back',
      CONFLICTED: 'conflicted'
    };
    
    this.init();
  }

  init() {
    // Load pending updates from storage
    this.loadPendingUpdates();
    
    // Listen for sync events to confirm/reject optimistic updates
    synchronizationService.addListener('optimistic-manager', (event, data) => {
      this.handleSyncEvent(event, data);
    });
    
    // Listen for connectivity changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  /**
   * Handle synchronization events
   */
  handleSyncEvent(event, data) {
    switch (event) {
      case 'syncItemProcessed':
        this.handleSyncItemProcessed(data.item);
        break;
      case 'conflictDetected':
        this.handleConflictDetected(data.item, data.conflict);
        break;
      case 'syncCompleted':
        this.confirmAllPendingUpdates();
        break;
      case 'syncError':
        this.handleSyncError(data.error);
        break;
    }
  }

  /**
   * Handle sync item processed
   */
  handleSyncItemProcessed(item) {
    if (item.status === 'completed') {
      this.confirmUpdate(item.id);
    } else if (item.status === 'failed') {
      this.rejectUpdate(item.id, item.error);
    }
  }

  /**
   * Handle conflict detected
   */
  handleConflictDetected(item, conflict) {
    const updateId = this.findUpdateByItemId(item.id);
    if (updateId) {
      this.markUpdateAsConflicted(updateId, conflict);
    }
  }

  /**
   * Handle sync error
   */
  handleSyncError(error) {
    // Mark all pending updates as potentially failed
    for (const [updateId, update] of this.pendingUpdates) {
      if (update.state === this.updateStates.PENDING) {
        update.lastError = error;
        update.retryCount = (update.retryCount || 0) + 1;
      }
    }
    this.savePendingUpdates();
  }

  /**
   * Perform optimistic update
   * @param {string} id - Unique identifier for the item being updated
   * @param {Object} currentData - Current data before update
   * @param {Object} updateData - New data to apply
   * @param {Object} options - Update options
   * @returns {Object} Update result
   */
  optimisticUpdate(id, currentData, updateData, options = {}) {
    const {
      operation = 'update',
      immediate = true,
      retryOnFailure = true,
      conflictStrategy = 'manual', // 'manual', 'local', 'remote', 'merge'
      optimisticData = null
    } = options;

    const updateId = this.generateUpdateId();
    const timestamp = Date.now();

    // Store original state for rollback
    this.originalStates.set(updateId, {
      id,
      data: JSON.parse(JSON.stringify(currentData)),
      timestamp,
      operation
    });

    // Calculate optimistic data
    const optimisticResult = optimisticData || this.mergeData(currentData, updateData);

    // Create update record
    const update = {
      id: updateId,
      itemId: id,
      operation,
      originalData: currentData,
      updateData,
      optimisticData: optimisticResult,
      state: this.updateStates.PENDING,
      timestamp,
      retryCount: 0,
      conflictStrategy,
      retryOnFailure,
      immediate,
      etag: this.generateETag(optimisticResult),
      version: (currentData.version || 0) + 1
    };

    // Store pending update
    this.pendingUpdates.set(updateId, update);
    
    // Add to history
    this.addToHistory(update);
    
    // Save to storage
    this.savePendingUpdates();

    // Notify listeners of optimistic update
    this.notifyListeners('optimisticUpdate', {
      updateId,
      itemId: id,
      optimisticData: optimisticResult,
      operation,
      state: this.updateStates.PENDING
    });

    return {
      updateId,
      optimisticData: optimisticResult,
      success: true,
      isPending: true
    };
  }

  /**
   * Confirm an optimistic update
   * @param {string} updateId - Update ID to confirm
   */
  confirmUpdate(updateId) {
    const update = this.pendingUpdates.get(updateId);
    if (!update) return;

    update.state = this.updateStates.CONFIRMED;
    update.confirmedAt = Date.now();

    // Remove from pending updates
    this.pendingUpdates.delete(updateId);
    this.originalStates.delete(updateId);

    // Update history
    this.updateHistoryRecord(updateId, { 
      state: this.updateStates.CONFIRMED,
      confirmedAt: update.confirmedAt
    });

    this.savePendingUpdates();

    // Notify listeners
    this.notifyListeners('updateConfirmed', {
      updateId,
      itemId: update.itemId,
      confirmedData: update.optimisticData
    });
  }

  /**
   * Reject an optimistic update and rollback
   * @param {string} updateId - Update ID to reject
   * @param {string} reason - Reason for rejection
   */
  rejectUpdate(updateId, reason = 'Server rejected') {
    const update = this.pendingUpdates.get(updateId);
    if (!update) return;

    const originalState = this.originalStates.get(updateId);
    
    update.state = this.updateStates.FAILED;
    update.failedAt = Date.now();
    update.failureReason = reason;

    // Update history
    this.updateHistoryRecord(updateId, { 
      state: this.updateStates.FAILED,
      failedAt: update.failedAt,
      failureReason: reason
    });

    // Perform rollback if we have original state
    if (originalState && update.immediate) {
      this.rollbackUpdate(updateId);
    } else {
      // Clean up if no rollback needed
      this.pendingUpdates.delete(updateId);
      this.originalStates.delete(updateId);
    }

    this.savePendingUpdates();

    // Notify listeners
    this.notifyListeners('updateRejected', {
      updateId,
      itemId: update.itemId,
      originalData: originalState?.data,
      reason
    });
  }

  /**
   * Rollback an optimistic update
   * @param {string} updateId - Update ID to rollback
   */
  rollbackUpdate(updateId) {
    const update = this.pendingUpdates.get(updateId);
    const originalState = this.originalStates.get(updateId);
    
    if (!update || !originalState) return;

    update.state = this.updateStates.ROLLED_BACK;
    update.rolledBackAt = Date.now();

    // Update history
    this.updateHistoryRecord(updateId, { 
      state: this.updateStates.ROLLED_BACK,
      rolledBackAt: update.rolledBackAt
    });

    // Clean up
    this.pendingUpdates.delete(updateId);
    this.originalStates.delete(updateId);

    this.savePendingUpdates();

    // Notify listeners to restore original data
    this.notifyListeners('updateRolledBack', {
      updateId,
      itemId: update.itemId,
      originalData: originalState.data,
      optimisticData: update.optimisticData
    });
  }

  /**
   * Mark update as conflicted
   * @param {string} updateId - Update ID
   * @param {Object} conflict - Conflict details
   */
  markUpdateAsConflicted(updateId, conflict) {
    const update = this.pendingUpdates.get(updateId);
    if (!update) return;

    update.state = this.updateStates.CONFLICTED;
    update.conflict = conflict;
    update.conflictedAt = Date.now();

    // Update history
    this.updateHistoryRecord(updateId, { 
      state: this.updateStates.CONFLICTED,
      conflictedAt: update.conflictedAt,
      conflict
    });

    this.savePendingUpdates();

    // Notify listeners
    this.notifyListeners('updateConflicted', {
      updateId,
      itemId: update.itemId,
      conflict,
      localData: update.optimisticData,
      remoteData: conflict.serverVersion
    });

    // Auto-resolve if strategy is set
    if (update.conflictStrategy !== 'manual') {
      this.resolveConflict(updateId, update.conflictStrategy);
    }
  }

  /**
   * Resolve a conflict
   * @param {string} updateId - Update ID
   * @param {string} strategy - Resolution strategy ('local', 'remote', 'merge')
   * @param {Object} mergedData - Custom merged data (if strategy is 'merge')
   */
  async resolveConflict(updateId, strategy, mergedData = null) {
    const update = this.pendingUpdates.get(updateId);
    if (!update || update.state !== this.updateStates.CONFLICTED) {
      throw new Error('Update not found or not in conflicted state');
    }

    let resolvedData;
    
    switch (strategy) {
      case 'local':
        resolvedData = update.optimisticData;
        break;
      case 'remote':
        resolvedData = update.conflict.serverVersion;
        break;
      case 'merge':
        resolvedData = mergedData || this.autoMergeConflict(update);
        break;
      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    // Update the optimistic data with resolved data
    update.optimisticData = resolvedData;
    update.state = this.updateStates.PENDING;
    update.conflictResolution = {
      strategy,
      resolvedAt: Date.now(),
      resolvedData
    };

    // Update history
    this.updateHistoryRecord(updateId, { 
      conflictResolution: update.conflictResolution,
      state: this.updateStates.PENDING
    });

    this.savePendingUpdates();

    // Notify listeners
    this.notifyListeners('conflictResolved', {
      updateId,
      itemId: update.itemId,
      strategy,
      resolvedData
    });

    // Try to sync the resolved data
    try {
      await synchronizationService.resolveConflict(
        update.itemId, 
        strategy, 
        resolvedData
      );
    } catch (error) {
      console.error('Failed to sync resolved conflict:', error);
      this.rejectUpdate(updateId, `Conflict resolution failed: ${error.message}`);
    }
  }

  /**
   * Auto-merge conflicted data
   * @param {Object} update - Update record with conflict
   * @returns {Object} Merged data
   */
  autoMergeConflict(update) {
    const local = update.optimisticData;
    const remote = update.conflict.serverVersion;
    const original = update.originalData;

    // Simple three-way merge
    const merged = { ...remote }; // Start with remote as base
    
    // Apply local changes that don't conflict with remote changes
    for (const key in local) {
      if (key === 'id' || key === 'version' || key === 'updatedAt') continue;
      
      // If local changed from original and remote didn't change from original
      if (JSON.stringify(local[key]) !== JSON.stringify(original[key]) &&
          JSON.stringify(remote[key]) === JSON.stringify(original[key])) {
        merged[key] = local[key];
      }
    }

    // Update metadata
    merged.version = Math.max(local.version || 0, remote.version || 0) + 1;
    merged.updatedAt = new Date().toISOString();
    merged._autoMerged = true;
    merged._mergeTimestamp = Date.now();

    return merged;
  }

  /**
   * Get all pending updates
   * @returns {Array} Array of pending updates
   */
  getPendingUpdates() {
    return Array.from(this.pendingUpdates.values());
  }

  /**
   * Get pending updates for a specific item
   * @param {string} itemId - Item ID
   * @returns {Array} Array of pending updates for the item
   */
  getPendingUpdatesForItem(itemId) {
    return Array.from(this.pendingUpdates.values())
      .filter(update => update.itemId === itemId);
  }

  /**
   * Get update history
   * @param {number} limit - Maximum number of records to return
   * @returns {Array} Array of historical updates
   */
  getUpdateHistory(limit = 50) {
    return this.updateHistory
      .slice(0, limit)
      .map(update => ({ ...update })); // Return copies
  }

  /**
   * Check if item has pending optimistic updates
   * @param {string} itemId - Item ID
   * @returns {boolean} True if item has pending updates
   */
  hasPendingUpdates(itemId) {
    return Array.from(this.pendingUpdates.values())
      .some(update => update.itemId === itemId);
  }

  /**
   * Get optimistic data for item (with pending updates applied)
   * @param {string} itemId - Item ID
   * @param {Object} baseData - Base data to apply updates to
   * @returns {Object} Data with optimistic updates applied
   */
  getOptimisticData(itemId, baseData) {
    const pendingUpdates = this.getPendingUpdatesForItem(itemId)
      .filter(update => update.state === this.updateStates.PENDING)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (pendingUpdates.length === 0) {
      return baseData;
    }

    // Apply all pending updates in order
    let result = { ...baseData };
    for (const update of pendingUpdates) {
      result = this.mergeData(result, update.updateData);
    }

    // Add metadata about optimistic updates
    result._hasOptimisticUpdates = true;
    result._pendingUpdateCount = pendingUpdates.length;
    result._lastOptimisticUpdate = pendingUpdates[pendingUpdates.length - 1].timestamp;

    return result;
  }

  /**
   * Confirm all pending updates (used when sync completes successfully)
   */
  confirmAllPendingUpdates() {
    const updateIds = Array.from(this.pendingUpdates.keys());
    for (const updateId of updateIds) {
      this.confirmUpdate(updateId);
    }
  }

  /**
   * Rollback all pending updates (used in error scenarios)
   */
  rollbackAllPendingUpdates() {
    const updateIds = Array.from(this.pendingUpdates.keys());
    for (const updateId of updateIds) {
      this.rollbackUpdate(updateId);
    }
  }

  /**
   * Merge data objects
   * @param {Object} base - Base data
   * @param {Object} update - Update data
   * @returns {Object} Merged data
   */
  mergeData(base, update) {
    return {
      ...base,
      ...update,
      updatedAt: new Date().toISOString(),
      version: (base.version || 0) + 1
    };
  }

  /**
   * Generate ETag for data
   * @param {Object} data - Data to generate ETag for
   * @returns {string} ETag
   */
  generateETag(data) {
    const content = JSON.stringify(data);
    // Simple hash function for ETag
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  /**
   * Generate unique update ID
   * @returns {string} Update ID
   */
  generateUpdateId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find update by item ID
   * @param {string} itemId - Item ID
   * @returns {string|null} Update ID or null
   */
  findUpdateByItemId(itemId) {
    for (const [updateId, update] of this.pendingUpdates) {
      if (update.itemId === itemId) {
        return updateId;
      }
    }
    return null;
  }

  /**
   * Add update to history
   * @param {Object} update - Update record
   */
  addToHistory(update) {
    this.updateHistory.unshift({ ...update });
    
    // Trim history if too large
    if (this.updateHistory.length > this.maxHistorySize) {
      this.updateHistory = this.updateHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Update history record
   * @param {string} updateId - Update ID
   * @param {Object} changes - Changes to apply
   */
  updateHistoryRecord(updateId, changes) {
    const index = this.updateHistory.findIndex(h => h.id === updateId);
    if (index !== -1) {
      this.updateHistory[index] = { ...this.updateHistory[index], ...changes };
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    // Retry failed updates when coming back online
    this.retryFailedUpdates();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    // Nothing special needed - optimistic updates work offline
  }

  /**
   * Retry failed updates
   */
  retryFailedUpdates() {
    for (const [updateId, update] of this.pendingUpdates) {
      if (update.state === this.updateStates.FAILED && 
          update.retryOnFailure && 
          (update.retryCount || 0) < 3) {
        
        update.state = this.updateStates.PENDING;
        update.retryCount = (update.retryCount || 0) + 1;
        update.lastRetry = Date.now();
        
        this.notifyListeners('updateRetrying', {
          updateId,
          itemId: update.itemId,
          retryCount: update.retryCount
        });
      }
    }
    
    this.savePendingUpdates();
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
        console.error('Error in optimistic update listener:', error);
      }
    });
  }

  /**
   * Save pending updates to storage
   */
  savePendingUpdates() {
    const dataToSave = {
      pendingUpdates: Array.from(this.pendingUpdates.entries()),
      originalStates: Array.from(this.originalStates.entries()),
      updateHistory: this.updateHistory.slice(0, 20) // Save limited history
    };
    
    autosaveService.saveToStorage(this.storageKey, dataToSave);
  }

  /**
   * Load pending updates from storage
   */
  loadPendingUpdates() {
    const saved = autosaveService.getFromStorage(this.storageKey);
    
    if (saved) {
      if (saved.pendingUpdates) {
        this.pendingUpdates = new Map(saved.pendingUpdates);
      }
      if (saved.originalStates) {
        this.originalStates = new Map(saved.originalStates);
      }
      if (saved.updateHistory) {
        this.updateHistory = saved.updateHistory;
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData() {
    this.pendingUpdates.clear();
    this.originalStates.clear();
    this.updateHistory = [];
    
    autosaveService.removeFromStorage(this.storageKey);
    
    this.notifyListeners('allDataCleared', {});
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const pending = this.getPendingUpdates();
    const history = this.updateHistory;
    
    return {
      pendingCount: pending.length,
      confirmedCount: history.filter(h => h.state === this.updateStates.CONFIRMED).length,
      failedCount: history.filter(h => h.state === this.updateStates.FAILED).length,
      conflictedCount: pending.filter(u => u.state === this.updateStates.CONFLICTED).length,
      totalHistoryCount: history.length,
      oldestPendingUpdate: pending.length > 0 ? 
        Math.min(...pending.map(u => u.timestamp)) : null,
      newestPendingUpdate: pending.length > 0 ? 
        Math.max(...pending.map(u => u.timestamp)) : null
    };
  }
}

// Create and export singleton instance
const optimisticUpdateManager = new OptimisticUpdateManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.optimisticUpdateManager = optimisticUpdateManager;
}

export default optimisticUpdateManager; 