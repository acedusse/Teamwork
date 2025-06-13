import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Avatar,
  Badge,
  Tooltip,
  LinearProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Link as LinkIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import RichTextEditor, { stripHtml, isEmptyContent } from './RichTextEditor';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Priority colors - memoized constant to prevent recreations
const PRIORITY_COLORS = {
  high: { color: '#d32f2f', bg: '#ffebee', icon: '🔴' },
  medium: { color: '#f57c00', bg: '#fff3e0', icon: '🟡' },
  low: { color: '#388e3c', bg: '#e8f5e8', icon: '🟢' }
};

// Status colors and icons - memoized constant to prevent recreations
const STATUS_INFO = {
  pending: { color: '#757575', bg: '#f5f5f5', icon: '⏱️', label: 'Pending' },
  'in-progress': { color: '#2196f3', bg: '#e3f2fd', icon: '🔄', label: 'In Progress' },
  review: { color: '#ff9800', bg: '#fff3e0', icon: '👀', label: 'Review' },
  done: { color: '#4caf50', bg: '#e8f5e8', icon: '✅', label: 'Done' },
  blocked: { color: '#f44336', bg: '#ffebee', icon: '🚫', label: 'Blocked' }
};

// Memoized SubtaskItem component to prevent unnecessary re-renders
const SubtaskItem = React.memo(({ subtask, onSubtaskAction }) => {
  const statusInfo = STATUS_INFO[subtask.status] || STATUS_INFO.pending;
  
  const handleAction = useCallback((actionType) => {
    onSubtaskAction?.(subtask.id, actionType);
  }, [subtask.id, onSubtaskAction]);

  return (
    <ListItem>
      <ListItemIcon>
        <Chip
          size="small"
          label={statusInfo.icon}
          sx={{
            bgcolor: statusInfo.bg,
            color: statusInfo.color,
            minWidth: 28,
            height: 20,
            '& .MuiChip-label': { px: 0.5 }
          }}
        />
      </ListItemIcon>
      <ListItemText
        primary={subtask.title}
        secondary={subtask.description}
        primaryTypographyProps={{ variant: 'body2' }}
        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
      />
    </ListItem>
  );
});

SubtaskItem.displayName = 'SubtaskItem';

// Memoized DependencyItem component
const DependencyItem = React.memo(({ dependency, onDependencyAction }) => {
  const statusInfo = STATUS_INFO[dependency.status] || STATUS_INFO.pending;
  
  const handleAction = useCallback((actionType) => {
    onDependencyAction?.(dependency.id, actionType);
  }, [dependency.id, onDependencyAction]);

  return (
    <ListItem>
      <ListItemIcon>
        <Chip
          size="small"
          label={dependency.status === 'done' ? '✅' : '⏱️'}
          sx={{
            bgcolor: statusInfo.bg,
            color: statusInfo.color,
            minWidth: 28,
            height: 20,
            '& .MuiChip-label': { px: 0.5 }
          }}
        />
      </ListItemIcon>
      <ListItemText
        primary={`Task ${dependency.id}: ${dependency.title}`}
        secondary={dependency.description}
        primaryTypographyProps={{ variant: 'body2' }}
        secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
      />
    </ListItem>
  );
});

DependencyItem.displayName = 'DependencyItem';

