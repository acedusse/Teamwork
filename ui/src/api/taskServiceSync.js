/**
 * Enhanced Task Service with Synchronization
 * Extends the offline task service with sync capabilities and version tracking
 */

import taskServiceOffline from './taskServiceOffline';
import synchronizationService from '../services/synchronizationService';

class TaskServiceSync {
  constructor() {
    this.baseService = taskServiceOffline;
    this.versionKey = 'taskmaster_data_versions';
    this.conflictResolvers = new Map();
    
    this.init();
  }

  init() {
    // Listen for sync events
    synchronizationService.addListener('task-service-sync', (event, data) => {
      this.handleSyncEvent(event, data);
    });
  }

  /**
   * Handle synchronization events
   */
  handleSyncEvent(event, data) {
    switch (event) {
      case 'syncStarted':
        console.log('Task service: Sync started');
        break;
      case 'syncCompleted':
        console.log('Task service: Sync completed');
        this.onSyncCompleted(data);
        break;
      case 'conflictDetected':
        console.log('Task service: Conflict detected', data);
        break;
    }
  }

  /**
   * Handle sync completion
   */
  onSyncCompleted(syncData) {
    // Update local version stamps
    this.updateLocalVersions();
    
    // Trigger refresh for any listening components
    this.notifyDataChange('sync_completed', syncData);
  }

  /**
   * Get all tasks with version tracking
   */
  async getTasks() {
    const tasks = await this.baseService.getTasks();
    
    // Add version metadata
    const versions = this.getDataVersions();
    return {
      data: tasks.data,
      lastSync: versions.lastSync,
      version: versions.tasksVersion || 1
    };
  }

  /**
   * Get task by ID with conflict detection
   */
  async getTask(id) {
    const task = await this.baseService.getTask(id);
    
    if (task.success) {
      // Check for potential conflicts
      const conflict = await this.checkForConflicts(task.data);
      if (conflict) {
        task.conflict = conflict;
      }
    }
    
    return task;
  }

  /**
   * Create task with version tracking
   */
  async createTask(taskData) {
    // Add version metadata
    const versionedData = {
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      localId: this.generateLocalId()
    };

    const result = await this.baseService.createTask(versionedData);
    
    if (result.success) {
      // Update version tracking
      this.incrementDataVersion('tasks');
      
      // Queue for sync if offline
      if (!synchronizationService.isOnline) {
        this.queueForSync('create_task', versionedData);
      }
    }
    
    return result;
  }

  /**
   * Update task with conflict detection
   */
  async updateTask(id, taskData) {
    // Check for conflicts before updating
    const existingTask = await this.baseService.getTask(id);
    
    if (existingTask.success) {
      const conflict = await this.checkForConflicts(existingTask.data);
      
      if (conflict && this.shouldRejectUpdate(conflict)) {
        return {
          success: false,
          error: 'Update rejected due to conflict',
          conflict,
          data: existingTask.data
        };
      }
    }

    // Add version metadata
    const versionedData = {
      ...taskData,
      updatedAt: new Date().toISOString(),
      version: (existingTask.data?.version || 0) + 1,
      lastModifiedBy: 'local'
    };

    const result = await this.baseService.updateTask(id, versionedData);
    
    if (result.success) {
      this.incrementDataVersion('tasks');
      
      if (!synchronizationService.isOnline) {
        this.queueForSync('update_task', { id, ...versionedData });
      }
    }
    
    return result;
  }

  /**
   * Delete task with sync tracking
   */
  async deleteTask(id) {
    const result = await this.baseService.deleteTask(id);
    
    if (result.success) {
      this.incrementDataVersion('tasks');
      
      if (!synchronizationService.isOnline) {
        this.queueForSync('delete_task', { id, deletedAt: new Date().toISOString() });
      }
    }
    
    return result;
  }

