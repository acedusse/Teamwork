// Visual Accessibility Manager Service
// Handles color contrast validation, zoom support, focus indicators, and visual compliance

class VisualAccessibilityManager {
  constructor() {
    this.contrastThresholds = {
      AA_NORMAL: 4.5,     // WCAG 2.1 AA for normal text
      AA_LARGE: 3.0,      // WCAG 2.1 AA for large text (18pt+ or 14pt+ bold)
      AAA_NORMAL: 7.0,    // WCAG 2.1 AAA for normal text
      AAA_LARGE: 4.5      // WCAG 2.1 AAA for large text
    };
    
    this.currentZoom = 1.0;
    this.highContrastMode = false;
    this.reducedMotion = false;
    
    if (typeof window !== 'undefined') {
      this.reducedMotion = this.detectReducedMotion();
      this.setupMediaQueries();
      this.setupFocusManagement();
    }
  }

  /**
   * Convert hex color to RGB values
   * @param {string} hex - Hex color code (e.g., '#ffffff')
   * @returns {Object} RGB values
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculate relative luminance of a color
   * @param {Object} rgb - RGB color object
   * @returns {number} Relative luminance (0-1)
   */
  calculateLuminance(rgb) {
    const { r, g, b } = rgb;
    
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color (hex)
   * @param {string} color2 - Second color (hex)
   * @returns {number} Contrast ratio (1-21)
   */
  calculateContrastRatio(color1, color2) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const lum1 = this.calculateLuminance(rgb1);
    const lum2 = this.calculateLuminance(rgb2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG standards
   * @param {string} foreground - Foreground color (hex)
   * @param {string} background - Background color (hex)
   * @param {string} level - 'AA' or 'AAA'
   * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
   * @returns {Object} Compliance result
   */
  checkColorCompliance(foreground, background, level = 'AA', isLargeText = false) {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    let threshold;
    if (level === 'AAA') {
      threshold = isLargeText ? this.contrastThresholds.AAA_LARGE : this.contrastThresholds.AAA_NORMAL;
    } else {
      threshold = isLargeText ? this.contrastThresholds.AA_LARGE : this.contrastThresholds.AA_NORMAL;
    }
    
    const passes = ratio >= threshold;
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      threshold,
      passes,
      level,
      isLargeText,
      grade: this.getContrastGrade(ratio, isLargeText)
    };
  }

  /**
   * Get contrast grade (AA, AAA, or Fail)
   * @param {number} ratio - Contrast ratio
   * @param {boolean} isLargeText - Whether text is large
   * @returns {string} Grade
   */
  getContrastGrade(ratio, isLargeText = false) {
    const aaThreshold = isLargeText ? this.contrastThresholds.AA_LARGE : this.contrastThresholds.AA_NORMAL;
    const aaaThreshold = isLargeText ? this.contrastThresholds.AAA_LARGE : this.contrastThresholds.AAA_NORMAL;
    
    if (ratio >= aaaThreshold) return 'AAA';
    if (ratio >= aaThreshold) return 'AA';
    return 'Fail';
  }

  /**
   * Convert RGB string to hex
   * @param {string} rgb - RGB string (e.g., 'rgb(255, 255, 255)')
   * @returns {string} Hex color
   */
  rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Detect if user prefers reduced motion
   * @returns {boolean} Whether reduced motion is preferred
   */
  detectReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Detect if user prefers high contrast
   * @returns {boolean} Whether high contrast is preferred
   */
  detectHighContrast() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Setup media query listeners
   */
  setupMediaQueries() {
    if (typeof window === 'undefined') return;
    
    // Listen for reduced motion changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addListener((e) => {
      this.reducedMotion = e.matches;
      this.updateMotionPreferences();
    });

    // Listen for high contrast changes
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addListener((e) => {
      this.highContrastMode = e.matches;
      this.updateContrastPreferences();
    });

