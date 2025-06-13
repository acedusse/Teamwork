/**
 * Synchronization Service
 * Manages data synchronization between offline and online states
 * Handles conflict detection, progress tracking, and retry mechanisms
 */

import offlineService from './offlineService';
import autosaveService from './autosaveService';

class SynchronizationService {
  constructor() {
    this.syncInProgress = false;
    this.syncQueue = [];
    this.syncHistory = [];
    this.conflictedItems = [];
    this.listeners = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.maxConcurrentSyncs = 3;
    this.currentSyncs = 0;
    
    // Sync state management
    this.syncState = {
      status: 'idle', // 'idle', 'syncing', 'paused', 'error', 'completed'
      progress: 0,    // 0-100
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      conflictedItems: 0,
      startTime: null,
      endTime: null,
      estimatedTimeRemaining: null
    };
    
    this.storageKey = 'taskmaster_sync_state';
    
    this.init();
  }

  init() {
    // Load previous sync state
    this.loadSyncState();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
    
    // Listen for offline service events
    offlineService.addListener('sync-service', {
      online: this.handleConnectivityRestored.bind(this),
      offline: this.handleConnectivityLost.bind(this)
    });
  }

  /**
   * Handle connectivity restored
   */
  async handleConnectivityRestored() {
    console.log('Connectivity restored - starting auto-sync');
    await this.startAutoSync();
  }

  /**
   * Handle connectivity lost
   */
  handleConnectivityLost() {
    console.log('Connectivity lost - pausing sync');
    this.pauseSync();
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    await this.handleConnectivityRestored();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.handleConnectivityLost();
  }

  /**
   * Start automatic synchronization
   */
  async startAutoSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    // Get queued items from offline service
    const queueStatus = offlineService.getQueueStatus();
    if (queueStatus.total === 0) {
      console.log('No items to sync');
      return;
    }

