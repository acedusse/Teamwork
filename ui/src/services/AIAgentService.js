/**
 * AIAgentService.js
 * Core service for managing AI agent interactions, orchestration, and data exchange
 * Builds upon existing AI services infrastructure and agent management system
 */

import aiModule from '../ai-module.js';
// Import AI service functions directly
import { generateObjectService, generateTextService } from './AIService.js';
import performanceMonitor from './performanceMonitoring';

// Agent types and their capabilities
export const AGENT_TYPES = {
  OPTIMIZATION: 'optimization',
  ESTIMATION: 'estimation',
  DEPENDENCIES: 'dependencies',
  QUALITY: 'quality',
  PLANNING: 'planning'
};

export const AGENT_CAPABILITIES = {
  // Optimization capabilities
  BOTTLENECK_DETECTION: 'bottleneck-detection',
  WIP_OPTIMIZATION: 'wip-optimization',
  TASK_PRIORITIZATION: 'task-prioritization',
  FLOW_ANALYSIS: 'flow-analysis',
  
  // Estimation capabilities
  STORY_POINT_ESTIMATION: 'story-point-estimation',
  EFFORT_PREDICTION: 'effort-prediction',
  COMPLEXITY_ANALYSIS: 'complexity-analysis',
  HISTORICAL_ANALYSIS: 'historical-analysis',
  
  // Dependency capabilities
  DEPENDENCY_DETECTION: 'dependency-detection',
  RISK_ASSESSMENT: 'risk-assessment',
  CRITICAL_PATH_ANALYSIS: 'critical-path-analysis',
  BLOCKING_RESOLUTION: 'blocking-resolution',
  
  // Quality capabilities
  TEST_STRATEGY_GENERATION: 'test-strategy-generation',
  QUALITY_METRICS: 'quality-metrics',
  DEFECT_PREDICTION: 'defect-prediction',
  COVERAGE_ANALYSIS: 'coverage-analysis',
  
  // Planning capabilities
  CAPACITY_PLANNING: 'capacity-planning',
  RESOURCE_ALLOCATION: 'resource-allocation',
  WORKLOAD_BALANCING: 'workload-balancing',
  TIMELINE_OPTIMIZATION: 'timeline-optimization'
};

export const AGENT_STATUS = {
  IDLE: 'idle',
  THINKING: 'thinking',
  WORKING: 'working',
  ACTIVE: 'active'
};

/**
 * Core AI Agent Service class
 */
class AIAgentService {
  constructor() {
    this.agents = new Map();
    this.sessions = new Map();
    this.eventListeners = new Map();
    this.apiBaseUrl = this._getApiBaseUrl();
    this.initialized = false;
  }

  /**
   * Initialize the service and load available agents
   */
  async initialize() {
    try {
      await this.loadAgents();
      this.initialized = true;
      this._emit('service:initialized', { agentCount: this.agents.size });
      return true;
    } catch (error) {
      console.error('Failed to initialize AIAgentService:', error);
      throw new Error(`AIAgentService initialization failed: ${error.message}`);
    }
  }

