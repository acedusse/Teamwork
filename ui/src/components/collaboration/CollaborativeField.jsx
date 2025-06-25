import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  TextareaAutosize,
  FormControl,
  FormLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import useCollaborativeLocks from '../../hooks/useCollaborativeLocks.js';
import { LockChip, LockOverlay } from './LockIndicator.jsx';

// Styled components for locked fields
const LockedFieldContainer = styled(Box)(({ theme, islocked }) => ({
  position: 'relative',
  ...(islocked === 'true' && {
    '& .MuiTextField-root': {
      '& .MuiInputBase-root': {
        backgroundColor: theme.palette.action.disabled,
        cursor: 'not-allowed',
      },
      '& .MuiInputBase-input': {
        cursor: 'not-allowed',
        userSelect: 'none',
      },
    },
  }),
}));

/**
 * Higher-order component that adds collaborative editing locks to form fields
 */
export const withCollaborativeLock = (WrappedComponent) => {
  const CollaborativeFieldWrapper = forwardRef(({
    resourceType,
    resourceId,
    field,
    lockTimeout = 30000,
    autoLock = false,
    showLockIndicator = true,
    lockIndicatorPosition = 'top-right',
    onLockGranted,
    onLockDenied,
    onLockReleased,
    disabled,
    readOnly,
    ...props
  }, ref) => {
    const {
      requestLock,
      releaseLock,
      isLocked,
      isLockedByCurrentUser,
      getLockInfo,
      isPending
    } = useCollaborativeLocks();

    const [lockError, setLockError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Generate lock info for display
    const lockInfo = getLockInfo(resourceType, resourceId, field);
    const locked = isLocked(resourceType, resourceId, field);
    const ownedByCurrentUser = isLockedByCurrentUser(resourceType, resourceId, field);
    const pending = isPending(resourceType, resourceId, field);

    /**
     * Request lock for editing
     */
    const handleRequestLock = useCallback(async () => {
      try {
        setLockError(null);
        const result = await requestLock(resourceType, resourceId, field, lockTimeout);
        setIsEditing(true);
        onLockGranted?.(result);
      } catch (error) {
        setLockError(error.message);
        onLockDenied?.(error);
      }
    }, [requestLock, resourceType, resourceId, field, lockTimeout, onLockGranted, onLockDenied]);

    /**
     * Release lock when done editing
     */
    const handleReleaseLock = useCallback(() => {
      try {
        releaseLock(resourceType, resourceId, field);
        setIsEditing(false);
        onLockReleased?.();
      } catch (error) {
        setLockError(error.message);
      }
    }, [releaseLock, resourceType, resourceId, field, onLockReleased]);

    /**
     * Handle field focus - request lock if auto-lock is enabled
     */
    const handleFocus = useCallback(async (event) => {
      if (autoLock && !locked && !pending) {
        await handleRequestLock();
      }
      props.onFocus?.(event);
    }, [autoLock, locked, pending, handleRequestLock, props]);

    /**
     * Handle field blur - release lock if auto-lock is enabled
     */
    const handleBlur = useCallback((event) => {
      if (autoLock && ownedByCurrentUser) {
        // Delay release to allow for quick re-focus
        setTimeout(() => {
          if (!isEditing) {
            handleReleaseLock();
          }
        }, 1000);
      }
      props.onBlur?.(event);
    }, [autoLock, ownedByCurrentUser, isEditing, handleReleaseLock, props]);

    /**
     * Handle value changes - extend lock if needed
     */
    const handleChange = useCallback((event) => {
      setIsEditing(true);
      props.onChange?.(event);
    }, [props]);

    // Auto-release lock on unmount
    useEffect(() => {
      return () => {
        if (ownedByCurrentUser) {
          releaseLock(resourceType, resourceId, field);
        }
      };
    }, [ownedByCurrentUser, releaseLock, resourceType, resourceId, field]);

    // Determine if field should be disabled
    const isFieldDisabled = disabled || readOnly || (locked && !ownedByCurrentUser);

    // Create enhanced lock info for indicators
    const enhancedLockInfo = lockInfo ? {
      ...lockInfo,
      ownedByCurrentUser,
      pending
    } : null;

    const lockIndicator = showLockIndicator && (
      <LockChip
        lockInfo={enhancedLockInfo}
        size="small"
        onRequestLock={handleRequestLock}
        onReleaseLock={handleReleaseLock}
        sx={{
          position: 'absolute',
          ...(lockIndicatorPosition === 'top-right' && {
            top: -8,
            right: -8,
            zIndex: 10
          }),
          ...(lockIndicatorPosition === 'top-left' && {
            top: -8,
            left: -8,
            zIndex: 10
          }),
          ...(lockIndicatorPosition === 'bottom-right' && {
            bottom: -8,
            right: -8,
            zIndex: 10
          }),
          ...(lockIndicatorPosition === 'bottom-left' && {
            bottom: -8,
            left: -8,
            zIndex: 10
          })
        }}
      />
    );

    return (
      <LockedFieldContainer islocked={isFieldDisabled.toString()}>
        <WrappedComponent
          {...props}
          ref={ref}
          disabled={isFieldDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        
        {lockIndicator}
        
        {/* Lock overlay for locked fields */}
        {locked && !ownedByCurrentUser && (
          <LockOverlay
            lockInfo={enhancedLockInfo}
            show={true}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 1
            }}
          >
            <Box />
          </LockOverlay>
        )}

        {/* Error notification */}
        <Snackbar
          open={!!lockError}
          autoHideDuration={6000}
          onClose={() => setLockError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setLockError(null)} 
            severity="error"
            variant="filled"
          >
            {lockError}
          </Alert>
        </Snackbar>
      </LockedFieldContainer>
    );
  });

  CollaborativeFieldWrapper.displayName = `withCollaborativeLock(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  CollaborativeFieldWrapper.propTypes = {
    resourceType: PropTypes.string.isRequired,
    resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    field: PropTypes.string,
    lockTimeout: PropTypes.number,
    autoLock: PropTypes.bool,
    showLockIndicator: PropTypes.bool,
    lockIndicatorPosition: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
    onLockGranted: PropTypes.func,
    onLockDenied: PropTypes.func,
    onLockReleased: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func
  };

  return CollaborativeFieldWrapper;
};

/**
 * Pre-wrapped collaborative TextField component
 */
export const CollaborativeTextField = withCollaborativeLock(TextField);

/**
 * Pre-wrapped collaborative TextareaAutosize component
 */
export const CollaborativeTextarea = withCollaborativeLock(TextareaAutosize);

/**
 * Collaborative form component that manages locks for multiple fields
 */
export const CollaborativeForm = ({
  resourceType,
  resourceId,
  children,
  autoLock = false,
  lockTimeout = 30000,
  onLockStateChange,
  ...props
}) => {
  const {
    activeLocks,
    ownedLocks,
    releaseAllLocks
  } = useCollaborativeLocks();



  // Track form-level lock state
  useEffect(() => {
    const formActiveLocks = activeLocks.filter(lock => 
      lock.resourceType === resourceType && lock.resourceId === resourceId
    );
    
    const formOwnedLocks = ownedLocks.filter(lockId => 
      lockId.startsWith(`${resourceType}:${resourceId}`)
    );



    onLockStateChange?.({
      activeLocks: formActiveLocks,
      ownedLocks: formOwnedLocks,
      hasActiveLocks: formActiveLocks.length > 0,
      hasOwnedLocks: formOwnedLocks.length > 0
    });
  }, [activeLocks, ownedLocks, resourceType, resourceId, onLockStateChange]);

  // Release all form locks on unmount
  useEffect(() => {
    return () => {
      releaseAllLocks();
    };
  }, [releaseAllLocks]);

  // Clone children and inject collaborative props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.field) {
      return React.cloneElement(child, {
        resourceType,
        resourceId,
        autoLock,
        lockTimeout,
        ...child.props
      });
    }
    return child;
  });

  return (
    <Box component="form" {...props}>
      {enhancedChildren}
    </Box>
  );
};

CollaborativeForm.propTypes = {
  resourceType: PropTypes.string.isRequired,
  resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node.isRequired,
  autoLock: PropTypes.bool,
  lockTimeout: PropTypes.number,
  onLockStateChange: PropTypes.func
};

/**
 * Hook for managing collaborative editing state in custom components
 */
export const useCollaborativeField = (resourceType, resourceId, field, options = {}) => {
  const {
    requestLock,
    releaseLock,
    isLocked,
    isLockedByCurrentUser,
    getLockInfo,
    isPending
  } = useCollaborativeLocks();

  const {
    lockTimeout = 30000,
    onLockGranted,
    onLockDenied,
    onLockReleased
  } = options;

  const [lockError, setLockError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const lockInfo = getLockInfo(resourceType, resourceId, field);
  const locked = isLocked(resourceType, resourceId, field);
  const ownedByCurrentUser = isLockedByCurrentUser(resourceType, resourceId, field);
  const pending = isPending(resourceType, resourceId, field);

  const handleRequestLock = useCallback(async () => {
    try {
      setLockError(null);
      const result = await requestLock(resourceType, resourceId, field, lockTimeout);
      setIsEditing(true);
      onLockGranted?.(result);
      return result;
    } catch (error) {
      setLockError(error.message);
      onLockDenied?.(error);
      throw error;
    }
  }, [requestLock, resourceType, resourceId, field, lockTimeout, onLockGranted, onLockDenied]);

  const handleReleaseLock = useCallback(() => {
    try {
      releaseLock(resourceType, resourceId, field);
      setIsEditing(false);
      onLockReleased?.();
    } catch (error) {
      setLockError(error.message);
    }
  }, [releaseLock, resourceType, resourceId, field, onLockReleased]);

  // Auto-release lock on unmount
  useEffect(() => {
    return () => {
      if (ownedByCurrentUser) {
        releaseLock(resourceType, resourceId, field);
      }
    };
  }, [ownedByCurrentUser, releaseLock, resourceType, resourceId, field]);

  return {
    // State
    lockInfo: lockInfo ? { ...lockInfo, ownedByCurrentUser, pending } : null,
    locked,
    ownedByCurrentUser,
    pending,
    isEditing,
    lockError,
    
    // Actions
    requestLock: handleRequestLock,
    releaseLock: handleReleaseLock,
    clearError: () => setLockError(null),
    
    // Computed
    canEdit: !locked || ownedByCurrentUser,
    isDisabled: locked && !ownedByCurrentUser
  };
};

export default withCollaborativeLock; 