    await this.startSync();
  }

  /**
   * Start synchronization process
   * @param {Object} options - Sync options
   */
  async startSync(options = {}) {
    if (this.syncInProgress) {
      throw new Error('Synchronization already in progress');
    }

    const {
      force = false,
      resolveConflicts = 'ask' // 'ask', 'local', 'remote', 'merge'
    } = options;

    this.syncInProgress = true;
    this.syncState = {
      ...this.syncState,
      status: 'syncing',
      progress: 0,
      startTime: Date.now(),
      endTime: null,
      processedItems: 0,
      failedItems: 0,
      conflictedItems: 0
    };

    try {
      // Build sync queue
      await this.buildSyncQueue();
      
      this.syncState.totalItems = this.syncQueue.length;
      this.notifyListeners('syncStarted', { ...this.syncState });

      if (this.syncQueue.length === 0) {
        await this.completeSyncSuccessfully();
        return;
      }

      // Process sync queue
      await this.processSyncQueue(resolveConflicts);
      
      // Complete synchronization
      await this.completeSyncSuccessfully();

    } catch (error) {
      console.error('Sync failed:', error);
      await this.handleSyncError(error);
    }
  }

  /**
   * Build synchronization queue from various sources
   */
  async buildSyncQueue() {
    this.syncQueue = [];

    // Get items from offline service queue
    const offlineQueue = offlineService.requestQueue || [];
    
    // Convert offline requests to sync items
    for (const request of offlineQueue) {
      this.syncQueue.push({
        id: request.id,
        type: 'api_request',
        priority: request.priority,
        context: request.context,
        data: request,
        status: 'pending',
        attempts: 0,
        lastAttempt: null,
        error: null
      });
    }

    // Get pending changes from other services
    const pendingChanges = this.getPendingChanges();
    for (const change of pendingChanges) {
      this.syncQueue.push({
        id: this.generateSyncId(),
        type: 'data_change',
        priority: change.priority || 5,
        context: change.context,
        data: change,
        status: 'pending',
        attempts: 0,
        lastAttempt: null,
        error: null
      });
    }

    // Sort by priority (higher first) and timestamp (older first)
    this.syncQueue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return (a.data.timestamp || 0) - (b.data.timestamp || 0);
    });

    console.log(`Built sync queue with ${this.syncQueue.length} items`);
  }

  /**
   * Process synchronization queue
   * @param {string} conflictResolution - How to resolve conflicts
   */
  async processSyncQueue(conflictResolution = 'ask') {
    const concurrentPromises = [];

    for (const item of this.syncQueue) {
      // Respect concurrency limit
      if (this.currentSyncs >= this.maxConcurrentSyncs) {
        await Promise.race(concurrentPromises);
      }

      const syncPromise = this.processSyncItem(item, conflictResolution)
        .finally(() => {
          this.currentSyncs--;
          const index = concurrentPromises.indexOf(syncPromise);
          if (index > -1) {
            concurrentPromises.splice(index, 1);
          }
        });

      this.currentSyncs++;
      concurrentPromises.push(syncPromise);

      // Update progress
      this.updateProgress();
    }

    // Wait for all remaining syncs to complete
    await Promise.allSettled(concurrentPromises);
  }

  /**
   * Process individual sync item
   * @param {Object} item - Sync item
   * @param {string} conflictResolution - Conflict resolution strategy
   */
  async processSyncItem(item, conflictResolution) {
    item.status = 'processing';
    item.lastAttempt = Date.now();
    
    try {
      let result;
      
      if (item.type === 'api_request') {
        result = await this.processSyncApiRequest(item);
      } else if (item.type === 'data_change') {
        result = await this.processSyncDataChange(item, conflictResolution);
      }

      if (result.success) {
        item.status = 'completed';
        this.syncState.processedItems++;
        
        // Remove from offline service queue if applicable
        if (item.type === 'api_request') {
          offlineService.removeFromQueue(item.data.id);
        }
      } else {
        throw new Error(result.error || 'Sync failed');
      }

    } catch (error) {
      console.warn(`Failed to sync item ${item.id}:`, error);
      
      item.attempts++;
      item.error = error.message;

      if (item.attempts < this.retryAttempts) {
        // Schedule retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, item.attempts - 1);
        setTimeout(() => {
          item.status = 'pending';
          this.processSyncItem(item, conflictResolution);
        }, delay);
      } else {
        item.status = 'failed';
        this.syncState.failedItems++;
      }
    }

    this.notifyListeners('syncItemProcessed', { item, syncState: { ...this.syncState } });
  }

  /**
   * Process API request sync item
   * @param {Object} item - Sync item containing API request
   * @returns {Object} Result
   */
  async processSyncApiRequest(item) {
    const request = item.data;
    
    try {
      const response = await fetch(request.url, request.options);
      
      if (response.ok) {
        // Call success callback if available
        if (request.onSuccess) {
          request.onSuccess(response);
        }
        
        return { success: true, response };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Call error callback if available
      if (request.onError) {
        request.onError(error);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Process data change sync item
   * @param {Object} item - Sync item containing data change
   * @param {string} conflictResolution - Conflict resolution strategy
   * @returns {Object} Result
   */
  async processSyncDataChange(item, conflictResolution) {
    const change = item.data;
    
    try {
      // Check for conflicts
      const conflict = await this.detectConflict(change);
      
      if (conflict && conflictResolution === 'ask') {
        // Add to conflicted items for user resolution
        this.conflictedItems.push({ item, conflict });
        this.syncState.conflictedItems++;
        
        this.notifyListeners('conflictDetected', { item, conflict });
        
        return { success: false, error: 'Conflict detected - user resolution required' };
      }
      
      // Apply change based on resolution strategy
      const result = await this.applyDataChange(change, conflict, conflictResolution);
      
      return { success: true, result };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts in data changes
   * @param {Object} change - Data change
   * @returns {Object|null} Conflict details or null
   */
  async detectConflict(change) {
    // This would be implemented based on your specific data structure
    // For now, we'll do a simple timestamp comparison
    
    if (!change.id || !change.lastModified) {
      return null;
    }

    try {
      // Fetch current server version
      const response = await fetch(`/api/data/${change.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // Item doesn't exist on server - no conflict
        return null;
      }

      const serverData = await response.json();
      
      if (serverData.lastModified && 
          new Date(serverData.lastModified) > new Date(change.lastModified)) {
        return {
          type: 'version_conflict',
          localVersion: change,
          serverVersion: serverData,
          conflictFields: this.identifyConflictedFields(change, serverData)
        };
      }

      return null;
    } catch (error) {
      console.warn('Error detecting conflict:', error);
      return null;
    }
  }

  /**
   * Identify conflicted fields between local and server data
   * @param {Object} local - Local data
   * @param {Object} server - Server data
   * @returns {Array} Conflicted field names
   */
  identifyConflictedFields(local, server) {
    const conflicts = [];
    
    for (const key in local) {
      if (key === 'id' || key === 'lastModified') continue;
      
      if (JSON.stringify(local[key]) !== JSON.stringify(server[key])) {
        conflicts.push(key);
      }
    }
    
    return conflicts;
  }

  /**
   * Apply data change with conflict resolution
   * @param {Object} change - Data change
   * @param {Object} conflict - Conflict details
   * @param {string} resolution - Resolution strategy
   * @returns {Object} Result
   */
  async applyDataChange(change, conflict, resolution) {
    let dataToSync = change;
    
    if (conflict) {
      switch (resolution) {
        case 'local':
          // Use local version
          dataToSync = change;
          break;
        case 'remote':
          // Skip sync, keep remote version
          return { skipped: true, reason: 'Remote version preserved' };
        case 'merge':
          // Attempt to merge (basic implementation)
          dataToSync = this.mergeData(change, conflict.serverVersion);
          break;
        default:
          throw new Error(`Unknown conflict resolution: ${resolution}`);
      }
    }

    // Send to server
    const response = await fetch(`/api/data/${change.id}`, {
      method: change.method || 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSync)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Simple merge strategy for conflicted data
   * @param {Object} local - Local data
   * @param {Object} server - Server data
   * @returns {Object} Merged data
   */
  mergeData(local, server) {
    // Basic merge: take local changes but preserve server timestamp
    return {
      ...server,
      ...local,
      lastModified: new Date().toISOString(),
      _mergedConflict: true
    };
  }

  /**
   * Get pending changes from various sources
   * @returns {Array} Pending changes
   */
  getPendingChanges() {
    const changes = [];
    
    // This would collect pending changes from various sources
    // For now, we'll return an empty array
    
    return changes;
  }

  /**
   * Update sync progress
   */
  updateProgress() {
    if (this.syncState.totalItems === 0) {
      this.syncState.progress = 100;
      return;
    }

    const completed = this.syncState.processedItems + this.syncState.failedItems;
    this.syncState.progress = Math.round((completed / this.syncState.totalItems) * 100);

    // Estimate remaining time
    if (this.syncState.startTime && completed > 0) {
      const elapsed = Date.now() - this.syncState.startTime;
      const avgTimePerItem = elapsed / completed;
      const remaining = this.syncState.totalItems - completed;
      this.syncState.estimatedTimeRemaining = remaining * avgTimePerItem;
    }

    this.saveSyncState();
    this.notifyListeners('syncProgress', { ...this.syncState });
  }

  /**
   * Complete synchronization successfully
   */
  async completeSyncSuccessfully() {
    this.syncInProgress = false;
    this.syncState = {
      ...this.syncState,
      status: 'completed',
      progress: 100,
      endTime: Date.now()
    };

    // Add to history
    this.syncHistory.unshift({
      ...this.syncState,
      id: this.generateSyncId()
    });

    // Keep only last 10 sync histories
    if (this.syncHistory.length > 10) {
      this.syncHistory = this.syncHistory.slice(0, 10);
    }

    this.saveSyncState();
    this.notifyListeners('syncCompleted', { ...this.syncState });

    console.log('Synchronization completed successfully');
  }

  /**
   * Handle sync error
   * @param {Error} error - Error that occurred
   */
  async handleSyncError(error) {
    this.syncInProgress = false;
    this.syncState = {
      ...this.syncState,
      status: 'error',
      endTime: Date.now(),
      error: error.message
    };

    this.saveSyncState();
    this.notifyListeners('syncError', { error, syncState: { ...this.syncState } });
  }

  /**
   * Pause synchronization
   */
  pauseSync() {
    if (!this.syncInProgress) return;

    this.syncState.status = 'paused';
    this.saveSyncState();
    this.notifyListeners('syncPaused', { ...this.syncState });
  }

  /**
   * Resume synchronization
   */
  async resumeSync() {
    if (this.syncState.status !== 'paused') return;

    this.syncState.status = 'syncing';
    this.notifyListeners('syncResumed', { ...this.syncState });

    // Continue processing queue
    await this.processSyncQueue();
  }

  /**
   * Cancel synchronization
   */
  cancelSync() {
    if (!this.syncInProgress) return;

    this.syncInProgress = false;
    this.syncState.status = 'cancelled';
    this.syncState.endTime = Date.now();

    this.saveSyncState();
    this.notifyListeners('syncCancelled', { ...this.syncState });
  }

  /**
   * Resolve a conflict manually
   * @param {string} itemId - Item ID
   * @param {string} resolution - Resolution ('local', 'remote', 'merge')
   * @param {Object} mergedData - Merged data if resolution is 'merge'
   */
  async resolveConflict(itemId, resolution, mergedData = null) {
    const conflictIndex = this.conflictedItems.findIndex(c => c.item.id === itemId);
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const { item, conflict } = this.conflictedItems[conflictIndex];
    
    try {
      let result;
      
      if (resolution === 'merge' && mergedData) {
        result = await this.applyDataChange(mergedData, null, 'local');
      } else {
        result = await this.applyDataChange(item.data, conflict, resolution);
      }

      // Remove from conflicted items
      this.conflictedItems.splice(conflictIndex, 1);
      this.syncState.conflictedItems--;
      
      // Mark item as completed
      item.status = 'completed';
      this.syncState.processedItems++;

      this.updateProgress();
      this.notifyListeners('conflictResolved', { itemId, resolution, result });

    } catch (error) {
      this.notifyListeners('conflictResolutionFailed', { itemId, error });
      throw error;
    }
  }

  /**
   * Add sync event listener
   * @param {string} id - Listener ID
   * @param {Function} callback - Callback function
   */
  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  /**
   * Remove sync event listener
   * @param {string} id - Listener ID
   */
  removeListener(id) {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Generate unique sync ID
   * @returns {string} Sync ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save sync state to storage
   */
  saveSyncState() {
    const stateToSave = {
      syncState: this.syncState,
      syncHistory: this.syncHistory,
      conflictedItems: this.conflictedItems.map(c => ({
        itemId: c.item.id,
        conflictType: c.conflict.type,
        timestamp: Date.now()
      }))
    };
    
    autosaveService.saveToStorage(this.storageKey, stateToSave);
  }

  /**
   * Load sync state from storage
   */
  loadSyncState() {
    const saved = autosaveService.getFromStorage(this.storageKey);
    
    if (saved) {
      this.syncState = { ...this.syncState, ...saved.syncState };
      this.syncHistory = saved.syncHistory || [];
      // Note: conflictedItems are not restored as they may be stale
    }
  }

  /**
   * Get current sync status
   * @returns {Object} Current sync state
   */
  getSyncStatus() {
    return {
      ...this.syncState,
      queueLength: this.syncQueue.length,
      conflictCount: this.conflictedItems.length,
      isOnline: offlineService.isOnline
    };
  }

  /**
   * Get sync history
   * @returns {Array} Sync history
   */
  getSyncHistory() {
    return [...this.syncHistory];
  }

  /**
   * Get conflicted items
   * @returns {Array} Conflicted items
   */
  getConflictedItems() {
    return [...this.conflictedItems];
  }

  /**
   * Clear sync history
   */
  clearSyncHistory() {
    this.syncHistory = [];
    this.saveSyncState();
  }

  /**
   * Clear all sync data
   */
  clearAllSyncData() {
    this.syncQueue = [];
    this.syncHistory = [];
    this.conflictedItems = [];
    this.syncState = {
      status: 'idle',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      conflictedItems: 0,
      startTime: null,
      endTime: null,
      estimatedTimeRemaining: null
    };
    
    autosaveService.removeFromStorage(this.storageKey);
  }
}

// Create and export singleton instance
const synchronizationService = new SynchronizationService();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.synchronizationService = synchronizationService;
}

export default synchronizationService; 