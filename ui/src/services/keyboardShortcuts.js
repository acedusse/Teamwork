// Keyboard Shortcuts Service
// Manages global keyboard shortcuts for the Taskmaster application

class KeyboardShortcutService {
  constructor() {
    this.shortcuts = new Map();
    this.isEnabled = true;
    this.preventDefault = true;
    this.boundHandler = this.handleKeyDown.bind(this);
    
    // Register default shortcuts
    this.registerDefaults();
    
    // Bind global event listener
    document.addEventListener('keydown', this.boundHandler, true);
  }

  /**
   * Register a keyboard shortcut
   * @param {Object} shortcut - Shortcut configuration
   * @param {string} shortcut.key - The key combination (e.g., 'ctrl+n', 'f1', 'escape')
   * @param {Function} shortcut.handler - Function to execute when shortcut is triggered
   * @param {string} shortcut.description - Human-readable description
   * @param {string} shortcut.category - Category for organization (e.g., 'navigation', 'actions')
   * @param {boolean} shortcut.preventDefault - Whether to prevent default browser behavior
   * @param {Function} shortcut.condition - Optional condition function to check before executing
   */
  register(shortcut) {
    const { key, handler, description, category = 'general', preventDefault = true, condition } = shortcut;
    
    if (!key || !handler) {
      console.warn('KeyboardShortcut: Invalid shortcut configuration', shortcut);
      return false;
    }

    const normalizedKey = this.normalizeKey(key);
    
    this.shortcuts.set(normalizedKey, {
      key: normalizedKey,
      originalKey: key,
      handler,
      description,
      category,
      preventDefault,
      condition
    });

    return true;
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} key - The key combination to unregister
   */
  unregister(key) {
    const normalizedKey = this.normalizeKey(key);
    return this.shortcuts.delete(normalizedKey);
  }

  /**
   * Enable or disable the keyboard shortcut service
   * @param {boolean} enabled - Whether shortcuts should be enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts organized by category
   * @returns {Object} Object with categories as keys and shortcuts arrays as values
   */
  getAllShortcuts() {
    const categorized = {};
    
    for (const shortcut of this.shortcuts.values()) {
      if (!categorized[shortcut.category]) {
        categorized[shortcut.category] = [];
      }
      categorized[shortcut.category].push({
        key: shortcut.originalKey,
        description: shortcut.description
      });
    }

    return categorized;
  }

