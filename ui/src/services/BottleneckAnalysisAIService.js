/**
 * BottleneckAnalysisAIService.js
 * Specialized service for AI-driven bottleneck detection and workflow analysis
 * Builds upon AIAgentService for core AI interactions
 */

import aiAgentService, { AGENT_TYPES } from './AIAgentService.js';

// Bottleneck analysis constants
export const BOTTLENECK_TYPES = {
  WIP_LIMIT: 'wip-limit',
  BLOCKED_TASKS: 'blocked-tasks',
  RESOURCE_CONSTRAINT: 'resource-constraint',
  PROCESS_INEFFICIENCY: 'process-inefficiency',
  DEPENDENCY_CHAIN: 'dependency-chain',
  SKILL_GAP: 'skill-gap',
  WORKFLOW_CONGESTION: 'workflow-congestion'
};

export const ANALYSIS_MODES = {
  REAL_TIME: 'real-time',
  HISTORICAL: 'historical',
  PREDICTIVE: 'predictive',
  COMPARATIVE: 'comparative'
};

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Bottleneck Analysis AI Service class
 */
class BottleneckAnalysisAIService {
  constructor() {
    this.activeSessions = new Map();
    this.analysisHistory = new Map();
    this.bottleneckPatterns = new Map();
    this.optimizationSuggestions = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the bottleneck analysis AI service
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
      console.error('Failed to initialize BottleneckAnalysisAIService:', error);
      throw error;
    }
  }

  /**
   * Start an AI-powered bottleneck analysis session
   */
  async startAnalysisSession(sessionConfig) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      sessionId,
      workflowData,
      analysisMode = ANALYSIS_MODES.REAL_TIME,
      focusAreas = [],
      timeframe = '7d'
    } = sessionConfig;

    try {
      // Get optimization agents for bottleneck analysis
      const availableAgents = aiAgentService.getAllAgents();
      const optimizationAgents = availableAgents.filter(agent => 
        agent.type === 'optimization' && 
        agent.capabilities.includes('bottleneck-detection')
      );

      if (optimizationAgents.length === 0) {
        throw new Error('No optimization agents with bottleneck-detection capability available');
      }

      // Create session for the primary optimization agent
      const primaryAgent = optimizationAgents[0];
      const agentSessionId = await aiAgentService.createSession(primaryAgent.id, {
        type: 'bottleneck-analysis',
        analysisMode,
        focusAreas,
        timeframe,
        workflowData: this._sanitizeWorkflowData(workflowData)
      });

      // Store analysis session
      const session = {
        sessionId,
        agentId: primaryAgent.id,
        agentSessionId,
        agent: primaryAgent,
        analysisMode,
        focusAreas,
        timeframe,
        workflowData,
        startTime: new Date().toISOString(),
        status: 'active',
        bottlenecks: [],
        suggestions: [],
        lastAnalysis: null
      };

      this.activeSessions.set(sessionId, session);

      return {
        sessionId,
        agentId: primaryAgent.id,
        agentName: primaryAgent.name,
        status: 'active',
        capabilities: primaryAgent.capabilities
      };
    } catch (error) {
      console.error('Failed to start bottleneck analysis session:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive bottleneck analysis
   */
  async analyzeBottlenecks(sessionId, workflowData, options = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Analysis session ${sessionId} not found`);
    }

    const {
      includeHistorical = true,
      includePredictive = false,
      focusAreas = [],
      severityThreshold = SEVERITY_LEVELS.LOW
    } = options;

    try {
      // Update session with latest workflow data
      session.workflowData = workflowData;

      // Build comprehensive analysis prompt
      const prompt = this._buildBottleneckAnalysisPrompt(
        session.agent,
        workflowData,
        {
          analysisMode: session.analysisMode,
          includeHistorical,
          includePredictive,
          focusAreas: focusAreas.length > 0 ? focusAreas : session.focusAreas,
          timeframe: session.timeframe,
          previousAnalysis: session.lastAnalysis
        }
      );

      // Invoke AI agent for bottleneck analysis
      const response = await aiAgentService.invokeAgent(
        session.agentId,
        { 
          prompt, 
          type: 'bottleneck-analysis',
          workflowData: this._sanitizeWorkflowData(workflowData)
        },
        { 
          sessionId: session.agentSessionId,
          structured: true,
          aiParams: {
            schema: this._getBottleneckAnalysisSchema(),
            temperature: 0.3, // Lower temperature for more consistent analysis
            maxTokens: 2000
          }
        }
      );

      const analysisResult = response.response.content;
      
      // Process and validate the analysis results
      const processedBottlenecks = this._processBottleneckResults(
        analysisResult.bottlenecks || [],
        workflowData,
        severityThreshold
      );

      const processedSuggestions = this._processOptimizationSuggestions(
        analysisResult.suggestions || [],
        processedBottlenecks
      );

      // Update session with results
      session.bottlenecks = processedBottlenecks;
      session.suggestions = processedSuggestions;
      session.lastAnalysis = {
        timestamp: new Date().toISOString(),
        bottleneckCount: processedBottlenecks.length,
        suggestionCount: processedSuggestions.length,
        severityDistribution: this._calculateSeverityDistribution(processedBottlenecks)
      };

      // Store in analysis history
      const historyEntry = {
        sessionId,
        timestamp: new Date().toISOString(),
        bottlenecks: processedBottlenecks,
        suggestions: processedSuggestions,
        workflowSnapshot: this._createWorkflowSnapshot(workflowData)
      };
      
      if (!this.analysisHistory.has(sessionId)) {
        this.analysisHistory.set(sessionId, []);
      }
      this.analysisHistory.get(sessionId).push(historyEntry);

      return {
        sessionId,
        timestamp: new Date().toISOString(),
        bottlenecks: processedBottlenecks,
        suggestions: processedSuggestions,
        summary: {
          totalBottlenecks: processedBottlenecks.length,
          criticalBottlenecks: processedBottlenecks.filter(b => b.severity === SEVERITY_LEVELS.CRITICAL).length,
          highPriorityBottlenecks: processedBottlenecks.filter(b => b.severity === SEVERITY_LEVELS.HIGH).length,
          totalSuggestions: processedSuggestions.length,
          implementableSuggestions: processedSuggestions.filter(s => s.implementable).length
        },
        metadata: {
          analysisMode: session.analysisMode,
          agentUsed: session.agent.name,
          processingTime: response.metadata?.processingTime || 0
        }
      };
    } catch (error) {
      console.error('Failed to analyze bottlenecks:', error);
      throw error;
    }
  }

  /**
   * Generate optimization suggestions for identified bottlenecks
   */
  async generateOptimizationSuggestions(sessionId, bottlenecks, context = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Analysis session ${sessionId} not found`);
    }

    try {
      const prompt = this._buildOptimizationPrompt(
        session.agent,
        bottlenecks,
        session.workflowData,
        context
      );

      const response = await aiAgentService.invokeAgent(
        session.agentId,
        { 
          prompt, 
          type: 'optimization-suggestions',
          bottlenecks,
          context
        },
        { 
          sessionId: session.agentSessionId,
          structured: true,
          aiParams: {
            schema: this._getOptimizationSuggestionsSchema(),
            temperature: 0.4,
            maxTokens: 1500
          }
        }
      );

      const suggestions = this._processOptimizationSuggestions(
        response.response.content.suggestions || [],
        bottlenecks
      );

      // Update session suggestions
      session.suggestions = [...session.suggestions, ...suggestions];

      return suggestions;
    } catch (error) {
      console.error('Failed to generate optimization suggestions:', error);
      throw error;
    }
  }

  /**
   * Get historical bottleneck patterns and trends
   */
  async analyzeHistoricalPatterns(sessionId, timeRange = '30d') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Analysis session ${sessionId} not found`);
    }

    try {
      const history = this.analysisHistory.get(sessionId) || [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));

      const relevantHistory = history.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );

      const prompt = this._buildPatternAnalysisPrompt(
        session.agent,
        relevantHistory,
        timeRange
      );

      const response = await aiAgentService.invokeAgent(
        session.agentId,
        { 
          prompt, 
          type: 'pattern-analysis',
          historicalData: relevantHistory
        },
        { 
          sessionId: session.agentSessionId,
          structured: true,
          aiParams: {
            schema: this._getPatternAnalysisSchema(),
            temperature: 0.2,
            maxTokens: 1200
          }
        }
      );

      return response.response.content;
    } catch (error) {
      console.error('Failed to analyze historical patterns:', error);
      throw error;
    }
  }

  /**
   * Predict future bottlenecks based on current trends
   */
  async predictFutureBottlenecks(sessionId, predictionHorizon = '7d') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Analysis session ${sessionId} not found`);
    }

    try {
      const history = this.analysisHistory.get(sessionId) || [];
      const currentWorkflow = session.workflowData;

      const prompt = this._buildPredictiveAnalysisPrompt(
        session.agent,
        currentWorkflow,
        history,
        predictionHorizon
      );

      const response = await aiAgentService.invokeAgent(
        session.agentId,
        { 
          prompt, 
          type: 'predictive-analysis',
          currentState: currentWorkflow,
          historicalData: history,
          horizon: predictionHorizon
        },
        { 
          sessionId: session.agentSessionId,
          structured: true,
          aiParams: {
            schema: this._getPredictiveAnalysisSchema(),
            temperature: 0.3,
            maxTokens: 1000
          }
        }
      );

      return response.response.content;
    } catch (error) {
      console.error('Failed to predict future bottlenecks:', error);
      throw error;
    }
  }

  /**
   * End an analysis session
   */
  async endAnalysisSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Analysis session ${sessionId} not found`);
    }

    try {
      // End the agent session
      await aiAgentService.endSession(session.agentSessionId);

      // Update session status
      session.status = 'ended';
      session.endTime = new Date().toISOString();

      // Generate final summary
      const summary = {
        sessionId,
        duration: new Date(session.endTime) - new Date(session.startTime),
        totalAnalyses: this.analysisHistory.get(sessionId)?.length || 0,
        finalBottleneckCount: session.bottlenecks.length,
        finalSuggestionCount: session.suggestions.length,
        agentUsed: session.agent.name
      };

      // Clean up active session
      this.activeSessions.delete(sessionId);

      return summary;
    } catch (error) {
      console.error('Failed to end analysis session:', error);
      throw error;
    }
  }

  /**
   * Get current session status and results
   */
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      agentId: session.agentId,
      agentName: session.agent.name,
      startTime: session.startTime,
      analysisMode: session.analysisMode,
      currentBottlenecks: session.bottlenecks.length,
      currentSuggestions: session.suggestions.length,
      lastAnalysis: session.lastAnalysis
    };
  }

  /**
   * Get analysis history for a session
   */
  getAnalysisHistory(sessionId, limit = 10) {
    const history = this.analysisHistory.get(sessionId) || [];
    return history.slice(-limit).reverse(); // Return most recent first
  }

  // Private helper methods

  /**
   * Sanitize workflow data for AI processing
   */
  _sanitizeWorkflowData(workflowData) {
    if (!workflowData) return {};

    return {
      columns: workflowData.columns || [],
      tasks: workflowData.tasks?.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignee: task.assignee,
        priority: task.priority,
        storyPoints: task.storyPoints,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        blockedSince: task.blockedSince,
        dependencies: task.dependencies
      })) || [],
      wipLimits: workflowData.wipLimits || {},
      teamCapacity: workflowData.teamCapacity || {},
      metrics: workflowData.metrics || {}
    };
  }

  /**
   * Build bottleneck analysis prompt
   */
  _buildBottleneckAnalysisPrompt(agent, workflowData, options) {
    const { analysisMode, includeHistorical, includePredictive, focusAreas, timeframe, previousAnalysis } = options;

    return `As an AI optimization agent specializing in bottleneck detection, analyze the following workflow data and identify bottlenecks that are impacting team productivity and flow efficiency.

