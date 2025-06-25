import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';

// Import all modal components
import {
  AgentModal,
  SessionModal,
  TaskModal,
  DependencyModal,
  ConfirmationModal,
  ErrorModal,
  LoadingModal,
  FormModal,
  InfoModal,
  SuccessModal,
  ProgressModal,
  MultiStepModal
} from './index';

/**
 * ModalManager - Centralized modal management system
 * 
 * Features:
 * - Global modal state management
 * - Deep linking support for modal states
 * - Modal history and navigation
 * - Data synchronization with main application state
 * - Performance optimization (lazy loading, code splitting)
 * - Notification system integration
 * - Cross-component modal triggering
 */

// Modal types registry
const MODAL_TYPES = {
  AGENT: 'agent',
  SESSION: 'session',
  TASK: 'task',
  DEPENDENCY: 'dependency',
  CONFIRMATION: 'confirmation',
  ERROR: 'error',
  LOADING: 'loading',
  FORM: 'form',
  INFO: 'info',
  SUCCESS: 'success',
  PROGRESS: 'progress',
  MULTI_STEP: 'multiStep'
};

// Modal configuration registry
const MODAL_CONFIGS = {
  [MODAL_TYPES.AGENT]: {
    component: AgentModal,
    defaultProps: {
      maxWidth: 'md',
      fullWidth: true,
      onSave: (agentData) => console.log('Agent saved:', agentData)
    },
    deepLinkPath: '/modals/agent',
    title: 'Agent Configuration'
  },
  [MODAL_TYPES.SESSION]: {
    component: SessionModal,
    defaultProps: {
      maxWidth: 'lg',
      fullWidth: true
    },
    deepLinkPath: '/modals/session',
    title: 'Session Management'
  },
  [MODAL_TYPES.TASK]: {
    component: TaskModal,
    defaultProps: {
      maxWidth: 'xl',
      fullWidth: true
    },
    deepLinkPath: '/modals/task',
    title: 'Task Management'
  },
  [MODAL_TYPES.DEPENDENCY]: {
    component: DependencyModal,
    defaultProps: {
      maxWidth: 'xl',
      fullWidth: true
    },
    deepLinkPath: '/modals/dependency',
    title: 'Dependency Management'
  },
  [MODAL_TYPES.CONFIRMATION]: {
    component: ConfirmationModal,
    defaultProps: {
      maxWidth: 'sm',
      fullWidth: false
    },
    deepLinkPath: '/modals/confirm',
    title: 'Confirmation'
  },
  [MODAL_TYPES.ERROR]: {
    component: ErrorModal,
    defaultProps: {
      maxWidth: 'md',
      fullWidth: true
    },
    deepLinkPath: '/modals/error',
    title: 'Error'
  },
  [MODAL_TYPES.LOADING]: {
    component: LoadingModal,
    defaultProps: {
      maxWidth: 'sm',
      fullWidth: false
    },
    deepLinkPath: '/modals/loading',
    title: 'Loading'
  },
  [MODAL_TYPES.FORM]: {
    component: FormModal,
    defaultProps: {
      maxWidth: 'md',
      fullWidth: true
    },
    deepLinkPath: '/modals/form',
    title: 'Form'
  },
  [MODAL_TYPES.INFO]: {
    component: InfoModal,
    defaultProps: {
      maxWidth: 'md',
      fullWidth: true
    },
    deepLinkPath: '/modals/info',
    title: 'Information'
  },
  [MODAL_TYPES.SUCCESS]: {
    component: SuccessModal,
    defaultProps: {
      maxWidth: 'sm',
      fullWidth: false
    },
    deepLinkPath: '/modals/success',
    title: 'Success'
  },
  [MODAL_TYPES.PROGRESS]: {
    component: ProgressModal,
    defaultProps: {
      maxWidth: 'sm',
      fullWidth: false
    },
    deepLinkPath: '/modals/progress',
    title: 'Progress'
  },
  [MODAL_TYPES.MULTI_STEP]: {
    component: MultiStepModal,
    defaultProps: {
      maxWidth: 'lg',
      fullWidth: true
    },
    deepLinkPath: '/modals/wizard',
    title: 'Multi-Step Process'
  }
};

// Modal Context
const ModalContext = createContext();

