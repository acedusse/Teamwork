import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useSocketIO from '../hooks/useWebSocket.js';

const WebSocketContext = createContext();

// Get WebSocket URL from environment or default to localhost
const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  return 'ws://localhost:3000';
};

export const WebSocketProvider = ({ children }) => {
  const [connectedUsers, setConnectedUsers] = useState(new Map());
  const [userPresence, setUserPresence] = useState(new Map());
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentUser, setCurrentUser] = useState({
    userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userName: localStorage.getItem('userName') || 'Anonymous User'
  });

  // Safely access environment variables in the browser
  const getEnvVariable = (name) => {
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[name];
    }
    // For Create React App and similar
    if (typeof window !== 'undefined' && window.__ENV && window.__ENV[name]) {
      return window.__ENV[name];
    }
    // Fallback
    return '';
  };

  // Socket.io connection
  const {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off
  } = useSocketIO(getWebSocketUrl(), {
    auth: {
      userId: currentUser.userId,
      userName: currentUser.userName,
      token: getEnvVariable('REACT_APP_WS_TOKEN')
    },
    autoConnect: true,
    onConnect: (socket) => {
      console.log('WebSocket connected successfully');
      // Update user presence to online
      updatePresence({ status: 'online', location: window.location.pathname });
    },
    onDisconnect: (reason) => {
      console.log('WebSocket disconnected:', reason);
      // Clear connected users on disconnect
      setConnectedUsers(new Map());
      setUserPresence(new Map());
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      addNotification({
        type: 'error',
        message: 'Connection error occurred',
        duration: 5000
      });
    }
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isConnected) {
        connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, connect]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // User joined
    const handleUserJoined = (data) => {
      setConnectedUsers(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          socketId: data.socketId,
          joinedAt: new Date().toISOString()
        });
        return updated;
      });

      addNotification({
        type: 'info',
        message: `${data.userName} joined the session`,
        duration: 3000
      });
    };

    // User left
    const handleUserLeft = (data) => {
      setConnectedUsers(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });

      setUserPresence(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });

      addNotification({
        type: 'info',
        message: `${data.userName} left the session`,
        duration: 3000
      });
    };

    // Presence updates
    const handlePresenceUpdate = (data) => {
      setUserPresence(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          userId: data.userId,
          userName: data.userName,
          ...data,
          updatedAt: new Date().toISOString()
        });
        return updated;
      });
    };

    // Notifications
    const handleNotification = (data) => {
      addNotification({
        type: data.type || 'info',
        message: data.message,
        fromUser: data.fromUserName,
        duration: data.duration || 5000,
        timestamp: data.timestamp
      });
    };

    // Server shutdown
    const handleServerShutdown = (data) => {
      addNotification({
        type: 'warning',
        message: data.message || 'Server is shutting down',
        duration: 10000
      });
    };

    // Register event listeners
    const cleanupFunctions = [
      on('userJoined', handleUserJoined),
      on('userLeft', handleUserLeft),
      on('presenceUpdate', handlePresenceUpdate),
      on('notification', handleNotification),
      on('serverShutdown', handleServerShutdown)
    ];

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [socket, on]);

  // Utility functions
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePresence = useCallback((presenceData) => {
    if (isConnected) {
      emit('presenceUpdate', {
        ...presenceData,
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, emit]);

  const sendNotification = useCallback((message, type = 'info') => {
    if (isConnected) {
      emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, emit]);

  const updateUserName = useCallback((newUserName) => {
    setCurrentUser(prev => ({ ...prev, userName: newUserName }));
    localStorage.setItem('userName', newUserName);
    
    // Reconnect with new user name
    if (isConnected) {
      disconnect();
      setTimeout(() => connect(), 1000);
    }
  }, [isConnected, disconnect, connect]);

  // Track location changes for presence
  useEffect(() => {
    if (isConnected) {
      updatePresence({ 
        status: 'online', 
        location: window.location.pathname,
        lastSeen: new Date().toISOString()
      });
    }
  }, [window.location.pathname, isConnected, updatePresence]);

  const contextValue = {
    // Connection state
    socket,
    isConnected,
    isOnline,
    error,
    
    // User data
    currentUser,
    connectedUsers: Array.from(connectedUsers.values()),
    userPresence: Array.from(userPresence.values()),
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Actions
    connect,
    disconnect,
    emit,
    on,
    off,
    updatePresence,
    sendNotification,
    updateUserName,
    
    // Utility functions for real-time features
    broadcastTaskUpdate: (taskData) => {
      if (isConnected) {
        emit('taskUpdate', {
          type: 'task_updated',
          ...taskData,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    sendCursorUpdate: (cursorData) => {
      if (isConnected) {
        emit('cursorUpdate', {
          ...cursorData,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    requestLock: (lockData) => {
      if (isConnected) {
        emit('requestLock', {
          ...lockData,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    releaseLock: (lockData) => {
      if (isConnected) {
        emit('releaseLock', {
          ...lockData,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    sendTypingIndicator: (typingData) => {
      if (isConnected) {
        emit('typing', {
          ...typingData,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext; 