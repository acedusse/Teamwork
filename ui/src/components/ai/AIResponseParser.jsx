/**
 * AIResponseParser.jsx
 * Unified component for parsing and displaying AI agent responses
 * across planning and optimization tabs
 */

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Avatar,
  Badge,
  Button,
  ButtonGroup
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as IdeaIcon,
  TrendingUp as ImpactIcon,
  Schedule as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Psychology as AIIcon,
  AutoFixHigh as OptimizeIcon,
  Analytics as AnalyticsIcon,
  Assignment as TaskIcon,
  Group as CollabIcon,
  Star as PriorityIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Response type configurations
const RESPONSE_TYPES = {
  BRAINSTORMING_IDEA: {
    icon: <IdeaIcon />,
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    label: 'Brainstorming Idea'
  },
  OPTIMIZATION_SUGGESTION: {
    icon: <OptimizeIcon />,
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    label: 'Optimization Suggestion'
  },
  BOTTLENECK_ANALYSIS: {
    icon: <WarningIcon />,
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
    label: 'Bottleneck Analysis'
  },
  STORY_ESTIMATION: {
    icon: <AnalyticsIcon />,
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    label: 'Story Estimation'
  },
  PLANNING_RECOMMENDATION: {
    icon: <TaskIcon />,
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    label: 'Planning Recommendation'
  },
  COLLABORATION_INSIGHT: {
    icon: <CollabIcon />,
    color: '#607d8b',
    bgColor: 'rgba(96, 125, 139, 0.1)',
    label: 'Collaboration Insight'
  }
};

// Priority levels
const PRIORITY_LEVELS = {
  critical: { color: '#f44336', label: 'Critical' },
  high: { color: '#ff9800', label: 'High' },
  medium: { color: '#2196f3', label: 'Medium' },
  low: { color: '#4caf50', label: 'Low' }
};

// Confidence levels
const CONFIDENCE_LEVELS = {
  high: { color: '#4caf50', threshold: 0.8 },
  medium: { color: '#ff9800', threshold: 0.6 },
  low: { color: '#f44336', threshold: 0.0 }
};

/**
 * Parse and format AI agent response content
 */
const parseResponseContent = (response) => {
  if (!response) return null;

  try {
    // Handle structured JSON responses
    if (typeof response === 'object') {
      return response;
    }

    // Handle string responses that might be JSON
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        // If not JSON, treat as plain text
        return { content: response, type: 'text' };
      }
    }

    return response;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return { content: 'Error parsing response', type: 'error' };
  }
};

/**
 * Get confidence level based on score
 */
const getConfidenceLevel = (confidence) => {
  if (!confidence) return null;
  
  if (confidence >= CONFIDENCE_LEVELS.high.threshold) return 'high';
  if (confidence >= CONFIDENCE_LEVELS.medium.threshold) return 'medium';
  return 'low';
};

/**
 * Individual response item component
 */
