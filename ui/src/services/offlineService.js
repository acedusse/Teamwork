/**
 * Offline Service
 * Manages offline state, request queuing, and service worker integration
 */

import autosaveService from './autosaveService';

class OfflineService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.requestQueue = [];
    this.maxQueueSize = 100;
    this.storageKey = 'taskmaster_offline_queue';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.listeners = new Map();
    
    this.init();
  }

  init() {
    // Load queued requests from localStorage
    this.loadQueueFromStorage();
    
    // Set up connectivity listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Listen for custom connectivity events from useOfflineStatus
      window.addEventListener('connectivity-restored', this.handleConnectivityRestored.bind(this));
      window.addEventListener('connectivity-lost', this.handleConnectivityLost.bind(this));
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  /**
   * Handle connectivity restored event
   */
  handleConnectivityRestored(event) {
    console.log('Connectivity restored at:', new Date(event.detail.timestamp));
    this.processQueue();
  }

  /**
   * Handle connectivity lost event
   */
  handleConnectivityLost(event) {
    console.log('Connectivity lost at:', new Date(event.detail.timestamp));
  }

  /**
   * Add a listener for connectivity changes
   * @param {string} id - Unique identifier for the listener
   * @param {Object} callbacks - Object with online/offline callback functions
   */
  addListener(id, callbacks) {
    this.listeners.set(id, callbacks);
  }

  /**
   * Remove a connectivity listener
   * @param {string} id - Listener identifier
   */
  removeListener(id) {
    this.listeners.delete(id);
  }

  /**
   * Notify all listeners of connectivity changes
   * @param {string} status - 'online' or 'offline'
   */
  notifyListeners(status) {
    this.listeners.forEach((callbacks) => {
      if (callbacks[status]) {
        callbacks[status]();
      }
    });
  }

  /**
   * Queue a failed request for retry when online
   * @param {Object} request - Request configuration
   * @param {string} request.url - Request URL
   * @param {Object} request.options - Fetch options
   * @param {Function} request.onSuccess - Success callback
   * @param {Function} request.onError - Error callback
   * @param {string} request.context - Context identifier
   * @param {number} request.priority - Priority level (1-10, higher = more important)
   */
  queueRequest(request) {
    if (this.requestQueue.length >= this.maxQueueSize) {
      // Remove oldest low-priority requests
      this.requestQueue = this.requestQueue
        .filter(r => r.priority > 5)
        .slice(-(this.maxQueueSize - 1));
    }

    const queuedRequest = {
      ...request,
      timestamp: Date.now(),
      attempts: 0,
      priority: request.priority || 5,
      id: this.generateRequestId()
    };

    this.requestQueue.push(queuedRequest);
    
    // Sort by priority (higher first) then by timestamp (older first)
    this.requestQueue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.saveQueueToStorage();
    return queuedRequest.id;
  }

  /**
   * Remove a request from the queue
   * @param {string} requestId - Request ID to remove
   */
  removeFromQueue(requestId) {
    this.requestQueue = this.requestQueue.filter(r => r.id !== requestId);
    this.saveQueueToStorage();
  }

  /**
   * Process all queued requests
   */
  async processQueue() {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.requestQueue.length} queued requests...`);

    // Process requests in priority order
    const requestsToProcess = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requestsToProcess) {
      try {
        await this.processRequest(request);
      } catch (error) {
        console.warn('Failed to process queued request:', error);
      }
    }

    this.saveQueueToStorage();
  }

  /**
   * Process a single queued request
   * @param {Object} request - Request to process
   */
  async processRequest(request) {
    request.attempts++;

    try {
      const response = await fetch(request.url, request.options);
      
      if (response.ok) {
        if (request.onSuccess) {
          request.onSuccess(response);
        }
        console.log(`Successfully processed queued request: ${request.context}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn(`Failed to process request (attempt ${request.attempts}):`, error);
      
      if (request.attempts < this.retryAttempts) {
        // Re-queue with exponential backoff
        setTimeout(() => {
          this.requestQueue.unshift(request);
          this.processRequest(request);
        }, this.retryDelay * Math.pow(2, request.attempts - 1));
      } else {
        // Final failure
        if (request.onError) {
          request.onError(error);
        }
        console.error(`Request failed after ${this.retryAttempts} attempts:`, request.context);
      }
    }
  }

  /**
   * Enhanced fetch with offline support
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {Object} offlineOptions - Offline-specific options
   * @returns {Promise} Fetch promise or queued request promise
   */
  async fetch(url, options = {}, offlineOptions = {}) {
    const {
      context = url,
      priority = 5,
      queueOnFailure = true,
      useCache = true
    } = offlineOptions;

    // Try to get from cache first if offline
    if (!this.isOnline && useCache) {
      const cached = this.getCachedResponse(url, options);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        // Cache successful responses
        if (useCache) {
          this.cacheResponse(url, options, response.clone());
        }
        return response;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (!this.isOnline && queueOnFailure) {
        // Queue the request for later
        return new Promise((resolve, reject) => {
          this.queueRequest({
            url,
            options,
            context,
            priority,
            onSuccess: resolve,
            onError: reject
          });
        });
      }
      throw error;
    }
  }

  /**
   * Cache a response in localStorage
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @param {Response} response - Response to cache
   */
  async cacheResponse(url, options, response) {
    try {
      const cacheKey = this.generateCacheKey(url, options);
      const responseData = {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
        timestamp: Date.now()
      };

      autosaveService.saveToStorage(`cache_${cacheKey}`, responseData);
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * Get cached response from localStorage
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Response|null} Cached response or null
   */
  getCachedResponse(url, options) {
    try {
      const cacheKey = this.generateCacheKey(url, options);
      const cached = autosaveService.getFromStorage(`cache_${cacheKey}`);
      
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24 hour cache
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers
        });
      }
    } catch (error) {
      console.warn('Failed to get cached response:', error);
    }
    return null;
  }

  /**
   * Generate cache key for request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {string} Cache key
   */
  generateCacheKey(url, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return btoa(`${method}:${url}:${body}`).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save request queue to localStorage
   */
  saveQueueToStorage() {
    try {
      const queueData = {
        requests: this.requestQueue,
        timestamp: Date.now()
      };
      autosaveService.saveToStorage(this.storageKey, queueData);
    } catch (error) {
      console.warn('Failed to save request queue:', error);
    }
  }

  /**
   * Load request queue from localStorage
   */
  loadQueueFromStorage() {
    try {
      const queueData = autosaveService.getFromStorage(this.storageKey);
      if (queueData && queueData.requests) {
        // Filter out old requests (older than 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.requestQueue = queueData.requests.filter(r => r.timestamp > dayAgo);
      }
    } catch (error) {
      console.warn('Failed to load request queue:', error);
    }
  }

  /**
   * Clear all queued requests
   */
  clearQueue() {
    this.requestQueue = [];
    this.saveQueueToStorage();
  }

  /**
   * Get queue status
   * @returns {Object} Queue information
   */
  getQueueStatus() {
    const highPriority = this.requestQueue.filter(r => r.priority >= 8).length;
    const mediumPriority = this.requestQueue.filter(r => r.priority >= 5 && r.priority < 8).length;
    const lowPriority = this.requestQueue.filter(r => r.priority < 5).length;

    return {
      total: this.requestQueue.length,
      highPriority,
      mediumPriority,
      lowPriority,
      oldestRequest: this.requestQueue.length > 0 ? 
        Math.min(...this.requestQueue.map(r => r.timestamp)) : null
    };
  }

  /**
   * Basic service worker registration
   * @param {string} swPath - Path to service worker file
   */
  async registerServiceWorker(swPath = '/sw.js') {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered:', registration);
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Get current status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueStatus: this.getQueueStatus(),
      listenersCount: this.listeners.size
    };
  }
}

// Create and export singleton instance
const offlineService = new OfflineService();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  window.offlineService = offlineService;
}

export default offlineService; 