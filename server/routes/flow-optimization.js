import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Mock flow optimization data
const mockFlowData = {
  metrics: {
    cycleTime: { current: 2.34, change: -0.3, trend: 'improving' },
    throughput: { current: 15, change: 15, trend: 'improving' },
    leadTime: { current: 4.2, change: -0.8, trend: 'improving' },
    wipLimits: { 
      development: { current: 4, limit: 3, status: 'over' },
      codeReview: { current: 2, limit: 3, status: 'ok' },
      testing: { current: 1, limit: 2, status: 'ok' }
    }
  },
  bottlenecks: [
    {
      id: 1,
      type: 'wip_limit',
      severity: 'high',
      column: 'Development',
      message: 'Development Column is over WIP limit (4/3). This is causing delays and reducing flow efficiency.',
      impact: 'high',
      detectedAt: new Date(),
      recommendations: [
        'Move blocked tasks to separate column',
        'Consider adding developer capacity',
        'Break down large tasks'
      ]
    },
    {
      id: 2,
      type: 'blocking_task',
      severity: 'medium',
      column: 'Code Review',
      message: 'TASK-005 has been in code review for 3 days without progress.',
      impact: 'medium',
      detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      recommendations: [
        'Escalate to senior developer',
        'Break into smaller reviewable chunks'
      ]
    }
  ],
  suggestions: [
    {
      id: 1,
      type: 'task_management',
      priority: 'high',
      title: 'Move TASK-005 (blocked) to separate blocked column',
      description: 'Separate blocked tasks to improve visibility and flow',
      impact: 'medium',
      effort: 'low',
      category: 'process',
      estimatedTimeToImplement: '1 hour',
      expectedImpact: 'Reduce cycle time by 0.5 days'
    },
    {
      id: 2,
      type: 'resource',
      priority: 'medium',
      title: 'Consider adding another developer to reduce WIP limit pressure',
      description: 'Additional developer capacity could help clear the bottleneck',
      impact: 'high',
      effort: 'high',
      category: 'resource',
      estimatedTimeToImplement: '2-4 weeks',
      expectedImpact: 'Increase throughput by 25%'
    },
    {
      id: 3,
      type: 'process',
      priority: 'medium',
      title: 'Break down large tasks (8 SP) into smaller chunks',
      description: 'Smaller tasks flow through the system more predictably',
      impact: 'medium',
      effort: 'medium',
      category: 'task_management',
      estimatedTimeToImplement: '2-3 hours',
      expectedImpact: 'Improve flow predictability by 30%'
    },
    {
      id: 4,
      type: 'process',
      priority: 'low',
      title: 'Review code review process - Items waiting too long',
      description: 'Optimize code review workflow to reduce wait times',
      impact: 'medium',
      effort: 'medium',
      category: 'process',
      estimatedTimeToImplement: '1 week',
      expectedImpact: 'Reduce code review time by 40%'
    },
    {
      id: 5,
      type: 'process',
      priority: 'low',
      title: 'Implement daily WIP limit check-ins',
      description: 'Regular monitoring to prevent bottlenecks before they occur',
      impact: 'low',
      effort: 'low',
      category: 'process',
      estimatedTimeToImplement: '30 minutes daily',
      expectedImpact: 'Prevent 80% of bottlenecks'
    }
  ],
  flowMetrics: {
    cumulativeFlow: [
      { date: '2024-01-01', backlog: 10, inProgress: 5, done: 20 },
      { date: '2024-01-02', backlog: 12, inProgress: 4, done: 22 },
      { date: '2024-01-03', backlog: 8, inProgress: 6, done: 25 },
      { date: '2024-01-04', backlog: 11, inProgress: 3, done: 28 },
      { date: '2024-01-05', backlog: 9, inProgress: 5, done: 30 }
    ],
    burndown: [
      { date: '2024-01-01', remaining: 50, ideal: 50 },
      { date: '2024-01-02', remaining: 45, ideal: 40 },
      { date: '2024-01-03', remaining: 38, ideal: 30 },
      { date: '2024-01-04', remaining: 32, ideal: 20 },
      { date: '2024-01-05', remaining: 25, ideal: 10 }
    ]
  },
  lastUpdated: new Date(),
  dataQuality: {
    completeness: 0.95,
    accuracy: 0.92,
    freshness: 0.98
  }
};

// Register explicit route for debugging
router.get('/', (req, res) => {
  console.log('Root flow optimization route accessed');
  res.json({ message: 'Flow optimization API is available' });
});

/**
 * GET /api/flow-optimization/data
 * Get current flow optimization data including metrics, bottlenecks, and suggestions
 */
