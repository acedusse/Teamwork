/**
 * StoryEstimationAIService.js
 * Specialized service for AI-powered story point estimation
 * Integrates with AIAgentService for intelligent story analysis and estimation
 */

import aiAgentService, { AGENT_TYPES, AGENT_CAPABILITIES } from './AIAgentService.js';

// Estimation complexity factors
export const ESTIMATION_FACTORS = {
  TECHNICAL_COMPLEXITY: 'technical-complexity',
  BUSINESS_COMPLEXITY: 'business-complexity',
  UNCERTAINTY: 'uncertainty',
  DEPENDENCIES: 'dependencies',
  TESTING_EFFORT: 'testing-effort',
  INTEGRATION_COMPLEXITY: 'integration-complexity'
};

// Story point scales
export const ESTIMATION_SCALES = {
  FIBONACCI: [1, 2, 3, 5, 8, 13, 21],
  POWER_OF_TWO: [1, 2, 4, 8, 16, 32],
  LINEAR: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  T_SHIRT: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
};

// Convert T-shirt sizes to numeric values
const T_SHIRT_TO_NUMERIC = {
  'XS': 1,
  'S': 2,
  'M': 3,
  'L': 5,
  'XL': 8,
  'XXL': 13
};

/**
 * Story Estimation AI Service class
 */
class StoryEstimationAIService {
  constructor() {
    this.estimationSessions = new Map();
    this.historicalData = new Map();
    this.teamVelocityData = new Map();
    this.estimationHistory = [];
    this.initialized = false;
  }