const AIResponseItem = ({ response, expanded = false, onToggleExpand, onResponseAction }) => {
  const parsedContent = useMemo(() => parseResponseContent(response.content), [response.content]);
  const responseConfig = RESPONSE_TYPES[response.type] || RESPONSE_TYPES.COLLABORATION_INSIGHT;
  const confidenceLevel = getConfidenceLevel(parsedContent?.confidence);

  if (!parsedContent) return null;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        borderLeft: `4px solid ${responseConfig.color}`,
        backgroundColor: responseConfig.bgColor,
        '&:hover': { boxShadow: 2 }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Agent Avatar */}
          <Avatar 
            sx={{ 
              bgcolor: responseConfig.color,
              width: 40,
              height: 40
            }}
          >
            {response.agentName ? response.agentName.charAt(0) : responseConfig.icon}
          </Avatar>

          <Box flex={1}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {parsedContent.title || response.agentName || 'AI Agent'}
              </Typography>
              
              <Chip 
                label={responseConfig.label}
                size="small"
                sx={{ 
                  backgroundColor: responseConfig.color,
                  color: 'white'
                }}
              />

              {parsedContent.priority && (
                <Chip
                  label={parsedContent.priority}
                  size="small"
                  sx={{
                    backgroundColor: PRIORITY_LEVELS[parsedContent.priority]?.color || '#666',
                    color: 'white'
                  }}
                />
              )}

              {confidenceLevel && (
                <Chip
                  label={`${Math.round(parsedContent.confidence * 100)}% confidence`}
                  size="small"
                  sx={{
                    backgroundColor: CONFIDENCE_LEVELS[confidenceLevel].color,
                    color: 'white'
                  }}
                />
              )}
            </Box>

            {/* Main Content */}
            <Typography variant="body2" color="text.secondary" paragraph>
              {parsedContent.description || parsedContent.content || 'No description available'}
            </Typography>

            {/* Metadata */}
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              {parsedContent.type && (
                <Chip label={parsedContent.type} size="small" variant="outlined" />
              )}
              
              {parsedContent.effort && (
                <Chip 
                  label={`Effort: ${parsedContent.effort}`} 
                  size="small" 
                  variant="outlined"
                  icon={<TimelineIcon />}
                />
              )}
              
              {parsedContent.impact && (
                <Chip 
                  label={`Impact: ${parsedContent.impact}`} 
                  size="small" 
                  variant="outlined"
                  icon={<ImpactIcon />}
                />
              )}

              {response.timestamp && (
                <Chip 
                  label={new Date(response.timestamp).toLocaleTimeString()}
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>

            {/* Expandable Details */}
            {(parsedContent.rationale || parsedContent.implementationSteps || parsedContent.assumptions) && (
              <Accordion expanded={expanded} onChange={onToggleExpand}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="medium">
                    View Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {parsedContent.rationale && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Rationale
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {parsedContent.rationale}
                        </Typography>
                      </Grid>
                    )}

                    {parsedContent.implementationSteps && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Implementation Steps
                        </Typography>
                        <List dense>
                          {parsedContent.implementationSteps.map((step, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Typography variant="body2" fontWeight="bold">
                                  {index + 1}.
                                </Typography>
                              </ListItemIcon>
                              <ListItemText primary={step} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {parsedContent.assumptions && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Assumptions
                        </Typography>
                        <List dense>
                          {parsedContent.assumptions.map((assumption, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <InfoIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={assumption} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {parsedContent.risks && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Risks & Considerations
                        </Typography>
                        <List dense>
                          {parsedContent.risks.map((risk, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <WarningIcon fontSize="small" color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={risk} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Action Buttons */}
            {onResponseAction && (
              <Box mt={2} display="flex" justifyContent="flex-end">
                <ButtonGroup variant="outlined" size="small" aria-label="AI response actions">
                  <Button
                    onClick={() => onResponseAction(response, 'approve')}
                    aria-label="Approve response"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => onResponseAction(response, 'implement')}
                    aria-label="Implement response"
                  >
                    Implement
                  </Button>
                  <Button
                    onClick={() => onResponseAction(response, 'reject')}
                    aria-label="Reject response"
                    color="error"
                  >
                    Reject
                  </Button>
                </ButtonGroup>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Main AI Response Parser Component
 */
const AIResponseParser = ({
  responses = [],
  title = "AI Agent Responses",
  loading = false,
  error = null,
  emptyMessage = "No AI responses available",
  maxResponses = null,
  groupByAgent = false,
  showSummary = true,
  onResponseAction = null,
  className
}) => {
  const [expandedItems, setExpandedItems] = React.useState(new Set());

  // Process and sort responses
  const processedResponses = useMemo(() => {
    let filtered = responses.filter(response => response && response.content);
    
    // Limit responses if specified
    if (maxResponses && filtered.length > maxResponses) {
      filtered = filtered.slice(0, maxResponses);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeB - timeA;
    });

    return filtered;
  }, [responses, maxResponses]);

  // Group responses by agent if requested
  const groupedResponses = useMemo(() => {
    if (!groupByAgent) return { all: processedResponses };

    return processedResponses.reduce((groups, response) => {
      const agentKey = response.agentId || response.agentName || 'unknown';
      if (!groups[agentKey]) {
        groups[agentKey] = [];
      }
      groups[agentKey].push(response);
      return groups;
    }, {});
  }, [processedResponses, groupByAgent]);

  // Generate summary statistics
  const summary = useMemo(() => {
    if (!showSummary) return null;

    const totalResponses = processedResponses.length;
    const responseTypes = {};
    const agentCounts = {};
    let averageConfidence = 0;
    let confidenceCount = 0;

    processedResponses.forEach(response => {
      // Count response types
      const type = response.type || 'unknown';
      responseTypes[type] = (responseTypes[type] || 0) + 1;

      // Count agent responses
      const agent = response.agentName || 'Unknown Agent';
      agentCounts[agent] = (agentCounts[agent] || 0) + 1;

      // Calculate average confidence
      const parsed = parseResponseContent(response.content);
      if (parsed?.confidence) {
        averageConfidence += parsed.confidence;
        confidenceCount++;
      }
    });

    if (confidenceCount > 0) {
      averageConfidence = averageConfidence / confidenceCount;
    }

    return {
      totalResponses,
      responseTypes,
      agentCounts,
      averageConfidence: confidenceCount > 0 ? averageConfidence : null
    };
  }, [processedResponses, showSummary]);

  const handleToggleExpand = (responseId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(responseId)) {
        newSet.delete(responseId);
      } else {
        newSet.add(responseId);
      }
      return newSet;
    });
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Error Processing AI Responses</Typography>
        {error.message || error}
      </Alert>
    );
  }

  return (
    <Box className={className}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AIIcon color="primary" />
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {loading && <LinearProgress sx={{ flex: 1, ml: 2 }} />}
      </Box>

      {/* Summary */}
      {summary && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: 'rgba(33, 150, 243, 0.05)' }}>
          <Typography variant="subtitle2" gutterBottom>
            Response Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {summary.totalResponses}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Responses
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {Object.keys(summary.agentCounts).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Agents
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {Object.keys(summary.responseTypes).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Response Types
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {summary.averageConfidence ? `${Math.round(summary.averageConfidence * 100)}%` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg. Confidence
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Responses */}
      {processedResponses.length === 0 ? (
        <Alert severity="info">
          {emptyMessage}
        </Alert>
      ) : (
        <Box>
          {Object.entries(groupedResponses).map(([groupKey, groupResponses]) => (
            <Box key={groupKey}>
              {groupByAgent && Object.keys(groupedResponses).length > 1 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, mb: 2 }}>
                    {groupKey === 'all' ? 'All Responses' : `${groupKey} (${groupResponses.length})`}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}
              
              {groupResponses.map((response, index) => (
                <AIResponseItem
                  key={response.id || `${groupKey}-${index}`}
                  response={response}
                  expanded={expandedItems.has(response.id || `${groupKey}-${index}`)}
                  onToggleExpand={() => handleToggleExpand(response.id || `${groupKey}-${index}`)}
                  onResponseAction={onResponseAction}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}

      {loading && processedResponses.length === 0 && (
        <Box display="flex" alignItems="center" justifyContent="center" py={4}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      )}
    </Box>
  );
};

AIResponseParser.propTypes = {
  responses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    agentId: PropTypes.string,
    agentName: PropTypes.string,
    type: PropTypes.string,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    timestamp: PropTypes.string
  })),
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  emptyMessage: PropTypes.string,
  maxResponses: PropTypes.number,
  groupByAgent: PropTypes.bool,
  showSummary: PropTypes.bool,
  onResponseAction: PropTypes.func,
  className: PropTypes.string
};

export default AIResponseParser; 