import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Avatar,
  Tooltip,
  Typography,
  Collapse,
  IconButton,
  Badge,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Fade
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';

const statusColors = {
  idle: '#9E9E9E',
  thinking: '#FF9800',
  working: '#4CAF50',
  active: '#2196F3'
};

const statusLabels = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  active: 'Active'
};

const AIAgentPresence = ({ 
  agents = [], 
  activities = [], 
  onAgentClick,
  onRefresh,
  expanded = false,
  showActivitiesCount = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Filter and sort recent activities
    const recent = activities
      .slice(0, showActivitiesCount)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setRecentActivities(recent);
  }, [activities, showActivitiesCount]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleAgentClick = useCallback((agent) => {
    if (onAgentClick) {
      onAgentClick(agent);
    }
  }, [onAgentClick]);

  const getActiveAgents = useCallback(() => {
    return agents.filter(agent => agent.status !== 'idle');
  }, [agents]);

  const getAgentStatusIcon = (status) => {
    switch (status) {
      case 'thinking':
        return '🤔';
      case 'working':
        return '⚡';
      case 'active':
        return '🔥';
      default:
        return '😴';
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeAgents = getActiveAgents();
  const hasActiveAgents = activeAgents.length > 0;

  return (
    <Card 
      elevation={2}
      sx={{ 
        mb: 2,
        border: hasActiveAgents ? '2px solid #4CAF50' : '1px solid #e0e0e0',
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          sx={{ cursor: 'pointer' }}
          onClick={handleToggleExpanded}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6" component="h3">
              AI Agents
            </Typography>
            <Badge 
              badgeContent={activeAgents.length} 
              color="success"
              invisible={!hasActiveAgents}
            >
              <Chip 
                label={`${agents.length} agents`}
                size="small"
                variant="outlined"
                color={hasActiveAgents ? "success" : "default"}
              />
            </Badge>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {onRefresh && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                title="Refresh agents"
              >
                <RefreshIcon />
              </IconButton>
            )}
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick status indicators */}
        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
          {agents.map((agent) => (
            <Tooltip 
              key={agent.id}
              title={`${agent.name} - ${statusLabels[agent.status]}${
                agent.currentTask ? ` (${agent.currentTask.title})` : ''
              }`}
              arrow
            >
              <Chip
                avatar={
                  <Avatar 
                    sx={{ 
                      bgcolor: statusColors[agent.status],
                      width: 24,
                      height: 24,
                      fontSize: '12px'
                    }}
                  >
                    {agent.avatar}
                  </Avatar>
                }
                label={agent.name}
                size="small"
                variant={agent.status !== 'idle' ? 'filled' : 'outlined'}
                color={agent.status !== 'idle' ? 'primary' : 'default'}
                onClick={() => handleAgentClick(agent)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s ease'
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>

        <Collapse in={isExpanded}>
          <Box mt={2}>
            {/* Detailed agent list */}
            <Typography variant="subtitle2" gutterBottom>
              Agent Details
            </Typography>
            <List dense>
              {agents.map((agent) => (
                <ListItem 
                  key={agent.id}
                  button
                  onClick={() => handleAgentClick(agent)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: agent.status !== 'idle' ? 'action.hover' : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: statusColors[agent.status],
                            border: '2px solid white'
                          }}
                        />
                      }
                    >
                      <Avatar sx={{ bgcolor: agent.color }}>
                        {agent.avatar}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="medium">
                          {agent.name}
                        </Typography>
                        <Chip 
                          label={statusLabels[agent.status]}
                          size="small"
                          sx={{ 
                            bgcolor: statusColors[agent.status],
                            color: 'white',
                            fontSize: '10px',
                            height: 18
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {agent.description}
                        </Typography>
                        {agent.currentTask && (
                          <Typography variant="caption" display="block" color="primary">
                            Working on: {agent.currentTask.title}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Last active: {formatTimeAgo(agent.lastActivity)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {agent.recommendations?.length > 0 && (
                      <Badge badgeContent={agent.recommendations.length} color="warning">
                        <NotificationsIcon fontSize="small" />
                      </Badge>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {/* Recent activities */}
            {recentActivities.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Activity
                </Typography>
                <List dense>
                  {recentActivities.map((activity) => {
                    const agent = agents.find(a => a.id === activity.agentId);
                    return (
                      <Fade key={activity.id} in timeout={500}>
                        <ListItem sx={{ py: 0.5 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: agent?.color || '#9E9E9E',
                                width: 24,
                                height: 24,
                                fontSize: '12px'
                              }}
                            >
                              {agent?.avatar || '🤖'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="caption">
                                <strong>{agent?.name || activity.agentId}</strong> {activity.action.replace('_', ' ')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatTimeAgo(activity.timestamp)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Fade>
                    );
                  })}
                </List>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

AIAgentPresence.propTypes = {
  agents: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['idle', 'thinking', 'working', 'active']).isRequired,
    avatar: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    capabilities: PropTypes.arrayOf(PropTypes.string).isRequired,
    lastActivity: PropTypes.string,
    currentTask: PropTypes.object,
    recommendations: PropTypes.arrayOf(PropTypes.object)
  })),
  activities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    agentId: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    details: PropTypes.object,
    timestamp: PropTypes.string.isRequired
  })),
  onAgentClick: PropTypes.func,
  onRefresh: PropTypes.func,
  expanded: PropTypes.bool,
  showActivitiesCount: PropTypes.number
};

export default AIAgentPresence; 