  /**
   * Initialize the story estimation AI service
   */
  async initialize() {
    try {
      // Ensure base AI agent service is initialized
      if (!aiAgentService.initialized) {
        await aiAgentService.initialize();
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize StoryEstimationAIService:', error);
      throw error;
    }
  }

  /**
   * Estimate story points for a single story using AI agents
   */
  async estimateStoryPoints(story, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      scale = ESTIMATION_SCALES.FIBONACCI,
      includeConfidence = true,
      includeBreakdown = true,
      teamContext = null,
      historicalContext = null
    } = options;

    try {
      // Get estimation agent (prefer estimation type, fallback to others)
      const agents = aiAgentService.getAllAgents();
      const estimationAgent = agents.find(agent => 
        agent.type === AGENT_TYPES.ESTIMATION
      ) || agents.find(agent => 
        agent.capabilities.includes(AGENT_CAPABILITIES.STORY_POINT_ESTIMATION)
      ) || agents[0];

      if (!estimationAgent) {
        throw new Error('No suitable AI agent found for story estimation');
      }

      // Create estimation session
      const sessionId = await aiAgentService.createSession(estimationAgent.id, {
        type: 'story-estimation',
        story: story.id,
        scale: scale.join(','),
        teamContext,
        historicalContext
      });

      // Build estimation prompt
      const prompt = this._buildEstimationPrompt(story, scale, teamContext, historicalContext);

      // Get AI estimation
      const response = await aiAgentService.invokeAgent(
        estimationAgent.id,
        { prompt, type: 'story-estimation' },
        {
          sessionId,
          structured: true,
          aiParams: {
            schema: this._getEstimationSchema(scale),
            temperature: 0.3 // Lower temperature for more consistent estimates
          }
        }
      );

      const estimation = response.response.content;

      // Process and validate estimation
      const processedEstimation = this._processEstimation(estimation, scale);

      // Store estimation for learning
      this._recordEstimation(story, processedEstimation, estimationAgent.id);

      // End session
      await aiAgentService.endSession(sessionId);

      return {
        storyId: story.id,
        estimatedPoints: processedEstimation.points,
        confidence: processedEstimation.confidence,
        breakdown: includeBreakdown ? processedEstimation.breakdown : null,
        reasoning: processedEstimation.reasoning,
        factors: processedEstimation.factors,
        agentId: estimationAgent.id,
        agentName: estimationAgent.name,
        scale: scale,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to estimate story points:', error);
      throw error;
    }
  }

  /**
   * Estimate multiple stories in batch
   */
  async estimateMultipleStories(stories, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      parallel = true,
      maxConcurrency = 3,
      includeComparison = true
    } = options;

    try {
      let estimations;

      if (parallel && stories.length > 1) {
        // Process stories in parallel with concurrency limit
        const chunks = this._chunkArray(stories, maxConcurrency);
        estimations = [];

        for (const chunk of chunks) {
          const chunkEstimations = await Promise.all(
            chunk.map(story => this.estimateStoryPoints(story, options))
          );
          estimations.push(...chunkEstimations);
        }
      } else {
        // Process stories sequentially
        estimations = [];
        for (const story of stories) {
          const estimation = await this.estimateStoryPoints(story, options);
          estimations.push(estimation);
        }
      }

      // Add relative comparison if requested
      if (includeComparison && estimations.length > 1) {
        estimations = this._addRelativeComparison(estimations);
      }

      return {
        estimations,
        summary: this._generateBatchSummary(estimations),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to estimate multiple stories:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered estimation suggestions based on historical data
   */
  async getEstimationSuggestions(story, teamHistory = []) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Find similar stories in history
      const similarStories = this._findSimilarStories(story, teamHistory);

      // Get estimation agent
      const agents = aiAgentService.getAllAgents();
      const estimationAgent = agents.find(agent => 
        agent.type === AGENT_TYPES.ESTIMATION
      ) || agents[0];

      if (!estimationAgent) {
        throw new Error('No suitable AI agent found for estimation suggestions');
      }

      // Build suggestions prompt
      const prompt = this._buildSuggestionsPrompt(story, similarStories);

      // Get AI suggestions
      const response = await aiAgentService.invokeAgent(
        estimationAgent.id,
        { prompt, type: 'estimation-suggestions' },
        {
          structured: true,
          aiParams: {
            schema: this._getSuggestionsSchema()
          }
        }
      );

      return {
        suggestions: response.response.content.suggestions,
        similarStories,
        confidence: response.response.content.confidence,
        reasoning: response.response.content.reasoning,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get estimation suggestions:', error);
      throw error;
    }
  }

  /**
   * Validate and refine estimation based on team feedback
   */
  async refineEstimation(originalEstimation, teamFeedback, actualEffort = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get estimation agent
      const agents = aiAgentService.getAllAgents();
      const estimationAgent = agents.find(agent => 
        agent.id === originalEstimation.agentId
      ) || agents.find(agent => 
        agent.type === AGENT_TYPES.ESTIMATION
      ) || agents[0];

      // Build refinement prompt
      const prompt = this._buildRefinementPrompt(originalEstimation, teamFeedback, actualEffort);

      // Get refined estimation
      const response = await aiAgentService.invokeAgent(
        estimationAgent.id,
        { prompt, type: 'estimation-refinement' },
        {
          structured: true,
          aiParams: {
            schema: this._getRefinementSchema()
          }
        }
      );

      const refinedEstimation = {
        ...originalEstimation,
        refinedPoints: response.response.content.refinedPoints,
        refinementReasoning: response.response.content.reasoning,
        confidenceChange: response.response.content.confidenceChange,
        learnings: response.response.content.learnings,
        refinedAt: new Date().toISOString()
      };

      // Update historical data for learning
      this._updateHistoricalData(refinedEstimation, teamFeedback, actualEffort);

      return refinedEstimation;
    } catch (error) {
      console.error('Failed to refine estimation:', error);
      throw error;
    }
  }

  /**
   * Analyze team estimation patterns and provide insights
   */
  async analyzeEstimationPatterns(teamEstimations) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get optimization agent for pattern analysis
      const agents = aiAgentService.getAllAgents();
      const analysisAgent = agents.find(agent => 
        agent.type === AGENT_TYPES.OPTIMIZATION
      ) || agents.find(agent => 
        agent.capabilities.includes(AGENT_CAPABILITIES.BOTTLENECK_DETECTION)
      ) || agents[0];

      // Prepare estimation data for analysis
      const analysisData = this._prepareAnalysisData(teamEstimations);

      // Build analysis prompt
      const prompt = this._buildAnalysisPrompt(analysisData);

      // Get AI analysis
      const response = await aiAgentService.invokeAgent(
        analysisAgent.id,
        { prompt, type: 'estimation-pattern-analysis' },
        {
          structured: true,
          aiParams: {
            schema: this._getAnalysisSchema()
          }
        }
      );

      return {
        patterns: response.response.content.patterns,
        insights: response.response.content.insights,
        recommendations: response.response.content.recommendations,
        accuracy: response.response.content.accuracy,
        trends: response.response.content.trends,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to analyze estimation patterns:', error);
      throw error;
    }
  }

