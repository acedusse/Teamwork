import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext.jsx';

/**
 * Hook for managing collaborative editing locks
 * Provides functionality to request, release, and track locks on resources
 */
export const useCollaborativeLocks = () => {
  const { 
    socket, 
    isConnected, 
    currentUser, 
    on, 
    requestLock: socketRequestLock, 
    releaseLock: socketReleaseLock 
  } = useWebSocket();

  // Track all active locks
  const [activeLocks, setActiveLocks] = useState(new Map());
  
  // Track locks owned by current user
  const [ownedLocks, setOwnedLocks] = useState(new Set());
  
  // Track pending lock requests
  const [pendingRequests, setPendingRequests] = useState(new Map());
  
  // Lock timeout management
  const lockTimeouts = useRef(new Map());
  const LOCK_TIMEOUT = 30000; // 30 seconds default timeout
  const LOCK_EXTENSION_TIME = 15000; // Extend lock by 15 seconds

  /**
   * Generate a unique lock ID for a resource
   */
  const generateLockId = useCallback((resourceType, resourceId, field = null) => {
    return field ? `${resourceType}:${resourceId}:${field}` : `${resourceType}:${resourceId}`;
  }, []);

  /**
   * Check if a resource is locked
   */
  const isLocked = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    return activeLocks.has(lockId);
  }, [activeLocks, generateLockId]);

  /**
   * Check if current user owns a lock
   */
  const isLockedByCurrentUser = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    return ownedLocks.has(lockId);
  }, [ownedLocks, generateLockId]);

  /**
   * Get lock information for a resource
   */
  const getLockInfo = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    return activeLocks.get(lockId);
  }, [activeLocks, generateLockId]);

  /**
   * Check if a lock request is pending
   */
  const isPending = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    return pendingRequests.has(lockId);
  }, [pendingRequests, generateLockId]);

  /**
   * Request a lock on a resource
   */
  const requestLock = useCallback(async (resourceType, resourceId, field = null, timeout = LOCK_TIMEOUT) => {
    if (!isConnected || !currentUser) {
      throw new Error('Not connected or user not authenticated');
    }

    const lockId = generateLockId(resourceType, resourceId, field);
    
    // Check if already locked by current user
    if (isLockedByCurrentUser(resourceType, resourceId, field)) {
      return { success: true, lockId, alreadyOwned: true };
    }

    // Check if already locked by someone else
    if (isLocked(resourceType, resourceId, field)) {
      const lockInfo = getLockInfo(resourceType, resourceId, field);
      throw new Error(`Resource is locked by ${lockInfo.userName} until ${new Date(lockInfo.expiresAt).toLocaleTimeString()}`);
    }

    // Check if request is already pending
    if (isPending(resourceType, resourceId, field)) {
      throw new Error('Lock request already pending for this resource');
    }

    // Mark request as pending
    setPendingRequests(prev => new Map(prev).set(lockId, {
      lockId,
      resourceType,
      resourceId,
      field,
      requestedAt: Date.now(),
      timeout
    }));

    try {
      // Send lock request via WebSocket
      socketRequestLock({
        lockId,
        resourceType,
        resourceId,
        field,
        timeout,
        requestedAt: Date.now()
      });

      // Wait for lock confirmation or timeout
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          setPendingRequests(prev => {
            const updated = new Map(prev);
            updated.delete(lockId);
            return updated;
          });
          reject(new Error('Lock request timed out'));
        }, 5000); // 5 second timeout for lock request

        // Listen for lock granted
        const handleLockGranted = (data) => {
          if (data.lockId === lockId && data.userId === currentUser.userId) {
            clearTimeout(timeoutId);
            setPendingRequests(prev => {
              const updated = new Map(prev);
              updated.delete(lockId);
              return updated;
            });
            resolve({ success: true, lockId });
          }
        };

        // Listen for lock denied
        const handleLockDenied = (data) => {
          if (data.lockId === lockId) {
            clearTimeout(timeoutId);
            setPendingRequests(prev => {
              const updated = new Map(prev);
              updated.delete(lockId);
              return updated;
            });
            reject(new Error(data.reason || 'Lock request denied'));
          }
        };

        const cleanupGranted = on('lockGranted', handleLockGranted);
        const cleanupDenied = on('lockDenied', handleLockDenied);

        // Cleanup listeners when promise resolves/rejects
        Promise.resolve().then(() => {
          setTimeout(() => {
            cleanupGranted();
            cleanupDenied();
          }, 100);
        });
      });
    } catch (error) {
      setPendingRequests(prev => {
        const updated = new Map(prev);
        updated.delete(lockId);
        return updated;
      });
      throw error;
    }
  }, [
    isConnected, 
    currentUser, 
    generateLockId, 
    isLockedByCurrentUser, 
    isLocked, 
    getLockInfo, 
    isPending, 
    socketRequestLock, 
    on
  ]);

  /**
   * Release a lock on a resource
   */
  const releaseLock = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    
    if (!isLockedByCurrentUser(resourceType, resourceId, field)) {
      console.warn('Attempted to release lock not owned by current user:', lockId);
      return false;
    }

    // Clear timeout if exists
    if (lockTimeouts.current.has(lockId)) {
      clearTimeout(lockTimeouts.current.get(lockId));
      lockTimeouts.current.delete(lockId);
    }

    // Send release request
    socketReleaseLock({
      lockId,
      resourceType,
      resourceId,
      field,
      releasedAt: Date.now()
    });

    return true;
  }, [generateLockId, isLockedByCurrentUser, socketReleaseLock]);

  /**
   * Extend a lock timeout
   */
  const extendLock = useCallback((resourceType, resourceId, field = null) => {
    const lockId = generateLockId(resourceType, resourceId, field);
    
    if (!isLockedByCurrentUser(resourceType, resourceId, field)) {
      return false;
    }

    // Send extension request
    socketRequestLock({
      lockId,
      resourceType,
      resourceId,
      field,
      extend: true,
      extendedAt: Date.now()
    });

    return true;
  }, [generateLockId, isLockedByCurrentUser, socketRequestLock]);

  /**
   * Release all locks owned by current user
   */
  const releaseAllLocks = useCallback(() => {
    ownedLocks.forEach(lockId => {
      const [resourceType, resourceId, field] = lockId.split(':');
      releaseLock(resourceType, resourceId, field === 'undefined' ? null : field);
    });
  }, [ownedLocks, releaseLock]);

  /**
   * Set up automatic lock timeout
   */
  const setupLockTimeout = useCallback((lockId, timeout) => {
    if (lockTimeouts.current.has(lockId)) {
      clearTimeout(lockTimeouts.current.get(lockId));
    }

    const timeoutId = setTimeout(() => {
      const [resourceType, resourceId, field] = lockId.split(':');
      releaseLock(resourceType, resourceId, field === 'undefined' ? null : field);
    }, timeout);

    lockTimeouts.current.set(lockId, timeoutId);
  }, [releaseLock]);

  // Handle incoming lock events
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Handle lock requests from other users
    const handleLockRequested = (data) => {
      const { lockId, userId, userName, resourceType, resourceId, field } = data;
      
      // Check if resource is already locked
      if (activeLocks.has(lockId)) {
        // Send denial
        socket.emit('lockDenied', {
          lockId,
          reason: `Resource is already locked by ${activeLocks.get(lockId).userName}`,
          deniedBy: currentUser.userId
        });
        return;
      }

      // Grant the lock
      const lockInfo = {
        lockId,
        userId,
        userName,
        resourceType,
        resourceId,
        field,
        grantedAt: Date.now(),
        expiresAt: Date.now() + (data.timeout || LOCK_TIMEOUT)
      };

      setActiveLocks(prev => new Map(prev).set(lockId, lockInfo));

      // Notify the requester
      socket.emit('lockGranted', {
        lockId,
        ...lockInfo,
        grantedBy: currentUser.userId
      });
    };

    // Handle lock granted notifications
    const handleLockGranted = (data) => {
      const { lockId, userId } = data;
      
      // Update active locks
      setActiveLocks(prev => new Map(prev).set(lockId, data));
      
      // If this is our lock, add to owned locks
      if (userId === currentUser.userId) {
        setOwnedLocks(prev => new Set(prev).add(lockId));
        setupLockTimeout(lockId, data.expiresAt - Date.now());
      }
    };

    // Handle lock released notifications
    const handleLockReleased = (data) => {
      const { lockId, userId } = data;
      
      // Remove from active locks
      setActiveLocks(prev => {
        const updated = new Map(prev);
        updated.delete(lockId);
        return updated;
      });
      
      // If this was our lock, remove from owned locks
      if (userId === currentUser.userId) {
        setOwnedLocks(prev => {
          const updated = new Set(prev);
          updated.delete(lockId);
          return updated;
        });
        
        // Clear timeout
        if (lockTimeouts.current.has(lockId)) {
          clearTimeout(lockTimeouts.current.get(lockId));
          lockTimeouts.current.delete(lockId);
        }
      }
    };

    // Handle user disconnections - release their locks
    const handleUserLeft = (data) => {
      const { userId } = data;
      
      // Find and release locks owned by disconnected user
      const locksToRelease = [];
      activeLocks.forEach((lockInfo, lockId) => {
        if (lockInfo.userId === userId) {
          locksToRelease.push(lockId);
        }
      });
      
      locksToRelease.forEach(lockId => {
        setActiveLocks(prev => {
          const updated = new Map(prev);
          updated.delete(lockId);
          return updated;
        });
      });
    };

    // Register event listeners
    const cleanupFunctions = [
      on('lockRequested', handleLockRequested),
      on('lockGranted', handleLockGranted),
      on('lockReleased', handleLockReleased),
      on('userLeft', handleUserLeft)
    ];

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [socket, isConnected, currentUser, activeLocks, on, setupLockTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      lockTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      lockTimeouts.current.clear();
      
      // Release all owned locks
      releaseAllLocks();
    };
  }, [releaseAllLocks]);

  return {
    // State
    activeLocks: Array.from(activeLocks.values()),
    ownedLocks: Array.from(ownedLocks),
    pendingRequests: Array.from(pendingRequests.values()),
    
    // Lock management functions
    requestLock,
    releaseLock,
    extendLock,
    releaseAllLocks,
    
    // Query functions
    isLocked,
    isLockedByCurrentUser,
    getLockInfo,
    isPending,
    
    // Utilities
    generateLockId
  };
};

export default useCollaborativeLocks; 