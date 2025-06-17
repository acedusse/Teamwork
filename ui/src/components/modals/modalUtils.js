/**
 * Modal Utilities - Helper functions for modal components
 * 
 * Features:
 * - Focus management utilities
 * - Keyboard event handlers
 * - Modal state helpers
 * - Animation utilities
 * - Accessibility helpers
 */

// Focus management utilities
export const focusUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container) => {
    if (!container) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Create a focus trap within a container
   */
  createFocusTrap: (container, options = {}) => {
    const { 
      initialFocus = null,
      restoreFocus = true,
      allowOutsideClick = false 
    } = options;
    
    if (!container) return null;
    
    const focusableElements = focusUtils.getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const previouslyFocused = document.activeElement;
    
    // Set initial focus
    const initialElement = initialFocus || firstFocusable;
    if (initialElement) {
      setTimeout(() => initialElement.focus(), 0);
    }
    
    // Handle tab key
    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    // Handle click outside
    const handleClickOutside = (event) => {
      if (!allowOutsideClick && !container.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        firstFocusable?.focus();
      }
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('click', handleClickOutside, true);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('click', handleClickOutside, true);
      
      if (restoreFocus && previouslyFocused) {
        setTimeout(() => previouslyFocused.focus(), 0);
      }
    };
  },

  /**
   * Restore focus to previously focused element
   */
  restoreFocus: (element) => {
    if (element && typeof element.focus === 'function') {
      setTimeout(() => element.focus(), 100);
    }
  }
};

// Keyboard event utilities
export const keyboardUtils = {
  /**
   * Check if key is an action key (Enter, Space)
   */
  isActionKey: (event) => {
    return event.key === 'Enter' || event.key === ' ';
  },

  /**
   * Check if key is escape
   */
  isEscapeKey: (event) => {
    return event.key === 'Escape';
  },

  /**
   * Handle keyboard shortcuts for modals
   */
  handleModalKeyboard: (event, handlers = {}) => {
    const {
      onEscape,
      onEnter,
      onSpace,
      onTab,
      preventDefault = true
    } = handlers;
    
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault();
          onEscape(event);
        }
        break;
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault();
          onEnter(event);
        }
        break;
      case ' ':
        if (onSpace) {
          if (preventDefault) event.preventDefault();
          onSpace(event);
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(event);
        }
        break;
    }
  }
};

// Modal state utilities
export const modalStateUtils = {
  /**
   * Check if modal should be closeable
   */
  canClose: (state) => {
    const { isLoading, hasUnsavedChanges, forceOpen } = state;
    return !isLoading && !hasUnsavedChanges && !forceOpen;
  },

  /**
   * Get modal size based on content and screen size
   */
  getResponsiveSize: (contentSize, screenSize) => {
    if (screenSize === 'xs') return 'xs';
    if (screenSize === 'sm') return contentSize === 'lg' ? 'md' : contentSize;
    return contentSize;
  },

  /**
   * Generate unique modal ID
   */
  generateModalId: (prefix = 'modal') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Check if click is outside modal content
   */
  isClickOutside: (event, modalRef) => {
    return modalRef.current && !modalRef.current.contains(event.target);
  }
};

// Animation utilities
export const animationUtils = {
  /**
   * Default transition durations
   */
  durations: {
    fast: 150,
    normal: 225,
    slow: 300
  },

  /**
   * Easing functions
   */
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },

  /**
   * Create fade transition
   */
  createFadeTransition: (duration = animationUtils.durations.normal) => ({
    entering: { opacity: 0 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
    timeout: duration
  }),

  /**
   * Create slide transition
   */
  createSlideTransition: (direction = 'up', duration = animationUtils.durations.normal) => {
    const transforms = {
      up: 'translateY(100%)',
      down: 'translateY(-100%)',
      left: 'translateX(100%)',
      right: 'translateX(-100%)'
    };

    return {
      entering: { transform: transforms[direction] },
      entered: { transform: 'translateY(0)' },
      exiting: { transform: transforms[direction] },
      exited: { transform: transforms[direction] },
      timeout: duration
    };
  }
};

// Accessibility utilities
export const a11yUtils = {
  /**
   * Generate ARIA attributes for modal
   */
  getModalAriaProps: (options = {}) => {
    const {
      titleId,
      descriptionId,
      role = 'dialog',
      modal = true,
      labelledBy,
      describedBy
    } = options;

    return {
      role,
      'aria-modal': modal,
      'aria-labelledby': labelledBy || titleId,
      'aria-describedby': describedBy || descriptionId
    };
  },

  /**
   * Announce to screen readers
   */
  announce: (message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announcer.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};

// Validation utilities
export const validationUtils = {
  /**
   * Validate modal props
   */
  validateModalProps: (props) => {
    const warnings = [];
    
    if (props.open && !props.onClose) {
      warnings.push('Modal is open but no onClose handler provided');
    }
    
    if (props.title && !props.titleId) {
      warnings.push('Title provided but no titleId for accessibility');
    }
    
    if (props.children && !props.contentId) {
      warnings.push('Content provided but no contentId for accessibility');
    }
    
    return warnings;
  },

  /**
   * Check if modal configuration is valid
   */
  isValidConfig: (config) => {
    const required = ['open', 'onClose'];
    return required.every(prop => prop in config);
  }
};

// Performance utilities
export const performanceUtils = {
  /**
   * Debounce function for modal operations
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function for modal operations
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Export all utilities
export default {
  focus: focusUtils,
  keyboard: keyboardUtils,
  state: modalStateUtils,
  animation: animationUtils,
  a11y: a11yUtils,
  validation: validationUtils,
  performance: performanceUtils
}; 