  /**
   * Get estimation history and metrics
   */
  getEstimationHistory(filters = {}) {
    const {
      storyId,
      agentId,
      dateRange,
      limit = 100
    } = filters;

    let history = [...this.estimationHistory];

    // Apply filters
    if (storyId) {
      history = history.filter(est => est.storyId === storyId);
    }
    if (agentId) {
      history = history.filter(est => est.agentId === agentId);
    }
    if (dateRange) {
      const { start, end } = dateRange;
      history = history.filter(est => {
        const estDate = new Date(est.timestamp);
        return estDate >= start && estDate <= end;
      });
    }

    // Sort by timestamp (newest first) and limit
    history = history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return {
      history,
      metrics: this._calculateHistoryMetrics(history),
      timestamp: new Date().toISOString()
    };
  }

  // Private helper methods

  /**
   * Build estimation prompt for AI agent
   */
  _buildEstimationPrompt(story, scale, teamContext, historicalContext) {
    const scaleText = Array.isArray(scale) ? scale.join(', ') : scale;
    
    return `As an expert story point estimation specialist, analyze the following user story and provide an accurate estimation.

**Story Details:**
- Title: ${story.title}
- Description: ${story.description || 'No description provided'}
- Acceptance Criteria: ${story.acceptanceCriteria || 'Not specified'}
- Epic: ${story.epic || 'None'}
- Labels: ${story.labels?.join(', ') || 'None'}

**Estimation Scale:** ${scaleText}

**Team Context:**
${teamContext ? JSON.stringify(teamContext, null, 2) : 'No team context provided'}

**Historical Context:**
${historicalContext ? JSON.stringify(historicalContext, null, 2) : 'No historical context provided'}

**Consider these factors:**
1. Technical complexity and implementation effort
2. Business logic complexity
3. Uncertainty and unknowns
4. Dependencies on other stories or systems
5. Testing effort required
6. Integration complexity

Provide a detailed estimation with reasoning, confidence level, and breakdown by complexity factors.`;
  }

  /**
   * Build suggestions prompt
   */
  _buildSuggestionsPrompt(story, similarStories) {
    return `Analyze this user story and provide estimation suggestions based on similar stories.

**Current Story:**
- Title: ${story.title}
- Description: ${story.description || 'No description provided'}

**Similar Stories for Reference:**
${similarStories.map((s, i) => 
  `${i + 1}. "${s.title}" - ${s.points} points (${s.reasoning || 'No reasoning provided'})`
).join('\n')}

Provide estimation suggestions with reasoning based on the similar stories and complexity analysis.`;
  }

  /**
   * Build refinement prompt
   */
  _buildRefinementPrompt(originalEstimation, teamFeedback, actualEffort) {
    return `Refine the original estimation based on team feedback and actual effort data.

**Original Estimation:**
- Points: ${originalEstimation.estimatedPoints}
- Reasoning: ${originalEstimation.reasoning}
- Confidence: ${originalEstimation.confidence}%

**Team Feedback:**
${JSON.stringify(teamFeedback, null, 2)}

**Actual Effort:**
${actualEffort ? JSON.stringify(actualEffort, null, 2) : 'Not yet completed'}

Provide a refined estimation with updated reasoning and confidence level.`;
  }

  /**
   * Build analysis prompt for estimation patterns
   */
  _buildAnalysisPrompt(analysisData) {
    return `Analyze the team's estimation patterns and provide insights.

**Estimation Data:**
${JSON.stringify(analysisData, null, 2)}

Identify patterns, trends, accuracy issues, and provide recommendations for improving estimation quality.`;
  }

  /**
   * Process and validate AI estimation response
   */
  _processEstimation(estimation, scale) {
    // Validate points are within scale
    let points = estimation.points;
    
    if (typeof points === 'string' && scale === ESTIMATION_SCALES.T_SHIRT) {
      points = T_SHIRT_TO_NUMERIC[points] || 3;
    } else if (Array.isArray(scale)) {
      // Find closest valid point in scale
      const numericPoints = typeof points === 'number' ? points : parseInt(points);
      points = scale.reduce((prev, curr) => 
        Math.abs(curr - numericPoints) < Math.abs(prev - numericPoints) ? curr : prev
      );
    }

    return {
      points,
      confidence: Math.min(100, Math.max(0, estimation.confidence || 70)),
      reasoning: estimation.reasoning || 'No reasoning provided',
      breakdown: estimation.breakdown || {},
      factors: estimation.factors || {}
    };
  }

