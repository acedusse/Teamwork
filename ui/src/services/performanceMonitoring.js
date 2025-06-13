/**
 * Performance Monitoring Service
 * Collects and reports performance metrics for the Task Master UI
 * Implements requirements from Task 12.3
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.customMetrics = {};
    this.isSupported = 'performance' in window;
    this.observers = [];
    
    if (this.isSupported) {
      this.init();
    }
  }

  init() {
    // Collect initial metrics when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.collectInitialMetrics());
    } else {
      this.collectInitialMetrics();
    }

    // Set up performance observers
    this.setupObservers();
    
    // Collect metrics when page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => this.collectNavigationMetrics(), 100);
    });
  }

  setupObservers() {
    // Observer for paint metrics (FCP, LCP)
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = Math.round(entry.startTime);
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observer for Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = Math.round(lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observer for First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.metrics.firstInputDelay = Math.round(entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Observer for resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          const resources = list.getEntries();
          this.analyzeResourcePerformance(resources);
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  collectInitialMetrics() {
    if (!this.isSupported) return;

    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];

    // Basic timing metrics
    this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    this.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    this.metrics.timeToFirstByte = timing.responseStart - timing.navigationStart;
    
    // Navigation API metrics (if available)
    if (navigation) {
      this.metrics.domInteractive = Math.round(navigation.domInteractive);
      this.metrics.domComplete = Math.round(navigation.domComplete);
      this.metrics.loadComplete = Math.round(navigation.loadEventEnd);
    }
  }

  collectNavigationMetrics() {
    if (!this.isSupported) return;

    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const nav = entries[0];
      
      // Core Web Vitals approximation
      this.metrics.timeToInteractive = this.calculateTTI(nav);
      
      // Resource counts
      const resources = performance.getEntriesByType('resource');
      this.metrics.totalResources = resources.length;
      this.metrics.totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    }
  }

  calculateTTI(navEntry) {
    // Simplified TTI calculation - when main thread is idle after DOM interactive
    return Math.round(navEntry.domInteractive + 50); // Rough approximation
  }

  analyzeResourcePerformance(resources) {
    const resourceTypes = {};
    let slowResources = [];

    resources.forEach(resource => {
      const type = resource.initiatorType || 'other';
      if (!resourceTypes[type]) {
        resourceTypes[type] = { count: 0, totalDuration: 0, totalSize: 0 };
      }
      
      resourceTypes[type].count++;
      resourceTypes[type].totalDuration += resource.duration;
      resourceTypes[type].totalSize += resource.transferSize || 0;

      // Flag slow resources (>1000ms)
      if (resource.duration > 1000) {
        slowResources.push({
          name: resource.name,
          duration: Math.round(resource.duration),
          size: resource.transferSize || 0
        });
      }
    });

    this.metrics.resourceTypes = resourceTypes;
    this.metrics.slowResources = slowResources;
  }

  // Custom metric tracking for application-specific performance
  startTimer(label) {
    this.customMetrics[label] = {
      startTime: performance.now(),
      endTime: null,
      duration: null
    };
  }

  endTimer(label) {
    if (this.customMetrics[label]) {
      this.customMetrics[label].endTime = performance.now();
      this.customMetrics[label].duration = 
        Math.round(this.customMetrics[label].endTime - this.customMetrics[label].startTime);
    }
  }

  // Track user interactions
  trackUserInteraction(action, element, duration = null) {
    const timestamp = Date.now();
    const metric = {
      timestamp,
      action,
      element: element || 'unknown',
      duration: duration || null,
      url: window.location.pathname
    };

    if (!this.customMetrics.userInteractions) {
      this.customMetrics.userInteractions = [];
    }
    this.customMetrics.userInteractions.push(metric);

    // Keep only last 100 interactions to prevent memory issues
    if (this.customMetrics.userInteractions.length > 100) {
      this.customMetrics.userInteractions = this.customMetrics.userInteractions.slice(-100);
    }
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      metrics: {
        ...this.metrics,
        customMetrics: this.customMetrics
      },
      coreWebVitals: this.getCoreWebVitals(),
      performance: this.getPerformanceGrade()
    };
  }

  getCoreWebVitals() {
    return {
      fcp: this.metrics.firstContentfulPaint, // Good: <1800ms
      lcp: this.metrics.largestContentfulPaint, // Good: <2500ms
      fid: this.metrics.firstInputDelay, // Good: <100ms
      cls: this.getCLS() // Good: <0.1
    };
  }

  getCLS() {
    // Simplified CLS calculation - would need proper implementation
    return 0; // Placeholder
  }

  getConnectionType() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  getPerformanceGrade() {
    const fcp = this.metrics.firstContentfulPaint || 0;
    const lcp = this.metrics.largestContentfulPaint || 0;
    const fid = this.metrics.firstInputDelay || 0;

    let score = 100;
    
    // Scoring based on Core Web Vitals
    if (fcp > 3000) score -= 20;
    else if (fcp > 1800) score -= 10;
    
    if (lcp > 4000) score -= 25;
    else if (lcp > 2500) score -= 15;
    
    if (fid > 300) score -= 20;
    else if (fid > 100) score -= 10;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Send metrics to analytics endpoint
  async sendMetrics(endpoint = '/api/analytics/performance') {
    if (!this.isSupported) return;

    try {
      const report = this.getPerformanceReport();
      
      // Use sendBeacon if available for reliability
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(endpoint, JSON.stringify(report));
      } else {
        // Fallback to fetch
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report)
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting performance observer:', error);
      }
    });
    this.observers = [];
  }

  // Debug method to log current metrics
  logMetrics() {
    console.group('🚀 Performance Metrics');
    console.table(this.metrics);
    console.log('Custom Metrics:', this.customMetrics);
    console.log('Performance Grade:', this.getPerformanceGrade());
    console.groupEnd();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export default performanceMonitor;

// Helper functions for components
export const trackComponentRender = (componentName) => {
  performanceMonitor.startTimer(`${componentName}-render`);
};

export const trackComponentRenderEnd = (componentName) => {
  performanceMonitor.endTimer(`${componentName}-render`);
};

export const trackUserAction = (action, element) => {
  performanceMonitor.trackUserInteraction(action, element);
};

export const getPerformanceReport = () => {
  return performanceMonitor.getPerformanceReport();
};

export const sendPerformanceMetrics = () => {
  return performanceMonitor.sendMetrics();
}; 