import { taskService } from './taskService';
import offlineService from '../services/offlineService';
import autosaveService from '../services/autosaveService';

/**
 * Enhanced Task Service with Offline Capabilities
 * Wraps the existing taskService with offline detection, queuing, and caching
 */

class OfflineTaskService {
  constructor() {
    this.cachePrefix = 'taskservice_cache_';
    this.syncPrefix = 'taskservice_sync_';
    this.pendingChanges = new Map(); // Track optimistic updates
  }

  /**
   * Get all tasks with offline support
   */
  async getTasks() {
    try {
      const response = await offlineService.fetch('/api/tasks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, {
        context: 'getTasks',
        priority: 7,
        useCache: true
      });

      const tasks = await response.json();
      
      // Cache the tasks locally
      autosaveService.saveToStorage(`${this.cachePrefix}all_tasks`, {
        data: tasks,
        timestamp: Date.now()
      });

      return tasks;
    } catch (error) {
      console.warn('Failed to fetch tasks, using cached data:', error);
      
      // Try to get cached tasks
      const cached = autosaveService.getFromStorage(`${this.cachePrefix}all_tasks`);
      if (cached && cached.data) {
        return this.applyPendingChanges(cached.data);
      }
      
      // Fallback to empty array
      return [];
    }
  }

  /**
   * Get a single task by ID with offline support
   */
  async getTask(id) {
    try {
      const response = await offlineService.fetch(`/api/tasks/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, {
        context: `getTask-${id}`,
        priority: 8,
        useCache: true
      });

      const task = await response.json();
      
      // Cache individual task
      autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
        data: task,
        timestamp: Date.now()
      });

      return task;
    } catch (error) {
      console.warn(`Failed to fetch task ${id}, using cached data:`, error);
      
      // Try cached individual task first
      const cached = autosaveService.getFromStorage(`${this.cachePrefix}task_${id}`);
      if (cached && cached.data) {
        return this.applyPendingChangesToTask(cached.data);
      }
      
      // Try to find in cached all tasks
      const allCached = autosaveService.getFromStorage(`${this.cachePrefix}all_tasks`);
      if (allCached && allCached.data) {
        const task = allCached.data.find(t => t.id === id);
        if (task) {
          return this.applyPendingChangesToTask(task);
        }
      }
      
      throw new Error(`Task ${id} not found in cache`);
    }
  }

  /**
   * Create a new task with optimistic updates and offline queuing
   */
  async createTask(taskData) {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticTask = {
      ...taskData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isOptimistic: true
    };

    // Apply optimistic update immediately
    this.addPendingChange('create', optimisticTask);
    this.updateCachedTasks(tasks => [...tasks, optimisticTask]);

    try {
      if (offlineService.isOnline) {
        const response = await taskService.createTask(taskData);
        
        // Remove optimistic update and replace with real data
        this.removePendingChange('create', tempId);
        this.updateCachedTasks(tasks => 
          tasks.map(t => t.id === tempId ? response : t)
        );
        
        return response;
      } else {
        // Queue for when online
        return new Promise((resolve, reject) => {
          offlineService.queueRequest({
            url: '/api/tasks',
            options: {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            },
            context: `createTask-${tempId}`,
            priority: 9,
            onSuccess: async (response) => {
              const realTask = await response.json();
              this.removePendingChange('create', tempId);
              this.updateCachedTasks(tasks => 
                tasks.map(t => t.id === tempId ? realTask : t)
              );
              resolve(realTask);
            },
            onError: (error) => {
              this.removePendingChange('create', tempId);
              this.updateCachedTasks(tasks => 
                tasks.filter(t => t.id !== tempId)
              );
              reject(error);
            }
          });
        });
      }
    } catch (error) {
      // Remove optimistic update on error
      this.removePendingChange('create', tempId);
      this.updateCachedTasks(tasks => 
        tasks.filter(t => t.id !== tempId)
      );
      throw error;
    }
  }

  /**
   * Update an existing task with optimistic updates and offline queuing
   */
  async updateTask(id, taskData) {
    const originalTask = await this.getTask(id);
    const optimisticTask = {
      ...originalTask,
      ...taskData,
      updatedAt: new Date().toISOString(),
      _isOptimistic: true
    };

    // Apply optimistic update immediately
    this.addPendingChange('update', optimisticTask);
    this.updateCachedTasks(tasks => 
      tasks.map(t => t.id === id ? optimisticTask : t)
    );
    
    // Cache individual task update
    autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
      data: optimisticTask,
      timestamp: Date.now()
    });

    try {
      if (offlineService.isOnline) {
        const response = await taskService.updateTask(id, taskData);
        
        // Remove optimistic update and replace with real data
        this.removePendingChange('update', id);
        this.updateCachedTasks(tasks => 
          tasks.map(t => t.id === id ? response : t)
        );
        
        // Update cached individual task
        autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
          data: response,
          timestamp: Date.now()
        });
        
        return response;
      } else {
        // Queue for when online
        return new Promise((resolve, reject) => {
          offlineService.queueRequest({
            url: `/api/tasks/${id}`,
            options: {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            },
            context: `updateTask-${id}`,
            priority: 8,
            onSuccess: async (response) => {
              const realTask = await response.json();
              this.removePendingChange('update', id);
              this.updateCachedTasks(tasks => 
                tasks.map(t => t.id === id ? realTask : t)
              );
              
              autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
                data: realTask,
                timestamp: Date.now()
              });
              
              resolve(realTask);
            },
            onError: (error) => {
              this.removePendingChange('update', id);
              this.updateCachedTasks(tasks => 
                tasks.map(t => t.id === id ? originalTask : t)
              );
              
              autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
                data: originalTask,
                timestamp: Date.now()
              });
              
              reject(error);
            }
          });
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      this.removePendingChange('update', id);
      this.updateCachedTasks(tasks => 
        tasks.map(t => t.id === id ? originalTask : t)
      );
      
      autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
        data: originalTask,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Delete a task with optimistic updates and offline queuing
   */
  async deleteTask(id) {
    const originalTask = await this.getTask(id);

    // Apply optimistic delete immediately
    this.addPendingChange('delete', { id });
    this.updateCachedTasks(tasks => tasks.filter(t => t.id !== id));
    
    // Remove from individual cache
    autosaveService.removeFromStorage(`${this.cachePrefix}task_${id}`);

    try {
      if (offlineService.isOnline) {
        const response = await taskService.deleteTask(id);
        this.removePendingChange('delete', id);
        return response;
      } else {
        // Queue for when online
        return new Promise((resolve, reject) => {
          offlineService.queueRequest({
            url: `/api/tasks/${id}`,
            options: { method: 'DELETE' },
            context: `deleteTask-${id}`,
            priority: 7,
            onSuccess: (response) => {
              this.removePendingChange('delete', id);
              resolve(response);
            },
            onError: (error) => {
              this.removePendingChange('delete', id);
              this.updateCachedTasks(tasks => [...tasks, originalTask]);
              
              autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
                data: originalTask,
                timestamp: Date.now()
              });
              
              reject(error);
            }
          });
        });
      }
    } catch (error) {
      // Revert optimistic delete on error
      this.removePendingChange('delete', id);
      this.updateCachedTasks(tasks => [...tasks, originalTask]);
      
      autosaveService.saveToStorage(`${this.cachePrefix}task_${id}`, {
        data: originalTask,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  /**
   * Get task statistics with cached fallback
   */
  async getTaskStats() {
    try {
      const response = await offlineService.fetch('/api/tasks/stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, {
        context: 'getTaskStats',
        priority: 5,
        useCache: true
      });

      const stats = await response.json();
      
      // Cache stats
      autosaveService.saveToStorage(`${this.cachePrefix}stats`, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      console.warn('Failed to fetch task stats, using cached data:', error);
      
      const cached = autosaveService.getFromStorage(`${this.cachePrefix}stats`);
      if (cached && cached.data) {
        return cached.data;
      }
      
      // Generate basic stats from cached tasks
      const tasks = await this.getTasks();
      return this.generateStatsFromTasks(tasks);
    }
  }

  /**
   * Get recent activities with cached fallback
   */
  async getRecentActivities() {
    try {
      const response = await offlineService.fetch('/api/tasks/activities', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, {
        context: 'getRecentActivities',
        priority: 4,
        useCache: true
      });

      const activities = await response.json();
      
      // Cache activities
      autosaveService.saveToStorage(`${this.cachePrefix}activities`, {
        data: activities,
        timestamp: Date.now()
      });

      return activities;
    } catch (error) {
      console.warn('Failed to fetch recent activities, using cached data:', error);
      
      const cached = autosaveService.getFromStorage(`${this.cachePrefix}activities`);
      if (cached && cached.data) {
        return cached.data;
      }
      
      return [];
    }
  }

  // Helper Methods

  /**
   * Apply pending changes to task list
   */
  applyPendingChanges(tasks) {
    let result = [...tasks];
    
    this.pendingChanges.forEach((change, key) => {
      switch (change.type) {
        case 'create':
          if (!result.find(t => t.id === change.data.id)) {
            result.push(change.data);
          }
          break;
        case 'update':
          result = result.map(t => t.id === change.data.id ? change.data : t);
          break;
        case 'delete':
          result = result.filter(t => t.id !== change.data.id);
          break;
      }
    });
    
    return result;
  }

  /**
   * Apply pending changes to single task
   */
  applyPendingChangesToTask(task) {
    const pendingUpdate = this.pendingChanges.get(`update-${task.id}`);
    if (pendingUpdate) {
      return pendingUpdate.data;
    }
    return task;
  }

  /**
   * Add a pending change
   */
  addPendingChange(type, data) {
    const key = `${type}-${data.id}`;
    this.pendingChanges.set(key, { type, data, timestamp: Date.now() });
  }

  /**
   * Remove a pending change
   */
  removePendingChange(type, id) {
    const key = `${type}-${id}`;
    this.pendingChanges.delete(key);
  }

  /**
   * Update cached tasks list
   */
  updateCachedTasks(updateFn) {
    const cached = autosaveService.getFromStorage(`${this.cachePrefix}all_tasks`);
    if (cached && cached.data) {
      const updatedTasks = updateFn(cached.data);
      autosaveService.saveToStorage(`${this.cachePrefix}all_tasks`, {
        data: updatedTasks,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Generate basic stats from tasks array
   */
  generateStatsFromTasks(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      _generatedOffline: true
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    const keys = autosaveService.getAllKeys().filter(key => 
      key.startsWith(this.cachePrefix)
    );
    
    keys.forEach(key => {
      autosaveService.removeFromStorage(key);
    });
    
    this.pendingChanges.clear();
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    const keys = autosaveService.getAllKeys().filter(key => 
      key.startsWith(this.cachePrefix)
    );
    
    return {
      cachedItems: keys.length,
      pendingChanges: this.pendingChanges.size,
      cacheKeys: keys
    };
  }
}

// Create and export singleton instance
const offlineTaskService = new OfflineTaskService();

export default offlineTaskService; 