import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Container,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Settings,
  Add,
  MoreVert,
  SmartToy,
  Assessment,
  ViewColumn,
  Timeline,
  People,
  Assignment,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

/** @typedef {import('@dnd-kit/core').DragStartEvent} DragStartEvent */
/** @typedef {import('@dnd-kit/core').DragEndEvent} DragEndEvent */
/** @typedef {import('@dnd-kit/core').DragOverEvent} DragOverEvent */
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import FilterBar from './FilterBar';
import BoardSettings from './BoardSettings';
import AIAgentPresence from './AIAgentPresence';
import SprintMetrics from './SprintMetrics';
import useAIAgents from '../../hooks/useAIAgents';
import useBottleneckAnalysis from '../../hooks/useBottleneckAnalysis';
import AIBottleneckAnalysisPanel from './AIBottleneckAnalysisPanel';

// Column configuration constants
const DEFAULT_COLUMNS = [
  {
    id: 'backlog',
    title: 'Backlog',
    wipLimit: null, // No WIP limit for backlog
    color: '#f5f5f5',
    icon: '📋',
    description: 'New tasks waiting to be prioritized'
  },
  {
    id: 'ready',
    title: 'Ready',
    wipLimit: 5,
    color: '#e3f2fd',
    icon: '🚀',
    description: 'Tasks ready to be worked on'
  },
  {
    id: 'development',
    title: 'Development',
    wipLimit: 3,
    color: '#fff3e0',
    icon: '⚡',
    description: 'Tasks currently being developed'
  },
  {
    id: 'code-review',
    title: 'Code Review',
    wipLimit: 2,
    color: '#f3e5f5',
    icon: '👀',
    description: 'Tasks under code review'
  },
  {
    id: 'testing',
    title: 'Testing',
    wipLimit: 3,
    color: '#e8f5e8',
    icon: '🧪',
    description: 'Tasks being tested'
  },
  {
    id: 'done',
    title: 'Done',
    wipLimit: null, // No WIP limit for done
    color: '#f1f8e9',
    icon: '✅',
    description: 'Completed tasks'
  }
];