// Modal Manager Provider Component
export const ModalManagerProvider = ({ 
  children, 
  enableDeepLinking = true,
  enableHistory = true,
  enableNotifications = true,
  maxStackSize = 10,
  defaultNotificationDuration = 6000
}) => {
  // Core modal state
  const [modalStack, setModalStack] = useState([]);
  const [modalData, setModalData] = useState({});
  const [modalHistory, setModalHistory] = useState([]);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState({
    openTimes: {},
    renderTimes: {},
    interactionCounts: {}
  });

  // Router integration
  const location = useLocation();
  const navigate = useNavigate();

  // Generate unique modal ID
  const generateModalId = useCallback(() => {
    return `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Open modal function
  const openModal = useCallback((type, props = {}, options = {}) => {
    const {
      id = generateModalId(),
      data = null,
      replace = false,
      enableDeepLink = enableDeepLinking,
      priority = 0
    } = options;

    const modalConfig = MODAL_CONFIGS[type];
    if (!modalConfig) {
      console.error(`Unknown modal type: ${type}`);
      return null;
    }

    const modalInstance = {
      id,
      type,
      props: {
        ...modalConfig.defaultProps,
        ...props,
        open: true,
        onClose: () => closeModal(id)
      },
      data,
      config: modalConfig,
      openedAt: Date.now(),
      priority
    };

    // Performance tracking
    setPerformanceMetrics(prev => ({
      ...prev,
      openTimes: {
        ...prev.openTimes,
        [type]: Date.now()
      },
      interactionCounts: {
        ...prev.interactionCounts,
        [type]: (prev.interactionCounts[type] || 0) + 1
      }
    }));

    // Update modal stack
    setModalStack(prev => {
      let newStack;
      if (replace && prev.length > 0) {
        // Replace the top modal
        newStack = [...prev.slice(0, -1), modalInstance];
      } else {
        // Add to stack
        newStack = [...prev, modalInstance];
        
        // Enforce max stack size
        if (newStack.length > maxStackSize) {
          newStack = newStack.slice(-maxStackSize);
        }
      }
      
      // Sort by priority (higher priority on top)
      return newStack.sort((a, b) => a.priority - b.priority);
    });

    // Store modal data
    setModalData(prev => ({
      ...prev,
      [id]: data
    }));

    // Add to history
    if (enableHistory) {
      setModalHistory(prev => [...prev, {
        id,
        type,
        openedAt: Date.now(),
        data
      }]);
    }

    // Deep linking
    if (enableDeepLink && modalConfig.deepLinkPath) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('modal', type);
      if (data && typeof data === 'object') {
        searchParams.set('modalData', JSON.stringify(data));
      }
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }

    return id;
  }, [
    generateModalId, 
    enableDeepLinking, 
    enableHistory, 
    maxStackSize, 
    location, 
    navigate
  ]);

  // Close modal function
  const closeModal = useCallback((modalId, result = null) => {
    setModalStack(prev => {
      const modalIndex = prev.findIndex(m => m.id === modalId);
      if (modalIndex === -1) return prev;

      const modal = prev[modalIndex];
      
      // Performance tracking
      setPerformanceMetrics(prevMetrics => ({
        ...prevMetrics,
        renderTimes: {
          ...prevMetrics.renderTimes,
          [modal.type]: Date.now() - modal.openedAt
        }
      }));

      // Call original onClose if provided
      if (modal.props.originalOnClose) {
        modal.props.originalOnClose(result);
      }

      return prev.filter(m => m.id !== modalId);
    });

    // Clean up modal data
    setModalData(prev => {
      const newData = { ...prev };
      delete newData[modalId];
      return newData;
    });

    // Update URL if this was the last modal
    setModalStack(currentStack => {
      const updatedStack = currentStack.filter(m => m.id !== modalId);
      
      if (updatedStack.length === 0 && enableDeepLinking) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete('modal');
        searchParams.delete('modalData');
        const newSearch = searchParams.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      }
      
      return updatedStack;
    });
  }, [enableDeepLinking, location, navigate]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    modalStack.forEach(modal => closeModal(modal.id));
  }, [modalStack, closeModal]);

  // Update modal data
  const updateModalData = useCallback((modalId, newData) => {
    setModalData(prev => ({
      ...prev,
      [modalId]: {
        ...prev[modalId],
        ...newData
      }
    }));
  }, []);

  // Get modal data
  const getModalData = useCallback((modalId) => {
    return modalData[modalId];
  }, [modalData]);

  // Show notification
  const showNotification = useCallback((message, severity = 'info', duration = defaultNotificationDuration) => {
    const notification = {
      id: generateModalId(),
      message,
      severity,
      duration,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, duration);
    }

    return notification.id;
  }, [generateModalId, defaultNotificationDuration]);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Deep linking effect
  useEffect(() => {
    if (!enableDeepLinking) return;

    const searchParams = new URLSearchParams(location.search);
    const modalType = searchParams.get('modal');
    const modalDataParam = searchParams.get('modalData');

    if (modalType && MODAL_TYPES[modalType.toUpperCase()]) {
      let data = null;
      if (modalDataParam) {
        try {
          data = JSON.parse(modalDataParam);
        } catch (e) {
          console.warn('Failed to parse modal data from URL:', e);
        }
      }

      // Only open if not already open
      const isAlreadyOpen = modalStack.some(m => m.type === modalType);
      if (!isAlreadyOpen) {
        openModal(modalType, {}, { data, enableDeepLink: false });
      }
    }
  }, [location.search, enableDeepLinking, modalStack, openModal]);

  // Convenience methods for specific modal types
  const modalMethods = useMemo(() => ({
    // Agent modal
    openAgent: (props, options) => openModal(MODAL_TYPES.AGENT, props, options),
    
    // Session modal
    openSession: (props, options) => openModal(MODAL_TYPES.SESSION, props, options),
    
    // Task modal
    openTask: (props, options) => openModal(MODAL_TYPES.TASK, props, options),
    
    // Dependency modal
    openDependency: (props, options) => openModal(MODAL_TYPES.DEPENDENCY, props, options),
    
    // Confirmation modal
    confirm: (message, options = {}) => {
      return new Promise((resolve) => {
        openModal(MODAL_TYPES.CONFIRMATION, {
          message,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          ...options
        });
      });
    },
    
    // Error modal
    showError: (error, options = {}) => {
      return openModal(MODAL_TYPES.ERROR, {
        error,
        ...options
      });
    },
    
    // Loading modal
    showLoading: (message, options = {}) => {
      return openModal(MODAL_TYPES.LOADING, {
        message,
        ...options
      });
    },
    
    // Info modal
    showInfo: (content, options = {}) => {
      return openModal(MODAL_TYPES.INFO, {
        content,
        ...options
      });
    },
    
    // Success modal
    showSuccess: (message, options = {}) => {
      return openModal(MODAL_TYPES.SUCCESS, {
        message,
        ...options
      });
    },
    
    // Form modal
    openForm: (props, options) => openModal(MODAL_TYPES.FORM, props, options),
    
    // Multi-step modal
    openWizard: (steps, options = {}) => {
      return openModal(MODAL_TYPES.MULTI_STEP, {
        steps,
        ...options
      });
    }
  }), [openModal]);

  // Context value
  const contextValue = useMemo(() => ({
    // State
    modalStack,
    modalData,
    modalHistory,
    notifications,
    performanceMetrics,
    
    // Core methods
    openModal,
    closeModal,
    closeAllModals,
    updateModalData,
    getModalData,
    
    // Notification methods
    showNotification,
    removeNotification,
    
    // Convenience methods
    ...modalMethods,
    
    // Utilities
    isModalOpen: (type) => modalStack.some(m => m.type === type),
    getOpenModals: () => modalStack,
    getCurrentModal: () => modalStack[modalStack.length - 1] || null,
    getModalCount: () => modalStack.length,
    
    // Constants
    MODAL_TYPES
  }), [
    modalStack,
    modalData,
    modalHistory,
    notifications,
    performanceMetrics,
    openModal,
    closeModal,
    closeAllModals,
    updateModalData,
    getModalData,
    showNotification,
    removeNotification,
    modalMethods
  ]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Render modal stack */}
      {modalStack.map((modal) => {
        const ModalComponent = modal.config.component;
        return (
          <ModalComponent
            key={modal.id}
            {...modal.props}
            modalId={modal.id}
            modalData={modalData[modal.id]}
            onUpdateData={(newData) => updateModalData(modal.id, newData)}
          />
        );
      })}
      
      {/* Notification system */}
      {enableNotifications && notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </ModalContext.Provider>
  );
};

// Hook to use modal manager
export const useModalManager = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalManager must be used within a ModalManagerProvider');
  }
  return context;
};

// HOC for components that need modal access
export const withModalManager = (Component) => {
  return function ModalManagerWrappedComponent(props) {
    const modalManager = useModalManager();
    return <Component {...props} modalManager={modalManager} />;
  };
};

// Export modal types for external use
export { MODAL_TYPES };

export default ModalManagerProvider; 