  /**
   * Normalize key combination string
   * @param {string} key - Raw key combination
   * @returns {string} Normalized key combination
   */
  normalizeKey(key) {
    return key.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/command|cmd/g, 'meta')
      .replace(/control|ctrl/g, 'ctrl')
      .replace(/option|opt/g, 'alt')
      .replace(/shift/g, 'shift')
      .split('+')
      .sort((a, b) => {
        // Sort modifiers first, then the main key
        const modifierOrder = { 'ctrl': 1, 'alt': 2, 'shift': 3, 'meta': 4 };
        return (modifierOrder[a] || 5) - (modifierOrder[b] || 5);
      })
      .join('+');
  }

  /**
   * Convert keyboard event to key string
   * @param {KeyboardEvent} event - The keyboard event
   * @returns {string} Key combination string
   */
  eventToKey(event) {
    const parts = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');
    
    // Handle special keys
    let key = event.key.toLowerCase();
    
    // Map special keys
    const keyMap = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'enter': 'enter',
      'escape': 'escape',
      'tab': 'tab',
      'backspace': 'backspace',
      'delete': 'delete'
    };
    
    key = keyMap[key] || key;
    parts.push(key);
    
    return parts.join('+');
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    if (!this.isEnabled) return;
    
    // Skip if user is typing in an input field
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.isContentEditable
    );

    // Allow certain shortcuts even when typing (like Ctrl+S, Ctrl+Z, etc.)
    const allowWhenTyping = ['ctrl+s', 'ctrl+z', 'ctrl+shift+z', 'escape', 'f1'];
    const keyString = this.eventToKey(event);
    
    if (isTyping && !allowWhenTyping.includes(keyString)) {
      return;
    }

    const shortcut = this.shortcuts.get(keyString);
    
    if (shortcut) {
      // Check condition if present
      if (shortcut.condition && !shortcut.condition()) {
        return;
      }

      // Prevent default behavior if configured
      if (shortcut.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        shortcut.handler(event);
      } catch (error) {
        console.error('KeyboardShortcut: Error executing shortcut handler', error);
      }
    }
  }

  /**
   * Register default application shortcuts
   */
  registerDefaults() {
    // Navigation shortcuts
    this.register({
      key: 'ctrl+1',
      handler: () => this.navigateToSection('dashboard'),
      description: 'Navigate to Dashboard',
      category: 'navigation'
    });

    this.register({
      key: 'ctrl+2',
      handler: () => this.navigateToSection('tasks'),
      description: 'Navigate to Task Board',
      category: 'navigation'
    });

    this.register({
      key: 'ctrl+3',
      handler: () => this.navigateToSection('prd'),
      description: 'Navigate to PRD',
      category: 'navigation'
    });

    this.register({
      key: 'ctrl+4',
      handler: () => this.navigateToSection('sprints'),
      description: 'Navigate to Sprint Planning',
      category: 'navigation'
    });

    this.register({
      key: 'ctrl+5',
      handler: () => this.navigateToSection('dependencies'),
      description: 'Navigate to Dependencies',
      category: 'navigation'
    });

    this.register({
      key: 'ctrl+6',
      handler: () => this.navigateToSection('settings'),
      description: 'Navigate to Settings',
      category: 'navigation'
    });

    // Search shortcut
    this.register({
      key: 'ctrl+f',
      handler: () => this.focusSearch(),
      description: 'Focus search input',
      category: 'actions',
      preventDefault: true
    });

    // Help shortcut
    this.register({
      key: '?',
      handler: () => this.showHelpDialog(),
      description: 'Show keyboard shortcuts help',
      category: 'help',
      condition: () => !this.isTyping()
    });

    this.register({
      key: 'f1',
      handler: () => this.showHelpDialog(),
      description: 'Show keyboard shortcuts help',
      category: 'help'
    });

    // Task management shortcuts
    this.register({
      key: 'ctrl+n',
      handler: () => this.createNewTask(),
      description: 'Create new task',
      category: 'tasks'
    });

    // Accessibility shortcuts
    this.register({
      key: 'alt+s',
      handler: () => this.skipToContent(),
      description: 'Skip to main content',
      category: 'accessibility'
    });

    this.register({
      key: 'escape',
      handler: () => this.handleEscape(),
      description: 'Close dialogs/panels',
      category: 'general',
      preventDefault: false
    });
  }

  /**
   * Navigate to a specific section of the application
   * @param {string} section - The section to navigate to
   */
  navigateToSection(section) {
    const routes = {
      'dashboard': '/',
      'tasks': '/tasks',
      'prd': '/prd',
      'sprints': '/sprints',
      'dependencies': '/dependencies',
      'settings': '/settings'
    };

    const route = routes[section];
    if (route && window.location.pathname !== route) {
      // Use React Router navigation if available
      if (window.routerNavigate) {
        window.routerNavigate(route);
      } else {
        // Fallback to direct navigation
        window.location.pathname = route;
      }
    }
  }

  /**
   * Focus the search input
   */
  focusSearch() {
    const searchInput = document.querySelector('input[placeholder*="Search"], input[aria-label="search"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  /**
   * Show the keyboard shortcuts help dialog
   */
  showHelpDialog() {
    // Dispatch custom event that components can listen to
    const event = new CustomEvent('showKeyboardHelp');
    document.dispatchEvent(event);
  }

  /**
   * Handle creating a new task
   */
  createNewTask() {
    // Dispatch custom event for task creation
    const event = new CustomEvent('createNewTask');
    document.dispatchEvent(event);
  }

  /**
   * Skip to main content (accessibility)
   */
  skipToContent() {
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  }

  /**
   * Handle escape key (close modals, panels, etc.)
   */
  handleEscape() {
    // Dispatch custom event that components can listen to
    const event = new CustomEvent('escapePressed');
    document.dispatchEvent(event);
  }

  /**
   * Check if user is currently typing in an input field
   */
  isTyping() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true' ||
      activeElement.isContentEditable
    );
  }

  /**
   * Destroy the service and clean up event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this.boundHandler, true);
    this.shortcuts.clear();
  }
}

// Create and export singleton instance
const keyboardShortcuts = new KeyboardShortcutService();

export default keyboardShortcuts; 