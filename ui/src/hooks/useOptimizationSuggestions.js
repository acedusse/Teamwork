/**
 * useOptimizationSuggestions.js
 * React hook for managing AI-driven optimization suggestions
 * Provides state management and integration with OptimizationSuggestionsAIService
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import optimizationSuggestionsAIService, { 
  OPTIMIZATION_MODES, 
  SUGGESTION_TYPES, 
  SUGGESTION_PRIORITY,
  IMPLEMENTATION_EFFORT 
} from '../services/OptimizationSuggestionsAIService.js';

/**
 * Custom hook for optimization suggestions management
 */
export const useOptimizationSuggestions = (options = {}) => {
  const {
    autoInitialize = true,
    autoGenerate = false,
    workflowData = null,
    optimizationMode = OPTIMIZATION_MODES.COMPREHENSIVE,
    focusAreas = [],
    timeframe = '30d',
    onSuggestionGenerated = null,
    onError = null,
    onSessionStatusChange = null
  } = options;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);

  // Configuration state
  const [config, setConfig] = useState({
    optimizationMode,
    focusAreas,
    timeframe,
    priorityFilter: null,
    typeFilter: null,
    includeHistoricalAnalysis: true,
    includePredictiveInsights: false
  });

  // Refs for managing intervals and preventing memory leaks
  const sessionIdRef = useRef(null);
  const isActiveRef = useRef(true);

  /**
   * Initialize the optimization suggestions service
   */
  const initialize = useCallback(async () => {
    if (isInitialized) return true;

    try {
      setIsLoading(true);
      setError(null);

      await optimizationSuggestionsAIService.initialize();
      
      if (isActiveRef.current) {
        setIsInitialized(true);
        return true;
      }
    } catch (err) {
      console.error('Failed to initialize optimization suggestions service:', err);
      const errorMessage = err.message || 'Failed to initialize optimization suggestions service';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage, err);
      }
      return false;
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized, onError]);

  /**
   * Start a new optimization session
   */
  const startSession = useCallback(async (sessionConfig = {}) => {
    if (!isInitialized) {
      await initialize();
    }

    try {
      setIsLoading(true);
      setError(null);

      const newSessionId = `opt_session_${Date.now()}`;
      const sessionResult = await optimizationSuggestionsAIService.startOptimizationSession({
        sessionId: newSessionId,
        workflowData: sessionConfig.workflowData || workflowData,
        optimizationMode: sessionConfig.optimizationMode || config.optimizationMode,
        focusAreas: sessionConfig.focusAreas || config.focusAreas,
        timeframe: sessionConfig.timeframe || config.timeframe
      });

      if (isActiveRef.current) {
        setSessionId(newSessionId);
        sessionIdRef.current = newSessionId;
        setSessionStatus(sessionResult);
        
        if (onSessionStatusChange) {
          onSessionStatusChange(sessionResult);
        }
      }

      return sessionResult;
    } catch (err) {
      console.error('Failed to start optimization session:', err);
      const errorMessage = err.message || 'Failed to start optimization session';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage, err);
      }
      throw err;
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized, initialize, workflowData, config, onSessionStatusChange, onError]);

  /**
   * Generate optimization suggestions
   */
  const generateSuggestions = useCallback(async (options = {}) => {
    const currentSessionId = sessionIdRef.current || sessionId;
    if (!currentSessionId) {
      throw new Error('No active optimization session. Please start a session first.');
    }

    try {
      setIsGenerating(true);
      setError(null);

      const result = await optimizationSuggestionsAIService.generateOptimizationSuggestions(
        currentSessionId,
        options.workflowData || workflowData,
        {
          includeHistoricalAnalysis: options.includeHistoricalAnalysis ?? config.includeHistoricalAnalysis,
          includePredictiveInsights: options.includePredictiveInsights ?? config.includePredictiveInsights,
          priorityFilter: options.priorityFilter ?? config.priorityFilter,
          typeFilter: options.typeFilter ?? config.typeFilter
        }
      );

      if (isActiveRef.current) {
        setSuggestions(result.suggestions);
        setMetadata(result.metadata);
        
        // Update history
        setHistory(prev => [...prev, {
          timestamp: new Date().toISOString(),
          suggestionCount: result.suggestions.length,
          mode: result.metadata.optimizationMode
        }]);

        if (onSuggestionGenerated) {
          onSuggestionGenerated(result.suggestions, result.metadata);
        }
      }

      return result;
    } catch (err) {
      console.error('Failed to generate optimization suggestions:', err);
      const errorMessage = err.message || 'Failed to generate optimization suggestions';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage, err);
      }
      throw err;
    } finally {
      if (isActiveRef.current) {
        setIsGenerating(false);
      }
    }
  }, [sessionId, workflowData, config, onSuggestionGenerated, onError]);

  /**
   * End the current optimization session
   */
  const endSession = useCallback(async () => {
    const currentSessionId = sessionIdRef.current || sessionId;
    if (!currentSessionId) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const summary = await optimizationSuggestionsAIService.endOptimizationSession(currentSessionId);
      
      if (isActiveRef.current) {
        setSessionId(null);
        sessionIdRef.current = null;
        setSessionStatus(null);
        setSuggestions([]);
        setMetadata(null);
      }

      return summary;
    } catch (err) {
      console.error('Failed to end optimization session:', err);
      const errorMessage = err.message || 'Failed to end optimization session';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage, err);
      }
      throw err;
    } finally {
      if (isActiveRef.current) {
        setIsLoading(false);
      }
    }
  }, [sessionId, onError]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Clear current suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setMetadata(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get suggestions filtered by criteria
   */
  const getFilteredSuggestions = useCallback((filters = {}) => {
    let filtered = [...suggestions];

    if (filters.priority) {
      filtered = filtered.filter(s => s.priority === filters.priority);
    }

    if (filters.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters.effort) {
      filtered = filtered.filter(s => s.effort === filters.effort);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(term) || 
        s.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [suggestions]);

  /**
   * Get suggestions grouped by type
   */
  const getSuggestionsByType = useCallback(() => {
    const grouped = {};
    suggestions.forEach(suggestion => {
      const type = suggestion.type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(suggestion);
    });
    return grouped;
  }, [suggestions]);

  /**
   * Get suggestions grouped by priority
   */
  const getSuggestionsByPriority = useCallback(() => {
    const grouped = {};
    suggestions.forEach(suggestion => {
      const priority = suggestion.priority || 'medium';
      if (!grouped[priority]) {
        grouped[priority] = [];
      }
      grouped[priority].push(suggestion);
    });
    return grouped;
  }, [suggestions]);

  /**
   * Get summary statistics
   */
  const getSummaryStats = useCallback(() => {
    if (suggestions.length === 0) {
      return {
        total: 0,
        byPriority: {},
        byType: {},
        byEffort: {},
        averageConfidence: 0
      };
    }

    const byPriority = {};
    const byType = {};
    const byEffort = {};
    let totalConfidence = 0;

    suggestions.forEach(suggestion => {
      // Count by priority
      const priority = suggestion.priority || 'medium';
      byPriority[priority] = (byPriority[priority] || 0) + 1;

      // Count by type
      const type = suggestion.type || 'other';
      byType[type] = (byType[type] || 0) + 1;

      // Count by effort
      const effort = suggestion.effort || 'medium-term';
      byEffort[effort] = (byEffort[effort] || 0) + 1;

      // Sum confidence
      totalConfidence += suggestion.confidence || 0.8;
    });

    return {
      total: suggestions.length,
      byPriority,
      byType,
      byEffort,
      averageConfidence: totalConfidence / suggestions.length
    };
  }, [suggestions]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize();
    }
  }, [autoInitialize, isInitialized, initialize]);

  // Auto-generate suggestions when workflow data changes
  useEffect(() => {
    if (autoGenerate && isInitialized && sessionId && workflowData) {
      generateSuggestions();
    }
  }, [autoGenerate, isInitialized, sessionId, workflowData, generateSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (sessionIdRef.current) {
        optimizationSuggestionsAIService.endOptimizationSession(sessionIdRef.current)
          .catch(err => console.warn('Failed to cleanup optimization session:', err));
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    isGenerating,
    error,
    sessionId,
    sessionStatus,
    suggestions,
    metadata,
    history,
    config,

    // Actions
    initialize,
    startSession,
    generateSuggestions,
    endSession,
    updateConfig,
    clearSuggestions,
    clearError,

    // Utilities
    getFilteredSuggestions,
    getSuggestionsByType,
    getSuggestionsByPriority,
    getSummaryStats,

    // Constants for easy access
    OPTIMIZATION_MODES,
    SUGGESTION_TYPES,
    SUGGESTION_PRIORITY,
    IMPLEMENTATION_EFFORT
  };
};

export default useOptimizationSuggestions; 