  /**
   * Load agents from the backend
   */
  async loadAgents() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai-agents`);
      if (!response.ok) {
        throw new Error(`Failed to load agents: ${response.status}`);
      }
      
      const data = await response.json();
      const agents = data.data?.agents || [];
      
      // Store agents in map for quick access
      this.agents.clear();
      agents.forEach(agent => {
        this.agents.set(agent.id, {
          ...agent,
          lastInteraction: null,
          sessionId: null
        });
      });
      
      this._emit('agents:loaded', { agents: Array.from(this.agents.values()) });
      return Array.from(this.agents.values());
    } catch (error) {
      console.error('Error loading agents:', error);
      throw error;
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by type
   */
  getAgentsByType(type) {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability) {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities && agent.capabilities.includes(capability)
    );
  }

  /**
   * Create a new agent session
   */
  async createSession(agentId, context = {}) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const sessionId = `session_${agentId}_${Date.now()}`;
    const session = {
      id: sessionId,
      agentId,
      context,
      startTime: new Date().toISOString(),
      interactions: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);
    
    // Update agent status
    await this.updateAgentStatus(agentId, AGENT_STATUS.ACTIVE, { sessionId });
    
    this._emit('session:created', { sessionId, agentId, context });
    return sessionId;
  }

  /**
   * End an agent session
   */
  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'ended';
    session.endTime = new Date().toISOString();
    
    // Update agent status back to idle
    await this.updateAgentStatus(session.agentId, AGENT_STATUS.IDLE);
    
    this._emit('session:ended', { sessionId, agentId: session.agentId });
    return session;
  }

  /**
   * Send a request to an AI agent
   */
  async invokeAgent(agentId, request, options = {}) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const sessionId = options.sessionId || await this.createSession(agentId, options.context);
    const session = this.sessions.get(sessionId);

    // Start monitoring
    const timerLabel = `agent-invoke-${agentId}`;
    performanceMonitor.startTimer(timerLabel);
    performanceMonitor.trackUserInteraction('ai-agent-invoke', agentId);

    try {
      // Update agent status to thinking
      await this.updateAgentStatus(agentId, AGENT_STATUS.THINKING);

      // Prepare the AI service request
      const aiRequest = this._prepareAIRequest(agent, request, session);
      this._emit('agent:thinking', { agentId, sessionId, request });

      // Update agent status to working
      await this.updateAgentStatus(agentId, AGENT_STATUS.WORKING);

      // Make the AI service call
      const response = await this._callAIService(aiRequest, options);

      // Process and validate the response
      const processedResponse = await this._processResponse(agent, response, request);

      // Record the interaction
      const interaction = {
        id: `interaction_${Date.now()}`,
        timestamp: new Date().toISOString(),
        request,
        response: processedResponse,
        metadata: {
          agentId,
          sessionId,
          duration: Date.now() - Date.parse(session.startTime)
        }
      };

      session.interactions.push(interaction);
      agent.lastInteraction = interaction;

      // End monitoring and log duration
      performanceMonitor.endTimer(timerLabel);
      performanceMonitor.trackUserInteraction('ai-agent-response', agentId, interaction.metadata.duration);

      // Update agent status back to active
      await this.updateAgentStatus(agentId, AGENT_STATUS.ACTIVE);

      this._emit('agent:response', { 
        agentId, 
        sessionId, 
        interaction,
        response: processedResponse 
      });

      return {
        response: processedResponse,
        interaction,
        sessionId,
        metadata: interaction.metadata
      };

    } catch (error) {
      // End monitoring and log error
      performanceMonitor.endTimer(timerLabel);
      performanceMonitor.trackUserInteraction('ai-agent-error', agentId);
      console.error(`Error invoking agent ${agentId}:`, error);
      // Update agent status back to idle on error
      await this.updateAgentStatus(agentId, AGENT_STATUS.IDLE);
      this._emit('agent:error', { agentId, sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId, status, currentTask = null) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai-agents/${agentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentTask })
      });

      if (!response.ok) {
        throw new Error(`Failed to update agent status: ${response.status}`);
      }

      // Update local agent state
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = status;
        agent.currentTask = currentTask;
        agent.lastActivity = new Date().toISOString();
      }

      this._emit('agent:status_updated', { agentId, status, currentTask });
      return true;
    } catch (error) {
      console.error(`Error updating agent ${agentId} status:`, error);
      throw error;
    }
  }

  /**
   * Add a recommendation from an agent
   */
  async addRecommendation(agentId, recommendation) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai-agents/${agentId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recommendation)
      });

      if (!response.ok) {
        throw new Error(`Failed to add recommendation: ${response.status}`);
      }

      this._emit('agent:recommendation_added', { agentId, recommendation });
      return true;
    } catch (error) {
      console.error(`Error adding recommendation for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get agent recommendations
   */
  getAgentRecommendations(agentId) {
    const agent = this.getAgent(agentId);
    return agent ? agent.recommendations || [] : [];
  }

