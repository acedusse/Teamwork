// ARIA Management Service
// Handles ARIA attributes, live regions, and screen reader announcements

class AriaManagerService {
  constructor() {
    this.liveRegions = new Map();
    this.announcements = [];
    this.setupGlobalLiveRegions();
    
    // ARIA role definitions and requirements
    this.roleDefinitions = {
      alert: { requiredProps: [], optionalProps: ['aria-live', 'aria-atomic'] },
      alertdialog: { requiredProps: ['aria-labelledby', 'aria-describedby'], optionalProps: ['aria-modal'] },
      application: { requiredProps: ['aria-label'], optionalProps: [] },
      banner: { requiredProps: [], optionalProps: ['aria-label'] },
      button: { requiredProps: [], optionalProps: ['aria-pressed', 'aria-expanded', 'aria-describedby'] },
      checkbox: { requiredProps: ['aria-checked'], optionalProps: ['aria-labelledby', 'aria-describedby'] },
      combobox: { requiredProps: ['aria-expanded'], optionalProps: ['aria-autocomplete', 'aria-owns'] },
      complementary: { requiredProps: [], optionalProps: ['aria-label'] },
      contentinfo: { requiredProps: [], optionalProps: ['aria-label'] },
      dialog: { requiredProps: ['aria-labelledby'], optionalProps: ['aria-describedby', 'aria-modal'] },
      grid: { requiredProps: [], optionalProps: ['aria-label', 'aria-readonly'] },
      gridcell: { requiredProps: [], optionalProps: ['aria-selected', 'aria-readonly'] },
      group: { requiredProps: [], optionalProps: ['aria-label', 'aria-labelledby'] },
      heading: { requiredProps: ['aria-level'], optionalProps: [] },
      link: { requiredProps: [], optionalProps: ['aria-describedby'] },
      list: { requiredProps: [], optionalProps: ['aria-label', 'aria-labelledby'] },
      listbox: { requiredProps: [], optionalProps: ['aria-label', 'aria-multiselectable'] },
      listitem: { requiredProps: [], optionalProps: ['aria-level', 'aria-posinset', 'aria-setsize'] },
      main: { requiredProps: [], optionalProps: ['aria-label'] },
      menu: { requiredProps: [], optionalProps: ['aria-label', 'aria-orientation'] },
      menubar: { requiredProps: [], optionalProps: ['aria-label', 'aria-orientation'] },
      menuitem: { requiredProps: [], optionalProps: ['aria-disabled', 'aria-expanded'] },
      menuitemcheckbox: { requiredProps: ['aria-checked'], optionalProps: ['aria-disabled'] },
      menuitemradio: { requiredProps: ['aria-checked'], optionalProps: ['aria-disabled'] },
      navigation: { requiredProps: [], optionalProps: ['aria-label'] },
      option: { requiredProps: ['aria-selected'], optionalProps: ['aria-disabled', 'aria-posinset'] },
      progressbar: { requiredProps: [], optionalProps: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'] },
      radio: { requiredProps: ['aria-checked'], optionalProps: ['aria-labelledby', 'aria-describedby'] },
      radiogroup: { requiredProps: [], optionalProps: ['aria-label', 'aria-required'] },
      region: { requiredProps: ['aria-label'], optionalProps: [] },
      search: { requiredProps: [], optionalProps: ['aria-label'] },
      searchbox: { requiredProps: [], optionalProps: ['aria-label', 'aria-placeholder'] },
      slider: { requiredProps: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'], optionalProps: ['aria-orientation'] },
      spinbutton: { requiredProps: ['aria-valuenow'], optionalProps: ['aria-valuemin', 'aria-valuemax'] },
      switch: { requiredProps: ['aria-checked'], optionalProps: ['aria-labelledby', 'aria-describedby'] },
      tab: { requiredProps: ['aria-selected'], optionalProps: ['aria-disabled', 'aria-controls'] },
      tablist: { requiredProps: [], optionalProps: ['aria-label', 'aria-orientation'] },
      tabpanel: { requiredProps: [], optionalProps: ['aria-labelledby'] },
      textbox: { requiredProps: [], optionalProps: ['aria-placeholder', 'aria-readonly', 'aria-required'] },
      toolbar: { requiredProps: [], optionalProps: ['aria-label', 'aria-orientation'] },
      tooltip: { requiredProps: [], optionalProps: [] },
      tree: { requiredProps: [], optionalProps: ['aria-label', 'aria-multiselectable'] },
      treeitem: { requiredProps: [], optionalProps: ['aria-expanded', 'aria-level', 'aria-selected'] }
    };
  }

  /**
   * Set up global live regions for announcements
   */
  setupGlobalLiveRegions() {
    // Create polite announcements region
    const politeRegion = this.createLiveRegion('polite', {
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'aria-relevant': 'text'
    });
    this.liveRegions.set('polite', politeRegion);

    // Create assertive announcements region
    const assertiveRegion = this.createLiveRegion('assertive', {
      'aria-live': 'assertive',
      'aria-atomic': 'true',
      'aria-relevant': 'text'
    });
    this.liveRegions.set('assertive', assertiveRegion);

    // Create status region for form validation, etc.
    const statusRegion = this.createLiveRegion('status', {
      'role': 'status',
      'aria-live': 'polite',
      'aria-atomic': 'false'
    });
    this.liveRegions.set('status', statusRegion);
  }

  /**
   * Create a live region element
   * @param {string} id - Unique identifier for the live region
   * @param {Object} attributes - ARIA attributes to set
   * @returns {Element} The created live region element
   */
  createLiveRegion(id, attributes = {}) {
    const existing = document.getElementById(`aria-live-${id}`);
    if (existing) {
      return existing;
    }

    const region = document.createElement('div');
    region.id = `aria-live-${id}`;
    region.className = 'sr-only';
    
    // Apply default styles for screen reader only content
    region.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    // Set ARIA attributes
    Object.entries(attributes).forEach(([key, value]) => {
      region.setAttribute(key, value);
    });

    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce text to screen readers
   * @param {string} text - Text to announce
   * @param {string} priority - 'polite' or 'assertive'
   * @param {number} delay - Delay before announcement (for timing)
   */
  announce(text, priority = 'polite', delay = 0) {
    if (!text || typeof text !== 'string') return;

    const announceText = () => {
      const region = this.liveRegions.get(priority);
      if (region) {
        // Clear existing content first
        region.textContent = '';
        
        // Use setTimeout to ensure screen readers pick up the change
        setTimeout(() => {
          region.textContent = text;
          
          // Keep track of announcements for debugging
          this.announcements.push({
            text,
            priority,
            timestamp: new Date().toISOString()
          });

          // Clear after announcement
          setTimeout(() => {
            if (region.textContent === text) {
              region.textContent = '';
            }
          }, 1000);
        }, 10);
      }
    };

    if (delay > 0) {
      setTimeout(announceText, delay);
    } else {
      announceText();
    }
  }

  /**
   * Announce status updates (form validation, operation results, etc.)
   * @param {string} text - Status text to announce
   */
  announceStatus(text) {
    const region = this.liveRegions.get('status');
    if (region) {
      region.textContent = text;
    }
  }

  /**
   * Set multiple ARIA attributes on an element
   * @param {Element} element - Target element
   * @param {Object} attributes - Object of attribute-value pairs
   */
  setAttributes(element, attributes) {
    if (!element || !attributes) return;

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value);
      } else {
        element.removeAttribute(key);
      }
    });
  }

  /**
   * Validate ARIA attributes for a given role
   * @param {Element} element - Element to validate
   * @param {string} role - ARIA role to validate against
   * @returns {Object} Validation result with missing and invalid attributes
   */
  validateRole(element, role) {
    const definition = this.roleDefinitions[role];
    if (!definition) {
      return { valid: false, error: `Unknown role: ${role}` };
    }

    const missing = [];
    const invalid = [];

    // Check required properties
    definition.requiredProps.forEach(prop => {
      if (!element.hasAttribute(prop)) {
        missing.push(prop);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
      invalid,
      suggestions: this.getRoleSuggestions(role)
    };
  }

  /**
   * Get suggestions for improving ARIA implementation for a role
   * @param {string} role - ARIA role
   * @returns {Array} Array of suggestion strings
   */
  getRoleSuggestions(role) {
    const definition = this.roleDefinitions[role];
    if (!definition) return [];

    const suggestions = [];

    switch (role) {
      case 'button':
        suggestions.push('Consider adding aria-describedby for additional context');
        suggestions.push('Use aria-pressed for toggle buttons');
        suggestions.push('Use aria-expanded for buttons that control collapsible content');
        break;
      case 'dialog':
        suggestions.push('Ensure focus is trapped within the dialog');
        suggestions.push('Include a close button or escape key handler');
        suggestions.push('Use aria-modal="true" for modal dialogs');
        break;
      case 'menu':
        suggestions.push('Implement arrow key navigation');
        suggestions.push('Use aria-orientation to indicate menu direction');
        suggestions.push('Ensure proper focus management');
        break;
      case 'list':
        suggestions.push('Consider using aria-setsize and aria-posinset for dynamic lists');
        suggestions.push('Provide aria-label if the list purpose is not clear from context');
        break;
    }

    return suggestions;
  }

  /**
   * Generate a unique ID for labeling relationships
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique ID
   */
  generateId(prefix = 'aria') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create label-control relationships
   * @param {Element} label - Label element
   * @param {Element} control - Control element
   * @param {Object} options - Additional options
   */
  linkLabelToControl(label, control, options = {}) {
    if (!label || !control) return;

    const { 
      useAriaLabelledby = true, 
      useFor = true,
      generateId: shouldGenerateId = true 
    } = options;

    let controlId = control.id;
    
    if (!controlId && shouldGenerateId) {
      controlId = this.generateId('control');
      control.id = controlId;
    }

    if (controlId) {
      if (useFor && label.tagName === 'LABEL') {
        label.setAttribute('for', controlId);
      }
      
      if (useAriaLabelledby) {
        let labelId = label.id;
        if (!labelId) {
          labelId = this.generateId('label');
          label.id = labelId;
        }
        control.setAttribute('aria-labelledby', labelId);
      }
    }
  }

  /**
   * Add describedby relationship
   * @param {Element} element - Element to describe
   * @param {Element} description - Description element
   */
  addDescription(element, description) {
    if (!element || !description) return;

    let descId = description.id;
    if (!descId) {
      descId = this.generateId('desc');
      description.id = descId;
    }

    const existingDescribedBy = element.getAttribute('aria-describedby');
    const newDescribedBy = existingDescribedBy ? 
      `${existingDescribedBy} ${descId}` : 
      descId;
    
    element.setAttribute('aria-describedby', newDescribedBy);
  }

  /**
   * Set expanded state for collapsible elements
   * @param {Element} trigger - Trigger element
   * @param {Element} content - Content element
   * @param {boolean} expanded - Whether content is expanded
   */
  setExpanded(trigger, content, expanded) {
    if (!trigger) return;

    trigger.setAttribute('aria-expanded', expanded.toString());
    
    if (content) {
      content.setAttribute('aria-hidden', (!expanded).toString());
      
      // Link trigger to content if not already linked
      if (!trigger.getAttribute('aria-controls')) {
        let contentId = content.id;
        if (!contentId) {
          contentId = this.generateId('content');
          content.id = contentId;
        }
        trigger.setAttribute('aria-controls', contentId);
      }
    }
  }

  /**
   * Set selected state for selectable items
   * @param {Element} element - Element to mark as selected
   * @param {boolean} selected - Whether element is selected
   * @param {Array} siblings - Sibling elements to unselect (for single-select)
   */
  setSelected(element, selected, siblings = []) {
    if (!element) return;

    element.setAttribute('aria-selected', selected.toString());
    
    // For single-select scenarios, unselect siblings
    if (selected && siblings.length > 0) {
      siblings.forEach(sibling => {
        if (sibling !== element) {
          sibling.setAttribute('aria-selected', 'false');
        }
      });
    }
  }

  /**
   * Get recent announcements for debugging
   * @param {number} limit - Number of recent announcements to return
   * @returns {Array} Recent announcements
   */
  getRecentAnnouncements(limit = 10) {
    return this.announcements.slice(-limit);
  }

  /**
   * Clear all live regions
   */
  clearLiveRegions() {
    this.liveRegions.forEach(region => {
      if (region && region.parentNode) {
        region.textContent = '';
      }
    });
  }

  /**
   * Destroy the service and clean up
   */
  destroy() {
    // Remove live regions
    this.liveRegions.forEach(region => {
      if (region && region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    
    this.liveRegions.clear();
    this.announcements = [];
  }
}

// Create and export singleton instance
const ariaManager = new AriaManagerService();

export default ariaManager; 