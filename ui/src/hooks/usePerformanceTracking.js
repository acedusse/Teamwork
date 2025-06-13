import { useEffect, useRef, useCallback } from 'react';
import { trackComponentRender, trackComponentRenderEnd, trackUserAction } from '../services/performanceMonitoring';

/**
 * Hook for tracking component rendering performance
 * @param {string} componentName - Name of the component to track
 * @param {Object} options - Options for performance tracking
 */
export const usePerformanceTracking = (componentName, options = {}) => {
  const {
    trackMounts = true,
    trackRenders = true,
    trackUserInteractions = true,
    throttleMs = 100
  } = options;

  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const mountTime = useRef(null);
  const lastTrackTime = useRef(0);

  // Track component mount
  useEffect(() => {
    if (trackMounts) {
      mountTime.current = performance.now();
      console.debug(`🏃 Component ${componentName} mounted at ${mountTime.current}ms`);
    }

    return () => {
      if (trackMounts && mountTime.current) {
        const unmountTime = performance.now();
        const totalMountedTime = unmountTime - mountTime.current;
        console.debug(`🛑 Component ${componentName} unmounted after ${totalMountedTime}ms`);
      }
    };
  }, [componentName, trackMounts]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current += 1;
      const now = performance.now();
      
      // Throttle tracking to avoid too many measurements
      if (now - lastTrackTime.current > throttleMs) {
        if (renderStartTime.current) {
          trackComponentRenderEnd(componentName);
        }
        trackComponentRender(componentName);
        renderStartTime.current = now;
        lastTrackTime.current = now;
        
        console.debug(`🔄 Component ${componentName} render #${renderCount.current}`);
      }
    }
  });

  // Cleanup render tracking on unmount
  useEffect(() => {
    return () => {
      if (renderStartTime.current) {
        trackComponentRenderEnd(componentName);
      }
    };
  }, [componentName]);

  // Track user interactions
  const trackInteraction = useCallback((action, element) => {
    if (trackUserInteractions) {
      trackUserAction(`${componentName}-${action}`, element);
    }
  }, [componentName, trackUserInteractions]);

  // Get performance stats for this component
  const getStats = useCallback(() => {
    return {
      componentName,
      renderCount: renderCount.current,
      mountTime: mountTime.current,
      currentTime: performance.now(),
      totalMountedTime: mountTime.current ? performance.now() - mountTime.current : 0
    };
  }, [componentName]);

  return {
    trackInteraction,
    getStats,
    renderCount: renderCount.current
  };
};

/**
 * Hook for tracking specific performance metrics in a component
 * @param {string} metricName - Name of the metric to track
 */
export const usePerformanceMetric = (metricName) => {
  const startTime = useRef(null);
  const endTime = useRef(null);

  const startMeasurement = useCallback(() => {
    startTime.current = performance.now();
    endTime.current = null;
  }, []);

  const endMeasurement = useCallback(() => {
    if (startTime.current) {
      endTime.current = performance.now();
      const duration = endTime.current - startTime.current;
      
      // Log to performance monitoring service
      console.debug(`📊 Metric ${metricName}: ${duration}ms`);
      
      return duration;
    }
    return null;
  }, [metricName]);

  const getDuration = useCallback(() => {
    if (startTime.current && endTime.current) {
      return endTime.current - startTime.current;
    }
    return null;
  }, []);

  return {
    start: startMeasurement,
    end: endMeasurement,
    duration: getDuration(),
    isRunning: startTime.current !== null && endTime.current === null
  };
};

/**
 * Hook for tracking async operations performance
 * @param {string} operationName - Name of the async operation
 */
export const useAsyncPerformanceTracking = (operationName) => {
  const activeOperations = useRef(new Map());

  const trackAsyncOperation = useCallback(async (asyncFn, operationId = 'default') => {
    const startTime = performance.now();
    const fullOperationName = `${operationName}-${operationId}`;
    
    activeOperations.current.set(operationId, startTime);
    
    try {
      console.debug(`🚀 Starting async operation: ${fullOperationName}`);
      const result = await asyncFn();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.debug(`✅ Completed async operation: ${fullOperationName} in ${duration}ms`);
      
      activeOperations.current.delete(operationId);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.debug(`❌ Failed async operation: ${fullOperationName} after ${duration}ms`);
      
      activeOperations.current.delete(operationId);
      throw error;
    }
  }, [operationName]);

  const getActiveOperations = useCallback(() => {
    const now = performance.now();
    const active = [];
    
    activeOperations.current.forEach((startTime, operationId) => {
      active.push({
        operationId,
        duration: now - startTime,
        operationName: `${operationName}-${operationId}`
      });
    });
    
    return active;
  }, [operationName]);

  return {
    track: trackAsyncOperation,
    getActive: getActiveOperations
  };
};

/**
 * Hook for tracking memory usage
 */
export const useMemoryTracking = () => {
  const getMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
        totalMB: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100
      };
    }
    return null;
  }, []);

  const logMemoryUsage = useCallback((context = '') => {
    const memoryInfo = getMemoryInfo();
    if (memoryInfo) {
      console.debug(`🧠 Memory Usage ${context}: ${memoryInfo.usedMB}MB / ${memoryInfo.totalMB}MB`);
    }
  }, [getMemoryInfo]);

  return {
    getMemoryInfo,
    logMemoryUsage
  };
};

export default usePerformanceTracking; 