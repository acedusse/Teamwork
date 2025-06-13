import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for detecting online/offline status
 * Uses navigator.onLine and online/offline events for real-time network detection
 * @param {Object} options - Configuration options
 * @param {number} options.checkInterval - Interval to periodically check connectivity (ms)
 * @param {string} options.testUrl - URL to test actual connectivity (optional)
 * @param {Function} options.onOnline - Callback when going online
 * @param {Function} options.onOffline - Callback when going offline
 * @returns {Object} Online status and utilities
 */
export const useOfflineStatus = ({
  checkInterval = 30000, // Check every 30 seconds
  testUrl = null,
  onOnline = null,
  onOffline = null
} = {}) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [connectionType, setConnectionType] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Detect connection type if available
  const detectConnectionType = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType({
          type: connection.effectiveType || connection.type,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }
    }
  }, []);

  // Test actual connectivity by making a request
  const testConnectivity = useCallback(async () => {
    if (!testUrl) return navigator.onLine;
    
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [testUrl]);

  // Handle online event
  const handleOnline = useCallback(async () => {
    let actuallyOnline = true;
    
    if (testUrl) {
      actuallyOnline = await testConnectivity();
    }
    
    if (actuallyOnline) {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      detectConnectionType();
      
      if (onOnline) {
        onOnline();
      }
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('connectivity-restored', {
        detail: { timestamp: Date.now() }
      }));
    }
  }, [testUrl, testConnectivity, detectConnectionType, onOnline]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    
    if (onOffline) {
      onOffline();
    }
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('connectivity-lost', {
      detail: { timestamp: Date.now() }
    }));
  }, [onOffline]);

  // Manual connectivity check
  const checkConnectivity = useCallback(async () => {
    const navigatorOnline = navigator.onLine;
    let actuallyOnline = navigatorOnline;
    
    if (testUrl && navigatorOnline) {
      actuallyOnline = await testConnectivity();
    }
    
    if (actuallyOnline !== isOnline) {
      if (actuallyOnline) {
        handleOnline();
      } else {
        handleOffline();
      }
    }
    
    return actuallyOnline;
  }, [testUrl, testConnectivity, isOnline, handleOnline, handleOffline]);

  // Set up event listeners and periodic checks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection type detection
    detectConnectionType();
    
    // Set up periodic connectivity check
    let intervalId = null;
    if (checkInterval > 0) {
      intervalId = setInterval(checkConnectivity, checkInterval);
    }
    
    // Listen for connection changes
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', detectConnectionType);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', detectConnectionType);
        }
      }
    };
  }, [handleOnline, handleOffline, detectConnectionType, checkConnectivity, checkInterval]);

  // Calculate time since last online
  const getOfflineDuration = useCallback(() => {
    if (isOnline) return 0;
    return Date.now() - lastOnlineTime;
  }, [isOnline, lastOnlineTime]);

  // Format offline duration for display
  const formatOfflineDuration = useCallback(() => {
    const duration = getOfflineDuration();
    if (duration === 0) return null;
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, [getOfflineDuration]);

  return {
    // Status
    isOnline,
    isOffline: !isOnline,
    isChecking,
    lastOnlineTime,
    connectionType,
    
    // Computed values
    offlineDuration: getOfflineDuration(),
    offlineDurationFormatted: formatOfflineDuration(),
    
    // Actions
    checkConnectivity,
    
    // Connection quality helpers
    isSlowConnection: connectionType?.type === 'slow-2g' || connectionType?.type === '2g',
    isFastConnection: connectionType?.type === '4g' || connectionType?.downlink > 10,
    saveDataEnabled: connectionType?.saveData || false
  };
};

// Higher-order component wrapper for class components
export const withOfflineStatus = (WrappedComponent) => {
  return function WithOfflineStatusComponent(props) {
    const offlineStatus = useOfflineStatus();
    return <WrappedComponent {...props} offlineStatus={offlineStatus} />;
  };
};

export default useOfflineStatus; 