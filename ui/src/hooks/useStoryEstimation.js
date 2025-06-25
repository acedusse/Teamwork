/**
 * useStoryEstimation.js
 * React hook for AI-powered story point estimation
 * Provides state management and integration with StoryEstimationAIService
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import storyEstimationAIService, { ESTIMATION_SCALES } from '../services/StoryEstimationAIService';

/**
 * Custom hook for story point estimation using AI agents
 */
export const useStoryEstimation = (options = {}) => {
  const {
    defaultScale = ESTIMATION_SCALES.FIBONACCI,
    autoInitialize = true,
    enableHistory = true,
    maxHistorySize = 100
  } = options;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBatchEstimating, setIsBatchEstimating] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [currentEstimation, setCurrentEstimation] = useState(null);
  const [batchEstimations, setBatchEstimations] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [refinedEstimation, setRefinedEstimation] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [estimationHistory, setEstimationHistory] = useState([]);

  // Configuration state
  const [estimationScale, setEstimationScale] = useState(defaultScale);
  const [teamContext, setTeamContext] = useState(null);
  const [historicalContext, setHistoricalContext] = useState(null);

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef(null);
  const estimationTimeoutRef = useRef(null);

  /**
   * Initialize the estimation service
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);
      await storyEstimationAIService.initialize();
      setIsInitialized(true);
      
      // Load estimation history if enabled
      if (enableHistory) {
        const history = storyEstimationAIService.getEstimationHistory({ limit: maxHistorySize });
        setEstimationHistory(history.history);
      }
      
      return true;
    } catch (err) {
      setError(`Failed to initialize estimation service: ${err.message}`);
      return false;
    }
  }, [enableHistory, maxHistorySize]);

  /**
   * Estimate story points for a single story
   */
  const estimateStoryPoints = useCallback(async (story, customOptions = {}) => {
    if (!isInitialized) {
      await initialize();
    }

    setIsEstimating(true);
    setError(null);
    setCurrentEstimation(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const estimationOptions = {
        scale: estimationScale,
        includeConfidence: true,
        includeBreakdown: true,
        teamContext,
        historicalContext,
        ...customOptions
      };

      const estimation = await storyEstimationAIService.estimateStoryPoints(story, estimationOptions);
      
      setCurrentEstimation(estimation);
      
      // Update history if enabled
      if (enableHistory) {
        setEstimationHistory(prev => [estimation, ...prev.slice(0, maxHistorySize - 1)]);
      }

      return estimation;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(`Failed to estimate story points: ${err.message}`);
      }
      throw err;
    } finally {
      setIsEstimating(false);
      abortControllerRef.current = null;
    }
  }, [isInitialized, initialize, estimationScale, teamContext, historicalContext, enableHistory, maxHistorySize]);

  /**
   * Estimate multiple stories in batch
   */
  const estimateMultipleStories = useCallback(async (stories, customOptions = {}) => {
    if (!isInitialized) {
      await initialize();
    }

    setIsBatchEstimating(true);
    setError(null);
    setBatchEstimations(null);

    try {
      const batchOptions = {
        scale: estimationScale,
        parallel: true,
        maxConcurrency: 3,
        includeComparison: true,
        teamContext,
        historicalContext,
        ...customOptions
      };

      const result = await storyEstimationAIService.estimateMultipleStories(stories, batchOptions);
      
      setBatchEstimations(result);
      
      // Update history if enabled
      if (enableHistory) {
        setEstimationHistory(prev => [
          ...result.estimations,
          ...prev.slice(0, maxHistorySize - result.estimations.length)
        ]);
      }

      return result;
    } catch (err) {
      setError(`Failed to estimate multiple stories: ${err.message}`);
      throw err;
    } finally {
      setIsBatchEstimating(false);
    }
  }, [isInitialized, initialize, estimationScale, teamContext, historicalContext, enableHistory, maxHistorySize]);

  /**
   * Get estimation suggestions based on historical data
   */
  const getEstimationSuggestions = useCallback(async (story, teamHistory = []) => {
    if (!isInitialized) {
      await initialize();
    }

    setIsLoadingSuggestions(true);
    setError(null);
    setSuggestions(null);

    try {
      const suggestionResult = await storyEstimationAIService.getEstimationSuggestions(story, teamHistory);
      setSuggestions(suggestionResult);
      return suggestionResult;
    } catch (err) {
      setError(`Failed to get estimation suggestions: ${err.message}`);
      throw err;
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [isInitialized, initialize]);

  /**
   * Refine estimation based on team feedback
   */
  const refineEstimation = useCallback(async (originalEstimation, teamFeedback, actualEffort = null) => {
    if (!isInitialized) {
      await initialize();
    }

    setIsRefining(true);
    setError(null);
    setRefinedEstimation(null);

    try {
      const refined = await storyEstimationAIService.refineEstimation(
        originalEstimation,
        teamFeedback,
        actualEffort
      );
      
      setRefinedEstimation(refined);
      
      // Update history if enabled
      if (enableHistory) {
        setEstimationHistory(prev => [refined, ...prev.slice(0, maxHistorySize - 1)]);
      }

      return refined;
    } catch (err) {
      setError(`Failed to refine estimation: ${err.message}`);
      throw err;
    } finally {
      setIsRefining(false);
    }
  }, [isInitialized, initialize, enableHistory, maxHistorySize]);

  /**
   * Analyze team estimation patterns
   */
  const analyzeEstimationPatterns = useCallback(async (teamEstimations) => {
    if (!isInitialized) {
      await initialize();
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);

    try {
      const analysis = await storyEstimationAIService.analyzeEstimationPatterns(teamEstimations);
      setAnalysisResults(analysis);
      return analysis;
    } catch (err) {
      setError(`Failed to analyze estimation patterns: ${err.message}`);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [isInitialized, initialize]);

  /**
   * Cancel ongoing estimation operations
   */
  const cancelEstimation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (estimationTimeoutRef.current) {
      clearTimeout(estimationTimeoutRef.current);
    }
    
    setIsEstimating(false);
    setIsBatchEstimating(false);
    setIsLoadingSuggestions(false);
    setIsRefining(false);
    setIsAnalyzing(false);
  }, []);

  /**
   * Clear all estimation results
   */
  const clearResults = useCallback(() => {
    setCurrentEstimation(null);
    setBatchEstimations(null);
    setSuggestions(null);
    setRefinedEstimation(null);
    setAnalysisResults(null);
    setError(null);
  }, []);

  /**
   * Clear estimation history
   */
  const clearHistory = useCallback(() => {
    setEstimationHistory([]);
  }, []);

  /**
   * Update team context for future estimations
   */
  const updateTeamContext = useCallback((context) => {
    setTeamContext(context);
  }, []);

  /**
   * Update historical context for future estimations
   */
  const updateHistoricalContext = useCallback((context) => {
    setHistoricalContext(context);
  }, []);

  /**
   * Change estimation scale
   */
  const changeEstimationScale = useCallback((scale) => {
    if (Object.values(ESTIMATION_SCALES).includes(scale)) {
      setEstimationScale(scale);
    } else {
      setError('Invalid estimation scale provided');
    }
  }, []);

  /**
   * Get estimation metrics from history
   */
  const getEstimationMetrics = useCallback(() => {
    if (!enableHistory || estimationHistory.length === 0) {
      return null;
    }

    const totalEstimations = estimationHistory.length;
    const averageConfidence = estimationHistory.reduce((sum, est) => sum + (est.confidence || 0), 0) / totalEstimations;
    const averagePoints = estimationHistory.reduce((sum, est) => sum + est.estimatedPoints, 0) / totalEstimations;
    
    const pointDistribution = estimationHistory.reduce((dist, est) => {
      const points = est.estimatedPoints;
      dist[points] = (dist[points] || 0) + 1;
      return dist;
    }, {});

    return {
      totalEstimations,
      averageConfidence: Math.round(averageConfidence),
      averagePoints: Math.round(averagePoints * 10) / 10,
      pointDistribution,
      lastEstimation: estimationHistory[0]?.timestamp
    };
  }, [enableHistory, estimationHistory]);

  /**
   * Export estimation data
   */
  const exportEstimationData = useCallback(() => {
    const exportData = {
      estimationHistory,
      currentEstimation,
      batchEstimations,
      suggestions,
      refinedEstimation,
      analysisResults,
      configuration: {
        estimationScale,
        teamContext,
        historicalContext
      },
      metrics: getEstimationMetrics(),
      exportedAt: new Date().toISOString()
    };

    return exportData;
  }, [
    estimationHistory,
    currentEstimation,
    batchEstimations,
    suggestions,
    refinedEstimation,
    analysisResults,
    estimationScale,
    teamContext,
    historicalContext,
    getEstimationMetrics
  ]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      initialize().catch(err => {
        console.error('Auto-initialization failed:', err);
      });
    }
  }, [autoInitialize, isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelEstimation();
    };
  }, [cancelEstimation]);

  // Return hook interface
  return {
    // State
    isInitialized,
    isEstimating,
    isBatchEstimating,
    isLoadingSuggestions,
    isRefining,
    isAnalyzing,
    error,
    
    // Results
    currentEstimation,
    batchEstimations,
    suggestions,
    refinedEstimation,
    analysisResults,
    estimationHistory,
    
    // Configuration
    estimationScale,
    teamContext,
    historicalContext,
    
    // Actions
    initialize,
    estimateStoryPoints,
    estimateMultipleStories,
    getEstimationSuggestions,
    refineEstimation,
    analyzeEstimationPatterns,
    cancelEstimation,
    clearResults,
    clearHistory,
    updateTeamContext,
    updateHistoricalContext,
    changeEstimationScale,
    
    // Utilities
    getEstimationMetrics,
    exportEstimationData,
    
    // Constants
    availableScales: ESTIMATION_SCALES,
    
    // Computed values
    isLoading: isEstimating || isBatchEstimating || isLoadingSuggestions || isRefining || isAnalyzing,
    hasResults: !!(currentEstimation || batchEstimations || suggestions || refinedEstimation || analysisResults),
    hasHistory: estimationHistory.length > 0
  };
};

export default useStoryEstimation; 