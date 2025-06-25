/**
 * useBrainstormingAI.js
 * Custom hook for integrating AI agents into brainstorming workflows
 * Provides a bridge between the CollaborativePlanningTab and BrainstormingAIService
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import brainstormingAIService, { BRAINSTORMING_MODES, IDEA_TYPES } from '../services/BrainstormingAIService.js';

/**
 * Custom hook for AI-powered brainstorming functionality
 */
export const useBrainstormingAI = (initialConfig = {}) => {
  // State management
  const [aiSession, setAiSession] = useState(null);
  const [agentParticipants, setAgentParticipants] = useState([]);
  const [agentContributions, setAgentContributions] = useState([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isEvaluatingIdeas, setIsEvaluatingIdeas] = useState(false);
  const [isClusteringIdeas, setIsClusteringIdeas] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState(null);
  const [agentRecommendations, setAgentRecommendations] = useState([]);
  const [ideaClusters, setIdeaClusters] = useState([]);
  const [agentVotes, setAgentVotes] = useState([]);

  // Configuration
  const [config, setConfig] = useState({
    focusArea: 'Core Features',
    duration: 90,
    participantTypes: ['optimization', 'estimation', 'planning'],
    mode: BRAINSTORMING_MODES.IDEA_GENERATION,
    autoGenerateIdeas: true,
    autoEvaluateIdeas: true,
    enableRealTimeVoting: true,
    ...initialConfig
  });

  // Refs for cleanup
  const sessionIdRef = useRef(null);
  const contributionTimerRef = useRef(null);

  /**
   * Initialize the AI brainstorming service
   */
  const initializeAI = useCallback(async () => {
    try {
      await brainstormingAIService.initialize();
      return true;
    } catch (error) {
      console.error('Failed to initialize AI brainstorming service:', error);
      setError('Failed to initialize AI service. Please try again.');
      return false;
    }
  }, []);

  /**
   * Start an AI-powered brainstorming session
   */
  const startAISession = useCallback(async (sessionConfig = {}) => {
    try {
      setError(null);
      
      const sessionId = `brainstorm_${Date.now()}`;
      const mergedConfig = { ...config, ...sessionConfig, sessionId };
      
      const result = await brainstormingAIService.startBrainstormingSession(mergedConfig);
      
      setAiSession(result);
      setAgentParticipants(result.participants);
      setSessionActive(true);
      sessionIdRef.current = sessionId;
      
      // Start periodic contribution polling if enabled
      if (config.autoGenerateIdeas) {
        startContributionPolling();
      }
      
      return result;
    } catch (error) {
      console.error('Failed to start AI session:', error);
      setError('Failed to start AI session. Please try again.');
      throw error;
    }
  }, [config]);

  /**
   * Generate AI agent ideas for a specific type
   */
  const generateAgentIdeas = useCallback(async (ideaType, context = {}) => {
    if (!sessionIdRef.current) {
      throw new Error('No active AI session');
    }

    try {
      setIsGeneratingIdeas(true);
      setError(null);

      const ideas = await brainstormingAIService.generateAgentIdeas(
        sessionIdRef.current,
        ideaType,
        context
      );

      // Transform AI ideas to match the expected format
      const transformedIdeas = ideas.map(contribution => ({
        id: `ai_idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: contribution.type,
        title: contribution.idea.title,
        content: contribution.idea.description,
        author: contribution.agentName,
        authorType: 'ai-agent',
        agentId: contribution.agentId,
        rationale: contribution.idea.rationale,
        implementation: contribution.idea.implementation,
        estimatedEffort: contribution.idea.estimatedEffort,
        expectedImpact: contribution.idea.expectedImpact,
        tags: [...(contribution.idea.tags || []), 'ai-generated'],
        timestamp: contribution.timestamp,
        votes: 0
      }));

      // Update contributions
      setAgentContributions(prev => [...prev, ...ideas]);

      return transformedIdeas;
    } catch (error) {
      console.error('Failed to generate agent ideas:', error);
      setError('Failed to generate AI ideas. Please try again.');
      throw error;
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, []);

  /**
   * Get AI agent evaluation of ideas
   */
  const evaluateIdeasWithAI = useCallback(async (ideas, criteria = []) => {
    if (!sessionIdRef.current) {
      throw new Error('No active AI session');
    }

    try {
      setIsEvaluatingIdeas(true);
      setError(null);

      const evaluations = await brainstormingAIService.evaluateIdeas(
        sessionIdRef.current,
        ideas,
        criteria
      );

      // Transform evaluations into recommendations
      const recommendations = evaluations.flatMap(evaluation => 
        evaluation.evaluation.evaluations.map(evalItem => ({
          id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ideaId: evalItem.ideaId,
          agentId: evaluation.agentId,
          agentName: evaluation.agentName,
          agentType: evaluation.agentType,
          score: evalItem.score,
          strengths: evalItem.strengths || [],
          concerns: evalItem.concerns || [],
          recommendations: evalItem.recommendations || [],
          complexity: evalItem.complexity,
          timestamp: evaluation.timestamp
        }))
      );

      setAgentRecommendations(prev => [...prev, ...recommendations]);

      return recommendations;
    } catch (error) {
      console.error('Failed to evaluate ideas with AI:', error);
      setError('Failed to evaluate ideas. Please try again.');
      throw error;
    } finally {
      setIsEvaluatingIdeas(false);
    }
  }, []);

  /**
   * Cluster ideas using AI
   */
  const clusterIdeasWithAI = useCallback(async (ideas) => {
    if (!sessionIdRef.current) {
      throw new Error('No active AI session');
    }

    try {
      setIsClusteringIdeas(true);
      setError(null);

      const clusters = await brainstormingAIService.clusterIdeas(
        sessionIdRef.current,
        ideas
      );

      setIdeaClusters(clusters.clusters || []);

      return clusters.clusters || [];
    } catch (error) {
      console.error('Failed to cluster ideas with AI:', error);
      setError('Failed to cluster ideas. Please try again.');
      throw error;
    } finally {
      setIsClusteringIdeas(false);
    }
  }, []);

  /**
   * Get AI agent votes on ideas
   */
  const getAgentVotes = useCallback(async (ideas, criteria = []) => {
    if (!sessionIdRef.current) {
      throw new Error('No active AI session');
    }

    try {
      setIsVoting(true);
      setError(null);

      const votes = await brainstormingAIService.voteOnIdeas(
        sessionIdRef.current,
        ideas,
        criteria
      );

      // Transform votes into a more usable format
      const transformedVotes = votes.flatMap(voteData =>
        voteData.votes.votes.map(vote => ({
          id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ideaId: vote.ideaId,
          agentId: voteData.agentId,
          agentName: voteData.agentName,
          agentType: voteData.agentType,
          score: vote.score,
          justification: vote.justification,
          timestamp: voteData.timestamp
        }))
      );

      setAgentVotes(prev => [...prev, ...transformedVotes]);

      return transformedVotes;
    } catch (error) {
      console.error('Failed to get agent votes:', error);
      setError('Failed to get AI votes. Please try again.');
      throw error;
    } finally {
      setIsVoting(false);
    }
  }, []);

  /**
   * End the AI brainstorming session
   */
  const endAISession = useCallback(async () => {
    if (!sessionIdRef.current) {
      return null;
    }

    try {
      const summary = await brainstormingAIService.endBrainstormingSession(
        sessionIdRef.current
      );

      // Cleanup
      setSessionActive(false);
      setAiSession(null);
      stopContributionPolling();
      sessionIdRef.current = null;

      return summary;
    } catch (error) {
      console.error('Failed to end AI session:', error);
      setError('Failed to end AI session properly.');
      throw error;
    }
  }, []);

  /**
   * Get session status and statistics
   */
  const getSessionStatus = useCallback(() => {
    if (!sessionIdRef.current) {
      return null;
    }

    return brainstormingAIService.getSessionStatus(sessionIdRef.current);
  }, []);

  /**
   * Start periodic contribution polling
   */
  const startContributionPolling = useCallback(() => {
    if (contributionTimerRef.current) {
      clearInterval(contributionTimerRef.current);
    }

    contributionTimerRef.current = setInterval(() => {
      if (sessionIdRef.current) {
        const contributions = brainstormingAIService.getSessionContributions(
          sessionIdRef.current
        );
        setAgentContributions(contributions);
      }
    }, 5000); // Poll every 5 seconds
  }, []);

  /**
   * Stop contribution polling
   */
  const stopContributionPolling = useCallback(() => {
    if (contributionTimerRef.current) {
      clearInterval(contributionTimerRef.current);
      contributionTimerRef.current = null;
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all AI state
   */
  const resetAIState = useCallback(() => {
    setAiSession(null);
    setAgentParticipants([]);
    setAgentContributions([]);
    setAgentRecommendations([]);
    setIdeaClusters([]);
    setAgentVotes([]);
    setSessionActive(false);
    setError(null);
    stopContributionPolling();
    sessionIdRef.current = null;
  }, [stopContributionPolling]);

  /**
   * Get recommendations for a specific idea
   */
  const getIdeaRecommendations = useCallback((ideaId) => {
    return agentRecommendations.filter(rec => rec.ideaId === ideaId);
  }, [agentRecommendations]);

  /**
   * Get votes for a specific idea
   */
  const getIdeaVotes = useCallback((ideaId) => {
    return agentVotes.filter(vote => vote.ideaId === ideaId);
  }, [agentVotes]);

  /**
   * Get agent statistics
   */
  const getAgentStats = useCallback(() => {
    const stats = agentParticipants.map(agent => {
      const contributions = agentContributions.filter(
        contrib => contrib.agentId === agent.id
      );
      const recommendations = agentRecommendations.filter(
        rec => rec.agentId === agent.id
      );
      const votes = agentVotes.filter(
        vote => vote.agentId === agent.id
      );

      return {
        ...agent,
        contributionsCount: contributions.length,
        recommendationsCount: recommendations.length,
        votesCount: votes.length,
        lastActivity: contributions.length > 0 
          ? contributions[contributions.length - 1].timestamp 
          : null
      };
    });

    return stats;
  }, [agentParticipants, agentContributions, agentRecommendations, agentVotes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContributionPolling();
      if (sessionIdRef.current) {
        brainstormingAIService.endBrainstormingSession(sessionIdRef.current)
          .catch(console.error);
      }
    };
  }, [stopContributionPolling]);

  // Initialize AI service on mount
  useEffect(() => {
    initializeAI();
  }, [initializeAI]);

  return {
    // State
    aiSession,
    agentParticipants,
    agentContributions,
    agentRecommendations,
    ideaClusters,
    agentVotes,
    sessionActive,
    error,
    config,
    
    // Loading states
    isGeneratingIdeas,
    isEvaluatingIdeas,
    isClusteringIdeas,
    isVoting,
    
    // Actions
    startAISession,
    endAISession,
    generateAgentIdeas,
    evaluateIdeasWithAI,
    clusterIdeasWithAI,
    getAgentVotes,
    updateConfig,
    clearError,
    resetAIState,
    
    // Utilities
    getSessionStatus,
    getIdeaRecommendations,
    getIdeaVotes,
    getAgentStats,
    
    // Constants
    BRAINSTORMING_MODES,
    IDEA_TYPES
  };
};

export default useBrainstormingAI; 