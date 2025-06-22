import React, { useState, useEffect, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Box,
  Card,
  CardContent,
  Fade,
  Alert,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Task as TaskIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Schedule as InProgressIcon,
  Block as BlockedIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Task status configurations
const TASK_STATUS_CONFIG = {
  pending: {
    icon: <PendingIcon />,
    color: 'default',
    label: 'Pending'
  },
  'in-progress': {
    icon: <InProgressIcon />,
    color: 'primary',
    label: 'In Progress'
  },
  done: {
    icon: <CheckCircleIcon />,
    color: 'success',
    label: 'Done'
  },
  blocked: {
    icon: <BlockedIcon />,
    color: 'error',
    label: 'Blocked'
  },
  deferred: {
    icon: <BlockedIcon />,
    color: 'warning',
    label: 'Deferred'
  }
};

// Priority configurations
const PRIORITY_CONFIG = {
  high: { color: 'error', label: 'High Priority' },
  medium: { color: 'warning', label: 'Medium Priority' },
  low: { color: 'info', label: 'Low Priority' }
};

const RealTimeTaskList = ({ 
  showSubtasks = false, 
  maxTasks = 10, 
  statusFilter = null,
  priorityFilter = null,
  onTaskClick = null,
  onTaskEdit = null,
  onTaskDelete = null,
  refreshInterval = 30000 // 30 seconds fallback refresh
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentlyUpdatedTasks, setRecentlyUpdatedTasks] = useState(new Set());

  const { socket, isConnected } = useWebSocket();

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      let taskList = data.tasks || [];
      
      // Apply filters
      if (statusFilter) {
        taskList = taskList.filter(task => task.status === statusFilter);
      }
      
      if (priorityFilter) {
        taskList = taskList.filter(task => task.priority === priorityFilter);
      }
      
      // Limit the number of tasks
      if (maxTasks > 0) {
        taskList = taskList.slice(0, maxTasks);
      }
      
      setTasks(taskList);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, maxTasks]);

  // Handle real-time task updates
  const handleTaskUpdate = useCallback((eventData) => {
    console.log('Real-time task update received:', eventData);
    
    const { eventType, task } = eventData;
    
    setTasks(prevTasks => {
      let updatedTasks = [...prevTasks];
      
      switch (eventType) {
        case 'task:created':
          // Add new task if it matches our filters
          const shouldAddTask = (!statusFilter || task.status === statusFilter) &&
                                (!priorityFilter || task.priority === priorityFilter);
          
          if (shouldAddTask) {
            updatedTasks.unshift(task);
            if (maxTasks > 0) {
              updatedTasks = updatedTasks.slice(0, maxTasks);
            }
          }
          break;
          
        case 'task:updated':
        case 'task:status_changed':
        case 'task:assigned':
          // Update existing task
          const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
          if (taskIndex !== -1) {
            // Check if updated task still matches filters
            const stillMatches = (!statusFilter || task.status === statusFilter) &&
                                (!priorityFilter || task.priority === priorityFilter);
            
            if (stillMatches) {
              updatedTasks[taskIndex] = task;
              
              // Mark as recently updated for visual highlight
              setRecentlyUpdatedTasks(prev => {
                const newSet = new Set(prev);
                newSet.add(task.id);
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                  setRecentlyUpdatedTasks(current => {
                    const updated = new Set(current);
                    updated.delete(task.id);
                    return updated;
                  });
                }, 3000);
                
                return newSet;
              });
            } else {
              // Remove task if it no longer matches filters
              updatedTasks.splice(taskIndex, 1);
            }
          } else if ((!statusFilter || task.status === statusFilter) &&
                    (!priorityFilter || task.priority === priorityFilter)) {
            // Add task if it now matches filters
            updatedTasks.unshift(task);
            if (maxTasks > 0) {
              updatedTasks = updatedTasks.slice(0, maxTasks);
            }
          }
          break;
          
        case 'task:deleted':
          // Remove deleted task
          updatedTasks = updatedTasks.filter(t => t.id !== task.id);
          break;
          
        default:
          console.log('Unknown task event type:', eventType);
      }
      
      return updatedTasks;
    });
    
    setLastUpdated(new Date());
  }, [statusFilter, priorityFilter, maxTasks]);

  // Handle bulk task updates (for backward compatibility)
  const handleBulkTaskUpdate = useCallback((data) => {
    console.log('Bulk task update received:', data);
    
    if (data.tasks) {
      let taskList = data.tasks;
      
      // Apply filters
      if (statusFilter) {
        taskList = taskList.filter(task => task.status === statusFilter);
      }
      
      if (priorityFilter) {
        taskList = taskList.filter(task => task.priority === priorityFilter);
      }
      
      // Limit the number of tasks
      if (maxTasks > 0) {
        taskList = taskList.slice(0, maxTasks);
      }
      
      setTasks(taskList);
      setLastUpdated(new Date());
    }
  }, [statusFilter, priorityFilter, maxTasks]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for specific task events
    socket.on('task:created', handleTaskUpdate);
    socket.on('task:updated', handleTaskUpdate);
    socket.on('task:deleted', handleTaskUpdate);
    socket.on('task:status_changed', handleTaskUpdate);
    socket.on('task:assigned', handleTaskUpdate);
    
    // Listen for bulk updates (backward compatibility)
    socket.on('tasksUpdated', handleBulkTaskUpdate);
    socket.on('tasks:bulk_update', handleBulkTaskUpdate);

    return () => {
      socket.off('task:created', handleTaskUpdate);
      socket.off('task:updated', handleTaskUpdate);
      socket.off('task:deleted', handleTaskUpdate);
      socket.off('task:status_changed', handleTaskUpdate);
      socket.off('task:assigned', handleTaskUpdate);
      socket.off('tasksUpdated', handleBulkTaskUpdate);
      socket.off('tasks:bulk_update', handleBulkTaskUpdate);
    };
  }, [socket, isConnected, handleTaskUpdate, handleBulkTaskUpdate]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchTasks();
    
    // Set up periodic refresh as fallback
    const interval = setInterval(fetchTasks, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchTasks, refreshInterval]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get task status config
  const getStatusConfig = (status) => {
    return TASK_STATUS_CONFIG[status] || TASK_STATUS_CONFIG.pending;
  };

  // Get priority config
  const getPriorityConfig = (priority) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={fetchTasks}
            aria-label="Retry loading tasks"
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        <Typography variant="body2">
          Failed to load tasks: {error}
        </Typography>
      </Alert>
    );
  }

  // Render empty state
  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {statusFilter || priorityFilter 
            ? 'No tasks match the current filters'
            : 'Create your first task to get started'
          }
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={1}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Tasks {statusFilter && `(${getStatusConfig(statusFilter).label})`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isConnected ? (
                <Chip 
                  size="small" 
                  label="Live" 
                  color="success" 
                  variant="outlined"
                />
              ) : (
                <Chip 
                  size="small" 
                  label="Offline" 
                  color="error" 
                  variant="outlined"
                />
              )}
              <IconButton
                size="small"
                onClick={fetchTasks}
                aria-label="Refresh tasks"
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {formatTimestamp(lastUpdated)}
            </Typography>
          )}
        </Box>

        {/* Task List */}
        <List sx={{ p: 0 }}>
          {tasks.map((task, index) => {
            const statusConfig = getStatusConfig(task.status);
            const priorityConfig = getPriorityConfig(task.priority);
            const isRecentlyUpdated = recentlyUpdatedTasks.has(task.id);

            return (
              <Fade key={task.id} in={true} timeout={300}>
                <ListItem
                  button={!!onTaskClick}
                  onClick={() => onTaskClick && onTaskClick(task)}
                  sx={{
                    borderLeft: isRecentlyUpdated ? '4px solid' : '4px solid transparent',
                    borderLeftColor: isRecentlyUpdated ? 'primary.main' : 'transparent',
                    backgroundColor: isRecentlyUpdated ? 'action.hover' : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Badge
                      badgeContent={task.subtasks?.length || 0}
                      color="primary"
                      invisible={!showSubtasks || !task.subtasks?.length}
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                    >
                      {statusConfig.icon}
                    </Badge>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: task.status === 'done' ? 'normal' : 'medium',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            opacity: task.status === 'done' ? 0.7 : 1,
                            flex: 1
                          }}
                        >
                          {task.title}
                        </Typography>
                        
                        {/* Priority Chip */}
                        {task.priority && task.priority !== 'medium' && (
                          <Chip
                            size="small"
                            label={task.priority}
                            color={priorityConfig.color}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        {/* Status Chip */}
                        <Chip
                          size="small"
                          label={statusConfig.label}
                          color={statusConfig.color}
                          variant="filled"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {task.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            #{task.id}
                          </Typography>
                          {task.assignee && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 12 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {task.assignee}
                                </Typography>
                              </Box>
                            </>
                          )}
                          {task.updatedAt && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(task.updatedAt)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {onTaskEdit && (
                        <Tooltip title="Edit task">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskEdit(task);
                            }}
                            aria-label={`Edit task ${task.title}`}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onTaskDelete && (
                        <Tooltip title="Delete task">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete(task);
                            }}
                            aria-label={`Delete task ${task.title}`}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </Fade>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default RealTimeTaskList;