**Analysis Context:**
- Agent Role: ${agent.name} (${agent.type})
- Analysis Mode: ${analysisMode}
- Timeframe: ${timeframe}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'All workflow areas'}
- Include Historical: ${includeHistorical}
- Include Predictive: ${includePredictive}

**Workflow Data:**
- Columns: ${JSON.stringify(workflowData.columns, null, 2)}
- Tasks: ${JSON.stringify(workflowData.tasks, null, 2)}
- WIP Limits: ${JSON.stringify(workflowData.wipLimits, null, 2)}
- Team Capacity: ${JSON.stringify(workflowData.teamCapacity, null, 2)}
- Current Metrics: ${JSON.stringify(workflowData.metrics, null, 2)}

${previousAnalysis ? `**Previous Analysis Results:**
${JSON.stringify(previousAnalysis, null, 2)}` : ''}

**Analysis Requirements:**
1. Identify all types of bottlenecks: WIP limit violations, blocked tasks, resource constraints, process inefficiencies, dependency chains, skill gaps, and workflow congestion
2. Assess the severity and impact of each bottleneck
3. Determine root causes and contributing factors
4. Provide specific, actionable recommendations for resolution
5. Estimate the potential impact of implementing suggested solutions

Please provide a comprehensive analysis following the structured format defined in the response schema.`;
  }

  /**
   * Build optimization suggestions prompt
   */
  _buildOptimizationPrompt(agent, bottlenecks, workflowData, context) {
    return `As an AI optimization agent, generate specific, actionable optimization suggestions to resolve the identified bottlenecks and improve workflow efficiency.

