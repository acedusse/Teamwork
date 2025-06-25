import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useSocketIO = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connecting', 'connected', 'disconnected', 'reconnecting', 'failed'
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const syncDataRef = useRef(new Map()); // Store data for consistency checks
  const offlineActionsRef = useRef([]);
  
  const {
    reconnectLimit = 10, // Increased from 5
    reconnectDelay = 1000, // Start with 1 second
    maxReconnectDelay = 30000, // Maximum 30 seconds
    heartbeatInterval = 30000, // 30 seconds
    auth = {},
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    onReconnectAttempt,
    onReconnectSuccess,
    onReconnectFailed,
    onOfflineAction,
    onSyncRequired,
    autoConnect = true,
    transports = ['websocket', 'polling'],
    enableHeartbeat = true,
    enableOfflineQueue = true
  } = options;

  // Enhanced reconnection with exponential backoff
  const getReconnectDelay = useCallback((attempt) => {
    const exponentialDelay = reconnectDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, maxReconnectDelay);
  }, [reconnectDelay, maxReconnectDelay]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network came back online');
      setIsOnline(true);
      
      // Trigger reconnection if we were disconnected due to network issues
      if (!isConnected && socket) {
        setConnectionState('reconnecting');
        attemptReconnect();
      }
      
      // Process offline queue
      processOfflineQueue();
    };

    const handleOffline = () => {
      console.log('Network went offline');
      setIsOnline(false);
      setConnectionState('disconnected');
      
      // Clear heartbeat when offline
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isConnected, socket]);

  // Heartbeat mechanism to detect connection issues
  const startHeartbeat = useCallback(() => {
    if (!enableHeartbeat || heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket && isConnected) {
        const startTime = Date.now();
        socket.emit('ping', startTime, (response) => {
          const latency = Date.now() - startTime;
          console.log(`Heartbeat response received, latency: ${latency}ms`);
          
          // If latency is too high, consider connection degraded
          if (latency > 5000) {
            console.warn('High latency detected, connection may be unstable');
            setError(new Error(`High latency: ${latency}ms`));
          }
        });
      }
    }, heartbeatInterval);
  }, [socket, isConnected, enableHeartbeat, heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Enhanced reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectLimit) {
      console.error('Maximum reconnection attempts reached');
      setConnectionState('failed');
      setError(new Error('Connection failed after maximum attempts'));
      if (onReconnectFailed) {
        onReconnectFailed();
      }
      return;
    }

    if (!isOnline) {
      console.log('Skipping reconnection attempt - offline');
      return;
    }

    reconnectAttemptsRef.current++;
    setConnectionState('reconnecting');
    
    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${reconnectLimit} in ${delay}ms`);
    
    if (onReconnectAttempt) {
      onReconnectAttempt(reconnectAttemptsRef.current, delay);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [reconnectLimit, isOnline, getReconnectDelay, onReconnectAttempt, onReconnectFailed]);

  // Process offline message queue
  const processOfflineQueue = useCallback(async () => {
    if (!enableOfflineQueue || offlineQueue.length === 0 || !isConnected) {
      return;
    }

    console.log(`Processing ${offlineQueue.length} offline messages`);
    
    const queueToProcess = [...offlineQueue];
    setOfflineQueue([]);

    for (const queuedMessage of queueToProcess) {
      try {
        if (socket && isConnected) {
          // Add metadata to indicate this is a queued message
          const messageWithMetadata = {
            ...queuedMessage.data,
            _offline: true,
            _queuedAt: queuedMessage.timestamp,
            _processedAt: Date.now()
          };
          
          socket.emit(queuedMessage.event, messageWithMetadata);
          console.log(`Processed offline message: ${queuedMessage.event}`);
        }
      } catch (error) {
        console.error('Failed to process offline message:', error);
        // Re-queue failed messages
        setOfflineQueue(prev => [...prev, queuedMessage]);
      }
    }

    // Trigger sync check after processing offline queue
    if (onSyncRequired) {
      onSyncRequired();
    }
    
    setLastSyncTime(Date.now());
  }, [enableOfflineQueue, offlineQueue, isConnected, socket, onSyncRequired]);

  // Enhanced connect function
  const connect = useCallback(() => {
    try {
      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
        stopHeartbeat();
      }

      setConnectionState('connecting');
      setError(null);

      const socketInstance = io(url, {
        auth,
        transports,
        reconnection: false, // We handle reconnection manually for better control
        timeout: 20000,
        forceNew: true
      });

      // Connection established
      socketInstance.on('connect', () => {
        console.log('Socket.io connected:', socketInstance.id);
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const { event, data } = messageQueueRef.current.shift();
          socketInstance.emit(event, data);
        }

        // Start heartbeat
        startHeartbeat();

        // Process offline queue
        processOfflineQueue();

        if (onConnect) {
          onConnect(socketInstance);
        }

        if (onReconnectSuccess && reconnectAttemptsRef.current > 0) {
          onReconnectSuccess(reconnectAttemptsRef.current);
        }
      });

      // Connection failed
      socketInstance.on('connect_error', (err) => {
        console.error('Socket.io connection error:', err);
        setError(err);
        setIsConnected(false);
        setConnectionState('disconnected');
        stopHeartbeat();

        if (onError) {
          onError(err);
        }

        // Attempt reconnection if we haven't exceeded the limit
        if (reconnectAttemptsRef.current < reconnectLimit && isOnline) {
          attemptReconnect();
        }
      });

      // Disconnected
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        stopHeartbeat();

        if (onDisconnect) {
          onDisconnect(reason);
        }

        // Attempt reconnection for unexpected disconnections
        if (reason !== 'io client disconnect' && isOnline) {
          attemptReconnect();
        }
      });

      // Handle server-initiated sync requests
      socketInstance.on('sync_required', (data) => {
        console.log('Server requested data sync:', data);
        if (onSyncRequired) {
          onSyncRequired(data);
        }
      });

      // Handle conflict resolution
      socketInstance.on('conflict_detected', (data) => {
        console.warn('Data conflict detected:', data);
        // Store conflict data for resolution
        syncDataRef.current.set(data.resourceId, {
          conflict: data,
          timestamp: Date.now()
        });
      });

      // Generic message handler
      if (onMessage) {
        socketInstance.onAny((event, ...args) => {
          const data = args.length === 1 ? args[0] : args;
          setLastMessage({ event, data, timestamp: new Date().toISOString() });
          onMessage(event, data);
        });
      }

      setSocket(socketInstance);
      return socketInstance;
    } catch (err) {
      console.error('Error creating Socket.io connection:', err);
      setError(err);
      setConnectionState('failed');
      return null;
    }
  }, [url, auth, transports, onConnect, onDisconnect, onError, onMessage, socket, startHeartbeat, stopHeartbeat, processOfflineQueue, attemptReconnect, reconnectLimit, isOnline, onSyncRequired, onReconnectSuccess]);

  const disconnect = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionState('disconnected');
    }
  }, [socket, stopHeartbeat]);

  // Enhanced emit with offline queuing
  const emit = useCallback((event, data, options = {}) => {
    const { 
      priority = 'normal', // 'high', 'normal', 'low'
      requiresAck = false,
      timeout = 5000,
      queueWhenOffline = enableOfflineQueue 
    } = options;

    if (socket && isConnected) {
      if (requiresAck) {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Acknowledgment timeout'));
          }, timeout);

          socket.emit(event, data, (response) => {
            clearTimeout(timeoutId);
            resolve(response);
          });
        });
      } else {
        socket.emit(event, data);
        return Promise.resolve();
      }
    } else {
      // Handle offline scenarios
      if (queueWhenOffline) {
        const queuedMessage = {
          event,
          data,
          timestamp: Date.now(),
          priority,
          requiresAck,
          timeout
        };

        if (enableOfflineQueue) {
          setOfflineQueue(prev => {
            const updated = [...prev, queuedMessage];
            // Sort by priority: high > normal > low
            return updated.sort((a, b) => {
              const priorities = { high: 3, normal: 2, low: 1 };
              return priorities[b.priority] - priorities[a.priority];
            });
          });
        } else {
          messageQueueRef.current.push(queuedMessage);
        }

        if (onOfflineAction) {
          onOfflineAction(event, data);
        }

        console.log(`Queued message for offline delivery: ${event}`);
      }

      // Try to connect if not connected and auto-connect is enabled
      if (!socket && autoConnect && isOnline) {
        connect();
      }

      return Promise.resolve();
    }
  }, [socket, isConnected, autoConnect, connect, enableOfflineQueue, onOfflineAction]);

  const on = useCallback((event, handler) => {
    if (socket) {
      socket.on(event, handler);

      // Return cleanup function
      return () => {
        socket.off(event, handler);
      };
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
  }, [socket]);

  // Force reconnection
  const forceReconnect = useCallback(() => {
    console.log('Forcing reconnection...');
    reconnectAttemptsRef.current = 0; // Reset attempts
    setConnectionState('reconnecting');
    connect();
  }, [connect]);

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    messageQueueRef.current = [];
    console.log('Offline queue cleared');
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    return {
      isConnected,
      isOnline,
      connectionState,
      reconnectAttempts: reconnectAttemptsRef.current,
      queuedMessages: messageQueueRef.current.length,
      offlineQueueSize: offlineQueue.length,
      lastSyncTime,
      hasConflicts: syncDataRef.current.size > 0,
      error: error?.message
    };
  }, [isConnected, isOnline, connectionState, offlineQueue.length, lastSyncTime, error]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isOnline) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isOnline]); // Removed connect and disconnect from deps to prevent infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    socket,
    isConnected,
    isOnline,
    connectionState,
    error,
    lastMessage,
    offlineQueue,
    lastSyncTime,
    connect,
    disconnect,
    emit,
    on,
    off,
    forceReconnect,
    clearOfflineQueue,
    getConnectionStats,
    processOfflineQueue
  };
};

export default useSocketIO; 