import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { broadcast } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_AGENTS_FILE = path.join(__dirname, '../data/ai-agents.json');
const AGENT_ACTIVITIES_FILE = path.join(__dirname, '../data/agent-activities.json');

/**
 * Load AI agents from file
 * @returns {Array} Array of AI agents
 */
export function loadAIAgents() {
  try {
    if (!fs.existsSync(AI_AGENTS_FILE)) {
      return [];
    }
    const data = JSON.parse(fs.readFileSync(AI_AGENTS_FILE, 'utf8'));
    return data.aiAgents || [];
  } catch (error) {
    logger.error('Error loading AI agents:', error);
    return [];
  }
}

/**
 * Save AI agents to file
 * @param {Array} agents - Array of AI agents
 */
export function saveAIAgents(agents) {
  try {
    const data = {
      aiAgents: agents,
      metadata: {
        created: "2025-01-17T12:00:00.000Z",
        updated: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    fs.writeFileSync(AI_AGENTS_FILE, JSON.stringify(data, null, 2));
    
    // Broadcast agent updates to connected clients
    broadcast({
      type: 'aiAgentsUpdated',
      agents: agents
    });
  } catch (error) {
    logger.error('Error saving AI agents:', error);
  }
}

/**
 * Update agent status
 * @param {string} agentId - Agent ID
 * @param {string} status - New status (idle, active, thinking, working)
 * @param {Object} currentTask - Current task the agent is working on
 */
export function updateAgentStatus(agentId, status, currentTask = null) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(agent => agent.id === agentId);
    
    if (agentIndex === -1) {
      logger.warn(`Agent ${agentId} not found`);
      return;
    }

    agents[agentIndex].status = status;
    agents[agentIndex].currentTask = currentTask;
    agents[agentIndex].lastActivity = new Date().toISOString();

    saveAIAgents(agents);
    
    // Log agent activity
    logAgentActivity(agentId, 'status_change', {
      status,
      currentTask: currentTask?.id || null
    });

    logger.info(`Agent ${agentId} status updated to ${status}`);
  } catch (error) {
    logger.error('Error updating agent status:', error);
  }
}

/**
 * Add recommendation from an AI agent
 * @param {string} agentId - Agent ID
 * @param {Object} recommendation - Recommendation object
 */
export function addAgentRecommendation(agentId, recommendation) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(agent => agent.id === agentId);
    
    if (agentIndex === -1) {
      logger.warn(`Agent ${agentId} not found`);
      return;
    }

    const recommendationWithId = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...recommendation
    };

    agents[agentIndex].recommendations.push(recommendationWithId);
    agents[agentIndex].lastActivity = new Date().toISOString();

    saveAIAgents(agents);
    
    // Broadcast recommendation to clients
    broadcast({
      type: 'agentRecommendation',
      agentId,
      recommendation: recommendationWithId
    });

    // Log agent activity
    logAgentActivity(agentId, 'recommendation', recommendation);

    logger.info(`Agent ${agentId} added recommendation: ${recommendation.title}`);
  } catch (error) {
    logger.error('Error adding agent recommendation:', error);
  }
}

/**
 * Clear agent recommendations
 * @param {string} agentId - Agent ID
 */
export function clearAgentRecommendations(agentId) {
  try {
    const agents = loadAIAgents();
    const agentIndex = agents.findIndex(agent => agent.id === agentId);
    
    if (agentIndex === -1) {
      logger.warn(`Agent ${agentId} not found`);
      return;
    }

    agents[agentIndex].recommendations = [];
    agents[agentIndex].lastActivity = new Date().toISOString();

    saveAIAgents(agents);
    
    logger.info(`Agent ${agentId} recommendations cleared`);
  } catch (error) {
    logger.error('Error clearing agent recommendations:', error);
  }
}

/**
 * Log agent activity
 * @param {string} agentId - Agent ID
 * @param {string} action - Action type
 * @param {Object} details - Activity details
 */
