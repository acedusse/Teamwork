import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const useSocketIO = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef([]);

  const {
    reconnectLimit = 5,
    reconnectDelay = 3000,
    auth = {},
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    autoConnect = true,
    transports = ['websocket', 'polling']
  } = options;

  const connect = useCallback(() => {
    try {
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
      }

      const socketInstance = io(url, {
        auth,
        transports,
        reconnection: true,
        reconnectionAttempts: reconnectLimit,
        reconnectionDelay: reconnectDelay,
        timeout: 20000,
        forceNew: true
      });

      // Connection established
      socketInstance.on('connect', () => {
        console.log('Socket.io connected:', socketInstance.id);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const { event, data } = messageQueueRef.current.shift();
          socketInstance.emit(event, data);
        }

        if (onConnect) {
          onConnect(socketInstance);
        }
      });

      // Connection failed
      socketInstance.on('connect_error', (err) => {
        console.error('Socket.io connection error:', err);
        setError(err);
        setIsConnected(false);
        
        if (onError) {
          onError(err);
        }
      });

      // Disconnected
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        setIsConnected(false);
        
        if (onDisconnect) {
          onDisconnect(reason);
        }
      });

      // Reconnection attempts
      socketInstance.on('reconnect_attempt', (attempt) => {
        console.log(`Socket.io reconnection attempt ${attempt}/${reconnectLimit}`);
        reconnectAttemptsRef.current = attempt;
      });

      socketInstance.on('reconnect', (attempt) => {
        console.log(`Socket.io reconnected after ${attempt} attempts`);
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('reconnect_failed', () => {
        console.error('Socket.io reconnection failed');
        setError(new Error('Reconnection failed'));
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
      return null;
    }
  }, [url, auth, transports, reconnectLimit, reconnectDelay, onConnect, onDisconnect, onError, onMessage, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push({ event, data });
      
      // Try to connect if not connected
      if (!socket && autoConnect) {
        connect();
      }
    }
  }, [socket, isConnected, autoConnect, connect]);

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

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket,
    isConnected,
    error,
    lastMessage,
    reconnectAttempts: reconnectAttemptsRef.current,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};

export default useSocketIO; 