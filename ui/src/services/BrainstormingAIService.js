/**
 * BrainstormingAIService.js
 * Specialized service for AI agent participation in brainstorming workflows
 * Builds upon AIAgentService for core AI interactions
 */

import aiAgentService, { AGENT_TYPES } from './AIAgentService.js';

// Brainstorming-specific constants
export const BRAINSTORMING_MODES = {
  IDEA_GENERATION: 'idea-generation',
  IDEA_EVALUATION: 'idea-evaluation',
  IDEA_CLUSTERING: 'idea-clustering',
  FEASIBILITY_ANALYSIS: 'feasibility-analysis',
  IMPACT_ASSESSMENT: 'impact-assessment'
};

export const IDEA_TYPES = {
  FEATURE: 'feature',
  USER_STORY: 'user-story',
  BUSINESS_GOAL: 'business-goal',
  TECHNICAL_REQUIREMENT: 'technical-requirement',
  PROCESS_IMPROVEMENT: 'process-improvement'
};

/**
 * Brainstorming AI Service class
 */
class BrainstormingAIService {
  constructor() {
    this.sessionParticipants = new Map();
    this.activeContributions = new Map();
    this.ideaClusters = new Map();
    this.evaluationCriteria = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the brainstorming AI service
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
      console.error('Failed to initialize BrainstormingAIService:', error);
      throw error;
    }
  }

  /**
   * Start an AI-powered brainstorming session
   */
  async startBrainstormingSession(sessionConfig) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      sessionId,
      focusArea,
      duration,
      participantTypes = ['optimization', 'estimation', 'planning'],
      mode = BRAINSTORMING_MODES.IDEA_GENERATION
    } = sessionConfig;

    try {
      // Get relevant agents for brainstorming
      const availableAgents = aiAgentService.getAllAgents();
      const selectedAgents = availableAgents.filter(agent => 
        participantTypes.includes(agent.type)
      );

      // Create sessions for each participating agent
      const agentSessions = await Promise.all(
        selectedAgents.map(async (agent) => {
          const sessionId = await aiAgentService.createSession(agent.id, {
            type: 'brainstorming',
            focusArea,
            duration,
            mode,
            role: this._getAgentBrainstormingRole(agent.type)
          });
          
          return {
            agentId: agent.id,
            sessionId,
            agent,
            contributions: [],
            lastActivity: new Date().toISOString()
          };
        })
      );

      // Store session participants
      this.sessionParticipants.set(sessionId, {
        sessionId,
        focusArea,
        duration,
        mode,
        agents: agentSessions,
        startTime: new Date().toISOString(),
        status: 'active'
      });

      return {
        sessionId,
        participants: agentSessions.map(session => ({
          id: session.agent.id,
          name: session.agent.name,
          type: session.agent.type,
          avatar: session.agent.avatar,
          role: this._getAgentBrainstormingRole(session.agent.type),
          status: 'active',
          sessionId: session.sessionId
        }))
      };
    } catch (error) {
      console.error('Failed to start brainstorming session:', error);
      throw error;
    }
  }

  /**
   * Generate AI agent ideas for a specific focus area
   */
  async generateAgentIdeas(sessionId, ideaType, context = {}) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session ${sessionId} not found`);
    }

    try {
      const ideas = await Promise.all(
        session.agents.map(async (agentSession) => {
          const prompt = this._buildIdeaGenerationPrompt(
            agentSession.agent,
            ideaType,
            session.focusArea,
            context
          );

          const response = await aiAgentService.invokeAgent(
            agentSession.agentId,
            { prompt, type: 'idea-generation' },
            { 
              sessionId: agentSession.sessionId,
              structured: true,
              aiParams: {
                schema: this._getIdeaGenerationSchema()
              }
            }
          );

          const ideaData = response.response.content;
          
          // Store the contribution
          const contribution = {
            id: `contrib_${Date.now()}_${agentSession.agentId}`,
            agentId: agentSession.agentId,
            agentName: agentSession.agent.name,
            type: ideaType,
            timestamp: new Date().toISOString(),
            idea: ideaData,
            context
          };

          agentSession.contributions.push(contribution);
          agentSession.lastActivity = new Date().toISOString();

          return contribution;
        })
      );

      return ideas.filter(idea => idea && idea.idea);
    } catch (error) {
      console.error('Failed to generate agent ideas:', error);
      throw error;
    }
  }

  /**
   * Get AI agent evaluation of user ideas
   */
  async evaluateIdeas(sessionId, ideas, evaluationCriteria = []) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session ${sessionId} not found`);
    }

    try {
      const evaluations = await Promise.all(
        session.agents.map(async (agentSession) => {
          const prompt = this._buildIdeaEvaluationPrompt(
            agentSession.agent,
            ideas,
            evaluationCriteria,
            session.focusArea
          );

          const response = await aiAgentService.invokeAgent(
            agentSession.agentId,
            { prompt, type: 'idea-evaluation' },
            { 
              sessionId: agentSession.sessionId,
              structured: true,
              aiParams: {
                schema: this._getIdeaEvaluationSchema()
              }
            }
          );

          return {
            agentId: agentSession.agentId,
            agentName: agentSession.agent.name,
            agentType: agentSession.agent.type,
            evaluation: response.response.content,
            timestamp: new Date().toISOString()
          };
        })
      );

      return evaluations;
    } catch (error) {
      console.error('Failed to evaluate ideas:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered idea clustering
   */
  async clusterIdeas(sessionId, ideas) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session ${sessionId} not found`);
    }

    try {
      // Use optimization agent for clustering if available
      const clusteringAgent = session.agents.find(agent => 
        agent.agent.type === AGENT_TYPES.OPTIMIZATION
      ) || session.agents[0];

      const prompt = this._buildIdeaClusteringPrompt(ideas, session.focusArea);

      const response = await aiAgentService.invokeAgent(
        clusteringAgent.agentId,
        { prompt, type: 'idea-clustering' },
        { 
          sessionId: clusteringAgent.sessionId,
          structured: true,
          aiParams: {
            schema: this._getIdeaClusteringSchema()
          }
        }
      );

      const clusters = response.response.content;
      
      // Store clusters for future reference
      this.ideaClusters.set(sessionId, {
        clusters,
        timestamp: new Date().toISOString(),
        agentId: clusteringAgent.agentId
      });

      return clusters;
    } catch (error) {
      console.error('Failed to cluster ideas:', error);
      throw error;
    }
  }

  /**
   * Generate agent voting/scoring for ideas
   */
  async voteOnIdeas(sessionId, ideas, votingCriteria = []) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session ${sessionId} not found`);
    }

    try {
      const votes = await Promise.all(
        session.agents.map(async (agentSession) => {
          const prompt = this._buildVotingPrompt(
            agentSession.agent,
            ideas,
            votingCriteria,
            session.focusArea
          );

          const response = await aiAgentService.invokeAgent(
            agentSession.agentId,
            { prompt, type: 'idea-voting' },
            { 
              sessionId: agentSession.sessionId,
              structured: true,
              aiParams: {
                schema: this._getVotingSchema()
              }
            }
          );

          return {
            agentId: agentSession.agentId,
            agentName: agentSession.agent.name,
            agentType: agentSession.agent.type,
            votes: response.response.content,
            timestamp: new Date().toISOString()
          };
        })
      );

      return votes;
    } catch (error) {
      console.error('Failed to get agent votes:', error);
      throw error;
    }
  }

  /**
   * End brainstorming session and cleanup
   */
  async endBrainstormingSession(sessionId) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      throw new Error(`Brainstorming session ${sessionId} not found`);
    }

    try {
      // End all agent sessions
      await Promise.all(
        session.agents.map(agentSession => 
          aiAgentService.endSession(agentSession.sessionId)
        )
      );

      // Update session status
      session.status = 'ended';
      session.endTime = new Date().toISOString();

      return {
        sessionId,
        summary: {
          duration: new Date(session.endTime) - new Date(session.startTime),
          totalContributions: session.agents.reduce(
            (total, agent) => total + agent.contributions.length, 0
          ),
          participatingAgents: session.agents.length,
          clusters: this.ideaClusters.get(sessionId)?.clusters?.length || 0
        }
      };
    } catch (error) {
      console.error('Failed to end brainstorming session:', error);
      throw error;
    }
  }

  /**
   * Get session status and statistics
   */
  getSessionStatus(sessionId) {
    const session = this.sessionParticipants.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      focusArea: session.focusArea,
      mode: session.mode,
      agents: session.agents.map(agent => ({
        id: agent.agentId,
        name: agent.agent.name,
        type: agent.agent.type,
        contributionsCount: agent.contributions.length,
        lastActivity: agent.lastActivity
      })),
      totalContributions: session.agents.reduce(
        (total, agent) => total + agent.contributions.length, 0
      )
    };
  }

  // Private helper methods

  /**
   * Get brainstorming role for agent type
   */
  _getAgentBrainstormingRole(agentType) {
    const roles = {
      [AGENT_TYPES.OPTIMIZATION]: 'Process & Workflow Analyst',
      [AGENT_TYPES.ESTIMATION]: 'Effort & Complexity Assessor',
      [AGENT_TYPES.DEPENDENCIES]: 'Risk & Dependencies Analyst',
      [AGENT_TYPES.QUALITY]: 'Quality & Testing Strategist',
      [AGENT_TYPES.PLANNING]: 'Resource & Timeline Planner'
    };
    return roles[agentType] || 'General Contributor';
  }

  /**
   * Build idea generation prompt
   */
  _buildIdeaGenerationPrompt(agent, ideaType, focusArea, context) {
    const roleContext = this._getAgentBrainstormingRole(agent.type);
    
    return `As a ${roleContext} in a brainstorming session focused on "${focusArea}", generate a creative and practical ${ideaType.replace('-', ' ')} idea.

Context: ${JSON.stringify(context, null, 2)}

Consider your expertise in: ${agent.capabilities.join(', ')}

Generate an idea that:
1. Addresses the focus area directly
2. Leverages your specific expertise
3. Is actionable and feasible
4. Brings unique value to the project

Provide your response as a structured idea with title, description, rationale, and implementation considerations.`;
  }

  /**
   * Build idea evaluation prompt
   */
  _buildIdeaEvaluationPrompt(agent, ideas, criteria, focusArea) {
    const roleContext = this._getAgentBrainstormingRole(agent.type);
    
    return `As a ${roleContext}, evaluate the following ideas for the "${focusArea}" project:

Ideas to evaluate:
${ideas.map((idea, index) => `${index + 1}. ${idea.title}: ${idea.content}`).join('\n')}

Evaluation criteria: ${criteria.length ? criteria.join(', ') : 'feasibility, impact, complexity, alignment with focus area'}

Based on your expertise in: ${agent.capabilities.join(', ')}

For each idea, provide:
1. Score (1-10)
2. Strengths
3. Concerns/Risks
4. Recommendations for improvement
5. Implementation complexity assessment`;
  }

  /**
   * Build idea clustering prompt
   */
  _buildIdeaClusteringPrompt(ideas, focusArea) {
    return `Analyze and cluster the following ideas from a "${focusArea}" brainstorming session:

Ideas:
${ideas.map((idea, index) => `${index + 1}. ${idea.title}: ${idea.content}`).join('\n')}

Create logical clusters based on:
1. Thematic similarity
2. Implementation dependencies
3. User value propositions
4. Technical complexity levels

For each cluster, provide:
- Cluster name and description
- List of included idea IDs
- Rationale for grouping
- Suggested prioritization within cluster`;
  }

  /**
   * Build voting prompt
   */
  _buildVotingPrompt(agent, ideas, criteria, focusArea) {
    const roleContext = this._getAgentBrainstormingRole(agent.type);
    
    return `As a ${roleContext}, vote on these ideas for the "${focusArea}" project:

Ideas:
${ideas.map((idea, index) => `ID: ${idea.id}, Title: ${idea.title}, Description: ${idea.content}`).join('\n')}

Voting criteria: ${criteria.length ? criteria.join(', ') : 'overall value, feasibility, alignment with focus area'}

Based on your expertise in: ${agent.capabilities.join(', ')}

Provide votes (scores 1-10) for each idea with brief justification from your perspective.`;
  }

  /**
   * Get idea generation schema for structured responses
   */
  _getIdeaGenerationSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Clear, concise title for the idea' },
        description: { type: 'string', description: 'Detailed description of the idea' },
        rationale: { type: 'string', description: 'Why this idea is valuable' },
        implementation: { type: 'string', description: 'Key implementation considerations' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Relevant tags' },
        estimatedEffort: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Effort estimate' },
        expectedImpact: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Expected impact' }
      },
      required: ['title', 'description', 'rationale']
    };
  }

  /**
   * Get idea evaluation schema
   */
  _getIdeaEvaluationSchema() {
    return {
      type: 'object',
      properties: {
        evaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ideaId: { type: 'string' },
              score: { type: 'number', minimum: 1, maximum: 10 },
              strengths: { type: 'array', items: { type: 'string' } },
              concerns: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
            },
            required: ['ideaId', 'score']
          }
        }
      },
      required: ['evaluations']
    };
  }

  /**
   * Get idea clustering schema
   */
  _getIdeaClusteringSchema() {
    return {
      type: 'object',
      properties: {
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              ideaIds: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            },
            required: ['id', 'name', 'ideaIds']
          }
        }
      },
      required: ['clusters']
    };
  }

  /**
   * Get voting schema
   */
  _getVotingSchema() {
    return {
      type: 'object',
      properties: {
        votes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ideaId: { type: 'string' },
              score: { type: 'number', minimum: 1, maximum: 10 },
              justification: { type: 'string' }
            },
            required: ['ideaId', 'score']
          }
        }
      },
      required: ['votes']
    };
  }
}

// Create and export singleton instance
const brainstormingAIService = new BrainstormingAIService();

export default brainstormingAIService;