  /**
   * Check for data conflicts
   */
  async checkForConflicts(localData) {
    if (!localData.id || !synchronizationService.isOnline) {
      return null;
    }

    try {
      // Fetch server version
      const response = await fetch(`/api/tasks/${localData.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return null; // Item doesn't exist on server
      }

      const serverData = await response.json();
      
      // Compare versions and timestamps
      if (this.hasVersionConflict(localData, serverData)) {
        return {
          type: 'version_conflict',
          localVersion: localData,
          serverVersion: serverData,
          conflictedFields: this.identifyConflictedFields(localData, serverData),
          severity: this.assessConflictSeverity(localData, serverData)
        };
      }

      return null;
    } catch (error) {
      console.warn('Error checking for conflicts:', error);
      return null;
    }
  }

  /**
   * Check if there's a version conflict
   */
  hasVersionConflict(local, server) {
    // Version-based conflict
    if (local.version && server.version && server.version > local.version) {
      return true;
    }

    // Timestamp-based conflict
    if (local.updatedAt && server.updatedAt) {
      return new Date(server.updatedAt) > new Date(local.updatedAt);
    }

    return false;
  }

  /**
   * Identify conflicted fields
   */
  identifyConflictedFields(local, server) {
    const conflicts = [];
    const fieldsToCheck = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate'];
    
    for (const field of fieldsToCheck) {
      if (JSON.stringify(local[field]) !== JSON.stringify(server[field])) {
        conflicts.push({
          field,
          localValue: local[field],
          serverValue: server[field]
        });
      }
    }
    
    return conflicts;
  }

  /**
   * Assess conflict severity
   */
  assessConflictSeverity(local, server) {
    const conflicts = this.identifyConflictedFields(local, server);
    
    // High severity if status or critical fields changed
    const criticalFields = ['status', 'priority', 'assignee'];
    const hasCriticalConflicts = conflicts.some(c => criticalFields.includes(c.field));
    
    if (hasCriticalConflicts) return 'high';
    if (conflicts.length > 2) return 'medium';
    return 'low';
  }

  /**
   * Should reject update due to conflict
   */
  shouldRejectUpdate(conflict) {
    // For now, only reject high-severity conflicts
    return conflict.severity === 'high';
  }

  /**
   * Queue operation for synchronization
   */
  queueForSync(operation, data) {
    const syncItem = {
      id: this.generateSyncId(),
      operation,
      data,
      timestamp: Date.now(),
      priority: this.getSyncPriority(operation),
      retries: 0
    };

    // Add to offline service queue
    this.baseService.offlineService.addToQueue(
      this.buildSyncRequest(operation, data),
      syncItem.priority,
      { operation, originalData: data }
    );
  }

  /**
   * Build sync request for operation
   */
  buildSyncRequest(operation, data) {
    const baseUrl = '/api/tasks';
    
    switch (operation) {
      case 'create_task':
        return {
          url: baseUrl,
          options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }
        };
        
      case 'update_task':
        return {
          url: `${baseUrl}/${data.id}`,
          options: {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }
        };
        
      case 'delete_task':
        return {
          url: `${baseUrl}/${data.id}`,
          options: {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          }
        };
        
      default:
        throw new Error(`Unknown sync operation: ${operation}`);
    }
  }

  /**
   * Get sync priority for operation
   */
  getSyncPriority(operation) {
    switch (operation) {
      case 'delete_task': return 9; // High priority
      case 'update_task': return 7; // Medium-high priority
      case 'create_task': return 5; // Medium priority
      default: return 3; // Low priority
    }
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflict(conflictId, resolution, mergedData = null) {
    try {
      switch (resolution) {
        case 'local':
          // Keep local version, force sync
          await synchronizationService.resolveConflict(conflictId, 'local');
          break;
          
        case 'remote':
          // Accept remote version, update local
          await synchronizationService.resolveConflict(conflictId, 'remote');
          break;
          
        case 'merge':
          // Use merged data
          if (!mergedData) {
            throw new Error('Merged data required for merge resolution');
          }
          await synchronizationService.resolveConflict(conflictId, 'merge', mergedData);
          break;
          
        default:
          throw new Error(`Unknown resolution: ${resolution}`);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Register conflict resolver
   */
  registerConflictResolver(taskId, resolver) {
    this.conflictResolvers.set(taskId, resolver);
  }

  /**
   * Get data versions
   */
  getDataVersions() {
    const stored = localStorage.getItem(this.versionKey);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Update data versions
   */
  updateDataVersions(versions) {
    localStorage.setItem(this.versionKey, JSON.stringify(versions));
  }

  /**
   * Increment data version
   */
  incrementDataVersion(dataType) {
    const versions = this.getDataVersions();
    versions[`${dataType}Version`] = (versions[`${dataType}Version`] || 0) + 1;
    versions.lastModified = new Date().toISOString();
    this.updateDataVersions(versions);
  }

  /**
   * Update local versions after sync
   */
  updateLocalVersions() {
    const versions = this.getDataVersions();
    versions.lastSync = new Date().toISOString();
    this.updateDataVersions(versions);
  }

  /**
   * Generate local ID for offline items
   */
  generateLocalId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate sync ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify data change to listeners
   */
  notifyDataChange(event, data) {
    // This would integrate with a global state management system
    // For now, just dispatch a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('taskDataChange', {
        detail: { event, data }
      }));
    }
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics() {
    const versions = this.getDataVersions();
    const queueStatus = this.baseService.offlineService.getQueueStatus();
    
    return {
      lastSync: versions.lastSync,
      currentVersion: versions.tasksVersion || 1,
      pendingSync: queueStatus.total,
      isOnline: synchronizationService.isOnline
    };
  }

  /**
   * Force full synchronization
   */
  async forceSyncAll() {
    try {
      await synchronizationService.startSync({ force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Export data for backup
   */
  async exportData() {
    const tasks = await this.baseService.getTasks();
    const versions = this.getDataVersions();
    const syncStats = this.getSyncStatistics();
    
    return {
      tasks: tasks.data,
      versions,
      syncStats,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import data from backup
   */
  async importData(backupData) {
    try {
      // Validate backup data
      if (!backupData.tasks || !Array.isArray(backupData.tasks)) {
        throw new Error('Invalid backup data format');
      }

      // Clear existing data
      await this.baseService.clearAllData();

      // Import tasks
      for (const task of backupData.tasks) {
        await this.baseService.createTask(task);
      }

      // Restore versions if available
      if (backupData.versions) {
        this.updateDataVersions(backupData.versions);
      }

      // Force sync to reconcile with server
      await this.forceSyncAll();

      return { success: true, imported: backupData.tasks.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const taskServiceSync = new TaskServiceSync();

export default taskServiceSync; 