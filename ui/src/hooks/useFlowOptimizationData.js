import { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from './useWebSocket';

// Server URL constants
const WS_URL = window.env?.REACT_APP_WS_URL || 'ws://localhost:3000';
const WS_ENABLED = false; // Disable WebSocket until endpoints are ready
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling
const CACHE_DURATION = 60000; // 1 minute cache
const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds auto-refresh

/**
 * Custom hook for Flow Optimization real-time data integration
 * Implements Task 6.7 requirements:
 * - WebSocket integration for real-time flow metrics updates
 * - Automatic data refresh intervals for metrics charts and bottleneck detection
 * - Data polling mechanisms for when WebSocket is unavailable
 * - Optimistic updates for flow data changes
 * - Manual refresh controls and last-updated timestamps
 * - Data caching strategies for improved performance
 */
const useFlowOptimizationData = (options = {}) => {
  const {
    enableAutoRefresh = true,
    enableWebSocket = true,
    enableCaching = true,
    onDataUpdate,
    onError
  } = options;

  // State management
  const [flowData, setFlowData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  // Refs for intervals and cache
  const autoRefreshIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const cacheRef = useRef(new Map());
  const optimisticUpdatesRef = useRef(new Map());

  // WebSocket connection for real-time updates (temporarily disabled)
  const { lastMessage, readyState, sendMessage, error: wsError } = useWebSocket(
    enableWebSocket && WS_ENABLED ? WS_URL : null,
    {
      onMessage: handleWebSocketMessage,
      onOpen: () => {
        setConnectionStatus('connected');
        setError(null);
        // Subscribe to flow optimization updates
        sendMessage({
          type: 'subscribe',
          channel: 'flow-optimization'
        });
      },
      onClose: () => {
        setConnectionStatus('disconnected');
      },
      onError: (error) => {
        console.log('WebSocket temporarily disabled - will be connected later');
        setConnectionStatus('fallback');
        if (onError) onError(error);
      },
      shouldReconnect: true,
      reconnectLimit: 5,
      reconnectInterval: 3000
    }
  );

  // Handle WebSocket messages
  function handleWebSocketMessage(message) {
    try {
      if (message.type === 'flow-metrics-update') {
        handleRealTimeUpdate(message.data);
      } else if (message.type === 'bottleneck-detected') {
        handleBottleneckUpdate(message.data);
      } else if (message.type === 'optimization-suggestion') {
        handleOptimizationSuggestion(message.data);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
      if (onError) onError(err);
    }
  }

  // Handle real-time flow data updates
  const handleRealTimeUpdate = useCallback((data) => {
    setFlowData(prevData => {
      const updatedData = { ...prevData, ...data };
      
      // Update cache
      if (enableCaching) {
        cacheRef.current.set('flow-data', {
          data: updatedData,
          timestamp: Date.now()
        });
      }
      
      setLastUpdated(new Date());
      if (onDataUpdate) onDataUpdate(updatedData);
      
      return updatedData;
    });
  }, [enableCaching, onDataUpdate]);

  // Handle bottleneck detection updates
  const handleBottleneckUpdate = useCallback((bottleneckData) => {
    setFlowData(prevData => {
      if (!prevData) return prevData;
      
      const updatedData = {
        ...prevData,
        bottlenecks: [...(prevData.bottlenecks || []), bottleneckData]
      };
      
      if (enableCaching) {
        cacheRef.current.set('flow-data', {
          data: updatedData,
          timestamp: Date.now()
        });
      }
      
      setLastUpdated(new Date());
      if (onDataUpdate) onDataUpdate(updatedData);
      
      return updatedData;
    });
  }, [enableCaching, onDataUpdate]);

  // Handle optimization suggestions
  const handleOptimizationSuggestion = useCallback((suggestion) => {
    setFlowData(prevData => {
      if (!prevData) return prevData;
      
      const updatedData = {
        ...prevData,
        suggestions: [...(prevData.suggestions || []), suggestion]
      };
      
      if (enableCaching) {
        cacheRef.current.set('flow-data', {
          data: updatedData,
          timestamp: Date.now()
        });
      }
      
      setLastUpdated(new Date());
      if (onDataUpdate) onDataUpdate(updatedData);
      
      return updatedData;
    });
  }, [enableCaching, onDataUpdate]);

  // Fetch flow data from API
  const fetchFlowData = useCallback(async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (useCache && enableCaching) {
        const cached = cacheRef.current.get('flow-data');
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          setFlowData(cached.data);
          setLastUpdated(new Date(cached.timestamp));
          setIsLoading(false);
          return cached.data;
        }
      }

      // TODO: Replace with actual API call once real endpoints are available
      // The current API endpoints are not functional yet
      // const response = await fetch('/api/flow-optimization/data');
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // const data = await response.json();
      
      // Using mock data until real endpoints are ready
      const data = {
        metrics: {
          cycleTime: { current: 2.34, change: -0.3, trend: 'improving' },
          throughput: { current: 15, change: 15, trend: 'improving' },
          leadTime: { current: 4.2, change: -0.8, trend: 'improving' },
          wipLimits: { 
            development: { current: 4, limit: 3, status: 'over' },
            codeReview: { current: 2, limit: 3, status: 'ok' },
            testing: { current: 1, limit: 2, status: 'ok' }
          }
        },
        bottlenecks: [
          {
            id: 1,
            type: 'wip_limit',
            severity: 'high',
            column: 'Development',
            message: 'Development Column is over WIP limit (4/3)',
            impact: 'high',
            detectedAt: new Date()
          }
        ],
        suggestions: [
          {
            id: 1,
            type: 'process',
            priority: 'medium',
            title: 'Break down large tasks into smaller chunks',
            impact: 'medium',
            effort: 'medium'
          }
        ],
        lastUpdated: new Date()
      };
      
      // Apply any pending optimistic updates
      const optimisticUpdates = Array.from(optimisticUpdatesRef.current.values());
      const finalData = optimisticUpdates.reduce((acc, update) => ({
        ...acc,
        ...update
      }), data);
      
      setFlowData(finalData);
      setLastUpdated(new Date());
      
      // Update cache
      if (enableCaching) {
        cacheRef.current.set('flow-data', {
          data: finalData,
          timestamp: Date.now()
        });
      }
      
      if (onDataUpdate) onDataUpdate(finalData);
      
      return finalData;
    } catch (err) {
      console.error('Error fetching flow data:', err);
      setError(err.message);
      if (onError) onError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableCaching, onDataUpdate, onError]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    return await fetchFlowData(false); // Force refresh, bypass cache
  }, [fetchFlowData]);

  // Optimistic update function
  const applyOptimisticUpdate = useCallback((updateId, updateData) => {
    optimisticUpdatesRef.current.set(updateId, updateData);
    
    setFlowData(prevData => {
      if (!prevData) return prevData;
      return { ...prevData, ...updateData };
    });
    
    setLastUpdated(new Date());
  }, []);

  // Remove optimistic update (when confirmed or failed)
  const removeOptimisticUpdate = useCallback((updateId) => {
    optimisticUpdatesRef.current.delete(updateId);
  }, []);

  // Setup polling fallback when WebSocket is unavailable
  useEffect(() => {
    if (!enableWebSocket || (readyState !== 1 && readyState !== 0)) {
      // WebSocket is not available, use polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        fetchFlowData(true);
      }, POLLING_INTERVAL);
      
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enableWebSocket, readyState, fetchFlowData]);

  // Setup automatic refresh interval
  useEffect(() => {
    if (enableAutoRefresh) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      
      autoRefreshIntervalRef.current = setInterval(() => {
        // Only auto-refresh if WebSocket is not connected
        if (!enableWebSocket || readyState !== 1) {
          fetchFlowData(true);
        }
      }, AUTO_REFRESH_INTERVAL);
      
      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
        }
      };
    }
  }, [enableAutoRefresh, enableWebSocket, readyState, fetchFlowData]);

  // Initial data fetch
  useEffect(() => {
    fetchFlowData(true);
  }, [fetchFlowData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Update connection status based on WebSocket state
  useEffect(() => {
    if (!enableWebSocket) {
      setConnectionStatus('polling');
      return;
    }

    switch (readyState) {
      case 0: // CONNECTING
        setConnectionStatus('connecting');
        break;
      case 1: // OPEN
        setConnectionStatus('connected');
        break;
      case 2: // CLOSING
        setConnectionStatus('disconnecting');
        break;
      case 3: // CLOSED
        setConnectionStatus('disconnected');
        break;
      default:
        setConnectionStatus('unknown');
    }
  }, [enableWebSocket, readyState]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    optimisticUpdatesRef.current.clear();
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    return {
      cacheSize: cacheRef.current.size,
      optimisticUpdatesCount: optimisticUpdatesRef.current.size,
      lastCacheUpdate: cacheRef.current.get('flow-data')?.timestamp || null
    };
  }, []);

  return {
    // Data
    flowData,
    isLoading,
    lastUpdated,
    error,
    
    // Connection status
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isPolling: connectionStatus === 'polling',
    
    // Actions
    refreshData,
    applyOptimisticUpdate,
    removeOptimisticUpdate,
    clearCache,
    
    // WebSocket actions
    sendMessage: enableWebSocket ? sendMessage : null,
    
    // Cache utilities
    getCacheStats
  };
};

export default useFlowOptimizationData; 