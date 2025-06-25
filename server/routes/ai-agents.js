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
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Get all AI agents
 */
router.get('/', (req, res, next) => {
  try {
    const agents = loadAIAgents();
    logger.agentEvent('list', { action: 'list', count: agents.length });
    res.json(success({ agents }));
  } catch (err) {
    logger.agentEvent('error', { action: 'list', error: err.message });
    next(err);
  }
});

/**
 * Get active AI agents
 */
router.get('/active', (req, res, next) => {
  try {
    const activeAgents = getActiveAgents();
    logger.agentEvent('list_active', { action: 'list_active', count: activeAgents.length });
    res.json(success({ agents: activeAgents }));
  } catch (err) {
    logger.agentEvent('error', { action: 'list_active', error: err.message });
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
      logger.agentEvent('error', { action: 'update_status', agentId, error: 'Status is required' });
      return res.status(400).json(error('Status is required'));
    }

    const validStatuses = ['idle', 'thinking', 'working', 'active'];
    if (!validStatuses.includes(status)) {
      logger.agentEvent('error', { action: 'update_status', agentId, error: 'Invalid status' });
      return res.status(400).json(error('Invalid status'));
    }

    updateAgentStatus(agentId, status, currentTask);
    logger.agentEvent('update_status', { agentId, status, currentTask });
    res.json(success({ message: 'Agent status updated successfully' }));
  } catch (err) {
    logger.agentEvent('error', { action: 'update_status', error: err.message });
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
      logger.agentEvent('error', { action: 'add_recommendation', agentId, error: 'Title and description are required' });
      return res.status(400).json(error('Title and description are required'));
    }

    addAgentRecommendation(agentId, recommendation);
    logger.agentEvent('add_recommendation', { agentId, recommendation });
    res.json(success({ message: 'Recommendation added successfully' }));
  } catch (err) {
    logger.agentEvent('error', { action: 'add_recommendation', error: err.message });
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
    logger.agentEvent('clear_recommendations', { agentId });
    res.json(success({ message: 'Recommendations cleared successfully' }));
  } catch (err) {
    logger.agentEvent('error', { action: 'clear_recommendations', error: err.message });
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
    logger.agentEvent('list_activities', { count: activities.length });
    res.json(success({ activities }));
  } catch (err) {
    logger.agentEvent('error', { action: 'list_activities', error: err.message });
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
      logger.agentEvent('error', { action: 'simulate', agentId, error: 'Task is required' });
      return res.status(400).json(error('Task is required'));
    }

    simulateAgentWork(agentId, task, duration);
    logger.agentEvent('simulate', { agentId, task, duration });
    res.json(success({ message: 'Agent simulation started' }));
  } catch (err) {
    logger.agentEvent('error', { action: 'simulate', error: err.message });
    next(err);
  }
});

/**
 * Reset all agents to idle state
 */
router.post('/reset', (req, res, next) => {
  try {
    resetAllAgents();
    logger.agentEvent('reset_all');
    res.json(success({ message: 'All agents reset to idle state' }));
  } catch (err) {
    logger.agentEvent('error', { action: 'reset_all', error: err.message });
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
      logger.agentEvent('error', { action: 'get_agent', agentId, error: 'Agent not found' });
      return res.status(404).json(error('Agent not found'));
    }

    logger.agentEvent('get_agent', { agentId });
    res.json(success({ agent }));
  } catch (err) {
    logger.agentEvent('error', { action: 'get_agent', error: err.message });
    next(err);
  }
});

export default router; 