import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ButtonGroup,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Timeline,
  AccountTree,
  Warning,
  CheckCircle,
  Schedule,
  PlayArrow,
  Block,
  Cancel,
  Route
} from '@mui/icons-material';

/**
 * GraphFilters component provides filtering and analysis tools for the dependency graph
 *
 * Props:
 *   tasks: Array of task objects
 *   onFilterChange: Function called when filters change (filteredTasks, filterSettings)
 *   onAnalysisChange: Function called when analysis results change
 */
export default function GraphFilters({
  tasks = [],
  onFilterChange,
  onAnalysisChange
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dependencyFilter, setDependencyFilter] = useState('all');
  const [showOrphaned, setShowOrphaned] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [criticalPath, setCriticalPath] = useState([]);
  const [orphanedTasks, setOrphanedTasks] = useState([]);
  const [blockedTasks, setBlockedTasks] = useState([]);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses', icon: null },
    { value: 'pending', label: 'Pending', icon: <Schedule fontSize="small" /> },
    { value: 'in-progress', label: 'In Progress', icon: <PlayArrow fontSize="small" /> },
    { value: 'done', label: 'Done', icon: <CheckCircle fontSize="small" /> },
    { value: 'blocked', label: 'Blocked', icon: <Block fontSize="small" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <Cancel fontSize="small" /> }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  // Dependency filter options
  const dependencyOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'with-deps', label: 'Has Dependencies' },
    { value: 'no-deps', label: 'No Dependencies' },
    { value: 'blocking', label: 'Blocking Others' },
    { value: 'blocked', label: 'Blocked by Dependencies' }
  ];

  // Calculate critical path (longest path through dependencies)
  const calculateCriticalPath = (tasks) => {
    if (!tasks || tasks.length === 0) return [];

    // Build adjacency list
    const graph = new Map();
    const inDegree = new Map();
    
    tasks.forEach(task => {
      const taskId = task.id?.toString();
      if (!graph.has(taskId)) {
        graph.set(taskId, []);
        inDegree.set(taskId, 0);
      }
    });

    // Add edges and calculate in-degrees
    tasks.forEach(task => {
      const taskId = task.id?.toString();
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          if (graph.has(depId)) {
            graph.get(depId).push(taskId);
            inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1);
          }
        });
      }
    });

    // Topological sort with longest path calculation
    const queue = [];
    const distances = new Map();
    const parent = new Map();

    // Initialize
    for (const [taskId, degree] of inDegree) {
      distances.set(taskId, 0);
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    let processed = [];
    while (queue.length > 0) {
      const current = queue.shift();
      processed.push(current);

      for (const neighbor of graph.get(current) || []) {
        // Update distance (longest path)
        const newDistance = distances.get(current) + 1;
        if (newDistance > distances.get(neighbor)) {
          distances.set(neighbor, newDistance);
          parent.set(neighbor, current);
        }

        // Reduce in-degree
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Find the path with maximum distance
    let maxDistance = 0;
    let endTask = null;
    for (const [taskId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endTask = taskId;
      }
    }

    // Reconstruct critical path
    const path = [];
    let current = endTask;
    while (current) {
      path.unshift(current);
      current = parent.get(current);
    }

    return path;
  };

  // Find orphaned tasks (no dependencies and no dependents)
  const findOrphanedTasks = (tasks) => {
    if (!tasks || tasks.length === 0) return [];

    const taskIds = new Set(tasks.map(t => t.id?.toString()));
    const hasDependents = new Set();
    
    // Find all tasks that have dependents
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          if (taskIds.has(depId)) {
            hasDependents.add(depId);
          }
        });
      }
    });

    // Find orphaned tasks
    return tasks.filter(task => {
      const taskId = task.id?.toString();
      const noDependencies = !task.dependencies || task.dependencies.length === 0;
      const noDependents = !hasDependents.has(taskId);
      return noDependencies && noDependents;
    });
  };

  // Find blocked tasks (tasks with incomplete dependencies)
  const findBlockedTasks = (tasks) => {
    if (!tasks || tasks.length === 0) return [];

    return tasks.filter(task => {
      if (!task.dependencies || task.dependencies.length === 0) return false;
      if (task.status === 'done') return false;

      return task.dependencies.some(depId => {
        const depTask = tasks.find(t => t.id?.toString() === depId?.toString());
        return depTask && depTask.status !== 'done';
      });
    });
  };

  // Apply filters to tasks
  const applyFilters = (tasks) => {
    let filtered = [...tasks];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Dependency filter
    switch (dependencyFilter) {
      case 'with-deps':
        filtered = filtered.filter(task => 
          task.dependencies && task.dependencies.length > 0
        );
        break;
      case 'no-deps':
        filtered = filtered.filter(task => 
          !task.dependencies || task.dependencies.length === 0
        );
        break;
      case 'blocking':
        const blockerIds = new Set();
        tasks.forEach(task => {
          if (task.dependencies) {
            task.dependencies.forEach(depId => blockerIds.add(depId));
          }
        });
        filtered = filtered.filter(task => 
          blockerIds.has(task.id?.toString())
        );
        break;
      case 'blocked':
        const blocked = findBlockedTasks(tasks);
        const blockedIds = new Set(blocked.map(t => t.id?.toString()));
        filtered = filtered.filter(task => 
          blockedIds.has(task.id?.toString())
        );
        break;
    }

    // Orphaned tasks filter
    if (!showOrphaned) {
      const orphaned = findOrphanedTasks(tasks);
      const orphanedIds = new Set(orphaned.map(t => t.id?.toString()));
      filtered = filtered.filter(task => 
        !orphanedIds.has(task.id?.toString())
      );
    }

    // Completed tasks filter
    if (!showCompleted) {
      filtered = filtered.filter(task => 
        task.status?.toLowerCase() !== 'done'
      );
    }

    return filtered;
  };

  // Update analysis when tasks change
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const critical = calculateCriticalPath(tasks);
    const orphaned = findOrphanedTasks(tasks);
    const blocked = findBlockedTasks(tasks);

    setCriticalPath(critical);
    setOrphanedTasks(orphaned);
    setBlockedTasks(blocked);

    if (onAnalysisChange) {
      onAnalysisChange({
        criticalPath: critical,
        orphanedTasks: orphaned,
        blockedTasks: blocked
      });
    }
  }, [tasks, onAnalysisChange]);

  // Update filtered tasks when filters change
  useEffect(() => {
    const filtered = applyFilters(tasks);
    
    if (onFilterChange) {
      onFilterChange(filtered, {
        statusFilter,
        priorityFilter,
        dependencyFilter,
        showOrphaned,
        showCompleted
      });
    }
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    dependencyFilter,
    showOrphaned,
    showCompleted,
    onFilterChange
  ]);

  const clearAllFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setDependencyFilter('all');
    setShowOrphaned(true);
    setShowCompleted(true);
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    dependencyFilter !== 'all',
    !showOrphaned,
    !showCompleted
  ].filter(Boolean).length;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          <Typography variant="h6">
            Graph Filters & Analysis
          </Typography>
          {activeFilterCount > 0 && (
            <Chip 
              label={`${activeFilterCount} active`} 
              size="small" 
              color="primary" 
            />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter Controls */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Status Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Dependency Filter */}
            <FormControl size="small" fullWidth>
              <InputLabel>Dependencies</InputLabel>
              <Select
                value={dependencyFilter}
                label="Dependencies"
                onChange={(e) => setDependencyFilter(e.target.value)}
              >
                {dependencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Toggle Filters */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOrphaned}
                    onChange={(e) => setShowOrphaned(e.target.checked)}
                  />
                }
                label="Show Orphaned Tasks"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                  />
                }
                label="Show Completed Tasks"
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Analysis Results */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Analysis Results</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Critical Path */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Route color="error" />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Critical Path ({criticalPath.length} tasks)
                </Typography>
              </Box>
              {criticalPath.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {criticalPath.map((taskId, index) => {
                    const task = tasks.find(t => t.id?.toString() === taskId);
                    return (
                      <Tooltip 
                        key={taskId} 
                        title={task ? `${task.title} (${task.status})` : `Task ${taskId}`}
                      >
                        <Chip
                          label={`${index + 1}. ${task ? task.title : `Task ${taskId}`}`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No critical path found
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Blocked Tasks */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Block color="warning" />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Blocked Tasks ({blockedTasks.length})
                </Typography>
              </Box>
              {blockedTasks.length > 0 ? (
                <List dense>
                  {blockedTasks.slice(0, 5).map((task) => (
                    <ListItem key={task.id} divider>
                      <ListItemIcon>
                        <Warning color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Waiting on: ${task.dependencies?.join(', ')}`}
                      />
                    </ListItem>
                  ))}
                  {blockedTasks.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      ... and {blockedTasks.length - 5} more
                    </Typography>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No blocked tasks
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Orphaned Tasks */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccountTree color="info" />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Orphaned Tasks ({orphanedTasks.length})
                </Typography>
              </Box>
              {orphanedTasks.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {orphanedTasks.map((task) => (
                    <Chip
                      key={task.id}
                      label={task.title}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No orphaned tasks
                </Typography>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
} 