**Agent Context:**
- Agent: ${agent.name} (${agent.type})
- Capabilities: ${agent.capabilities.join(', ')}

**Identified Bottlenecks:**
${JSON.stringify(bottlenecks, null, 2)}

**Current Workflow State:**
${JSON.stringify(workflowData, null, 2)}

**Additional Context:**
${JSON.stringify(context, null, 2)}

**Optimization Requirements:**
1. Provide immediate, short-term solutions for critical bottlenecks
2. Suggest medium-term process improvements
3. Recommend long-term strategic changes
4. Consider resource constraints and team capabilities
5. Prioritize suggestions by impact and implementation effort
6. Include specific steps for implementation
7. Estimate expected outcomes and success metrics

Focus on practical, implementable solutions that can be executed with current resources and constraints.`;
  }

  /**
   * Build pattern analysis prompt
   */
  _buildPatternAnalysisPrompt(agent, historicalData, timeRange) {
    return `As an AI optimization agent, analyze the historical bottleneck data to identify patterns, trends, and recurring issues that can inform future optimization strategies.

**Agent Context:**
- Agent: ${agent.name}
- Analysis Period: ${timeRange}

**Historical Data:**
${JSON.stringify(historicalData, null, 2)}

**Pattern Analysis Requirements:**
1. Identify recurring bottleneck types and locations
2. Analyze temporal patterns (time of day, day of week, sprint cycles)
3. Detect correlation between bottlenecks and external factors
4. Identify improvement trends from implemented solutions
5. Highlight persistent issues that need strategic attention
6. Provide insights for proactive bottleneck prevention