  /**
   * Clear agent recommendations
   */
  async clearRecommendations(agentId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/ai-agents/${agentId}/recommendations`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to clear recommendations: ${response.status}`);
      }

      // Update local agent state
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.recommendations = [];
      }

      this._emit('agent:recommendations_cleared', { agentId });
      return true;
    } catch (error) {
      console.error(`Error clearing recommendations for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Prepare AI service request based on agent type and capabilities
   */
  _prepareAIRequest(agent, request, session) {
    const basePrompt = this._generateAgentPrompt(agent, request, session);
    
    return {
      prompt: basePrompt,
      model: this._selectModelForAgent(agent),
      temperature: this._getTemperatureForAgent(agent),
      maxTokens: this._getMaxTokensForAgent(agent),
      context: {
        agentId: agent.id,
        agentType: agent.type,
        capabilities: agent.capabilities,
        sessionId: session.id
      }
    };
  }

  /**
   * Generate appropriate prompt for agent based on its type and capabilities
   */
  _generateAgentPrompt(agent, request, session) {
    let systemPrompt = `You are ${agent.name}, a specialized AI agent with the following capabilities: ${agent.capabilities.join(', ')}.`;
    
    // Add type-specific instructions
    switch (agent.type) {
      case AGENT_TYPES.OPTIMIZATION:
        systemPrompt += ' Focus on analyzing workflow efficiency, identifying bottlenecks, and suggesting optimizations.';
        break;
      case AGENT_TYPES.ESTIMATION:
        systemPrompt += ' Specialize in analyzing tasks and providing accurate effort estimates and complexity assessments.';
        break;
      case AGENT_TYPES.DEPENDENCIES:
        systemPrompt += ' Identify task dependencies, assess risks, and analyze critical paths in project workflows.';
        break;
      case AGENT_TYPES.QUALITY:
        systemPrompt += ' Focus on quality assurance, test strategy generation, and defect prediction.';
        break;
      case AGENT_TYPES.PLANNING:
        systemPrompt += ' Specialize in resource planning, capacity management, and timeline optimization.';
        break;
    }

    systemPrompt += '\n\nProvide practical, actionable insights based on the given context and data.';

    return `${systemPrompt}\n\nUser Request: ${request.prompt || request.message || JSON.stringify(request)}`;
  }

  /**
   * Select appropriate model for agent
   */
  _selectModelForAgent(agent) {
    // Use research model for complex analysis tasks
    const complexTypes = [AGENT_TYPES.OPTIMIZATION, AGENT_TYPES.DEPENDENCIES, AGENT_TYPES.QUALITY];
    return complexTypes.includes(agent.type) ? 'research' : 'main';
  }

  /**
   * Get temperature setting for agent
   */
  _getTemperatureForAgent(agent) {
    // Lower temperature for estimation and planning, higher for creative optimization
    switch (agent.type) {
      case AGENT_TYPES.ESTIMATION:
      case AGENT_TYPES.DEPENDENCIES:
        return 0.3;
      case AGENT_TYPES.OPTIMIZATION:
      case AGENT_TYPES.PLANNING:
        return 0.7;
      default:
        return 0.5;
    }
  }

  /**
   * Get max tokens for agent
   */
  _getMaxTokensForAgent(agent) {
    // More tokens for complex analysis tasks
    const complexTypes = [AGENT_TYPES.OPTIMIZATION, AGENT_TYPES.QUALITY];
    return complexTypes.includes(agent.type) ? 2000 : 1000;
  }

  /**
   * Call the AI service with appropriate parameters
   */
  async _callAIService(request, options = {}) {
    const params = {
      prompt: request.prompt,
      role: request.model || 'main',
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      commandName: 'ai-agent-service',
      outputType: 'service',
      ...options.aiParams
    };

    if (options.structured) {
      return await generateObjectService(params);
    } else {
      return await generateTextService(params);
    }
  }

  /**
   * Process and validate AI service response
   */
  async _processResponse(agent, response, originalRequest) {
    const processed = {
      content: response.mainResult?.text || response.mainResult?.object || response.mainResult,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type
      },
      timestamp: new Date().toISOString(),
      metadata: {
        model: response.telemetryData?.modelUsed,
        provider: response.telemetryData?.providerName,
        tokens: response.telemetryData?.totalTokens,
        cost: response.telemetryData?.totalCost
      }
    };

    // Validate response based on agent type
    this._validateAgentResponse(agent, processed);

    return processed;
  }

  /**
   * Validate agent response based on its type and capabilities
   */
  _validateAgentResponse(agent, response) {
    if (!response.content) {
      throw new Error(`Invalid response from agent ${agent.id}: No content`);
    }

    // Add type-specific validation as needed
    // This can be extended based on specific requirements for each agent type
  }

  /**
   * Get API base URL
   */
  _getApiBaseUrl() {
    return window.env?.REACT_APP_API_URL || 'http://localhost:3000';
  }

  /**
   * Emit events to listeners
   */
  _emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Create and export singleton instance
const aiAgentService = new AIAgentService();

export default aiAgentService;

// Export specific functions for direct use
export const {
  initialize,
  loadAgents,
  getAgent,
  getAllAgents,
  getAgentsByType,
  getAgentsByCapability,
  createSession,
  endSession,
  invokeAgent,
  updateAgentStatus,
  addRecommendation,
  getAgentRecommendations,
  clearRecommendations,
  on,
  off
} = aiAgentService; 