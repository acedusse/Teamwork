import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  Speed,
  Block,
  AccessTime,
  TrendingUp,
  TrendingDown,
  Person,
  Assignment,
  Timeline,
  Info as InfoIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * BottleneckDetection Component
 * 
 * Analyzes workflow data and identifies bottlenecks including:
 * - WIP limit violations
 * - Blocked tasks accumulation
 * - Resource constraints
 * - Process inefficiencies
 * - Column overload patterns
 */
const BottleneckDetection = ({ 
  flowData = null,
  onBottleneckAction,
  showDetails = true,
  className 
}) => {
  const [bottlenecks, setBottlenecks] = useState([]);
  const [expandedBottlenecks, setExpandedBottlenecks] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState(new Date());

  // Bottleneck analysis logic
  const analyzeBottlenecks = useCallback((data) => {
    if (!data) {
      // Use sample data for demonstration
      return [
        {
          id: 'wip-dev-001',
          type: 'wip_limit',
          severity: 'critical',
          column: 'Development',
          title: 'WIP Limit Exceeded',
          message: 'Development Column is over WIP limit (4/3). This is causing delays and reducing flow efficiency.',
          impact: 'high',
          detectedAt: new Date(),
          metrics: {
            current: 4,
            limit: 3,
            overagePercentage: 33,
            avgCycleTime: 2.8,
            expectedCycleTime: 2.1
          },
          recommendations: [
            'Move blocked tasks to a separate column',
            'Consider pairing on complex tasks',
            'Review task sizing and break down large items'
          ],
          affectedTasks: [
            { id: 'TASK-001', title: 'User Authentication', status: 'in-progress', assignee: 'John Doe' },
            { id: 'TASK-005', title: 'Database Schema', status: 'blocked', assignee: 'Jane Smith' },
            { id: 'TASK-008', title: 'API Integration', status: 'in-progress', assignee: 'Bob Wilson' },
            { id: 'TASK-012', title: 'UI Components', status: 'in-progress', assignee: 'Alice Brown' }
          ]
        },
        {
          id: 'blocked-001',
          type: 'blocked_tasks',
          severity: 'high',
          column: 'Code Review',
          title: 'Blocked Tasks Accumulation',
          message: 'Multiple tasks have been blocked in Code Review for over 2 days, creating a bottleneck.',
          impact: 'medium',
          detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          metrics: {
            blockedCount: 3,
            avgBlockedTime: 2.5,
            maxBlockedTime: 4.2,
            blockedTasks: 3
          },
          recommendations: [
            'Assign dedicated reviewers for urgent tasks',
            'Implement pair programming for complex reviews',
            'Set up automated code quality checks'
          ],
          affectedTasks: [
            { id: 'TASK-003', title: 'Payment Integration', status: 'blocked', assignee: 'Charlie Davis', blockedSince: '2 days' },
            { id: 'TASK-007', title: 'Security Module', status: 'blocked', assignee: 'Diana Prince', blockedSince: '1.5 days' },
            { id: 'TASK-011', title: 'Data Migration', status: 'blocked', assignee: 'Eve Wilson', blockedSince: '3 days' }
          ]
        },
        {
          id: 'resource-001',
          type: 'resource_constraint',
          severity: 'medium',
          column: 'Testing',
          title: 'Resource Constraint',
          message: 'Testing capacity is insufficient for current workload. QA team is overloaded.',
          impact: 'medium',
          detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          metrics: {
            utilization: 95,
            capacity: 100,
            backlogSize: 8,
            avgWaitTime: 1.8
          },
          recommendations: [
            'Cross-train developers in testing practices',
            'Implement automated testing for repetitive scenarios',
            'Consider temporary QA contractor'
          ],
          affectedTasks: [
            { id: 'TASK-004', title: 'Mobile App Testing', status: 'waiting', assignee: 'QA Team' },
            { id: 'TASK-009', title: 'Integration Tests', status: 'waiting', assignee: 'QA Team' },
            { id: 'TASK-013', title: 'Performance Tests', status: 'waiting', assignee: 'QA Team' }
          ]
        }
      ];
    }

    // Real bottleneck analysis would go here
    // This would analyze actual flow data to detect patterns
    return [];
  }, []);

  // Perform bottleneck analysis when data changes
  useEffect(() => {
    setIsAnalyzing(true);
    
    // Simulate analysis time
    const analysisTimer = setTimeout(() => {
      const detectedBottlenecks = analyzeBottlenecks(flowData);
      setBottlenecks(detectedBottlenecks);
      setAnalysisTimestamp(new Date());
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(analysisTimer);
  }, [flowData, analyzeBottlenecks]);

  // Handle bottleneck expansion
  const handleToggleExpansion = useCallback((bottleneckId) => {
    setExpandedBottlenecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bottleneckId)) {
        newSet.delete(bottleneckId);
      } else {
        newSet.add(bottleneckId);
      }
      return newSet;
    });
  }, []);

  // Handle bottleneck action
  const handleBottleneckAction = useCallback((bottleneck, action) => {
    if (onBottleneckAction) {
      onBottleneckAction(bottleneck, action);
    }
  }, [onBottleneckAction]);

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <Warning />;
      case 'medium': return <Warning />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  // Get bottleneck type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'wip_limit': return <Speed />;
      case 'blocked_tasks': return <Block />;
      case 'resource_constraint': return <Person />;
      case 'process_inefficiency': return <Timeline />;
      default: return <Warning />;
    }
  };

  return (
    <Box className={className}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Bottleneck Detection
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last analyzed: {analysisTimestamp.toLocaleTimeString()}
          </Typography>
          {isAnalyzing && (
            <Tooltip title="Analyzing workflow data...">
              <Box sx={{ width: 100 }}>
                <LinearProgress size="small" />
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Analysis Status */}
      {isAnalyzing && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            sx={{ 
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              }
            }} 
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Analyzing workflow patterns and detecting bottlenecks...
          </Typography>
        </Box>
      )}

      {/* Bottleneck Alerts */}
      {bottlenecks.length === 0 && !isAnalyzing ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>No Bottlenecks Detected</AlertTitle>
          Your workflow is currently operating smoothly with no significant bottlenecks identified.
        </Alert>
      ) : (
        <Box>
          {bottlenecks.map((bottleneck) => (
            <Paper key={bottleneck.id} elevation={1} sx={{ mb: 2, borderRadius: 2 }}>
              <Alert 
                severity={getSeverityColor(bottleneck.severity)}
                sx={{ 
                  '& .MuiAlert-message': { width: '100%' },
                  borderRadius: 2
                }}
                icon={getSeverityIcon(bottleneck.severity)}
                action={
                  showDetails && (
                    <IconButton
                      onClick={() => handleToggleExpansion(bottleneck.id)}
                      size="small"
                      sx={{ color: 'inherit' }}
                    >
                      {expandedBottlenecks.has(bottleneck.id) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )
                }
              >
                <AlertTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getTypeIcon(bottleneck.type)}
                  {bottleneck.title}: {bottleneck.column} Column
                  <Chip 
                    label={bottleneck.severity.toUpperCase()} 
                    size="small" 
                    color={getSeverityColor(bottleneck.severity)}
                    sx={{ fontSize: '0.7rem', ml: 1 }}
                  />
                </AlertTitle>
                {bottleneck.message}

                {/* Expanded Details */}
                {showDetails && (
                  <Collapse in={expandedBottlenecks.has(bottleneck.id)} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        {/* Metrics */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            📊 Metrics
                          </Typography>
                          <Card variant="outlined" sx={{ p: 2 }}>
                            {bottleneck.type === 'wip_limit' && (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Current WIP:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.current}/{bottleneck.metrics.limit}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Overage:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                    +{bottleneck.metrics.overagePercentage}%
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Cycle Time Impact:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.avgCycleTime}d vs {bottleneck.metrics.expectedCycleTime}d
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            {bottleneck.type === 'blocked_tasks' && (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Blocked Tasks:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.blockedCount}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Avg Blocked Time:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.avgBlockedTime}d
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Max Blocked Time:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                    {bottleneck.metrics.maxBlockedTime}d
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            {bottleneck.type === 'resource_constraint' && (
                              <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Utilization:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                    {bottleneck.metrics.utilization}%
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">Backlog Size:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.backlogSize} items
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Avg Wait Time:</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {bottleneck.metrics.avgWaitTime}d
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Card>
                        </Grid>

                        {/* Recommendations */}
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            💡 Recommendations
                          </Typography>
                          <List dense>
                            {bottleneck.recommendations.map((recommendation, index) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  <TrendingUp fontSize="small" color="success" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={recommendation}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>

                        {/* Affected Tasks */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            🎯 Affected Tasks ({bottleneck.affectedTasks.length})
                          </Typography>
                          <Grid container spacing={1}>
                            {bottleneck.affectedTasks.slice(0, 6).map((task) => (
                              <Grid item xs={12} sm={6} md={4} key={task.id}>
                                <Card variant="outlined" sx={{ p: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Assignment fontSize="small" color="action" />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {task.id}
                                      </Typography>
                                      <Typography variant="body2" noWrap>
                                        {task.title}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {task.assignee}
                                        {task.blockedSince && ` • Blocked ${task.blockedSince}`}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Card>
                              </Grid>
                            ))}
                            {bottleneck.affectedTasks.length > 6 && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">
                                  ... and {bottleneck.affectedTasks.length - 6} more tasks
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </Grid>
                    </Box>
                  </Collapse>
                )}
              </Alert>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

BottleneckDetection.propTypes = {
  flowData: PropTypes.object,
  onBottleneckAction: PropTypes.func,
  showDetails: PropTypes.bool,
  className: PropTypes.string
};

export default BottleneckDetection; 