Generate actionable insights that can guide future workflow optimization and bottleneck prevention strategies.`;
  }

  /**
   * Build predictive analysis prompt
   */
  _buildPredictiveAnalysisPrompt(agent, currentWorkflow, history, horizon) {
    return `As an AI optimization agent, predict potential future bottlenecks based on current workflow state and historical patterns.

**Agent Context:**
- Agent: ${agent.name}
- Prediction Horizon: ${horizon}

**Current Workflow State:**
${JSON.stringify(currentWorkflow, null, 2)}

**Historical Patterns:**
${JSON.stringify(history.slice(-5), null, 2)} // Last 5 analyses

**Predictive Analysis Requirements:**
1. Identify early warning signs of emerging bottlenecks
2. Predict likelihood and timing of potential issues
3. Assess risk factors and contributing conditions
4. Recommend proactive measures to prevent predicted bottlenecks
5. Provide confidence levels for predictions
6. Suggest monitoring points for early detection

Focus on actionable predictions that enable proactive workflow management and bottleneck prevention.`;
  }

  /**
   * Process and validate bottleneck analysis results
   */
  _processBottleneckResults(bottlenecks, workflowData, severityThreshold) {
    return bottlenecks
      .filter(bottleneck => bottleneck && bottleneck.type && bottleneck.severity)
      .filter(bottleneck => this._getSeverityLevel(bottleneck.severity) >= this._getSeverityLevel(severityThreshold))
      .map(bottleneck => ({
        id: bottleneck.id || `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: bottleneck.type,
        severity: bottleneck.severity,
        title: bottleneck.title || this._generateBottleneckTitle(bottleneck),
        description: bottleneck.description || '',
        location: bottleneck.location || '',
        impact: bottleneck.impact || 'medium',
        rootCause: bottleneck.rootCause || '',
        affectedTasks: bottleneck.affectedTasks || [],
        metrics: bottleneck.metrics || {},
        detectedAt: new Date().toISOString(),
        recommendations: bottleneck.recommendations || []
      }));
  }

  /**
   * Process optimization suggestions
   */
  _processOptimizationSuggestions(suggestions, bottlenecks) {
    return suggestions
      .filter(suggestion => suggestion && suggestion.title)
      .map(suggestion => ({
        id: suggestion.id || `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: suggestion.title,
        description: suggestion.description || '',
        type: suggestion.type || 'process',
        priority: suggestion.priority || 'medium',
        impact: suggestion.impact || 'medium',
        effort: suggestion.effort || 'medium',
        implementable: suggestion.implementable !== false,
        timeframe: suggestion.timeframe || 'short-term',
        relatedBottlenecks: suggestion.relatedBottlenecks || [],
        steps: suggestion.steps || [],
        expectedOutcome: suggestion.expectedOutcome || '',
        successMetrics: suggestion.successMetrics || [],
        createdAt: new Date().toISOString()
      }));
  }

  /**
   * Calculate severity distribution
   */
  _calculateSeverityDistribution(bottlenecks) {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    bottlenecks.forEach(bottleneck => {
      if (distribution.hasOwnProperty(bottleneck.severity)) {
        distribution[bottleneck.severity]++;
      }
    });

    return distribution;
  }

  /**
   * Create workflow snapshot for historical tracking
   */
  _createWorkflowSnapshot(workflowData) {
    return {
      timestamp: new Date().toISOString(),
      taskCount: workflowData.tasks?.length || 0,
      columnDistribution: this._calculateColumnDistribution(workflowData),
      wipUtilization: this._calculateWipUtilization(workflowData),
      blockedTaskCount: workflowData.tasks?.filter(task => task.status === 'blocked').length || 0
    };
  }

  /**
   * Calculate column distribution
   */
  _calculateColumnDistribution(workflowData) {
    const distribution = {};
    workflowData.tasks?.forEach(task => {
      distribution[task.status] = (distribution[task.status] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculate WIP utilization
   */
  _calculateWipUtilization(workflowData) {
    const utilization = {};
    const wipLimits = workflowData.wipLimits || {};
    const distribution = this._calculateColumnDistribution(workflowData);

    Object.keys(wipLimits).forEach(column => {
      const current = distribution[column] || 0;
      const limit = wipLimits[column];
      utilization[column] = limit > 0 ? (current / limit) * 100 : 0;
    });

    return utilization;
  }

  /**
   * Get severity level as number for comparison
   */
  _getSeverityLevel(severity) {
    const levels = {
      [SEVERITY_LEVELS.CRITICAL]: 4,
      [SEVERITY_LEVELS.HIGH]: 3,
      [SEVERITY_LEVELS.MEDIUM]: 2,
      [SEVERITY_LEVELS.LOW]: 1
    };
    return levels[severity] || 1;
  }

  /**
   * Generate bottleneck title from type and location
   */
  _generateBottleneckTitle(bottleneck) {
    const typeLabels = {
      [BOTTLENECK_TYPES.WIP_LIMIT]: 'WIP Limit Exceeded',
      [BOTTLENECK_TYPES.BLOCKED_TASKS]: 'Blocked Tasks Accumulation',
      [BOTTLENECK_TYPES.RESOURCE_CONSTRAINT]: 'Resource Constraint',
      [BOTTLENECK_TYPES.PROCESS_INEFFICIENCY]: 'Process Inefficiency',
      [BOTTLENECK_TYPES.DEPENDENCY_CHAIN]: 'Dependency Chain Issue',
      [BOTTLENECK_TYPES.SKILL_GAP]: 'Skill Gap Bottleneck',
      [BOTTLENECK_TYPES.WORKFLOW_CONGESTION]: 'Workflow Congestion'
    };

    const baseTitle = typeLabels[bottleneck.type] || 'Workflow Bottleneck';
    return bottleneck.location ? `${baseTitle} in ${bottleneck.location}` : baseTitle;
  }

  // Schema definitions for structured AI responses

  /**
   * Get bottleneck analysis schema
   */
  _getBottleneckAnalysisSchema() {
    return {
      type: 'object',
      properties: {
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { 
                type: 'string',
                enum: Object.values(BOTTLENECK_TYPES)
              },
              severity: { 
                type: 'string',
                enum: Object.values(SEVERITY_LEVELS)
              },
              title: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              impact: { 
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical']
              },
              rootCause: { type: 'string' },
              affectedTasks: {
                type: 'array',
                items: { type: 'string' }
              },
              metrics: { type: 'object' },
              recommendations: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['type', 'severity', 'title', 'description']
          }
        },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              priority: { 
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical']
              },
              impact: { 
                type: 'string',
                enum: ['low', 'medium', 'high']
              },
              effort: { 
                type: 'string',
                enum: ['low', 'medium', 'high']
              },
              timeframe: { 
                type: 'string',
                enum: ['immediate', 'short-term', 'medium-term', 'long-term']
              },
              implementable: { type: 'boolean' },
              steps: {
                type: 'array',
                items: { type: 'string' }
              },
              expectedOutcome: { type: 'string' },
              successMetrics: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['title', 'description', 'priority']
          }
        }
      },
      required: ['bottlenecks']
    };
  }

  /**
   * Get optimization suggestions schema
   */
  _getOptimizationSuggestionsSchema() {
    return {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              priority: { 
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical']
              },
              impact: { 
                type: 'string',
                enum: ['low', 'medium', 'high']
              },
              effort: { 
                type: 'string',
                enum: ['low', 'medium', 'high']
              },
              timeframe: { 
                type: 'string',
                enum: ['immediate', 'short-term', 'medium-term', 'long-term']
              },
              implementable: { type: 'boolean' },
              relatedBottlenecks: {
                type: 'array',
                items: { type: 'string' }
              },
              steps: {
                type: 'array',
                items: { type: 'string' }
              },
              expectedOutcome: { type: 'string' },
              successMetrics: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['title', 'description', 'priority']
          }
        }
      },
      required: ['suggestions']
    };
  }

  /**
   * Get pattern analysis schema
   */
  _getPatternAnalysisSchema() {
    return {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            },
            required: ['type', 'description']
          }
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              direction: { 
                type: 'string',
                enum: ['improving', 'stable', 'declining']
              },
              confidence: { type: 'number' },
              description: { type: 'string' }
            },
            required: ['metric', 'direction']
          }
        },
        insights: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['patterns', 'insights']
    };
  }

  /**
   * Get predictive analysis schema
   */
  _getPredictiveAnalysisSchema() {
    return {
      type: 'object',
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              likelihood: { 
                type: 'string',
                enum: ['low', 'medium', 'high']
              },
              timeframe: { type: 'string' },
              description: { type: 'string' },
              earlyWarnings: {
                type: 'array',
                items: { type: 'string' }
              },
              preventiveMeasures: {
                type: 'array',
                items: { type: 'string' }
              },
              confidence: { type: 'number' }
            },
            required: ['type', 'likelihood', 'description']
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['action', 'description']
          }
        }
      },
      required: ['predictions']
    };
  }
}

// Create and export singleton instance
const bottleneckAnalysisAIService = new BottleneckAnalysisAIService();
export default bottleneckAnalysisAIService; 