// Main component with optimizations
const TaskDetailPanel = React.memo(function TaskDetailPanel({ 
  open = false, 
  task = null, 
  onClose = null,
  onTaskUpdate = null,
  onTaskDelete = null,
  onTaskAction = null,
  allTasks = [],
  loading = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const [dependenciesExpanded, setDependenciesExpanded] = useState(true);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [errors, setErrors] = useState({});
  const [useRichText, setUseRichText] = useState(false);
  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Reset editing state when task changes
  useEffect(() => {
    setIsEditing(false);
    setEditedTask(null);
    setErrors({});
  }, [task?.id]);

  // Initialize edited task when entering edit mode
  useEffect(() => {
    if (isEditing && task) {
      setEditedTask({
        ...task,
        dependencies: task.dependencies || []
      });
      setErrors({});
    }
  }, [isEditing, task]);

  // Memoized calculations to prevent unnecessary recalculations
  const priorityInfo = useMemo(() => 
    PRIORITY_COLORS[task?.priority] || PRIORITY_COLORS.medium, 
    [task?.priority]
  );
  
  const statusInfo = useMemo(() => 
    STATUS_INFO[task?.status] || STATUS_INFO.pending, 
    [task?.status]
  );

  // Calculate subtask progress with memoization
  const subtaskProgress = useMemo(() => {
    if (!task?.subtasks?.length) return 0;
    return (task.subtasks.filter(st => st.status === 'done').length / task.subtasks.length) * 100;
  }, [task?.subtasks]);

  // Get dependency tasks with memoization
  const dependencyTasks = useMemo(() => {
    if (!task?.dependencies || !allTasks?.length) return [];
    return allTasks.filter(t => task.dependencies.includes(t.id));
  }, [task?.dependencies, allTasks]);

  // Form validation
  const validateTask = (taskData) => {
    const newErrors = {};
    
    if (!taskData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (taskData.title?.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    // Validate description (check both plain text and HTML)
    if (taskData.description) {
      const plainText = stripHtml(taskData.description);
      if (plainText.length > 2000) {
        newErrors.description = 'Description must be less than 2000 characters';
      }
    }
    
    // Validate details
    if (taskData.details) {
      const plainText = stripHtml(taskData.details);
      if (plainText.length > 3000) {
        newErrors.details = 'Implementation details must be less than 3000 characters';
      }
    }
    
    // Validate test strategy
    if (taskData.testStrategy) {
      const plainText = stripHtml(taskData.testStrategy);
      if (plainText.length > 1500) {
        newErrors.testStrategy = 'Test strategy must be less than 1500 characters';
      }
    }
    
    return newErrors;
  };

  // Handle closing the drawer
  const handleClose = useCallback(() => {
    setIsEditing(false);
    setEditedTask(null);
    setErrors({});
    onClose?.();
  }, [onClose]);

  // Early return for no task - memoized to prevent unnecessary renders
  const noTaskContent = useMemo(() => {
    if (!task) {
      return (
        <Drawer
          anchor="right"
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: { width: { xs: '100%', sm: 480, md: 520 } }
          }}
        >
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No task selected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Select a task from the board to view details
            </Typography>
          </Box>
        </Drawer>
      );
    }
    return null;
  }, [task, open, handleClose]);

  if (!task) {
    return noTaskContent;
  }

  // Optimized event handlers with useCallback
  const handleCopyTaskId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(task.id.toString());
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy task ID:', err);
    }
  }, [task?.id]);



  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!editedTask) return;
    
    const validationErrors = validateTask(editedTask);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onTaskUpdate?.(editedTask);
    setIsEditing(false);
    setEditedTask(null);
    setErrors({});
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  }, [editedTask, onTaskUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedTask(null);
    setErrors({});
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onTaskDelete?.(task);
    setShowDeleteDialog(false);
    onClose?.();
  }, [task, onTaskDelete, onClose]);

  const handleFieldChange = useCallback((field, value) => {
    if (!editedTask) return;
    
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [editedTask, errors]);

  const handleDependencyChange = useCallback((newDependencies) => {
    if (!editedTask) return;
    setEditedTask(prev => ({
      ...prev,
      dependencies: newDependencies.map(dep => dep.id || dep)
    }));
  }, [editedTask]);

  const handleRichTextChange = useCallback((field) => (htmlContent, plainText) => {
    handleFieldChange(field, htmlContent);
  }, [handleFieldChange]);

  // Memoized quick actions to prevent recalculation
  const quickActions = useMemo(() => {
    const actions = [];
    
    if (task.status === 'pending') {
      actions.push(
        { id: 'start', label: 'Start Task', icon: <PlayArrowIcon />, color: 'success' }
      );
    } else if (task.status === 'in-progress') {
      actions.push(
        { id: 'complete', label: 'Mark Complete', icon: <CheckIcon />, color: 'success' },
        { id: 'pause', label: 'Pause Task', icon: <PauseIcon />, color: 'warning' }
      );
    } else if (task.status === 'done') {
      actions.push(
        { id: 'reopen', label: 'Reopen Task', icon: <PlayArrowIcon />, color: 'primary' }
      );
    }

    if (task.status !== 'blocked') {
      actions.push(
        { id: 'block', label: 'Block Task', icon: <BlockIcon />, color: 'error' }
      );
    }

    return actions;
  }, [task.status]);

  const handleQuickActionOptimized = useCallback((actionId) => {
    onTaskAction?.(actionId, task.id);
  }, [onTaskAction, task.id]);

  // Handle subtask creation
  const handleCreateSubtask = () => {
    if (newSubtask.title.trim() && onTaskAction) {
      onTaskAction('create-subtask', task.id, newSubtask);
      setNewSubtask({ title: '', description: '' });
      setShowCreateSubtask(false);
    }
  };

  const handleCancelSubtask = () => {
    setNewSubtask({ title: '', description: '' });
    setShowCreateSubtask(false);
  };

  // Generate mock history data (in real app, this would come from backend)
  const generateTaskHistory = (task) => {
    const history = [];
    
    // Task creation
    if (task.createdAt) {
      history.push({
        id: 1,
        action: 'created',
        description: 'Task was created',
        user: task.assignee || 'System',
        timestamp: task.createdAt,
        icon: '✨',
        color: 'success'
      });
    }

    // Status changes (mock data)
    if (task.status === 'in-progress' || task.status === 'done') {
      history.push({
        id: 2,
        action: 'status_change',
        description: 'Status changed from "pending" to "in-progress"',
        user: task.assignee || 'User',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '🔄',
        color: 'info'
      });
    }

    if (task.status === 'done') {
      history.push({
        id: 3,
        action: 'status_change',
        description: 'Status changed from "in-progress" to "done"',
        user: task.assignee || 'User',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '✅',
        color: 'success'
      });
    }

    // Priority changes (mock)
    if (task.priority === 'high') {
      history.push({
        id: 4,
        action: 'priority_change',
        description: 'Priority changed to "high"',
        user: task.assignee || 'User',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '🔴',
        color: 'warning'
      });
    }

    // Assignee changes (mock)
    if (task.assignee) {
      history.push({
        id: 5,
        action: 'assignee_change',
        description: `Task assigned to ${task.assignee}`,
        user: 'Project Manager',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '👤',
        color: 'info'
      });
    }

    // Dependencies added (mock)
    if (task.dependencies && task.dependencies.length > 0) {
      history.push({
        id: 6,
        action: 'dependencies_added',
        description: `${task.dependencies.length} dependencies added`,
        user: task.assignee || 'User',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        icon: '🔗',
        color: 'default'
      });
    }

    // Comments/updates (mock)
    history.push({
      id: 7,
      action: 'comment',
      description: 'Added implementation notes and updated requirements',
      user: task.assignee || 'Developer',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      icon: '💬',
      color: 'default'
    });

    // Sort by timestamp (newest first)
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const taskHistory = generateTaskHistory(task);

  // Handle adding comments
  const handleAddComment = () => {
    if (newComment.trim() && onTaskAction) {
      onTaskAction('add-comment', task.id, { comment: newComment.trim() });
      setNewComment('');
      setShowAddComment(false);
    }
  };

  const handleCancelComment = () => {
    setNewComment('');
    setShowAddComment(false);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: '100%', sm: 480, md: 520 },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {loading && <LinearProgress />}
      
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, mr: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: '1.2rem' }}>
                {statusInfo.icon}
              </Typography>
              {isEditing ? (
                <TextField
                  value={editedTask?.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }
                  }}
                />
              ) : (
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  {task.title}
                </Typography>
              )}
            </Stack>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Copy task ID">
                <Chip
                  label={`#${task.id}`}
                  size="small"
                  onClick={handleCopyTaskId}
                  icon={<CopyIcon />}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
              
              {isEditing ? (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={editedTask?.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="pending">⏱️ Pending</MenuItem>
                    <MenuItem value="in-progress">🔄 In Progress</MenuItem>
                    <MenuItem value="review">👀 Review</MenuItem>
                    <MenuItem value="done">✅ Done</MenuItem>
                    <MenuItem value="blocked">🚫 Blocked</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Chip 
                  label={statusInfo.label}
                  size="small"
                  sx={{ 
                    bgcolor: statusInfo.bg,
                    color: statusInfo.color,
                    fontWeight: 'bold'
                  }}
                />
              )}
              
              {isEditing ? (
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={editedTask?.priority || ''}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    variant="outlined"
                  >
                    <MenuItem value="low">🟢 Low</MenuItem>
                    <MenuItem value="medium">🟡 Medium</MenuItem>
                    <MenuItem value="high">🔴 High</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Chip 
                  label={task.priority}
                  size="small"
                  sx={{ 
                    bgcolor: priorityInfo.bg,
                    color: priorityInfo.color,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1}>
            {isEditing ? (
              <>
                <Tooltip title="Save changes">
                  <IconButton 
                    onClick={handleSave}
                    color="success"
                    size="small"
                  >
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Cancel editing">
                  <IconButton 
                    onClick={handleCancel}
                    color="error"
                    size="small"
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Edit task">
                <IconButton 
                  onClick={() => setIsEditing(true)}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Close panel">
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Copy success alert */}
        {showCopySuccess && (
          <Alert 
            severity="success" 
            sx={{ mt: 2 }}
            onClose={() => setShowCopySuccess(false)}
          >
            Task ID copied to clipboard!
          </Alert>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Stack spacing={3} sx={{ p: 3 }}>
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {quickActions.map((action) => (
                  <Chip
                    key={action.id}
                    label={action.label}
                    icon={action.icon}
                    onClick={() => handleQuickAction(action.id)}
                    color={action.color}
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Description */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Description
              </Typography>
              {isEditing && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={useRichText}
                      onChange={(e) => setUseRichText(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Rich Text"
                  sx={{ m: 0 }}
                />
              )}
            </Stack>
            
            {isEditing ? (
              useRichText ? (
                <RichTextEditor
                  value={editedTask?.description || ''}
                  onChange={handleRichTextChange('description')}
                  placeholder="Enter task description..."
                  error={!!errors.description}
                  helperText={errors.description}
                  minHeight={120}
                  maxHeight={250}
                />
              ) : (
                <TextField
                  value={editedTask?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  multiline
                  minRows={3}
                  maxRows={8}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter task description..."
                  error={!!errors.description}
                  helperText={errors.description}
                />
              )
            ) : (
              <>
                {task.description ? (
                  <Box 
                    sx={{ 
                      '& p': { margin: '0 0 8px 0' },
                      '& ul, & ol': { paddingLeft: '1.5em' },
                      '& blockquote': { 
                        borderLeft: '4px solid #1976d2',
                        paddingLeft: '16px',
                        margin: '8px 0',
                        fontStyle: 'italic',
                        color: 'text.secondary'
                      },
                      '& code': {
                        backgroundColor: 'action.hover',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      },
                      '& pre': {
                        backgroundColor: 'action.hover',
                        padding: '12px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontFamily: 'monospace'
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: task.description.includes('<') ? task.description : task.description.replace(/\n/g, '<br>')
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No description provided
                  </Typography>
                )}
              </>
            )}
          </Paper>

          {/* Implementation Details */}
          {(task.details || isEditing) && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Implementation Details
              </Typography>
              {isEditing ? (
                useRichText ? (
                  <RichTextEditor
                    value={editedTask?.details || ''}
                    onChange={handleRichTextChange('details')}
                    placeholder="Enter implementation details..."
                    error={!!errors.details}
                    helperText={errors.details}
                    minHeight={150}
                    maxHeight={350}
                  />
                ) : (
                  <TextField
                    value={editedTask?.details || ''}
                    onChange={(e) => handleFieldChange('details', e.target.value)}
                    multiline
                    minRows={4}
                    maxRows={10}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter implementation details..."
                    error={!!errors.details}
                    helperText={errors.details}
                  />
                )
              ) : (
                <Box 
                  sx={{ 
                    '& p': { margin: '0 0 8px 0' },
                    '& ul, & ol': { paddingLeft: '1.5em' },
                    '& blockquote': { 
                      borderLeft: '4px solid #1976d2',
                      paddingLeft: '16px',
                      margin: '8px 0',
                      fontStyle: 'italic',
                      color: 'text.secondary'
                    },
                    '& code': {
                      backgroundColor: 'action.hover',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    },
                    '& pre': {
                      backgroundColor: 'action.hover',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontFamily: 'monospace'
                    }
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: task.details.includes('<') ? task.details : task.details.replace(/\n/g, '<br>')
                  }}
                />
              )}
            </Paper>
          )}

          {/* Test Strategy */}
          {(task.testStrategy || isEditing) && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Test Strategy
              </Typography>
              {isEditing ? (
                useRichText ? (
                  <RichTextEditor
                    value={editedTask?.testStrategy || ''}
                    onChange={handleRichTextChange('testStrategy')}
                    placeholder="Enter test strategy..."
                    error={!!errors.testStrategy}
                    helperText={errors.testStrategy}
                    minHeight={120}
                    maxHeight={300}
                  />
                ) : (
                  <TextField
                    value={editedTask?.testStrategy || ''}
                    onChange={(e) => handleFieldChange('testStrategy', e.target.value)}
                    multiline
                    minRows={3}
                    maxRows={8}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter test strategy..."
                    error={!!errors.testStrategy}
                    helperText={errors.testStrategy}
                  />
                )
              ) : (
                <Box 
                  sx={{ 
                    '& p': { margin: '0 0 8px 0' },
                    '& ul, & ol': { paddingLeft: '1.5em' },
                    '& blockquote': { 
                      borderLeft: '4px solid #1976d2',
                      paddingLeft: '16px',
                      margin: '8px 0',
                      fontStyle: 'italic',
                      color: 'text.secondary'
                    },
                    '& code': {
                      backgroundColor: 'action.hover',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    },
                    '& pre': {
                      backgroundColor: 'action.hover',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontFamily: 'monospace'
                    }
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: task.testStrategy.includes('<') ? task.testStrategy : task.testStrategy.replace(/\n/g, '<br>')
                  }}
                />
              )}
            </Paper>
          )}

          {/* Subtasks */}
          {(task.subtasks && task.subtasks.length > 0) || isEditing && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Subtasks
                  </Typography>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <Chip 
                      label={`${task.subtasks.filter(st => st.status === 'done').length}/${task.subtasks.length}`}
                      size="small"
                      color={subtaskProgress === 100 ? 'success' : 'default'}
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={1}>
                  {isEditing && (
                    <Tooltip title="Add subtask">
                      <IconButton 
                        size="small" 
                        onClick={() => setShowCreateSubtask(true)}
                        color="primary"
                      >
                        <AssignmentIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <IconButton size="small" onClick={() => setSubtasksExpanded(!subtasksExpanded)}>
                      {subtasksExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </Stack>
              </Stack>

              {/* Subtask Creation Form */}
              {showCreateSubtask && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Create New Subtask
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Subtask Title"
                      value={newSubtask.title}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                      fullWidth
                      size="small"
                      required
                    />
                    <TextField
                      label="Description (Optional)"
                      value={newSubtask.description}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={handleCancelSubtask}>
                        Cancel
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={handleCreateSubtask}
                        disabled={!newSubtask.title.trim()}
                      >
                        Create
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {task.subtasks && task.subtasks.length > 0 && (
                <>
                  {subtaskProgress > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={subtaskProgress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(subtaskProgress)}% complete
                      </Typography>
                    </Box>
                  )}

                  <Collapse in={subtasksExpanded}>
                    <List dense>
                      {task.subtasks.map((subtask, index) => (
                        <SubtaskItem
                          key={subtask.id || index}
                          subtask={subtask}
                          onSubtaskAction={onTaskAction}
                        />
                      ))}
                    </List>
                  </Collapse>
                </>
              )}

              {(!task.subtasks || task.subtasks.length === 0) && !showCreateSubtask && (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  No subtasks yet. {isEditing && 'Click the + button to add one.'}
                </Typography>
              )}
            </Paper>
          )}

          {/* Dependencies */}
          {(dependencyTasks.length > 0 || isEditing) && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Dependencies
                  </Typography>
                  {!isEditing && (
                    <Chip 
                      label={dependencyTasks.length}
                      size="small"
                      color="warning"
                    />
                  )}
                </Stack>
                {!isEditing && (
                  <IconButton size="small" onClick={() => setDependenciesExpanded(!dependenciesExpanded)}>
                    {dependenciesExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </Stack>

              {isEditing ? (
                <Autocomplete
                  multiple
                  options={allTasks.filter(t => t.id !== task.id)}
                  getOptionLabel={(option) => `#${option.id} - ${option.title}`}
                  value={allTasks.filter(t => editedTask?.dependencies?.includes(t.id)) || []}
                  onChange={(event, newValue) => handleDependencyChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select dependencies..."
                      variant="outlined"
                      helperText="Select tasks that must be completed before this task can start"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                        <Typography sx={{ fontSize: '1rem' }}>
                          {option.status === 'done' ? '✅' : 
                           option.status === 'in-progress' ? '🔄' : 
                           option.status === 'blocked' ? '🚫' : '⏱️'}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            #{option.id} - {option.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.status} • {option.priority} priority
                            {option.assignee && ` • ${option.assignee}`}
                          </Typography>
                        </Box>
                        <Chip
                          label={option.priority}
                          size="small"
                          sx={{ 
                            bgcolor: PRIORITY_COLORS[option.priority]?.bg || PRIORITY_COLORS.medium.bg,
                            color: PRIORITY_COLORS[option.priority]?.color || PRIORITY_COLORS.medium.color,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Stack>
                    </Box>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={`#${option.id} - ${option.title}`}
                        {...getTagProps({ index })}
                        key={option.id}
                        sx={{
                          '& .MuiChip-label': {
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
                    ))
                  }
                  filterOptions={(options, { inputValue }) => {
                    return options.filter(option => 
                      option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.id.toString().includes(inputValue) ||
                      option.description?.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.assignee?.toLowerCase().includes(inputValue.toLowerCase())
                    );
                  }}
                  groupBy={(option) => option.status}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              ) : (
                <Collapse in={dependenciesExpanded}>
                  <List dense>
                    {dependencyTasks.map((depTask) => (
                      <DependencyItem
                        key={depTask.id}
                        dependency={depTask}
                        onDependencyAction={onTaskAction}
                      />
                    ))}
                  </List>
                </Collapse>
              )}
            </Paper>
          )}

          {/* Task Metadata */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Task Information
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  {isEditing ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editedTask?.status || ''}
                        onChange={(e) => handleFieldChange('status', e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="pending">⏱️ Pending</MenuItem>
                        <MenuItem value="in-progress">🔄 In Progress</MenuItem>
                        <MenuItem value="review">👀 Review</MenuItem>
                        <MenuItem value="done">✅ Done</MenuItem>
                        <MenuItem value="blocked">🚫 Blocked</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip 
                      label={statusInfo.label}
                      size="small"
                      sx={{ 
                        bgcolor: statusInfo.bg,
                        color: statusInfo.color,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Priority:</Typography>
                  {isEditing ? (
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={editedTask?.priority || ''}
                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="low">🟢 Low</MenuItem>
                        <MenuItem value="medium">🟡 Medium</MenuItem>
                        <MenuItem value="high">🔴 High</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip 
                      label={task.priority}
                      size="small"
                      sx={{ 
                        bgcolor: priorityInfo.bg,
                        color: priorityInfo.color,
                        fontSize: '0.75rem'
                      }}
                    />
                  )}
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Assignee:</Typography>
                  {isEditing ? (
                    <TextField
                      value={editedTask?.assignee || ''}
                      onChange={(e) => handleFieldChange('assignee', e.target.value)}
                      size="small"
                      placeholder="Enter assignee name"
                      sx={{ minWidth: 150 }}
                    />
                  ) : (
                    <>
                      {task.assignee ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 24, height: 24 }}>{task.assignee[0]}</Avatar>
                          <Typography variant="body2">{task.assignee}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          Unassigned
                        </Typography>
                      )}
                    </>
                  )}
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                  {isEditing ? (
                    <DatePicker
                      value={editedTask?.dueDate ? new Date(editedTask.dueDate) : null}
                      onChange={(newValue) => handleFieldChange('dueDate', newValue?.toISOString())}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { minWidth: 150 }
                        }
                      }}
                    />
                  ) : (
                    <>
                      {task.dueDate ? (
                        <Typography variant="body2">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No due date
                        </Typography>
                      )}
                    </>
                  )}
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Estimated Hours:</Typography>
                  {isEditing ? (
                    <TextField
                      value={editedTask?.estimatedHours || ''}
                      onChange={(e) => handleFieldChange('estimatedHours', e.target.value)}
                      size="small"
                      type="number"
                      placeholder="0"
                      inputProps={{ min: 0, step: 0.5 }}
                      sx={{ minWidth: 100 }}
                    />
                  ) : (
                    <Typography variant="body2">
                      {task.estimatedHours ? `${task.estimatedHours}h` : 'Not estimated'}
                    </Typography>
                  )}
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Tags:</Typography>
                  {isEditing ? (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={[]}
                      value={editedTask?.tags || []}
                      onChange={(event, newValue) => handleFieldChange('tags', newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            size="small"
                            {...getTagProps({ index })}
                            key={index}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="Add tags..."
                          sx={{ minWidth: 200 }}
                        />
                      )}
                    />
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {task.tags && task.tags.length > 0 ? (
                        task.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No tags
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>

                {!isEditing && (
                  <>
                    {task.createdAt && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Created:</Typography>
                        <Typography variant="body2">{new Date(task.createdAt).toLocaleDateString()}</Typography>
                      </Stack>
                    )}

                    {task.updatedAt && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Last Updated:</Typography>
                        <Typography variant="body2">{new Date(task.updatedAt).toLocaleDateString()}</Typography>
                      </Stack>
                    )}
                  </>
                )}
              </Stack>
            </LocalizationProvider>
          </Paper>

          {/* Task History */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Task History
                </Typography>
                <Chip 
                  label={taskHistory.length}
                  size="small"
                  color="info"
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Add comment">
                  <IconButton 
                    size="small" 
                    onClick={() => setShowAddComment(true)}
                    color="primary"
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setHistoryExpanded(!historyExpanded)}>
                  {historyExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Stack>
            </Stack>

            {/* Comment Form */}
            {showAddComment && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Add Comment
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    placeholder="Add a comment about this task..."
                    required
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={handleCancelComment}>
                      Cancel
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                    >
                      Add Comment
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )}

            <Collapse in={historyExpanded}>
              <List dense>
                {taskHistory.map((entry) => (
                  <ListItem key={entry.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: `${entry.color}.light`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem'
                        }}
                      >
                        {entry.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {entry.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                            {entry.user[0]}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {entry.user}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              
              {taskHistory.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  No history entries yet
                </Typography>
              )}
            </Collapse>

            {!historyExpanded && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                Click to view {taskHistory.length} history entries
              </Typography>
            )}
          </Paper>

          {/* Task Actions */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Actions
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="View in Board"
                  icon={<VisibilityIcon />}
                  onClick={() => onTaskAction && onTaskAction('view', task.id)}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="Edit Task"
                  icon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
                <Chip
                  label="View History"
                  icon={<HistoryIcon />}
                  onClick={() => setHistoryExpanded(!historyExpanded)}
                  variant="outlined"
                  sx={{ cursor: 'pointer' }}
                />
              </Stack>
              
              <Chip
                label="Delete Task"
                icon={<DeleteIcon />}
                onClick={handleDelete}
                color="error"
                variant="outlined"
                sx={{ cursor: 'pointer', alignSelf: 'flex-start' }}
              />
            </Stack>
          </Paper>
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Task #{task.id}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
            {task.subtasks && task.subtasks.length > 0 && (
              <>
                <br /><br />
                <strong>Warning:</strong> This task has {task.subtasks.length} subtask(s) that will also be deleted.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={showSaveSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowSaveSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Task updated successfully!
        </Alert>
      </Snackbar>
    </Drawer>
  );
});

export default TaskDetailPanel; 