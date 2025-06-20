import { useCallback, useEffect, useState } from 'react';
import { useModalManager } from '../components/modals';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * useModalIntegration - Custom hook for easy modal integration
 * 
 * Features:
 * - Simplified modal opening/closing
 * - Deep linking support
 * - Data synchronization
 * - Performance tracking
 * - Event handling
 */
export const useModalIntegration = (options = {}) => {
  const {
    enableDeepLinking = true,
    enableHistory = true,
    trackPerformance = true,
    autoCloseOnRouteChange = true
  } = options;

  const modalManager = useModalManager();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for tracking modal interactions
  const [modalInteractions, setModalInteractions] = useState({});
  const [lastOpenedModal, setLastOpenedModal] = useState(null);

  // Enhanced modal opening with tracking
  const openModalWithTracking = useCallback((type, props = {}, options = {}) => {
    const startTime = performance.now();
    
    const modalId = modalManager.openModal(type, {
      ...props,
      onClose: (...args) => {
        // Track close time
        if (trackPerformance) {
          const endTime = performance.now();
          setModalInteractions(prev => ({
            ...prev,
            [modalId]: {
              ...prev[modalId],
              closeTime: endTime,
              duration: endTime - startTime
            }
          }));
        }
        
        // Call original onClose if provided
        if (props.onClose) {
          props.onClose(...args);
        }
      }
    }, options);

    // Track opening
    if (trackPerformance) {
      setModalInteractions(prev => ({
        ...prev,
        [modalId]: {
          type,
          openTime: startTime,
          interactions: 0
        }
      }));
    }

    setLastOpenedModal({ id: modalId, type, timestamp: Date.now() });
    
    return modalId;
  }, [modalManager, trackPerformance]);

  // Track modal interactions
  const trackInteraction = useCallback((modalId, interactionType, data = {}) => {
    if (!trackPerformance) return;
    
    setModalInteractions(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        interactions: (prev[modalId]?.interactions || 0) + 1,
        lastInteraction: {
          type: interactionType,
          timestamp: Date.now(),
          data
        }
      }
    }));
  }, [trackPerformance]);

  // Convenience methods for common modal operations
  const modalActions = {
    // Task management
    createTask: (taskData = {}) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.TASK, {
        mode: 'create',
        initialData: taskData,
        title: 'Create New Task'
      });
    },

    editTask: (task) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.TASK, {
        mode: 'edit',
        task,
        title: `Edit Task: ${task.title}`
      });
    },

    viewTask: (task) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.TASK, {
        mode: 'view',
        task,
        title: `Task Details: ${task.title}`,
        readOnly: true
      });
    },

    // Agent management
    configureAgent: (agent = {}) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.AGENT, {
        agent,
        title: agent.id ? 'Configure Agent' : 'Create New Agent'
      });
    },

    // Session management
    manageSession: (session = {}) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.SESSION, {
        session,
        title: session.id ? 'Manage Session' : 'Create New Session'
      });
    },

    // Dependency management
    manageDependencies: (tasks = [], selectedTaskId = null) => {
      return openModalWithTracking(modalManager.MODAL_TYPES.DEPENDENCY, {
        tasks,
        selectedTaskId,
        title: 'Manage Dependencies'
      });
    },

    // Confirmation dialogs
    confirmAction: (message, options = {}) => {
      return modalManager.confirm(message, {
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        ...options
      });
    },

    confirmDelete: (itemName, options = {}) => {
      return modalManager.confirm(
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        {
          type: 'delete',
          destructive: true,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          ...options
        }
      );
    },

    // Error handling
    showError: (error, options = {}) => {
      const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
      return modalManager.showError(errorMessage, {
        showRetry: true,
        showReport: true,
        ...options
      });
    },

    // Loading states
    showLoading: (message = 'Loading...', options = {}) => {
      return modalManager.showLoading(message, {
        showCancel: false,
        ...options
      });
    },

    // Success messages
    showSuccess: (message, options = {}) => {
      return modalManager.showSuccess(message, {
        autoClose: true,
        duration: 3000,
        ...options
      });
    },

    // Info messages
    showInfo: (content, options = {}) => {
      return modalManager.showInfo(content, {
        type: 'info',
        ...options
      });
    }
  };

  // Deep linking effect
  useEffect(() => {
    if (!enableDeepLinking) return;

    const searchParams = new URLSearchParams(location.search);
    const modalParam = searchParams.get('modal');
    const modalDataParam = searchParams.get('modalData');

    if (modalParam && modalManager.MODAL_TYPES[modalParam.toUpperCase()]) {
      let modalData = null;
      if (modalDataParam) {
        try {
          modalData = JSON.parse(modalDataParam);
        } catch (e) {
          console.warn('Failed to parse modal data from URL:', e);
        }
      }

      // Open modal based on URL parameters
      const modalType = modalManager.MODAL_TYPES[modalParam.toUpperCase()];
      if (!modalManager.isModalOpen(modalType)) {
        openModalWithTracking(modalType, {}, { data: modalData });
      }
    }
  }, [location.search, enableDeepLinking, modalManager, openModalWithTracking]);

  // Auto-close modals on route change
  useEffect(() => {
    if (autoCloseOnRouteChange && modalManager.getModalCount() > 0) {
      // Close all modals when navigating to a different route
      modalManager.closeAllModals();
    }
  }, [location.pathname, autoCloseOnRouteChange, modalManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (modalManager.getModalCount() > 0) {
        modalManager.closeAllModals();
      }
    };
  }, [modalManager]);

  return {
    // Modal manager instance
    modalManager,
    
    // Enhanced methods
    openModal: openModalWithTracking,
    trackInteraction,
    
    // Convenience methods
    ...modalActions,
    
    // State
    modalInteractions,
    lastOpenedModal,
    isAnyModalOpen: modalManager.getModalCount() > 0,
    openModalCount: modalManager.getModalCount(),
    currentModal: modalManager.getCurrentModal(),
    
    // Utilities
    closeAllModals: modalManager.closeAllModals,
    getPerformanceMetrics: () => modalInteractions,
    
    // Deep linking utilities
    createModalLink: (modalType, data = null) => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('modal', modalType);
      if (data) {
        searchParams.set('modalData', JSON.stringify(data));
      }
      return `${location.pathname}?${searchParams.toString()}`;
    },
    
    clearModalFromUrl: () => {
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('modal');
      searchParams.delete('modalData');
      const newSearch = searchParams.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  };
};

export default useModalIntegration; 