// Add explicit debug logs to track request handling
// TODO: Implement actual API endpoint when real data source is available
// This is currently just a mock endpoint that returns simulated data
router.get('/data', (req, res) => {
  console.log('⭐ Flow optimization /data endpoint requested - NOTE: This is currently a mock endpoint');
  try {
    console.log('Returning mock flow optimization data');
    logger.info('Returning mock flow optimization data - real implementation pending');
    
    // Simulate some variability in the data
    const variableData = {
      ...mockFlowData,
      metrics: {
        ...mockFlowData.metrics,
        cycleTime: {
          ...mockFlowData.metrics.cycleTime,
          current: 2.34 + (Math.random() - 0.5) * 0.5
        },
        throughput: {
          ...mockFlowData.metrics.throughput,
          current: 15 + Math.floor((Math.random() - 0.5) * 6)
        }
      },
      lastUpdated: new Date()
    };

    res.json(variableData);
  } catch (error) {
    logger.error('Error fetching flow optimization data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flow optimization data',
      message: error.message 
    });
  }
});

/**
 * POST /api/flow-optimization/suggestions/apply
 * Apply selected optimization suggestions
 */
router.post('/suggestions/apply', (req, res) => {
  try {
    const { suggestionIds } = req.body;
    
    if (!Array.isArray(suggestionIds)) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'suggestionIds must be an array' 
      });
    }

    logger.info(`Applying suggestions: ${suggestionIds.join(', ')}`);
    
    // Simulate applying suggestions
    const appliedSuggestions = suggestionIds.map(id => {
      const suggestion = mockFlowData.suggestions.find(s => s.id === parseInt(id));
      return suggestion ? {
        id: suggestion.id,
        title: suggestion.title,
        status: 'applied',
        appliedAt: new Date()
      } : null;
    }).filter(Boolean);

    // Remove applied suggestions from mock data
    mockFlowData.suggestions = mockFlowData.suggestions.filter(
      s => !suggestionIds.includes(s.id.toString())
    );

    res.json({
      success: true,
      appliedSuggestions,
      message: `Successfully applied ${appliedSuggestions.length} suggestions`
    });
  } catch (error) {
    logger.error('Error applying suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to apply suggestions',
      message: error.message 
    });
  }
});

/**
 * GET /api/flow-optimization/bottlenecks
 * Get current bottleneck analysis
 */
router.get('/bottlenecks', (req, res) => {
  try {
    logger.info('Fetching bottleneck analysis');
    
    res.json({
      bottlenecks: mockFlowData.bottlenecks,
      analysis: {
        totalBottlenecks: mockFlowData.bottlenecks.length,
        highSeverity: mockFlowData.bottlenecks.filter(b => b.severity === 'high').length,
        mediumSeverity: mockFlowData.bottlenecks.filter(b => b.severity === 'medium').length,
        lowSeverity: mockFlowData.bottlenecks.filter(b => b.severity === 'low').length
      },
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching bottleneck analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bottleneck analysis',
      message: error.message 
    });
  }
});

/**
 * GET /api/flow-optimization/metrics
 * Get flow metrics and trends
 */
router.get('/metrics', (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    logger.info(`Fetching flow metrics for time range: ${timeRange}`);
    
    res.json({
      metrics: mockFlowData.metrics,
      flowMetrics: mockFlowData.flowMetrics,
      timeRange,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching flow metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flow metrics',
      message: error.message 
    });
  }
});

/**
 * WebSocket message handler for real-time updates
 * This would be called by the WebSocket server to broadcast updates
 */
export function broadcastFlowUpdate(wss, updateType, data) {
  const message = {
    type: updateType,
    data,
    timestamp: new Date()
  };

  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}

// Simulate periodic updates (in a real app, this would be triggered by actual events)
setInterval(() => {
  // Simulate a new bottleneck detection
  if (Math.random() < 0.1) { // 10% chance every interval
    const newBottleneck = {
      id: Date.now(),
      type: 'slow_task',
      severity: 'medium',
      column: 'Testing',
      message: `Task has been in testing for ${Math.floor(Math.random() * 5) + 1} hours without progress.`,
      impact: 'medium',
      detectedAt: new Date()
    };
    
    mockFlowData.bottlenecks.push(newBottleneck);
    
    // This would broadcast to WebSocket clients
    console.log('New bottleneck detected:', newBottleneck);
  }

  // Simulate metric updates
  mockFlowData.metrics.cycleTime.current += (Math.random() - 0.5) * 0.1;
  mockFlowData.metrics.throughput.current += Math.floor((Math.random() - 0.5) * 2);
  mockFlowData.lastUpdated = new Date();
}, 900000); // Every 15 minutes

export default router; 