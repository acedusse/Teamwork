/**
 * useBottleneckAnalysis Hook
 * React hook for AI-driven bottleneck detection and workflow analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import bottleneckAnalysisAIService, { 
  BOTTLENECK_TYPES, 
  ANALYSIS_MODES, 
  SEVERITY_LEVELS 
} from '../services/BottleneckAnalysisAIService.js';

/**
 * Custom hook for managing bottleneck analysis with AI agents
 */
export const useBottleneckAnalysis = (config = {}) => {
  const {
    autoInitialize = true,
    defaultAnalysisMode = ANALYSIS_MODES.REAL_TIME,
    defaultTimeframe = '7d',
    enableAutoAnalysis = false,
    autoAnalysisInterval = 300000, // 5 minutes
    onBottleneckDetected = null,
    onSuggestionGenerated = null,
    onAnalysisComplete = null,
    onError = null
  } = config;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [error, setError] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);

  // Configuration state
  const [analysisMode, setAnalysisMode] = useState(defaultAnalysisMode);
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [focusAreas, setFocusAreas] = useState([]);
  const [severityThreshold, setSeverityThreshold] = useState(SEVERITY_LEVELS.LOW);

  // Refs for cleanup and intervals
  const autoAnalysisIntervalRef = useRef(null);
  const sessionIdRef = useRef(null);

  /**
   * Initialize the bottleneck analysis service
   */
  const initializeService = useCallback(async () => {
    if (isInitialized || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      await bottleneckAnalysisAIService.initialize();
      setIsInitialized(true);
    } catch (err) {
      const error = new Error(`Failed to initialize bottleneck analysis service: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing, onError]);

  /**
   * Start a new analysis session
   */
  const startSession = useCallback(async (workflowData, sessionConfig = {}) => {
    if (!isInitialized) {
      await initializeService();
    }

    const sessionId = sessionConfig.sessionId || `bottleneck_session_${Date.now()}`;
    sessionIdRef.current = sessionId;

    try {
      const session = await bottleneckAnalysisAIService.startAnalysisSession({
        sessionId,
        workflowData,
        analysisMode: sessionConfig.analysisMode || analysisMode,
        focusAreas: sessionConfig.focusAreas || focusAreas,
        timeframe: sessionConfig.timeframe || timeframe
      });

      setCurrentSession(session);
      setError(null);

      return session;
    } catch (err) {
      const error = new Error(`Failed to start analysis session: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    }
  }, [isInitialized, initializeService, analysisMode, focusAreas, timeframe, onError]);

  /**
   * Perform bottleneck analysis
   */
  const analyzeBottlenecks = useCallback(async (workflowData, options = {}) => {
    if (!currentSession) {
      throw new Error('No active analysis session. Please start a session first.');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisOptions = {
        includeHistorical: options.includeHistorical !== false,
        includePredictive: options.includePredictive || false,
        focusAreas: options.focusAreas || focusAreas,
        severityThreshold: options.severityThreshold || severityThreshold
      };

      const results = await bottleneckAnalysisAIService.analyzeBottlenecks(
        currentSession.sessionId,
        workflowData,
        analysisOptions
      );

      setAnalysisResults(results);
      setBottlenecks(results.bottlenecks);
      setSuggestions(results.suggestions);
      setLastAnalysisTime(new Date().toISOString());

      // Update analysis history
      const history = bottleneckAnalysisAIService.getAnalysisHistory(currentSession.sessionId);
      setAnalysisHistory(history);

      // Trigger callbacks
      if (onBottleneckDetected && results.bottlenecks.length > 0) {
        onBottleneckDetected(results.bottlenecks);
      }
      if (onSuggestionGenerated && results.suggestions.length > 0) {
        onSuggestionGenerated(results.suggestions);
      }
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

      return results;
    } catch (err) {
      const error = new Error(`Analysis failed: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentSession, focusAreas, severityThreshold, onBottleneckDetected, onSuggestionGenerated, onAnalysisComplete, onError]);

  /**
   * Generate additional optimization suggestions
   */
  const generateOptimizationSuggestions = useCallback(async (bottlenecksToAnalyze, context = {}) => {
    if (!currentSession) {
      throw new Error('No active analysis session. Please start a session first.');
    }

    setIsGeneratingSuggestions(true);
    setError(null);

    try {
      const newSuggestions = await bottleneckAnalysisAIService.generateOptimizationSuggestions(
        currentSession.sessionId,
        bottlenecksToAnalyze || bottlenecks,
        context
      );

      setSuggestions(prev => [...prev, ...newSuggestions]);

      if (onSuggestionGenerated && newSuggestions.length > 0) {
        onSuggestionGenerated(newSuggestions);
      }

      return newSuggestions;
    } catch (err) {
      const error = new Error(`Failed to generate optimization suggestions: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [currentSession, bottlenecks, onSuggestionGenerated, onError]);

  /**
   * Get historical patterns and trends
   */
  const analyzeHistoricalPatterns = useCallback(async (timeRange = '30d') => {
    if (!currentSession) {
      throw new Error('No active analysis session. Please start a session first.');
    }

    try {
      const patterns = await bottleneckAnalysisAIService.analyzeHistoricalPatterns(
        currentSession.sessionId,
        timeRange
      );

      return patterns;
    } catch (err) {
      const error = new Error(`Failed to analyze historical patterns: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    }
  }, [currentSession, onError]);

  /**
   * Predict future bottlenecks
   */
  const predictFutureBottlenecks = useCallback(async (predictionHorizon = '7d') => {
    if (!currentSession) {
      throw new Error('No active analysis session. Please start a session first.');
    }

    try {
      const predictions = await bottleneckAnalysisAIService.predictFutureBottlenecks(
        currentSession.sessionId,
        predictionHorizon
      );

      return predictions;
    } catch (err) {
      const error = new Error(`Failed to predict future bottlenecks: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    }
  }, [currentSession, onError]);

  /**
   * End the current analysis session
   */
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const summary = await bottleneckAnalysisAIService.endAnalysisSession(currentSession.sessionId);
      
      setCurrentSession(null);
      sessionIdRef.current = null;
      
      // Clear auto-analysis interval
      if (autoAnalysisIntervalRef.current) {
        clearInterval(autoAnalysisIntervalRef.current);
        autoAnalysisIntervalRef.current = null;
      }

      return summary;
    } catch (err) {
      const error = new Error(`Failed to end analysis session: ${err.message}`);
      setError(error);
      if (onError) onError(error);
      throw error;
    }
  }, [currentSession, onError]);

  /**
   * Get current session status
   */
  const getSessionStatus = useCallback(() => {
    if (!currentSession) return null;
    
    return bottleneckAnalysisAIService.getSessionStatus(currentSession.sessionId);
  }, [currentSession]);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(async () => {
    await endSession();
    setAnalysisResults(null);
    setBottlenecks([]);
    setSuggestions([]);
    setAnalysisHistory([]);
    setError(null);
    setLastAnalysisTime(null);
  }, [endSession]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig) => {
    if (newConfig.analysisMode) setAnalysisMode(newConfig.analysisMode);
    if (newConfig.timeframe) setTimeframe(newConfig.timeframe);
    if (newConfig.focusAreas) setFocusAreas(newConfig.focusAreas);
    if (newConfig.severityThreshold) setSeverityThreshold(newConfig.severityThreshold);
  }, []);

  /**
   * Filter bottlenecks by criteria
   */
  const filterBottlenecks = useCallback((criteria) => {
    return bottlenecks.filter(bottleneck => {
      if (criteria.severity && bottleneck.severity !== criteria.severity) return false;
      if (criteria.type && bottleneck.type !== criteria.type) return false;
      if (criteria.location && !bottleneck.location.includes(criteria.location)) return false;
      return true;
    });
  }, [bottlenecks]);

  /**
   * Filter suggestions by criteria
   */
  const filterSuggestions = useCallback((criteria) => {
    return suggestions.filter(suggestion => {
      if (criteria.priority && suggestion.priority !== criteria.priority) return false;
      if (criteria.impact && suggestion.impact !== criteria.impact) return false;
      if (criteria.effort && suggestion.effort !== criteria.effort) return false;
      if (criteria.implementable !== undefined && suggestion.implementable !== criteria.implementable) return false;
      return true;
    });
  }, [suggestions]);

  /**
   * Get analysis summary statistics
   */
  const getAnalysisSummary = useCallback(() => {
    if (!analysisResults) return null;

    return {
      totalBottlenecks: bottlenecks.length,
      criticalBottlenecks: bottlenecks.filter(b => b.severity === SEVERITY_LEVELS.CRITICAL).length,
      highPriorityBottlenecks: bottlenecks.filter(b => b.severity === SEVERITY_LEVELS.HIGH).length,
      totalSuggestions: suggestions.length,
      implementableSuggestions: suggestions.filter(s => s.implementable).length,
      lastAnalysis: lastAnalysisTime,
      sessionStatus: getSessionStatus(),
      severityDistribution: analysisResults.summary?.severityDistribution || {}
    };
  }, [analysisResults, bottlenecks, suggestions, lastAnalysisTime, getSessionStatus]);

  // Auto-initialization effect
  useEffect(() => {
    if (autoInitialize && !isInitialized && !isInitializing) {
      initializeService().catch(console.error);
    }
  }, [autoInitialize, isInitialized, isInitializing, initializeService]);

  // Auto-analysis effect
  useEffect(() => {
    if (enableAutoAnalysis && currentSession && autoAnalysisInterval > 0) {
      autoAnalysisIntervalRef.current = setInterval(() => {
        // This would need workflow data to be passed in somehow
        // For now, we'll just log that auto-analysis is enabled
        console.log('Auto-analysis interval triggered - workflow data needed');
      }, autoAnalysisInterval);

      return () => {
        if (autoAnalysisIntervalRef.current) {
          clearInterval(autoAnalysisIntervalRef.current);
          autoAnalysisIntervalRef.current = null;
        }
      };
    }
  }, [enableAutoAnalysis, currentSession, autoAnalysisInterval]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoAnalysisIntervalRef.current) {
        clearInterval(autoAnalysisIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isInitializing,
    currentSession,
    isAnalyzing,
    isGeneratingSuggestions,
    analysisResults,
    bottlenecks,
    suggestions,
    analysisHistory,
    error,
    lastAnalysisTime,

    // Configuration
    analysisMode,
    timeframe,
    focusAreas,
    severityThreshold,

    // Actions
    initializeService,
    startSession,
    analyzeBottlenecks,
    generateOptimizationSuggestions,
    analyzeHistoricalPatterns,
    predictFutureBottlenecks,
    endSession,
    clearError,
    reset,
    updateConfig,

    // Utilities
    getSessionStatus,
    filterBottlenecks,
    filterSuggestions,
    getAnalysisSummary,

    // Constants
    BOTTLENECK_TYPES,
    ANALYSIS_MODES,
    SEVERITY_LEVELS
  };
};

export default useBottleneckAnalysis; 