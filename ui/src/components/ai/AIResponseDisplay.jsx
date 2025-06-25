/**
 * AIResponseDisplay.jsx
 * Specialized display component for AI agent responses
 * Designed for easy integration into dashboard tabs
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Share as ShareIcon,
  BookmarkBorder as SaveIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Psychology as AIIcon,
  CheckCircle as ImplementedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

// Response status colors
const STATUS_COLORS = {
  pending: '#2196f3',
  approved: '#4caf50',
  rejected: '#f44336',
  implemented: '#9c27b0',
  archived: '#757575'
};

// Response action types
const ACTION_TYPES = {
  APPROVE: 'approve',
  REJECT: 'reject',
  IMPLEMENT: 'implement',
  SAVE: 'save',
  SHARE: 'share',
  VIEW_DETAILS: 'view_details'
};

/**
 * Response status indicator
 */
const ResponseStatusIndicator = ({ status, size = 'small' }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'implemented': return <ImplementedIcon />;
      case 'rejected': return <RejectedIcon />;
      default: return <PendingIcon />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'implemented': return 'Implemented';
      case 'rejected': return 'Rejected';
      case 'archived': return 'Archived';
      default: return 'Pending';
    }
  };

  return (
    <Chip
      icon={getStatusIcon()}
      label={getStatusLabel()}
      size={size}
      sx={{
        backgroundColor: STATUS_COLORS[status] || STATUS_COLORS.pending,
        color: 'white'
      }}
    />
  );
};

/**
 * Response action buttons
 */
const ResponseActions = ({ 
  response, 
  onAction, 
  showImplement = true, 
  showApprove = true,
  compact = false 
}) => {
  const handleAction = (actionType, data = {}) => {
    if (onAction) {
      onAction(actionType, response, data);
    }
  };

  if (compact) {
    return (
      <Box display="flex" gap={0.5}>
        <IconButton 
          size="small" 
          onClick={() => handleAction(ACTION_TYPES.APPROVE)}
          disabled={response.status === 'approved'}
        >
          <ApproveIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleAction(ACTION_TYPES.REJECT)}
          disabled={response.status === 'rejected'}
        >
          <RejectIcon fontSize="small" />
        </IconButton>
        {showImplement && (
          <IconButton 
            size="small" 
            onClick={() => handleAction(ACTION_TYPES.IMPLEMENT)}
            disabled={response.status === 'implemented'}
          >
            <ImplementedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      {showApprove && response.status !== 'approved' && (
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<ApproveIcon />}
          onClick={() => handleAction(ACTION_TYPES.APPROVE)}
        >
          Approve
        </Button>
      )}
      
      {response.status !== 'rejected' && (
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<RejectIcon />}
          onClick={() => handleAction(ACTION_TYPES.REJECT)}
        >
          Reject
        </Button>
      )}
      
      {showImplement && response.status === 'approved' && (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<ImplementedIcon />}
          onClick={() => handleAction(ACTION_TYPES.IMPLEMENT)}
        >
          Implement
        </Button>
      )}
      
      <Button
        size="small"
        variant="outlined"
        startIcon={<SaveIcon />}
        onClick={() => handleAction(ACTION_TYPES.SAVE)}
      >
        Save
      </Button>
    </Box>
  );
};

/**
 * Individual AI response card
 */
