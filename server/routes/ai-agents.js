import express from 'express';
import { success, error } from '../utils/response.js';
import {
  loadAIAgents,
  saveAIAgents,
  updateAgentStatus,
  addAgentRecommendation,
  clearAgentRecommendations,
  getAgentActivities,
  simulateAgentWork,
  getActiveAgents,
  resetAllAgents
} from '../utils/ai-agents.js';

const router = express.Router();

/**
 * Get all AI agents
 */
router.get('/', (req, res, next) => {
  try {
    const agents = loadAIAgents();
    res.json(success({ agents }));
  } catch (err) {
    next(err);
  }
});

/**
 * Get active AI agents
 */
router.get('/active', (req, res, next) => {
  try {
    const activeAgents = getActiveAgents();
    res.json(success({ agents: activeAgents }));
  } catch (err) {
    next(err);
  }
});

/**
 * Update agent status
 */
router.post('/:agentId/status', (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { status, currentTask } = req.body;

    if (!status) {
      return res.status(400).json(error('Status is required'));
    }

    const validStatuses = ['idle', 'thinking', 'working', 'active'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(error('Invalid status'));
    }

    updateAgentStatus(agentId, status, currentTask);
    res.json(success({ message: 'Agent status updated successfully' }));
  } catch (err) {
    next(err);
  }
});

/**
 * Add agent recommendation
 */
router.post('/:agentId/recommendations', (req, res, next) => {
  try {
    const { agentId } = req.params;
    const recommendation = req.body;

    if (!recommendation.title || !recommendation.description) {
      return res.status(400).json(error('Title and description are required'));
    }

    addAgentRecommendation(agentId, recommendation);
    res.json(success({ message: 'Recommendation added successfully' }));
  } catch (err) {
    next(err);
  }
});

/**
 * Clear agent recommendations
 */
router.delete('/:agentId/recommendations', (req, res, next) => {
  try {
    const { agentId } = req.params;
    clearAgentRecommendations(agentId);
    res.json(success({ message: 'Recommendations cleared successfully' }));
  } catch (err) {
    next(err);
  }
});

/**
 * Get agent activities
 */
router.get('/activities', (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = getAgentActivities(limit);
    res.json(success({ activities }));
  } catch (err) {
    next(err);
  }
});

/**
 * Simulate agent work on a task
 */
router.post('/:agentId/simulate', (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { task, duration } = req.body;

    if (!task) {
      return res.status(400).json(error('Task is required'));
    }

    simulateAgentWork(agentId, task, duration);
    res.json(success({ message: 'Agent simulation started' }));
  } catch (err) {
    next(err);
  }
});

/**
 * Reset all agents to idle state
 */
router.post('/reset', (req, res, next) => {
  try {
    resetAllAgents();
    res.json(success({ message: 'All agents reset to idle state' }));
  } catch (err) {
    next(err);
  }
});

/**
 * Get specific agent details
 */
router.get('/:agentId', (req, res, next) => {
  try {
    const { agentId } = req.params;
    const agents = loadAIAgents();
    const agent = agents.find(a => a.id === agentId);

    if (!agent) {
      return res.status(404).json(error('Agent not found'));
    }

    res.json(success({ agent }));
  } catch (err) {
    next(err);
  }
});

export default router; 