  /**
   * Record estimation for learning
   */
  _recordEstimation(story, estimation, agentId) {
    const record = {
      storyId: story.id,
      storyTitle: story.title,
      estimatedPoints: estimation.points,
      confidence: estimation.confidence,
      reasoning: estimation.reasoning,
      agentId,
      timestamp: new Date().toISOString()
    };

    this.estimationHistory.push(record);

    // Keep only last 1000 estimations
    if (this.estimationHistory.length > 1000) {
      this.estimationHistory = this.estimationHistory.slice(-1000);
    }
  }

  /**
   * Find similar stories based on content analysis
   */
  _findSimilarStories(story, teamHistory) {
    // Simple similarity based on keywords and length
    const storyWords = this._extractKeywords(story.title + ' ' + (story.description || ''));
    
    return teamHistory
      .map(historyStory => {
        const historyWords = this._extractKeywords(
          historyStory.title + ' ' + (historyStory.description || '')
        );
        
        const similarity = this._calculateSimilarity(storyWords, historyWords);
        return { ...historyStory, similarity };
      })
      .filter(s => s.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }

  /**
   * Extract keywords from text
   */
  _extractKeywords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'use', 'way', 'she', 'many', 'oil', 'sit', 'word', 'long', 'down', 'side', 'been', 'call', 'come', 'each', 'find', 'have', 'into', 'like', 'look', 'make', 'more', 'move', 'must', 'name', 'over', 'said', 'same', 'some', 'such', 'take', 'than', 'that', 'them', 'well', 'were', 'what', 'when', 'with', 'work', 'your'].includes(word));
  }

  /**
   * Calculate similarity between two sets of keywords
   */
  _calculateSimilarity(words1, words2) {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Chunk array for parallel processing
   */
  _chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Add relative comparison between estimations
   */
  _addRelativeComparison(estimations) {
    const sortedByPoints = [...estimations].sort((a, b) => a.estimatedPoints - b.estimatedPoints);
    
    return estimations.map(estimation => {
      const rank = sortedByPoints.findIndex(e => e.storyId === estimation.storyId) + 1;
      const percentile = (rank / estimations.length) * 100;
      
      return {
        ...estimation,
        relativeComplexity: percentile <= 25 ? 'Low' : 
                           percentile <= 50 ? 'Medium-Low' :
                           percentile <= 75 ? 'Medium-High' : 'High',
        rankInBatch: rank,
        percentile: Math.round(percentile)
      };
    });
  }

  /**
   * Generate batch summary
   */
  _generateBatchSummary(estimations) {
    const points = estimations.map(e => e.estimatedPoints);
    const confidences = estimations.map(e => e.confidence);
    
    return {
      totalStories: estimations.length,
      totalPoints: points.reduce((sum, p) => sum + p, 0),
      averagePoints: points.reduce((sum, p) => sum + p, 0) / points.length,
      averageConfidence: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      pointRange: {
        min: Math.min(...points),
        max: Math.max(...points)
      },
      distribution: this._calculateDistribution(points)
    };
  }

  /**
   * Calculate point distribution
   */
  _calculateDistribution(points) {
    const distribution = {};
    points.forEach(point => {
      distribution[point] = (distribution[point] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Prepare analysis data
   */
  _prepareAnalysisData(teamEstimations) {
    return {
      totalEstimations: teamEstimations.length,
      estimationAccuracy: this._calculateAccuracy(teamEstimations),
      commonPatterns: this._identifyPatterns(teamEstimations),
      velocityTrends: this._calculateVelocityTrends(teamEstimations)
    };
  }

  /**
   * Calculate estimation accuracy
   */
  _calculateAccuracy(estimations) {
    const accurateEstimations = estimations.filter(est => 
      est.actualEffort && Math.abs(est.estimatedPoints - est.actualEffort) <= 1
    );
    
    return estimations.length > 0 ? (accurateEstimations.length / estimations.length) * 100 : 0;
  }

  /**
   * Identify common patterns
   */
  _identifyPatterns(estimations) {
    // Simple pattern identification
    const overestimations = estimations.filter(est => 
      est.actualEffort && est.estimatedPoints > est.actualEffort
    ).length;
    
    const underestimations = estimations.filter(est => 
      est.actualEffort && est.estimatedPoints < est.actualEffort
    ).length;
    
    return {
      overestimationRate: estimations.length > 0 ? (overestimations / estimations.length) * 100 : 0,
      underestimationRate: estimations.length > 0 ? (underestimations / estimations.length) * 100 : 0
    };
  }

  /**
   * Calculate velocity trends
   */
  _calculateVelocityTrends(estimations) {
    // Group by sprint/time period and calculate velocity
    const sprintGroups = {};
    estimations.forEach(est => {
      const sprint = est.sprint || 'unknown';
      if (!sprintGroups[sprint]) {
        sprintGroups[sprint] = [];
      }
      sprintGroups[sprint].push(est);
    });
    
    return Object.entries(sprintGroups).map(([sprint, ests]) => ({
      sprint,
      plannedVelocity: ests.reduce((sum, e) => sum + e.estimatedPoints, 0),
      actualVelocity: ests.reduce((sum, e) => sum + (e.actualEffort || 0), 0)
    }));
  }

  /**
   * Update historical data for learning
   */
  _updateHistoricalData(estimation, feedback, actualEffort) {
    const key = `${estimation.storyId}_${estimation.timestamp}`;
    this.historicalData.set(key, {
      estimation,
      feedback,
      actualEffort,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Calculate history metrics
   */
  _calculateHistoryMetrics(history) {
    if (history.length === 0) {
      return { accuracy: 0, averageConfidence: 0, totalEstimations: 0 };
    }

    const confidences = history.map(h => h.confidence || 70);
    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    return {
      totalEstimations: history.length,
      averageConfidence: Math.round(averageConfidence),
      accuracy: this._calculateAccuracy(history),
      lastEstimation: history[0]?.timestamp
    };
  }

  /**
   * Get estimation schema for structured AI responses
   */
  _getEstimationSchema(scale) {
    const pointsSchema = Array.isArray(scale) && scale.includes('XS') 
      ? { type: 'string', enum: scale }
      : { type: 'number', minimum: 1, maximum: 100 };

    return {
      type: 'object',
      properties: {
        points: pointsSchema,
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        reasoning: { type: 'string' },
        breakdown: {
          type: 'object',
          properties: {
            technicalComplexity: { type: 'number', minimum: 1, maximum: 10 },
            businessComplexity: { type: 'number', minimum: 1, maximum: 10 },
            uncertainty: { type: 'number', minimum: 1, maximum: 10 },
            dependencies: { type: 'number', minimum: 1, maximum: 10 },
            testingEffort: { type: 'number', minimum: 1, maximum: 10 }
          }
        },
        factors: {
          type: 'object',
          properties: {
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            estimationApproach: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['points', 'confidence', 'reasoning']
    };
  }

  /**
   * Get suggestions schema
   */
  _getSuggestionsSchema() {
    return {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              points: { type: 'number' },
              reasoning: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        reasoning: { type: 'string' }
      },
      required: ['suggestions', 'confidence', 'reasoning']
    };
  }

  /**
   * Get refinement schema
   */
  _getRefinementSchema() {
    return {
      type: 'object',
      properties: {
        refinedPoints: { type: 'number' },
        reasoning: { type: 'string' },
        confidenceChange: { type: 'number', minimum: -100, maximum: 100 },
        learnings: { type: 'array', items: { type: 'string' } }
      },
      required: ['refinedPoints', 'reasoning']
    };
  }

  /**
   * Get analysis schema
   */
  _getAnalysisSchema() {
    return {
      type: 'object',
      properties: {
        patterns: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        accuracy: { type: 'number', minimum: 0, maximum: 100 },
        trends: { type: 'array', items: { type: 'string' } }
      },
      required: ['patterns', 'insights', 'recommendations']
    };
  }
}

// Create and export singleton instance
const storyEstimationAIService = new StoryEstimationAIService();

export default storyEstimationAIService;
