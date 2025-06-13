import React, { useState, useEffect, useRef, useCallback } from 'react';
import './KeyboardShortcutHelp.css';

const KeyboardShortcutHelp = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  // Store the element that had focus before opening the dialog
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus the close button when dialog opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else if (!isOpen && previousFocusRef.current) {
      // Return focus to previous element when dialog closes
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus within the dialog
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isOpen, onClose]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Keyboard shortcuts data organized by category
  const shortcutCategories = [
    {
      category: 'Navigation',
      description: 'Move around the application',
      shortcuts: [
        { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
        { keys: ['Ctrl', '2'], description: 'Go to Tasks' },
        { keys: ['Ctrl', '3'], description: 'Go to Team' },
        { keys: ['Ctrl', '4'], description: 'Go to Calendar' },
        { keys: ['Ctrl', '5'], description: 'Go to Reports' },
        { keys: ['Ctrl', '6'], description: 'Go to Settings' },
        { keys: ['Tab'], description: 'Move to next interactive element' },
        { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
        { keys: ['Enter'], description: 'Activate focused element' },
        { keys: ['Space'], description: 'Activate buttons and checkboxes' },
      ]
    },
    {
      category: 'Task Management',
      description: 'Create and manage tasks',
      shortcuts: [
        { keys: ['Ctrl', 'N'], description: 'Create new task' },
        { keys: ['Ctrl', 'E'], description: 'Edit selected task' },
        { keys: ['Ctrl', 'D'], description: 'Duplicate selected task' },
        { keys: ['Delete'], description: 'Delete selected task' },
        { keys: ['Ctrl', 'S'], description: 'Save current task' },
        { keys: ['Escape'], description: 'Cancel editing' },
        { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
        { keys: ['Ctrl', 'Y'], description: 'Redo last action' },
      ]
    },
    {
      category: 'Search & Filter',
      description: 'Find and filter content',
      shortcuts: [
        { keys: ['Ctrl', 'F'], description: 'Focus search input' },
        { keys: ['Ctrl', 'K'], description: 'Open quick command palette' },
        { keys: ['Escape'], description: 'Clear search/close filters' },
        { keys: ['Enter'], description: 'Execute search' },
        { keys: ['Arrow Down'], description: 'Navigate search results down' },
        { keys: ['Arrow Up'], description: 'Navigate search results up' },
      ]
    },
    {
      category: 'Dialog & Modal',
      description: 'Work with dialogs and modals',
      shortcuts: [
        { keys: ['Escape'], description: 'Close current dialog/modal' },
        { keys: ['Tab'], description: 'Move to next element in dialog' },
        { keys: ['Shift', 'Tab'], description: 'Move to previous element in dialog' },
        { keys: ['Enter'], description: 'Confirm/submit dialog' },
        { keys: ['Space'], description: 'Toggle checkboxes in dialog' },
      ]
    },
    {
      category: 'Accessibility',
      description: 'Accessibility and help features',
      shortcuts: [
        { keys: ['?'], description: 'Show this keyboard shortcuts help' },
        { keys: ['Alt', '1'], description: 'Skip to main content' },
        { keys: ['Alt', '2'], description: 'Skip to navigation' },
        { keys: ['Alt', '3'], description: 'Skip to search' },
        { keys: ['Ctrl', 'Alt', 'H'], description: 'Toggle high contrast mode' },
        { keys: ['Ctrl', 'Alt', 'R'], description: 'Toggle reduced motion' },
      ]
    },
    {
      category: 'Application',
      description: 'General application controls',
      shortcuts: [
        { keys: ['Ctrl', 'R'], description: 'Refresh current view' },
        { keys: ['F11'], description: 'Toggle fullscreen mode' },
        { keys: ['Ctrl', 'M'], description: 'Toggle sidebar' },
        { keys: ['Ctrl', ','], description: 'Open preferences/settings' },
        { keys: ['Ctrl', 'Q'], description: 'Sign out' },
      ]
    }
  ];

  const formatKeySequence = (keys) => {
    return keys.map(key => (
      <kbd key={key} className="keyboard-key">
        {key}
      </kbd>
    ));
  };

  const insertPlusSign = (elements) => {
    return elements.reduce((result, element, index) => {
      if (index > 0) {
        result.push(<span key={`plus-${index}`} className="key-separator">+</span>);
      }
      result.push(element);
      return result;
    }, []);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="keyboard-help-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div 
        className="keyboard-help-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        aria-describedby="keyboard-help-description"
      >
        <div className="keyboard-help-header">
          <h2 id="keyboard-help-title" className="keyboard-help-title">
            Keyboard Shortcuts
          </h2>
          <p id="keyboard-help-description" className="keyboard-help-description">
            Use these keyboard shortcuts to navigate and interact with the application efficiently.
            Press <kbd className="keyboard-key">Escape</kbd> or click outside this dialog to close.
          </p>
          <button
            ref={closeButtonRef}
            className="keyboard-help-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help dialog"
            type="button"
          >
            <span className="close-icon" aria-hidden="true">×</span>
          </button>
        </div>

        <div className="keyboard-help-content">
          {shortcutCategories.map((category, categoryIndex) => (
            <div key={category.category} className="shortcut-category">
              <h3 className="category-title">
                {category.category}
                <span className="category-description">{category.description}</span>
              </h3>
              
              <div className="shortcuts-grid">
                {category.shortcuts.map((shortcut, shortcutIndex) => (
                  <div 
                    key={shortcutIndex} 
                    className="shortcut-item"
                    role="row"
                  >
                    <div className="shortcut-keys" role="cell">
                      {insertPlusSign(formatKeySequence(shortcut.keys))}
                    </div>
                    <div className="shortcut-description" role="cell">
                      {shortcut.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="keyboard-help-footer">
          <div className="footer-note">
            <strong>Note:</strong> On Mac, use <kbd className="keyboard-key">Cmd</kbd> instead of <kbd className="keyboard-key">Ctrl</kbd>
          </div>
          <div className="footer-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
            <a
              href="/accessibility-guide"
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Full Accessibility Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage keyboard shortcut help dialog
export const useKeyboardShortcutHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openHelp = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Listen for '?' key to open help
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger if we're not in an input field
      if (
        event.key === '?' && 
        !event.ctrlKey && 
        !event.altKey && 
        !event.metaKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
        !event.target.isContentEditable
      ) {
        event.preventDefault();
        openHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openHelp]);

  return {
    isOpen,
    openHelp,
    closeHelp,
    toggleHelp
  };
};

export default KeyboardShortcutHelp; 