    // Listen for zoom changes
    window.addEventListener('resize', () => {
      this.detectZoomLevel();
    });
  }

  /**
   * Update motion preferences
   */
  updateMotionPreferences() {
    if (typeof document === 'undefined') return;
    
    document.body.classList.toggle('reduced-motion', this.reducedMotion);
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('motionPreferenceChanged', {
      detail: { reducedMotion: this.reducedMotion }
    }));
  }

  /**
   * Update contrast preferences
   */
  updateContrastPreferences() {
    if (typeof document === 'undefined') return;
    
    document.body.classList.toggle('high-contrast', this.highContrastMode);
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('contrastPreferenceChanged', {
      detail: { highContrast: this.highContrastMode }
    }));
  }

  /**
   * Detect current zoom level
   * @returns {number} Zoom level
   */
  detectZoomLevel() {
    if (typeof window === 'undefined') return 1.0;
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    const zoomLevel = Math.round(devicePixelRatio * 100) / 100;
    
    if (zoomLevel !== this.currentZoom) {
      this.currentZoom = zoomLevel;
      this.handleZoomChange();
    }
    
    return zoomLevel;
  }

  /**
   * Handle zoom level changes
   */
  handleZoomChange() {
    if (typeof document === 'undefined') return;
    
    // Add zoom level class to body
    document.body.className = document.body.className.replace(/zoom-\d+/g, '');
    
    if (this.currentZoom >= 2.0) {
      document.body.classList.add('zoom-200');
    } else if (this.currentZoom >= 1.5) {
      document.body.classList.add('zoom-150');
    } else if (this.currentZoom >= 1.25) {
      document.body.classList.add('zoom-125');
    }
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('zoomLevelChanged', {
      detail: { zoomLevel: this.currentZoom }
    }));
  }

  /**
   * Setup enhanced focus management
   */
  setupFocusManagement() {
    if (typeof document === 'undefined') return;
    
    let isUsingKeyboard = false;
    
    // Track keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('using-keyboard');
      }
    });
    
    // Track mouse usage
    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.remove('using-keyboard');
    });
    
    // Enhanced focus indicators for keyboard users
    document.addEventListener('focusin', (e) => {
      if (isUsingKeyboard) {
        e.target.classList.add('keyboard-focus');
      }
    });
    
    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('keyboard-focus');
    });
  }

  /**
   * Add status indicator with icon and color
   * @param {Element} element - Target element
   * @param {string} status - Status type (success, warning, error, info)
   * @param {string} text - Status text
   */
  addStatusIndicator(element, status, text) {
    if (!element) return;
    
    // Remove existing status indicators
    const existingIndicators = element.querySelectorAll('.status-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Create new status indicator
    const indicator = document.createElement('span');
    indicator.className = `status-indicator status-${status}`;
    indicator.textContent = text;
    indicator.setAttribute('aria-label', `${status}: ${text}`);
    
    element.appendChild(indicator);
  }

  /**
   * Ensure element has minimum touch target size
   * @param {Element} element - Element to check
   * @param {number} minSize - Minimum size in pixels (default 44px)
   */
  ensureTouchTargetSize(element, minSize = 44) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
      element.style.display = element.style.display || 'inline-flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }
  }

  /**
   * Make text content scalable and readable
   * @param {Element} element - Element to enhance
   */
  makeTextScalable(element) {
    if (!element) return;
    
    element.classList.add('text-resize-support');
    
    // Ensure proper line length for readability
    if (element.textContent && element.textContent.length > 200) {
      element.classList.add('long-text');
    }
  }

  /**
   * Get contrasting color (black or white) for a given color
   * @param {string} color - Hex color
   * @returns {string} Contrasting color
   */
  getContrastColor(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return '#000000';
    
    const luminance = this.calculateLuminance(rgb);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Generate accessibility report for validation
   * @returns {Object} Comprehensive accessibility report
   */
  generateAccessibilityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      preferences: {
        reducedMotion: this.reducedMotion,
        highContrast: this.highContrastMode,
        currentZoom: this.currentZoom
      },
      recommendations: []
    };
    
    // Add recommendations based on current state
    if (this.currentZoom < 2.0) {
      report.recommendations.push('Test application at 200% zoom to ensure WCAG 2.1 AA compliance');
    }
    
    if (!this.reducedMotion && !document?.body?.classList?.contains('reduced-motion')) {
      report.recommendations.push('Consider reducing animations for users who prefer reduced motion');
    }
    
    return report;
  }

  /**
   * Apply visual accessibility enhancements to an element
   * @param {Element} element - Element to enhance
   * @param {Object} options - Enhancement options
   */
  enhanceElement(element, options = {}) {
    if (!element) return;
    
    const {
      ensureTouchTarget = true,
      makeTextScalable = true,
      addFocusEnhancement = true,
      checkColorContrast = true
    } = options;
    
    if (ensureTouchTarget) {
      this.ensureTouchTargetSize(element);
    }
    
    if (makeTextScalable) {
      this.makeTextScalable(element);
    }
    
    if (addFocusEnhancement) {
      element.classList.add('enhanced-focus');
    }
    
    if (checkColorContrast && typeof window !== 'undefined') {
      // Add data attributes for color checking
      const computedStyle = window.getComputedStyle(element);
      const fgColor = this.rgbToHex(computedStyle.color);
      const bgColor = this.rgbToHex(computedStyle.backgroundColor);
      
      if (fgColor) element.setAttribute('data-fg-color', fgColor);
      if (bgColor) element.setAttribute('data-bg-color', bgColor);
    }
  }

  /**
   * Initialize visual accessibility manager
   */
  init() {
    // Apply initial enhancements
    this.detectZoomLevel();
    this.updateMotionPreferences();
    this.updateContrastPreferences();
    
    // Add CSS classes for feature detection
    if (typeof document !== 'undefined') {
      document.body.classList.add('visual-accessibility-enabled');
    }
    
    console.log('Visual Accessibility Manager initialized');
  }
}

// Create and export singleton instance
const visualAccessibilityManager = new VisualAccessibilityManager();

export default visualAccessibilityManager; 