export function logAgentActivity(agentId, action, details = {}) {
  try {
    let activities = [];
    
    if (fs.existsSync(AGENT_ACTIVITIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(AGENT_ACTIVITIES_FILE, 'utf8'));
      activities = data.activities || [];
    }

    const activity = {
      id: Date.now().toString(),
      agentId,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    activities.unshift(activity); // Add to beginning
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities = activities.slice(0, 1000);
    }

    const data = {
      activities,
      metadata: {
        updated: new Date().toISOString()
      }
    };

    fs.writeFileSync(AGENT_ACTIVITIES_FILE, JSON.stringify(data, null, 2));
    
    // Broadcast activity to clients
    broadcast({
      type: 'agentActivity',
      activity
    });

  } catch (error) {
    logger.error('Error logging agent activity:', error);
  }
}

/**
 * Get agent activities
 * @param {number} limit - Maximum number of activities to return
 * @returns {Array} Array of activities
 */
export function getAgentActivities(limit = 50) {
  try {
    if (!fs.existsSync(AGENT_ACTIVITIES_FILE)) {
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(AGENT_ACTIVITIES_FILE, 'utf8'));
    const activities = data.activities || [];
    
    return activities.slice(0, limit);
  } catch (error) {
    logger.error('Error getting agent activities:', error);
    return [];
  }
}

/**
 * Simulate agent task processing
 * @param {string} agentId - Agent ID
 * @param {Object} task - Task to process
 * @param {number} duration - Processing duration in milliseconds
 */
export function simulateAgentWork(agentId, task, duration = 3000) {
  const agents = loadAIAgents();
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    logger.warn(`Agent ${agentId} not found for simulation`);
    return;
  }

  // Start working
  updateAgentStatus(agentId, 'thinking', task);
  
  setTimeout(() => {
    updateAgentStatus(agentId, 'working', task);
    
    setTimeout(() => {
      // Generate a recommendation based on agent type
      const recommendation = generateRecommendationForTask(agent, task);
      addAgentRecommendation(agentId, recommendation);
      
      // Finish work
      updateAgentStatus(agentId, 'idle', null);
      
      logAgentActivity(agentId, 'task_completed', {
        taskId: task.id,
        duration: duration + 2000
      });
      
    }, 2000); // Work for 2 seconds
  }, duration); // Think for specified duration
}

/**
 * Generate recommendation based on agent type and task
 * @param {Object} agent - AI agent
 * @param {Object} task - Task
 * @returns {Object} Recommendation
 */
function generateRecommendationForTask(agent, task) {
  const recommendations = {
    'task-optimizer': {
      title: 'Optimize Task Flow',
      description: `Consider moving "${task.title}" to a different column to improve flow`,
      priority: 'medium',
      type: 'optimization',
      actionable: true
    },
    'story-estimator': {
      title: 'Story Point Estimation',
      description: `Based on complexity analysis, "${task.title}" should be estimated at ${Math.ceil(Math.random() * 8) + 1} story points`,
      priority: 'low',
      type: 'estimation',
      actionable: true
    },
    'dependency-tracker': {
      title: 'Dependency Alert',
      description: `Task "${task.title}" may have unidentified dependencies. Review before starting development.`,
      priority: 'high',
      type: 'dependency',
      actionable: true
    },
    'quality-assurance': {
      title: 'Quality Recommendation',
      description: `Add automated tests for "${task.title}" to maintain quality standards`,
      priority: 'medium',
      type: 'quality',
      actionable: true
    },
    'resource-planner': {
      title: 'Resource Allocation',
      description: `Consider assigning additional resources to "${task.title}" to meet deadline`,
      priority: 'medium',
      type: 'planning',
      actionable: true
    }
  };

  return recommendations[agent.id] || {
    title: 'General Recommendation',
    description: `Review task "${task.title}" for optimization opportunities`,
    priority: 'low',
    type: 'general',
    actionable: false
  };
}

/**
 * Get active agents
 * @returns {Array} Array of active agents
 */
export function getActiveAgents() {
  const agents = loadAIAgents();
  return agents.filter(agent => agent.status !== 'idle');
}

/**
 * Reset all agents to idle state
 */
export function resetAllAgents() {
  try {
    const agents = loadAIAgents();
    agents.forEach(agent => {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.lastActivity = new Date().toISOString();
    });
    
    saveAIAgents(agents);
    logger.info('All agents reset to idle state');
  } catch (error) {
    logger.error('Error resetting agents:', error);
  }
} 