// Sample task data for demonstration
const SAMPLE_TASKS = [
  {
    id: 'TASK-001',
    title: 'Implement ML Training Pipeline',
    description: 'Set up machine learning model training pipeline with automated data processing',
    assignee: { name: 'Available to pull', avatar: '🔄', color: '#1976d2' },
    priority: 'high',
    storyPoints: 8,
    epic: 'Core AI',
    tags: ['ml', 'pipeline', 'backend'],
    status: 'backlog',
    dueDate: '2024-01-15',
    progress: 0
  },
  {
    id: 'TASK-002',
    title: 'User Authentication API',
    description: 'Develop secure user authentication endpoints with JWT tokens',
    assignee: { name: 'Waiting for capacity', avatar: '⏳', color: '#d32f2f' },
    priority: 'medium',
    storyPoints: 5,
    epic: 'Security',
    tags: ['api', 'auth', 'backend'],
    status: 'ready',
    dueDate: '2024-01-20',
    progress: 0
  },
  {
    id: 'TASK-003',
    title: 'Database Schema Design',
    description: 'Design and implement the core database schema for user data',
    assignee: { name: 'Business Analysis Agent', avatar: '📊', color: '#388e3c' },
    priority: 'medium',
    storyPoints: 3,
    epic: 'Data',
    tags: ['database', 'schema'],
    status: 'development',
    dueDate: '2024-01-25',
    progress: 60
  },
  {
    id: 'TASK-004',
    title: 'React Dashboard Components',
    description: 'Build responsive dashboard UI components with Material-UI',
    assignee: { name: 'Frontend Agent', avatar: '🎨', color: '#f57c00' },
    priority: 'medium',
    storyPoints: 5,
    epic: 'Frontend',
    tags: ['react', 'ui', 'components'],
    status: 'development',
    dueDate: '2024-01-18',
    progress: 40
  },
  {
    id: 'TASK-005',
    title: 'API Gateway Implementation',
    description: 'Set up API gateway with rate limiting and authentication',
    assignee: { name: 'Backend Agent', avatar: '⚡', color: '#7b1fa2' },
    priority: 'high',
    storyPoints: 8,
    epic: 'Infrastructure',
    tags: ['api', 'gateway', 'backend'],
    status: 'development',
    dueDate: '2024-01-10',
    progress: 75
  },
  {
    id: 'TASK-006',
    title: 'Model Training Scripts',
    description: 'Create automated scripts for ML model training and evaluation',
    assignee: { name: 'ML Agent', avatar: '🤖', color: '#1976d2' },
    priority: 'medium',
    storyPoints: 3,
    epic: 'Core AI',
    tags: ['ml', 'training', 'automation'],
    status: 'development',
    dueDate: '2024-01-12',
    progress: 30
  },
  {
    id: 'TASK-007',
    title: 'Unit Test Coverage',
    description: 'Implement comprehensive unit tests for all core modules',
    assignee: { name: 'QA Agent', avatar: '🛡️', color: '#9C27B0' },
    priority: 'low',
    storyPoints: 2,
    epic: 'Quality',
    tags: ['testing', 'quality', 'coverage'],
    status: 'code-review',
    dueDate: '2024-01-14',
    progress: 85
  },
  {
    id: 'TASK-008',
    title: 'Authentication Service',
    description: 'Complete OAuth integration and session management',
    assignee: { name: 'Solutions Architect', avatar: '🏗️', color: '#FF9800' },
    priority: 'high',
    storyPoints: 5,
    epic: 'Security',
    tags: ['auth', 'oauth', 'sessions'],
    status: 'code-review',
    dueDate: '2024-01-16',
    progress: 95
  },
  {
    id: 'TASK-009',
    title: 'Performance Testing',
    description: 'Conduct load testing and performance optimization',
    assignee: { name: 'QA Agent', avatar: '🛡️', color: '#9C27B0' },
    priority: 'medium',
    storyPoints: 3,
    epic: 'Quality',
    tags: ['performance', 'testing', 'optimization'],
    status: 'testing',
    dueDate: '2024-01-18',
    progress: 60
  },
  {
    id: 'TASK-010',
    title: 'Integration Test Suite',
    description: 'Build comprehensive integration tests for API endpoints',
    assignee: { name: 'QA Agent', avatar: '🛡️', color: '#9C27B0' },
    priority: 'medium',
    storyPoints: 3,
    epic: 'Quality',
    tags: ['integration', 'testing', 'api'],
    status: 'testing',
    dueDate: '2024-01-20',
    progress: 40
  },
  {
    id: 'TASK-011',
    title: 'DevOps Pipeline',
    description: 'Set up CI/CD pipeline with automated deployment',
    assignee: { name: 'DevOps Agent', avatar: '🔧', color: '#607D8B' },
    priority: 'high',
    storyPoints: 8,
    epic: 'Infrastructure',
    tags: ['devops', 'pipeline', 'deployment'],
    status: 'done',
    dueDate: '2024-01-08',
    progress: 100
  },
  {
    id: 'TASK-012',
    title: 'Project Architecture',
    description: 'Complete system architecture documentation and guidelines',
    assignee: { name: 'Solutions Architect', avatar: '🏗️', color: '#FF9800' },
    priority: 'low',
    storyPoints: 5,
    epic: 'Infrastructure',
    tags: ['architecture', 'documentation'],
    status: 'done',
    dueDate: '2024-01-05',
    progress: 100
  }
];

// Board metrics data
const BOARD_METRICS = {
  totalTasks: 15,
  completedTasks: 8,
  inProgressTasks: 4,
  blockedTasks: 1,
  avgCycleTime: 4.2,
  throughput: 2.1
};

