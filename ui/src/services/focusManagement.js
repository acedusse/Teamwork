// Focus Management Service
// Handles keyboard navigation, focus trapping, and accessibility patterns

class FocusManagementService {
  constructor() {
    this.focusTrapStack = [];
    this.lastFocusedElement = null;
    this.focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex^="-"])'
    ].join(',');
    
    this.boundHandleFocusTrap = this.handleFocusTrap.bind(this);
    this.boundHandleArrowNavigation = this.handleArrowNavigation.bind(this);
  }

  /**
   * Get all focusable elements within a container
   * @param {Element} container - Container element to search within
   * @returns {Element[]} Array of focusable elements
   */
  getFocusableElements(container = document) {
    const elements = Array.from(container.querySelectorAll(this.focusableSelectors));
    return elements.filter(element => {
      return !element.hasAttribute('disabled') && 
             !element.hasAttribute('hidden') && 
             element.offsetParent !== null &&
             window.getComputedStyle(element).visibility !== 'hidden';
    });
  }

  /**
   * Create a focus trap within a container (for modals, dialogs, etc.)
   * @param {Element} container - Container element to trap focus within
   * @param {Object} options - Configuration options
   */
  createFocusTrap(container, options = {}) {
    const {
      initialFocus = null,
      restoreFocus = true,
      allowOutsideClick = false,
      escapeCallback = null
    } = options;

    // Store the currently focused element to restore later
    if (restoreFocus) {
      this.lastFocusedElement = document.activeElement;
    }

    const trap = {
      container,
      initialFocus,
      restoreFocus,
      allowOutsideClick,
      escapeCallback,
      focusableElements: this.getFocusableElements(container),
      isActive: true
    };

    // Add to focus trap stack
    this.focusTrapStack.push(trap);

    // Set initial focus
    this.setInitialFocus(trap);

    // Add event listeners
    document.addEventListener('keydown', this.boundHandleFocusTrap, true);
    document.addEventListener('click', this.handleTrapClick.bind(this), true);

    return trap;
  }

  /**
   * Remove the most recent focus trap
   */
  removeFocusTrap() {
    const trap = this.focusTrapStack.pop();
    
    if (!trap) return;

    trap.isActive = false;

    // If no more traps, remove event listeners
    if (this.focusTrapStack.length === 0) {
      document.removeEventListener('keydown', this.boundHandleFocusTrap, true);
      document.removeEventListener('click', this.handleTrapClick.bind(this), true);
    }

    // Restore focus to the previously focused element
    if (trap.restoreFocus && this.lastFocusedElement) {
      // Use setTimeout to ensure the element is available
      setTimeout(() => {
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
          this.lastFocusedElement.focus();
        }
        this.lastFocusedElement = null;
      }, 0);
    }
  }

  /**
   * Set initial focus for a focus trap
   * @param {Object} trap - Focus trap object
   */
  setInitialFocus(trap) {
    let elementToFocus = null;

    if (trap.initialFocus) {
      if (typeof trap.initialFocus === 'string') {
        elementToFocus = trap.container.querySelector(trap.initialFocus);
      } else if (trap.initialFocus instanceof Element) {
        elementToFocus = trap.initialFocus;
      }
    }

    // Fallback to first focusable element
    if (!elementToFocus && trap.focusableElements.length > 0) {
      elementToFocus = trap.focusableElements[0];
    }

    if (elementToFocus) {
      setTimeout(() => elementToFocus.focus(), 0);
    }
  }

  /**
   * Handle focus trap keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleFocusTrap(event) {
    const activeTrap = this.focusTrapStack[this.focusTrapStack.length - 1];
    
    if (!activeTrap || !activeTrap.isActive) return;

    // Handle Escape key
    if (event.key === 'Escape') {
      event.preventDefault();
      if (activeTrap.escapeCallback) {
        activeTrap.escapeCallback();
      } else {
        this.removeFocusTrap();
      }
      return;
    }

    // Handle Tab navigation
    if (event.key === 'Tab') {
      this.handleTabNavigation(event, activeTrap);
    }
  }

  /**
   * Handle Tab navigation within focus trap
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} trap - Focus trap object
   */
  handleTabNavigation(event, trap) {
    const { focusableElements } = trap;
    
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const currentIndex = focusableElements.indexOf(document.activeElement);
    let nextIndex;

    if (event.shiftKey) {
      // Shift+Tab - go to previous element
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      // Tab - go to next element
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }

    event.preventDefault();
    focusableElements[nextIndex].focus();
  }

  /**
   * Handle clicks within focus trap
   * @param {MouseEvent} event - Mouse event
   */
  handleTrapClick(event) {
    const activeTrap = this.focusTrapStack[this.focusTrapStack.length - 1];
    
    if (!activeTrap || !activeTrap.isActive) return;

    const clickedInsideTrap = activeTrap.container.contains(event.target);
    
    if (!clickedInsideTrap && !activeTrap.allowOutsideClick) {
      event.preventDefault();
      event.stopPropagation();
      
      // Refocus the first focusable element in the trap
      if (activeTrap.focusableElements.length > 0) {
        activeTrap.focusableElements[0].focus();
      }
    }
  }

  /**
   * Enable arrow key navigation for a list or grid
   * @param {Element} container - Container element
   * @param {Object} options - Configuration options
   */
  enableArrowNavigation(container, options = {}) {
    const {
      selector = '[role="option"], [role="menuitem"], [role="tab"], button, a',
      orientation = 'vertical', // 'vertical', 'horizontal', 'grid'
      wrap = true,
      homeEndKeys = true,
      onItemSelect = null
    } = options;

    const navigationData = {
      container,
      selector,
      orientation,
      wrap,
      homeEndKeys,
      onItemSelect,
      boundHandler: this.handleArrowNavigation.bind(this)
    };

    // Store navigation data on the container
    container._navigationData = navigationData;

    // Add event listener
    container.addEventListener('keydown', navigationData.boundHandler);

    return () => {
      container.removeEventListener('keydown', navigationData.boundHandler);
      delete container._navigationData;
    };
  }

  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleArrowNavigation(event) {
    const container = event.currentTarget;
    const navData = container._navigationData;
    
    if (!navData) return;

    const items = Array.from(container.querySelectorAll(navData.selector))
      .filter(item => !item.hasAttribute('disabled') && item.offsetParent !== null);

    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (navData.orientation === 'vertical' || navData.orientation === 'grid') {
          event.preventDefault();
          newIndex = this.getNextIndex(currentIndex, items.length, 1, navData.wrap);
        }
        break;

      case 'ArrowUp':
        if (navData.orientation === 'vertical' || navData.orientation === 'grid') {
          event.preventDefault();
          newIndex = this.getNextIndex(currentIndex, items.length, -1, navData.wrap);
        }
        break;

      case 'ArrowRight':
        if (navData.orientation === 'horizontal' || navData.orientation === 'grid') {
          event.preventDefault();
          newIndex = this.getNextIndex(currentIndex, items.length, 1, navData.wrap);
        }
        break;

      case 'ArrowLeft':
        if (navData.orientation === 'horizontal' || navData.orientation === 'grid') {
          event.preventDefault();
          newIndex = this.getNextIndex(currentIndex, items.length, -1, navData.wrap);
        }
        break;

      case 'Home':
        if (navData.homeEndKeys) {
          event.preventDefault();
          newIndex = 0;
        }
        break;

      case 'End':
        if (navData.homeEndKeys) {
          event.preventDefault();
          newIndex = items.length - 1;
        }
        break;

      case 'Enter':
      case ' ':
        if (navData.onItemSelect && currentIndex >= 0) {
          event.preventDefault();
          navData.onItemSelect(items[currentIndex], currentIndex);
        }
        break;
    }

    // Focus the new item if index changed
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
      items[newIndex].focus();
    }
  }

  /**
   * Calculate the next index for arrow navigation
   * @param {number} currentIndex - Current focused item index
   * @param {number} length - Total number of items
   * @param {number} direction - Direction to move (-1 or 1)
   * @param {boolean} wrap - Whether to wrap around
   * @returns {number} New index
   */
  getNextIndex(currentIndex, length, direction, wrap) {
    if (length === 0) return -1;

    let newIndex = currentIndex + direction;

    if (wrap) {
      if (newIndex < 0) {
        newIndex = length - 1;
      } else if (newIndex >= length) {
        newIndex = 0;
      }
    } else {
      newIndex = Math.max(0, Math.min(length - 1, newIndex));
    }

    return newIndex;
  }

  /**
   * Set proper tab order for elements
   * @param {Element[]} elements - Array of elements to set tab order for
   * @param {number} startIndex - Starting tab index (default: 0)
   */
  setTabOrder(elements, startIndex = 0) {
    elements.forEach((element, index) => {
      if (element) {
        element.setAttribute('tabindex', startIndex + index);
      }
    });
  }

  /**
   * Make an element focusable if it's not already
   * @param {Element} element - Element to make focusable
   * @param {number} tabIndex - Tab index to set (default: 0)
   */
  makeFocusable(element, tabIndex = 0) {
    if (!element) return;

    const isNativelyFocusable = element.matches(this.focusableSelectors);
    
    if (!isNativelyFocusable) {
      element.setAttribute('tabindex', tabIndex);
    }
  }

  /**
   * Focus first element in container
   * @param {Element} container - Container to search within
   * @param {string} selector - Optional selector to limit search
   */
  focusFirst(container, selector = null) {
    const query = selector ? `${selector}` : this.focusableSelectors;
    const firstFocusable = container.querySelector(query);
    
    if (firstFocusable) {
      firstFocusable.focus();
      return true;
    }
    return false;
  }

  /**
   * Focus last element in container
   * @param {Element} container - Container to search within
   * @param {string} selector - Optional selector to limit search
   */
  focusLast(container, selector = null) {
    const query = selector ? `${selector}` : this.focusableSelectors;
    const focusableElements = Array.from(container.querySelectorAll(query));
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (lastFocusable) {
      lastFocusable.focus();
      return true;
    }
    return false;
  }

  /**
   * Check if element is currently visible and focusable
   * @param {Element} element - Element to check
   * @returns {boolean} Whether element is focusable
   */
  isFocusable(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return !element.hasAttribute('disabled') &&
           !element.hasAttribute('hidden') &&
           element.offsetParent !== null &&
           style.visibility !== 'hidden' &&
           style.display !== 'none';
  }

  /**
   * Clean up all focus traps and event listeners
   */
  destroy() {
    // Remove all focus traps
    while (this.focusTrapStack.length > 0) {
      this.removeFocusTrap();
    }

    // Clean up any remaining event listeners
    document.removeEventListener('keydown', this.boundHandleFocusTrap, true);
    document.removeEventListener('keydown', this.boundHandleArrowNavigation);
  }
}

// Create and export singleton instance
const focusManager = new FocusManagementService();

export default focusManager; 