import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  InputAdornment,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Check as CheckIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskDetailPanel from './TaskDetailPanel';

// Define task status columns
const TASK_COLUMNS = [
  {
    id: 'pending',
    title: 'To Do',
    color: '#f44336',
    bgColor: '#ffebee',
    description: 'Tasks ready to be started'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: '#2196f3',
    bgColor: '#e3f2fd',
    description: 'Tasks currently being worked on'
  },
  {
    id: 'review',
    title: 'Review',
    color: '#ff9800',
    bgColor: '#fff3e0',
    description: 'Tasks under review'
  },
  {
    id: 'done',
    title: 'Done',
    color: '#4caf50',
    bgColor: '#e8f5e8',
    description: 'Completed tasks'
  }
];

// Priority colors
const PRIORITY_COLORS = {
  high: { color: '#d32f2f', bg: '#ffebee' },
  medium: { color: '#f57c00', bg: '#fff3e0' },
  low: { color: '#388e3c', bg: '#e8f5e8' }
};

// Filter and sort options
const FILTER_OPTIONS = [
  { value: 'all', label: 'All Tasks', icon: '📋' },
  { value: 'high', label: 'High Priority', icon: '🔴' },
  { value: 'medium', label: 'Medium Priority', icon: '🟡' },
  { value: 'low', label: 'Low Priority', icon: '🟢' },
  { value: 'pending', label: 'Pending Tasks', icon: '⏱️' },
  { value: 'in-progress', label: 'In Progress', icon: '🔄' },
  { value: 'review', label: 'In Review', icon: '👀' },
  { value: 'done', label: 'Completed', icon: '✅' },
  { value: 'blocked', label: 'Blocked', icon: '🚫' },
  { value: 'has-subtasks', label: 'Has Subtasks', icon: '📝' },
  { value: 'has-dependencies', label: 'Has Dependencies', icon: '🔗' }
];

const SORT_OPTIONS = [
  { value: 'id', label: 'Task ID', icon: '🔢' },
  { value: 'priority', label: 'Priority', icon: '⭐' },
  { value: 'title', label: 'Title (A-Z)', icon: '🔤' },
  { value: 'title-desc', label: 'Title (Z-A)', icon: '🔤' },
  { value: 'status', label: 'Status', icon: '📊' },
  { value: 'created', label: 'Created Date', icon: '📅' },
  { value: 'updated', label: 'Last Updated', icon: '🕒' }
];