const AIResponseCard = ({
  response,
  expanded = false,
  onToggleExpand,
  onAction,
  showActions = true,
  compact = false,
  showAgent = true
}) => {
  const [localExpanded, setLocalExpanded] = useState(expanded);

  const handleToggleExpand = useCallback(() => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    if (onToggleExpand) {
      onToggleExpand(response.id, newExpanded);
    }
  }, [localExpanded, onToggleExpand, response.id]);

  // Parse response content
  const content = typeof response.content === 'string' 
    ? (() => {
        try {
          return JSON.parse(response.content);
        } catch {
          return { description: response.content };
        }
      })()
    : response.content;

  const hasDetails = content.rationale || content.implementationSteps || 
                    content.assumptions || content.risks || content.metadata;

  return (
    <Card 
      variant="outlined"
      sx={{
        mb: compact ? 1 : 2,
        borderLeft: `4px solid ${STATUS_COLORS[response.status] || STATUS_COLORS.pending}`,
        '&:hover': { boxShadow: 2 }
      }}
    >
      <CardContent sx={{ pb: showActions ? 1 : 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Agent Avatar */}
          {showAgent && (
            <Badge
              badgeContent={response.type === 'OPTIMIZATION_SUGGESTION' ? '⚡' : 
                           response.type === 'BRAINSTORMING_IDEA' ? '💡' : 
                           response.type === 'BOTTLENECK_ANALYSIS' ? '⚠️' : '🤖'}
              color="primary"
            >
              <Avatar 
                sx={{ 
                  bgcolor: STATUS_COLORS[response.status] || STATUS_COLORS.pending,
                  width: compact ? 32 : 40,
                  height: compact ? 32 : 40
                }}
              >
                {response.agentName ? response.agentName.charAt(0) : <AIIcon />}
              </Avatar>
            </Badge>
          )}

          <Box flex={1}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography 
                variant={compact ? "subtitle2" : "subtitle1"} 
                fontWeight="bold"
              >
                {content.title || response.agentName || 'AI Response'}
              </Typography>
              
              <ResponseStatusIndicator status={response.status} />
              
              {content.priority && (
                <Chip
                  label={content.priority}
                  size="small"
                  color={content.priority === 'high' ? 'error' : 
                         content.priority === 'medium' ? 'warning' : 'default'}
                />
              )}

              {content.confidence && (
                <Chip
                  label={`${Math.round(content.confidence * 100)}%`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Agent Info */}
            {showAgent && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="caption" color="text.secondary">
                  {response.agentName} • {response.type?.replace('_', ' ').toLowerCase()}
                </Typography>
                {response.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    • {new Date(response.timestamp).toLocaleString()}
                  </Typography>
                )}
              </Box>
            )}

            {/* Main Content */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph={!compact}
              sx={{ mb: compact ? 1 : 2 }}
            >
              {content.description || content.content || 'No description available'}
            </Typography>

            {/* Metadata Chips */}
            {(content.effort || content.impact || content.type) && (
              <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                {content.effort && (
                  <Chip label={`Effort: ${content.effort}`} size="small" variant="outlined" />
                )}
                {content.impact && (
                  <Chip label={`Impact: ${content.impact}`} size="small" variant="outlined" />
                )}
                {content.type && (
                  <Chip label={content.type} size="small" variant="outlined" />
                )}
              </Box>
            )}

            {/* Expandable Details */}
            {hasDetails && (
              <Box>
                <Button
                  size="small"
                  onClick={handleToggleExpand}
                  endIcon={localExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mb: 1 }}
                >
                  {localExpanded ? 'Hide Details' : 'View Details'}
                </Button>

                <Collapse in={localExpanded}>
                  <Grid container spacing={2}>
                    {content.rationale && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Rationale
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {content.rationale}
                        </Typography>
                      </Grid>
                    )}

                    {content.implementationSteps && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Implementation Steps
                        </Typography>
                        <List dense>
                          {content.implementationSteps.map((step, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {index + 1}.
                                </Typography>
                              </ListItemIcon>
                              <ListItemText 
                                primary={step}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {content.assumptions && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Assumptions
                        </Typography>
                        <List dense>
                          {content.assumptions.map((assumption, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              <ListItemText 
                                primary={`• ${assumption}`}
                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                    {content.risks && (
                      <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Risks & Considerations
                          </Typography>
                          <List dense>
                            {content.risks.map((risk, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText 
                                  primary={`• ${risk}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Collapse>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <ResponseActions
            response={response}
            onAction={onAction}
            compact={compact}
          />
        </CardActions>
      )}
    </Card>
  );
};

/**
 * Main AI Response Display Component
 */
const AIResponseDisplay = ({
  responses = [],
  title,
  loading = false,
  error = null,
  onResponseAction,
  maxDisplayed = 10,
  compact = false,
  showActions = true,
  showAgent = true,
  emptyMessage = "No AI responses available",
  groupByStatus = false,
  allowExpand = true
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleToggleExpand = useCallback((responseId, expanded) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (expanded) {
        newSet.add(responseId);
      } else {
        newSet.delete(responseId);
      }
      return newSet;
    });
  }, []);

  // Process responses
  const processedResponses = responses
    .filter(response => response && response.content)
    .slice(0, maxDisplayed)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // Group by status if requested
  const groupedResponses = groupByStatus
    ? processedResponses.reduce((groups, response) => {
        const status = response.status || 'pending';
        if (!groups[status]) groups[status] = [];
        groups[status].push(response);
        return groups;
      }, {})
    : { all: processedResponses };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="subtitle2">Error Loading AI Responses</Typography>
        {error.message || error}
      </Alert>
    );
  }

  if (processedResponses.length === 0 && !loading) {
    return (
      <Alert severity="info">
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          {title}
        </Typography>
      )}

      {Object.entries(groupedResponses).map(([groupKey, groupResponses]) => (
        <Box key={groupKey}>
          {groupByStatus && Object.keys(groupedResponses).length > 1 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1, textTransform: 'capitalize' }}>
                {groupKey} ({groupResponses.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {groupResponses.map((response) => (
            <AIResponseCard
              key={response.id}
              response={response}
              expanded={allowExpand && expandedItems.has(response.id)}
              onToggleExpand={allowExpand ? handleToggleExpand : undefined}
              onAction={onResponseAction}
              showActions={showActions}
              compact={compact}
              showAgent={showAgent}
            />
          ))}
        </Box>
      ))}

      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <Typography variant="body2" color="text.secondary">
            Loading AI responses...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

AIResponseDisplay.propTypes = {
  responses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    agentId: PropTypes.string,
    agentName: PropTypes.string,
    type: PropTypes.string,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    status: PropTypes.string,
    timestamp: PropTypes.string
  })),
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onResponseAction: PropTypes.func,
  maxDisplayed: PropTypes.number,
  compact: PropTypes.bool,
  showActions: PropTypes.bool,
  showAgent: PropTypes.bool,
  emptyMessage: PropTypes.string,
  groupByStatus: PropTypes.bool,
  allowExpand: PropTypes.bool
};

export { AIResponseDisplay, ResponseActions, ResponseStatusIndicator, ACTION_TYPES };
export default AIResponseDisplay; 