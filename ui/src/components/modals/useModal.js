import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useModal - Custom hook for managing modal state and behavior
 * 
 * Features:
 * - Modal open/close state management
 * - Data passing between modal and parent
 * - Loading and error state management
 * - Auto-close functionality
 * - Focus management
 * - Event callbacks
 */
const useModal = (initialState = {}) => {
  const {
    defaultOpen = false,
    defaultData = null,
    autoCloseDelay = null,
    onOpen: onOpenCallback,
    onClose: onCloseCallback,
    onDataChange: onDataChangeCallback
  } = initialState;

  // State
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Refs
  const autoCloseTimeoutRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  // Clear auto-close timeout
  const clearAutoCloseTimeout = useCallback(() => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  }, []);

  // Open modal
  const open = useCallback((modalData = null) => {
    // Store currently focused element for restoration
    lastFocusedElementRef.current = document.activeElement;
    
    setIsOpen(true);
    setData(modalData);
    setError(null);
    setResult(null);
    
    // Call onOpen callback
    if (onOpenCallback) {
      onOpenCallback(modalData);
    }
  }, [onOpenCallback]);

  // Close modal
  const close = useCallback((reason = 'manual', closeResult = null) => {
    clearAutoCloseTimeout();
    
    setIsOpen(false);
    setIsLoading(false);
    setError(null);
    
    if (closeResult !== null) {
      setResult(closeResult);
    }
    
    // Restore focus
    if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === 'function') {
      setTimeout(() => {
        lastFocusedElementRef.current.focus();
      }, 100);
    }
    
    // Call onClose callback
    if (onCloseCallback) {
      onCloseCallback(reason, closeResult, data);
    }
  }, [onCloseCallback, data, clearAutoCloseTimeout]);

  // Toggle modal
  const toggle = useCallback((modalData = null) => {
    if (isOpen) {
      close('toggle');
    } else {
      open(modalData);
    }
  }, [isOpen, open, close]);

  // Update modal data
  const updateData = useCallback((newData) => {
    setData(prevData => {
      const updatedData = typeof newData === 'function' ? newData(prevData) : newData;
      
      // Call onDataChange callback
      if (onDataChangeCallback) {
        onDataChangeCallback(updatedData, prevData);
      }
      
      return updatedData;
    });
  }, [onDataChangeCallback]);

  // Set loading state
  const setLoadingState = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  // Set error state
  const setErrorState = useCallback((errorValue) => {
    setError(errorValue);
    setIsLoading(false);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-close functionality
  const autoClose = useCallback((delay = autoCloseDelay) => {
    if (delay && delay > 0) {
      clearAutoCloseTimeout();
      autoCloseTimeoutRef.current = setTimeout(() => {
        close('autoClose');
      }, delay);
    }
  }, [autoCloseDelay, close, clearAutoCloseTimeout]);

  // Handle async operations
  const handleAsync = useCallback(async (asyncOperation, options = {}) => {
    const {
      loadingMessage = 'Processing...',
      successMessage = 'Operation completed successfully',
      errorMessage = 'An error occurred',
      autoCloseOnSuccess = false,
      autoCloseDelay: customAutoCloseDelay = 2000
    } = options;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await asyncOperation(data);
      
      setIsLoading(false);
      setResult(result);
      
      if (autoCloseOnSuccess) {
        autoClose(customAutoCloseDelay);
      }
      
      return result;
    } catch (error) {
      setIsLoading(false);
      setError({
        message: error.message || errorMessage,
        details: error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [data, autoClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoCloseTimeout();
    };
  }, [clearAutoCloseTimeout]);

  // Modal handlers for common patterns
  const handlers = {
    onClose: close,
    onCancel: () => close('cancel'),
    onConfirm: (confirmResult) => close('confirm', confirmResult),
    onSubmit: (submitResult) => close('submit', submitResult),
    onError: setErrorState,
    onRetry: clearError
  };

  return {
    // State
    isOpen,
    data,
    isLoading,
    error,
    result,
    
    // Actions
    open,
    close,
    toggle,
    updateData,
    setLoadingState,
    setErrorState,
    clearError,
    autoClose,
    handleAsync,
    
    // Handlers (for common modal patterns)
    handlers,
    
    // Utilities
    isError: !!error,
    hasData: data !== null && data !== undefined,
    canClose: !isLoading
  };
};

export default useModal; 