// Draggable Task Component
const DraggableTask = React.memo(function DraggableTask({ task, onTaskAction = null, hasOptimisticUpdate = false }) {
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Memoized style calculation
  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }), [transform, transition, isDragging]);

  // Memoized priority color
  const priorityColor = useMemo(() => 
    PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium, 
    [task.priority]
  );

  // Optimized event handlers with useCallback
  const handleActionsClick = useCallback((event) => {
    event.stopPropagation();
    setActionsAnchor(event.currentTarget);
  }, []);

  const handleActionsClose = useCallback(() => {
    setActionsAnchor(null);
  }, []);

  const handleActionSelect = useCallback((action, actionData = {}) => {
    handleActionsClose();
    onTaskAction?.(action, task.id, actionData);
  }, [onTaskAction, task.id]);

  // Memoized quick actions
  const quickActions = useMemo(() => {
    const actions = [
      { id: 'view', label: 'View Details', icon: <ViewIcon />, color: 'primary' },
      { id: 'edit', label: 'Edit Task', icon: <EditIcon />, color: 'default' },
    ];

    // Status-specific actions
    if (task.status === 'pending') {
      actions.push(
        { id: 'start', label: 'Start Task', icon: <PlayArrowIcon />, color: 'success' },
        { id: 'block', label: 'Block Task', icon: <BlockIcon />, color: 'warning' }
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

    // Priority actions
    if (task.priority !== 'high') {
      actions.push({ id: 'priority-high', label: 'Set High Priority', icon: <FlagIcon />, color: 'error' });
    }
    if (task.priority !== 'low') {
      actions.push({ id: 'priority-low', label: 'Set Low Priority', icon: <FlagIcon />, color: 'default' });
    }

    actions.push(
      { id: 'assign', label: 'Assign', icon: <AssignmentIcon />, color: 'default' },
      { id: 'schedule', label: 'Schedule', icon: <ScheduleIcon />, color: 'default' },
      { id: 'delete', label: 'Delete Task', icon: <DeleteIcon />, color: 'error' }
    );

    return actions;
  }, [task.status, task.priority]);

  // Get status icon
  const getStatusIcon = () => {
    switch (task.status) {
      case 'pending': return '⏱️';
      case 'in-progress': return '🔄';
      case 'review': return '👀';
      case 'done': return '✅';
      case 'blocked': return '🚫';
      default: return '📋';
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      elevation={isDragging ? 8 : isHovered ? 3 : 1}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        p: 2,
        cursor: isDragging ? 'grabbing' : 'grab',
        bgcolor: hasOptimisticUpdate ? 'action.hover' : 'background.paper',
        border: 2,
        borderColor: isDragging ? 'primary.main' : 
                    hasOptimisticUpdate ? 'warning.main' :
                    isHovered ? 'primary.light' : 'grey.200',
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        opacity: hasOptimisticUpdate ? 0.8 : 1,
        '&:hover': {
          bgcolor: hasOptimisticUpdate ? 'action.hover' : 'grey.50'
        }
      }}
    >
      {/* Quick Actions Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: isHovered || Boolean(actionsAnchor) ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        <IconButton
          size="small"
          onClick={handleActionsClick}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'grey.300',
            '&:hover': { bgcolor: 'grey.100' }
          }}
          {...{}} // Override drag listeners for this button
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Main drag area */}
      <Box {...listeners} sx={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ pr: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '1rem' }}>
                {getStatusIcon()}
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                {task.title}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Task #{task.id}
            </Typography>
            <Chip 
              label={task.priority} 
              size="small" 
              sx={{ 
                bgcolor: priorityColor.bg,
                color: priorityColor.color,
                fontWeight: 'bold',
                fontSize: '0.7rem',
                height: 20
              }} 
            />
          </Stack>
          
          {task.description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.8rem'
              }}
            >
              {task.description}
            </Typography>
          )}

          {/* Task metadata */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {task.subtasks && task.subtasks.length > 0 && (
              <Chip 
                label={`${task.subtasks.filter(st => st.status === 'done').length}/${task.subtasks.length} subtasks`}
                size="small" 
                variant="outlined"
                color={task.subtasks.every(st => st.status === 'done') ? 'success' : 'default'}
                sx={{ fontSize: '0.7rem', height: 18 }}
              />
            )}

            {(task.dependencies && task.dependencies.length > 0) && (
              <Chip 
                label={`${task.dependencies.length} deps`}
                size="small" 
                variant="outlined"
                color="warning"
                sx={{ fontSize: '0.7rem', height: 18 }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={handleActionsClose}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 180 }
        }}
      >
        {quickActions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleActionSelect(action.id)}
            sx={{ 
              color: action.color === 'error' ? 'error.main' : 
                     action.color === 'success' ? 'success.main' : 
                     action.color === 'warning' ? 'warning.main' : 
                     action.color === 'primary' ? 'primary.main' : 'inherit'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {action.icon}
              <Typography variant="body2">{action.label}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
});

// Optimized Droppable Column Component with React.memo
const DroppableColumn = React.memo(function DroppableColumn({ id, children, column, stats }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  // Memoized styles to prevent recalculation
  const droppableStyle = useMemo(() => ({
    minHeight: 400,
    border: 2,
    borderColor: isOver ? column.color : 'transparent',
    borderStyle: 'dashed',
    borderRadius: 1,
    p: 1,
    backgroundColor: isOver ? `${column.color}10` : 'transparent',
    transition: 'all 0.2s ease-in-out'
  }), [isOver, column.color]);

  const paperStyle = useMemo(() => ({
    p: 2,
    minHeight: 500,
    bgcolor: column.bgColor,
    border: 2,
    borderColor: isOver ? column.color : 'transparent',
    transition: 'all 0.2s ease-in-out',
    transform: isOver ? 'scale(1.02)' : 'scale(1)'
  }), [isOver, column.color, column.bgColor]);

  const chipStyle = useMemo(() => ({
    bgcolor: column.color, 
    color: 'white',
    fontWeight: 'bold'
  }), [column.color]);

  const typographyStyle = useMemo(() => ({
    color: column.color,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 1
  }), [column.color]);

  return (
    <Paper
      elevation={2}
      sx={paperStyle}
    >
      {/* Column Header */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="h6" 
            component="h2"
            sx={typographyStyle}
          >
            {column.title}
            <Chip 
              label={stats.total} 
              size="small" 
              sx={chipStyle}
            />
          </Typography>
        </Stack>
        
        <Typography variant="caption" color="text.secondary">
          {column.description}
        </Typography>
        
        {stats.highPriority > 0 && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
            {stats.highPriority} high priority
          </Typography>
        )}
      </Box>

      {/* Droppable area */}
      <Box 
        ref={setNodeRef}
        sx={droppableStyle}
      >
        {children}
      </Box>
    </Paper>
  );
});

// Optimized KanbanBoard component with React.memo
const KanbanBoard = React.memo(function KanbanBoard({ 
  tasks = [], 
  loading = false, 
  onTaskMove = null,
  onTaskUpdate = null,
  onTaskCreate = null,
  onRefresh = null,
  onTaskAction = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('id');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [updateNotification, setUpdateNotification] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Apply optimistic updates to tasks - optimized with useCallback
  const getTasksWithOptimisticUpdates = useCallback(() => {
    return tasks.map(task => {
      const updates = optimisticUpdates[task.id];
      if (updates) {
        return { ...task, ...updates };
      }
      return task;
    });
  }, [tasks, optimisticUpdates]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...getTasksWithOptimisticUpdates()];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.details?.toLowerCase().includes(searchLower) ||
        task.id?.toString().includes(searchTerm) ||
        (task.subtasks && task.subtasks.some(st => 
          st.title?.toLowerCase().includes(searchLower) ||
          st.description?.toLowerCase().includes(searchLower)
        ))
      );
    }

    // Apply filters
    if (filterBy !== 'all') {
      filtered = filtered.filter(task => {
        switch (filterBy) {
          case 'high':
          case 'medium':
          case 'low':
            return task.priority === filterBy;
          case 'pending':
          case 'in-progress':
          case 'review':
          case 'done':
          case 'blocked':
            return task.status === filterBy;
          case 'has-subtasks':
            return task.subtasks && task.subtasks.length > 0;
          case 'has-dependencies':
            return task.dependencies && task.dependencies.length > 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'status':
          const statusOrder = { pending: 1, 'in-progress': 2, review: 3, done: 4, blocked: 5 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        case 'created':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'updated':
          return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        case 'id':
        default:
          return parseFloat(a.id || 0) - parseFloat(b.id || 0);
      }
    });

    setFilteredTasks(filtered);
  }, [getTasksWithOptimisticUpdates, searchTerm, filterBy, sortBy]);

  // Memoized grouped tasks to prevent recalculation
  const taskGroups = useMemo(() => {
    const groups = {};
    TASK_COLUMNS.forEach(column => {
      groups[column.id] = filteredTasks.filter(task => task.status === column.id);
    });
    return groups;
  }, [filteredTasks]);

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const task = filteredTasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Find the task being moved
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) return;

    // If status changed, update the task
    if (task.status !== newStatus) {
      // Optimistic update
      handleOptimisticUpdate(taskId, { status: newStatus });
      
      if (onTaskMove) {
        onTaskMove(taskId, newStatus, task.status);
      }
    }
  };

  // Handle optimistic updates for immediate UI feedback
  const handleOptimisticUpdate = (taskId, updates) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...updates,
        timestamp: Date.now()
      }
    }));

    // Show update notification
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setUpdateNotification({
        message: `Task "${task.title}" updated`,
        type: 'success',
        timestamp: Date.now()
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setUpdateNotification(null);
      }, 3000);
    }

    // Clear optimistic update after a delay (assuming server update completes)
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[taskId];
        return newUpdates;
      });
    }, 2000);
  };

  // Handle task actions with optimistic updates
  const handleTaskActionWithOptimistic = (action, taskId, actionData = {}) => {
    const task = filteredTasks.find(t => t.id === taskId);
    if (!task) return;

    let optimisticUpdate = {};

    // Apply optimistic updates based on action
    switch (action) {
      case 'start':
        optimisticUpdate = { status: 'in-progress' };
        break;
      case 'complete':
        optimisticUpdate = { status: 'done' };
        break;
      case 'pause':
        optimisticUpdate = { status: 'pending' };
        break;
      case 'block':
        optimisticUpdate = { status: 'blocked' };
        break;
      case 'reopen':
        optimisticUpdate = { status: 'pending' };
        break;
      case 'priority-high':
        optimisticUpdate = { priority: 'high' };
        break;
      case 'priority-low':
        optimisticUpdate = { priority: 'low' };
        break;
      default:
        // For other actions (view, edit, delete, assign, schedule), no optimistic update
        break;
    }

    // Apply optimistic update if applicable
    if (Object.keys(optimisticUpdate).length > 0) {
      handleOptimisticUpdate(taskId, optimisticUpdate);
    }

    // Call the original action handler
    if (onTaskAction) {
      onTaskAction(action, taskId, actionData);
    }
  };


  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      if (onRefresh) {
        onRefresh();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [onRefresh]);

  // Calculate column statistics
  const getColumnStats = (columnId) => {
    const columnTasks = taskGroups[columnId] || [];
    const total = columnTasks.length;
    const highPriority = columnTasks.filter(t => t.priority === 'high').length;
    return { total, highPriority };
  };

  // Handle filter menu
  const handleFilterClick = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterSelect = (value) => {
    setFilterBy(value);
    handleFilterClose();
  };

  // Handle sort menu
  const handleSortClick = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  const handleSortSelect = (value) => {
    setSortBy(value);
    handleSortClose();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {TASK_COLUMNS.map((column) => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Update Notification */}
      {updateNotification && (
        <Alert 
          severity={updateNotification.type}
          sx={{ 
            mb: 2,
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': { transform: 'translateY(-20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 }
            }
          }}
          onClose={() => setUpdateNotification(null)}
        >
          {updateNotification.message}
        </Alert>
      )}

      {/* Header with search and controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h5" component="h1" fontWeight="bold">
            Task Board
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Search */}
            <TextField
              placeholder="Search tasks, descriptions, subtasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              size="small"
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  bgcolor: searchFocused ? 'background.paper' : 'grey.50',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color={searchFocused ? 'primary' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                    >
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        ✕
                      </Typography>
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Filter */}
            <Tooltip title="Filter tasks">
              <IconButton onClick={handleFilterClick}>
                <FilterIcon />
              </IconButton>
            </Tooltip>

            {/* Sort */}
            <Tooltip title="Sort tasks">
              <IconButton onClick={handleSortClick}>
                <SortIcon />
              </IconButton>
            </Tooltip>

            {/* Refresh */}
            <Tooltip title={`Refresh tasks (Last updated: ${new Date(lastUpdate).toLocaleTimeString()})`}>
              <IconButton 
                onClick={onRefresh}
                sx={{
                  animation: Object.keys(optimisticUpdates).length > 0 ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {/* Add Task */}
            <Tooltip title="Add new task">
              <IconButton 
                onClick={() => {
                  // Create a basic empty task template instead of passing the raw event
                  onTaskCreate && onTaskCreate({
                    title: '',
                    description: '',
                    priority: 'medium',
                    status: 'pending',
                    tags: [],
                    dependencyIds: []
                  });
                }}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Active filters display */}
        {(searchTerm || filterBy !== 'all') && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={() => setSearchTerm('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {filterBy !== 'all' && (
              <Chip
                label={`Filter: ${FILTER_OPTIONS.find(f => f.value === filterBy)?.label}`}
                onDelete={() => setFilterBy('all')}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 220, maxHeight: 400 }
        }}
      >
        {FILTER_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleFilterSelect(option.value)}
            selected={filterBy === option.value}
            sx={{
              bgcolor: filterBy === option.value ? 'primary.light' : 'transparent',
              '&:hover': { bgcolor: filterBy === option.value ? 'primary.light' : 'grey.100' }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: '1rem' }}>{option.icon}</Typography>
              <Typography variant="body2">{option.label}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortClose}
        PaperProps={{
          elevation: 8,
          sx: { minWidth: 200 }
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSortSelect(option.value)}
            selected={sortBy === option.value}
            sx={{
              bgcolor: sortBy === option.value ? 'secondary.light' : 'transparent',
              '&:hover': { bgcolor: sortBy === option.value ? 'secondary.light' : 'grey.100' }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: '1rem' }}>{option.icon}</Typography>
              <Typography variant="body2">{option.label}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>

      {/* Task Statistics */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label={`Total: ${filteredTasks.length}${tasks.length !== filteredTasks.length ? ` of ${tasks.length}` : ''}`} 
            color="default" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`High Priority: ${filteredTasks.filter(t => t.priority === 'high').length}`} 
            color="error" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`In Progress: ${taskGroups['in-progress']?.length || 0}`} 
            color="primary" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Completed: ${taskGroups['done']?.length || 0}`} 
            color="success" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`With Subtasks: ${filteredTasks.filter(t => t.subtasks && t.subtasks.length > 0).length}`} 
            color="info" 
            variant="outlined" 
            size="small"
          />
          <Chip 
            label={`Blocked: ${taskGroups['blocked']?.length || 0}`} 
            color="warning" 
            variant="outlined" 
            size="small"
          />
        </Stack>
      </Box>

      {/* No tasks message */}
      {filteredTasks.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {tasks.length === 0 
            ? "No tasks found. Click the + button to create your first task."
            : "No tasks match your current filters. Try adjusting your search or filter criteria."
          }
        </Alert>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Grid container spacing={2}>
          {TASK_COLUMNS.map((column) => {
            const columnTasks = taskGroups[column.id] || [];
            const stats = getColumnStats(column.id);
            
            return (
              <Grid item xs={12} sm={6} md={3} key={column.id}>
                <DroppableColumn 
                  id={column.id} 
                  column={column} 
                  stats={stats}
                >
                  <SortableContext 
                    items={columnTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.length === 0 ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 200,
                          color: 'text.secondary',
                          fontStyle: 'italic',
                          border: 2,
                          borderStyle: 'dashed',
                          borderColor: 'grey.300',
                          borderRadius: 1,
                          bgcolor: 'grey.50'
                        }}
                      >
                        Drop tasks here or no tasks available
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {columnTasks.map((task) => (
                          <DraggableTask 
                            key={task.id} 
                            task={task} 
                            onTaskAction={handleTaskActionWithOptimistic}
                            hasOptimisticUpdate={Boolean(optimisticUpdates[task.id])}
                          />
                        ))}
                      </Stack>
                    )}
                  </SortableContext>
                </DroppableColumn>
              </Grid>
            );
          })}
        </Grid>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <Box sx={{ transform: 'rotate(5deg)', opacity: 0.9 }}>
              <DraggableTask 
                task={activeTask} 
                onTaskAction={handleTaskActionWithOptimistic}
                hasOptimisticUpdate={Boolean(optimisticUpdates[activeTask?.id])}
              />
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
});

export default KanbanBoard;