// Board Header Component
const BoardHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onFilterClick, 
  onSettingsClick,
  metrics 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2
      }}>
        {/* Title and Metrics */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ViewColumn color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Scrumban Board
            </Typography>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {metrics.totalTasks}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Tasks
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {metrics.completedTasks}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completed
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {metrics.inProgressTasks}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {metrics.avgCycleTime}d
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Cycle Time
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Search and Actions */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: isMobile ? '100%' : 'auto'
        }}>
          <TextField
            size="small"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: isMobile ? '100%' : 250,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper'
              }
            }}
          />
          
          <Tooltip title="Filter Tasks">
            <IconButton onClick={onFilterClick} color="primary">
              <FilterList />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Board Settings">
            <IconButton onClick={onSettingsClick} color="primary">
              <Settings />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => console.log('Pull new task')}
            sx={{ ml: 1 }}
          >
            {isMobile ? 'Pull' : 'Pull New Task'}
          </Button>
        </Box>
      </Box>

      {/* Mobile Metrics */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          mt: 2,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {metrics.totalTasks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {metrics.completedTasks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Done
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {metrics.inProgressTasks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {metrics.avgCycleTime}d
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cycle
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

BoardHeader.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onFilterClick: PropTypes.func.isRequired,
  onSettingsClick: PropTypes.func.isRequired,
  metrics: PropTypes.object.isRequired
};

// Main ScrumbanBoardTab Component
const ScrumbanBoardTab = ({ 
  initialTasks = SAMPLE_TASKS,
  initialColumns = DEFAULT_COLUMNS,
  boardConfig = {},
  onTasksUpdate,
  onBoardConfigUpdate,
  className 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [tasks, setTasks] = useState(initialTasks);
  const [columns, setColumns] = useState(initialColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Board settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardPreferences, setBoardPreferences] = useState({
    compactView: false,
    showAssigneeAvatars: true,
    showPriorityIndicators: true,
    showStoryPoints: true,
    showTags: true,
    showDueDates: true,
    autoRefresh: false,
    refreshInterval: 30,
    theme: 'light',
    columnSpacing: 'normal'
  });

  // AI Agents integration
  const {
    agents,
    activities,
    loading: agentsLoading,
    error: agentsError,
    notifications: agentNotifications,
    wsConnected,
    simulateAgentWork,
    clearAgentRecommendations,
    fetchAIAgents
  } = useAIAgents();

  // AI Bottleneck Analysis integration
  const {
    isLoading: isAnalyzing,
    bottlenecks,
    suggestions: workflowSuggestions,
    startAnalysis,
    applySuggestion: applyWorkflowSuggestion,
    clearResults: clearAnalysisResults,
    error: analysisError
  } = useBottleneckAnalysis({
    context: 'scrumban-board',
    autoAnalyze: false
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Compute unique filter options from all tasks
  const allAssignees = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)));
  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));
  const allPriorities = Array.from(new Set(tasks.map(t => t.priority).filter(Boolean)));

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    // Search
    const matchesSearch = !searchQuery || (
      (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    // Assignee
    const matchesAssignee = selectedAssignees.length === 0 || selectedAssignees.includes(task.assignee);
    // Priority
    const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(task.priority);
    // Tags
    const matchesTags = selectedTags.length === 0 || (task.tags && selectedTags.every(tag => task.tags.includes(tag)));
    // Date range (assume task.dueDate is ISO string)
    let matchesDate = true;
    if (dateRange[0]) {
      matchesDate = matchesDate && task.dueDate && new Date(task.dueDate) >= dateRange[0];
    }
    if (dateRange[1]) {
      matchesDate = matchesDate && task.dueDate && new Date(task.dueDate) <= dateRange[1];
    }
    return matchesSearch && matchesAssignee && matchesPriority && matchesTags && matchesDate;
  });

  // Group filtered tasks by column
  const filteredTasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = filteredTasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  // Calculate WIP violations
  const wipViolations = columns.reduce((acc, column) => {
    if (column.wipLimit && filteredTasksByColumn[column.id].length > column.wipLimit) {
      acc[column.id] = filteredTasksByColumn[column.id].length - column.wipLimit;
    }
    return acc;
  }, {});

  // Event handlers
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleFilterClick = useCallback(() => {
    console.log('Open filter dialog');
    // TODO: Implement filter dialog
  }, []);

  const handleSettingsClick = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleTaskMove = useCallback((taskId, targetColumnId) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task.id === taskId ? { ...task, status: targetColumnId } : task
      );
      
      // Notify parent component of changes
      if (onTasksUpdate) {
        onTasksUpdate(updatedTasks);
      }
      
      // Show notification
      const task = prevTasks.find(t => t.id === taskId);
      const targetColumn = columns.find(c => c.id === targetColumnId);
      setNotification({
        open: true,
        message: `Moved "${task.title}" to ${targetColumn.title}`,
        severity: 'success'
      });
      
      return updatedTasks;
    });
  }, [columns, onTasksUpdate]);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Board settings handlers
  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleColumnsChange = useCallback((newColumns) => {
    setColumns(newColumns);
    if (onBoardConfigUpdate) {
      onBoardConfigUpdate({ ...boardConfig, columns: newColumns });
    }
    setNotification({
      open: true,
      message: 'Board columns updated',
      severity: 'success'
    });
  }, [boardConfig, onBoardConfigUpdate]);

  const handlePreferencesChange = useCallback((newPreferences) => {
    setBoardPreferences(newPreferences);
    if (onBoardConfigUpdate) {
      onBoardConfigUpdate({ ...boardConfig, preferences: newPreferences });
    }
    setNotification({
      open: true,
      message: 'Board preferences updated',
      severity: 'success'
    });
  }, [boardConfig, onBoardConfigUpdate]);

  const handleApplyTemplate = useCallback((template) => {
    setColumns(template.columns);
    if (onBoardConfigUpdate) {
      onBoardConfigUpdate({ ...boardConfig, columns: template.columns });
    }
    setNotification({
      open: true,
      message: `Applied ${template.name} template`,
      severity: 'success'
    });
  }, [boardConfig, onBoardConfigUpdate]);

  const handleExportConfig = useCallback(() => {
    const config = {
      columns,
      preferences: boardPreferences,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `scrumban-board-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setNotification({
      open: true,
      message: 'Board configuration exported',
      severity: 'success'
    });
  }, [columns, boardPreferences]);

  // AI Agent handlers
  const handleAgentClick = useCallback((agent) => {
    console.log('Agent clicked:', agent);
    // TODO: Show agent details modal or perform action
  }, []);

  const handleAgentRefresh = useCallback(() => {
    fetchAIAgents();
  }, [fetchAIAgents]);

  const handleTaskAnalyze = useCallback((task) => {
    // Find an available agent to analyze the task
    const availableAgents = agents.filter(agent => agent.status === 'idle');
    if (availableAgents.length > 0) {
      const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      simulateAgentWork(randomAgent.id, task, 3000);
    } else {
      setNotification({
        open: true,
        message: 'No available AI agents for task analysis',
        severity: 'warning'
      });
    }
  }, [agents, simulateAgentWork]);

  // AI Workflow Analysis handlers
  const handleWorkflowAnalysis = useCallback(async () => {
    const workflowData = {
      tasks: filteredTasks,
      columns,
      wipViolations,
      metrics: {
        totalTasks: tasks.length,
        tasksInProgress: filteredTasksByColumn['development']?.length || 0,
        blockedTasks: filteredTasksByColumn['code-review']?.length || 0,
        completedTasks: filteredTasksByColumn['done']?.length || 0
      }
    };

    await startAnalysis({
      type: 'workflow-analysis',
      data: workflowData,
      focusAreas: ['wip-limits', 'task-flow', 'resource-allocation']
    });
  }, [filteredTasks, columns, wipViolations, tasks, filteredTasksByColumn, startAnalysis]);

  const handleApplyWorkflowSuggestion = useCallback(async (suggestion) => {
    if (suggestion.action === 'adjust-wip-limit') {
      const { columnId, newLimit } = suggestion.data;
      const updatedColumns = columns.map(col => 
        col.id === columnId ? { ...col, wipLimit: newLimit } : col
      );
      setColumns(updatedColumns);
      setNotification({
        open: true,
        message: `Applied AI suggestion: Adjusted WIP limit for ${columnId}`,
        severity: 'success'
      });
    } else if (suggestion.action === 'rebalance-tasks') {
      // Handle task rebalancing suggestions
      setNotification({
        open: true,
        message: 'Applied AI suggestion: Task rebalancing recommendations noted',
        severity: 'info'
      });
    }
    
    await applyWorkflowSuggestion(suggestion.id);
  }, [columns, applyWorkflowSuggestion]);

  const handleImportConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target.result);
            if (config.columns) {
              setColumns(config.columns);
            }
            if (config.preferences) {
              setBoardPreferences(config.preferences);
            }
            if (onBoardConfigUpdate) {
              onBoardConfigUpdate(config);
            }
            setNotification({
              open: true,
              message: 'Board configuration imported successfully',
              severity: 'success'
            });
          } catch (error) {
            setNotification({
              open: true,
              message: 'Failed to import configuration: Invalid file format',
              severity: 'error'
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [onBoardConfigUpdate]);

  // Drag and drop event handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the task being dragged
    const task = tasks.find(t => t.id === active.id);
    setDraggedTask(task);
  }, [tasks]);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id;
    const overColumn = columns.find(col => col.id === overId);
    
    // If dropping over a column (not a task), update the task's status
    if (overColumn && activeTask.status !== overId) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === active.id 
            ? { ...task, status: overId }
            : task
        )
      );
    }
  }, [tasks, columns]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedTask(null);
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id;
    const overColumn = columns.find(col => col.id === overId);
    
    if (overColumn) {
      // Check WIP limits
      const targetColumnTasks = tasks.filter(t => t.status === overId && t.id !== active.id);
      const isWipViolated = overColumn.wipLimit && targetColumnTasks.length >= overColumn.wipLimit;
      
      if (isWipViolated) {
        setNotification({
          open: true,
          message: `Cannot move task: WIP limit (${overColumn.wipLimit}) exceeded for ${overColumn.title}`,
          severity: 'warning'
        });
        return;
      }

      // Move the task
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === active.id 
            ? { ...task, status: overId }
            : task
        )
      );

      // Notify parent component
      if (onTasksUpdate) {
        const updatedTasks = tasks.map(task => 
          task.id === active.id 
            ? { ...task, status: overId }
            : task
        );
        onTasksUpdate(updatedTasks);
      }

      setNotification({
        open: true,
        message: `Moved "${activeTask.title}" to ${overColumn.title}`,
        severity: 'success'
      });
    }
  }, [tasks, columns, onTasksUpdate]);

  // KanbanColumn event handlers
  const handleTaskDrop = useCallback((task, targetColumnId) => {
    console.log(`Task ${task.id} dropped to column ${targetColumnId}`);
    handleTaskMove(task.id, targetColumnId);
  }, [handleTaskMove]);

  const handleTaskClick = useCallback((task) => {
    console.log('Task clicked:', task);
    // TODO: Open task details modal
  }, []);

  const handleAddTask = useCallback((columnId) => {
    console.log(`Add task to column ${columnId}`);
    // TODO: Open add task dialog
    setNotification({
      open: true,
      message: `Add task to ${columnId}`,
      severity: 'info'
    });
  }, []);

  const handleColumnUpdate = useCallback((updatedColumn) => {
    console.log('Column updated:', updatedColumn);
    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === updatedColumn.id ? updatedColumn : col
      )
    );
    setNotification({
      open: true,
      message: `Column "${updatedColumn.title}" updated`,
      severity: 'success'
    });
  }, []);

  const handleColumnDelete = useCallback((columnId) => {
    console.log(`Delete column ${columnId}`);
    setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
    setNotification({
      open: true,
      message: 'Column deleted',
      severity: 'warning'
    });
  }, []);

  // Task card event handlers
  const handleTaskEdit = useCallback((task) => {
    console.log('Edit task:', task);
    // TODO: Open task edit modal
  }, []);

  const handleTaskAssign = useCallback((task) => {
    console.log('Reassign task:', task);
    // TODO: Open assignee selection dialog
  }, []);

  const handleTaskComment = useCallback((task) => {
    console.log('Add comment to task:', task);
    // TODO: Open comment dialog
  }, []);

  const handleTaskDelete = useCallback((task) => {
    console.log('Delete task:', task);
    setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
    setNotification({
      open: true,
      message: `Task "${task.title}" deleted`,
      severity: 'warning'
    });
  }, []);

  const renderTaskCard = useCallback((task, column) => {
    return (
      <TaskCard
        key={task.id}
        task={task}
        column={column}
        onClick={handleTaskClick}
        onEdit={handleTaskEdit}
        onAssign={handleTaskAssign}
        onComment={handleTaskComment}
        onDelete={handleTaskDelete}
        showQuickActions={true}
        showProgress={true}
        showTags={true}
        showDueDate={true}
        showAssignee={true}
        showStoryPoints={true}
        compact={false}
      />
    );
  }, [handleTaskClick, handleTaskEdit, handleTaskAssign, handleTaskComment, handleTaskDelete]);

  // Calculate board metrics
  const boardMetrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'done').length,
    inProgressTasks: tasks.filter(task => ['development', 'code-review', 'testing'].includes(task.status)).length,
    blockedTasks: tasks.filter(task => task.blocked).length,
    avgCycleTime: BOARD_METRICS.avgCycleTime,
    throughput: BOARD_METRICS.throughput
  };

  // Sprint metrics handlers
  const handleBurndownChart = useCallback(() => {
    console.log('Open Burndown Chart');
    setNotification({
      open: true,
      message: 'Burndown Chart feature coming soon!',
      severity: 'info'
    });
  }, []);

  const handleCumulativeFlow = useCallback(() => {
    console.log('Open Cumulative Flow');
    setNotification({
      open: true,
      message: 'Cumulative Flow feature coming soon!',
      severity: 'info'
    });
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Container maxWidth="xl" className={className}>
        <Box sx={{ py: 3 }}>
          {/* Board Header */}
          <BoardHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={handleFilterClick}
            onSettingsClick={handleSettingsClick}
            metrics={boardMetrics}
          />

          {/* Filter Bar */}
          <FilterBar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            assignees={allAssignees}
            selectedAssignees={selectedAssignees}
            onAssigneesChange={setSelectedAssignees}
            prioritiesList={allPriorities.length ? allPriorities : undefined}
            selectedPriorities={selectedPriorities}
            onPrioritiesChange={setSelectedPriorities}
            tags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* AI Agent Presence */}
          <AIAgentPresence
            agents={agents}
            activities={activities}
            onAgentClick={handleAgentClick}
            onRefresh={handleAgentRefresh}
            expanded={false}
            showActivitiesCount={5}
          />

          {/* Sprint Metrics */}
          <SprintMetrics
            onBurndownChart={handleBurndownChart}
            onCumulativeFlow={handleCumulativeFlow}
          />

          {/* AI Workflow Analysis */}
          <Box sx={{ mb: 3 }}>
            <AIBottleneckAnalysisPanel
              context="scrumban-workflow"
              onAnalysisStart={handleWorkflowAnalysis}
              onSuggestionApplied={handleApplyWorkflowSuggestion}
              isLoading={isAnalyzing}
              bottlenecks={bottlenecks}
              suggestions={workflowSuggestions}
              error={analysisError}
              showAdvancedOptions={false}
              maxHeight={200}
              customTitle="AI Workflow Analysis"
              customActions={[
                {
                  label: 'Analyze Workflow',
                  action: handleWorkflowAnalysis,
                  icon: <Assessment />,
                  disabled: isAnalyzing
                }
              ]}
            />
          </Box>

          {/* Kanban Board */}
          <Paper elevation={1} sx={{ p: 2, minHeight: '70vh' }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : isTablet 
                  ? 'repeat(3, 1fr)' 
                  : 'repeat(6, 1fr)',
              gap: 2,
              minHeight: '60vh'
            }}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasksByColumn[column.id]}
                  wipViolation={wipViolations[column.id]}
                  onTaskDrop={handleTaskDrop}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleAddTask}
                  onColumnUpdate={handleColumnUpdate}
                  onColumnDelete={handleColumnDelete}
                  renderTaskCard={renderTaskCard}
                  sx={{
                    minHeight: isMobile ? '300px' : '500px'
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Notification Snackbar */}
          <Snackbar
            open={notification.open}
            autoHideDuration={3000}
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.severity}
              variant="filled"
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedTask ? (
          <TaskCard
            task={draggedTask}
            isDragging={true}
            showQuickActions={false}
            sx={{
              transform: 'rotate(5deg)',
              opacity: 0.9,
              boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
              cursor: 'grabbing'
            }}
          />
        ) : null}
      </DragOverlay>

      {/* Board Settings Dialog */}
      <BoardSettings
        open={settingsOpen}
        onClose={handleSettingsClose}
        columns={columns}
        onColumnsChange={handleColumnsChange}
        preferences={boardPreferences}
        onPreferencesChange={handlePreferencesChange}
        onApplyTemplate={handleApplyTemplate}
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
      />
    </DndContext>
  );
};

ScrumbanBoardTab.propTypes = {
  initialTasks: PropTypes.array,
  initialColumns: PropTypes.array,
  boardConfig: PropTypes.object,
  onTasksUpdate: PropTypes.func,
  onBoardConfigUpdate: PropTypes.func,
  className: PropTypes.string
};

export default ScrumbanBoardTab; 