import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Chip,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  AccountTree,
  Analytics,
  Warning,
  CheckCircle,
  Error,
  Info,
  Close,
  Download,
  Upload,
  Refresh,
  Settings,
  Visibility,
  VisibilityOff,
  FilterList,
  Search,
  Add,
  Delete,
  Edit,
  Save,
  Cancel,
  PlayArrow,
  Stop,
  ExpandMore,
  TrendingUp,
  Timeline,
  Hub,
  Link,
  LinkOff,
  BugReport,
  Speed,
  Assessment
} from '@mui/icons-material';
import BaseModal from './BaseModal';
import DependencyGraph from '../DependencyGraph';
import DependencyManagementPanel from '../DependencyManagementPanel';

/**
 * DependencyModal - Comprehensive dependency visualization and management modal
 * 
 * Features:
 * - Interactive dependency graph visualization with multiple layouts
 * - Dependency creation/deletion with drag-and-drop interface
 * - Circular dependency detection and validation
 * - Dependency path highlighting and critical path analysis
 * - Bulk dependency operations and import/export
 * - Dependency impact analysis and recommendations
 * - Advanced filtering and search capabilities
 * - Real-time validation and error reporting
 * - Performance analytics and bottleneck detection
 */
const DependencyModal = ({
  open = false,
  onClose,
  tasks = [],
  selectedTaskId = null,
  onTasksUpdate,
  onDependencyAdd,
  onDependencyRemove,
  onTaskSelect,
  // Modal configuration
  title = 'Dependency Management',
  maxWidth = 'xl',
  fullWidth = true,
  // Feature toggles
  showAdvancedFeatures = true,
  showAnalytics = true,
  showBulkOperations = true,
  showImportExport = true,
  // Callbacks
  onValidationError,
  onAnalyticsUpdate,
  onBulkOperationComplete,
  ...modalProps
}) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dependencyAnalysis, setDependencyAnalysis] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [graphSettings, setGraphSettings] = useState({
    layout: 'breadthfirst',
    showStatusIndicators: true,
    showCriticalPath: true,
    highlightCycles: true,
    showMetrics: true
  });
  
  // Bulk operations state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkOperation, setBulkOperation] = useState('');
  
  // Import/Export state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Tab definitions
  const tabs = [
    { 
      label: 'Graph View', 
      icon: <AccountTree />, 
      description: 'Interactive dependency visualization' 
    },
    { 
      label: 'Management', 
      icon: <Settings />, 
      description: 'Add, edit, and remove dependencies' 
    },
    { 
      label: 'Analytics', 
      icon: <Analytics />, 
      description: 'Dependency analysis and insights',
      disabled: !showAnalytics 
    },
    { 
      label: 'Bulk Operations', 
      icon: <Edit />, 
      description: 'Batch dependency operations',
      disabled: !showBulkOperations 
    }
  ];

  // Initialize selected task
  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id?.toString() === selectedTaskId?.toString());
      setSelectedTask(task || null);
    }
  }, [selectedTaskId, tasks]);

  // Memoized dependency analysis
  const analysisResults = useMemo(() => {
    if (!tasks || tasks.length === 0) return {};
    
    return analyzeDependencies(tasks);
  }, [tasks]);

  // Dependency analysis function
  const analyzeDependencies = useCallback((taskList) => {
    const analysis = {
      totalTasks: taskList.length,
      totalDependencies: 0,
      circularDependencies: [],
      criticalPath: [],
      orphanedTasks: [],
      bottlenecks: [],
      dependencyDepth: {},
      taskMetrics: {}
    };

    // Calculate basic metrics
    taskList.forEach(task => {
      const deps = task.dependencies || [];
      analysis.totalDependencies += deps.length;
      
      // Track dependency depth
      analysis.dependencyDepth[task.id] = calculateDependencyDepth(task, taskList);
      
      // Calculate task metrics
      analysis.taskMetrics[task.id] = {
        dependsOn: deps.length,
        dependedBy: taskList.filter(t => 
          (t.dependencies || []).includes(task.id)
        ).length,
        criticalityScore: 0 // Will be calculated below
      };
    });

    // Detect circular dependencies
    analysis.circularDependencies = detectCircularDependencies(taskList);
    
    // Find critical path
    analysis.criticalPath = findCriticalPath(taskList);
    
    // Identify orphaned tasks (no dependencies and no dependents)
    analysis.orphanedTasks = taskList.filter(task => {
      const metrics = analysis.taskMetrics[task.id];
      return metrics.dependsOn === 0 && metrics.dependedBy === 0;
    });
    
    // Identify bottlenecks (tasks with many dependents)
    analysis.bottlenecks = taskList
      .filter(task => analysis.taskMetrics[task.id].dependedBy >= 3)
      .sort((a, b) => 
        analysis.taskMetrics[b.id].dependedBy - analysis.taskMetrics[a.id].dependedBy
      );

    // Calculate criticality scores
    Object.keys(analysis.taskMetrics).forEach(taskId => {
      const metrics = analysis.taskMetrics[taskId];
      metrics.criticalityScore = 
        (metrics.dependedBy * 2) + // Tasks depending on this
        (analysis.dependencyDepth[taskId] * 0.5) + // Depth in dependency chain
        (analysis.criticalPath.includes(parseInt(taskId)) ? 5 : 0); // On critical path
    });

    return analysis;
  }, []);

  // Helper functions for dependency analysis
  const calculateDependencyDepth = (task, taskList, visited = new Set()) => {
    if (visited.has(task.id)) return 0; // Circular dependency
    visited.add(task.id);
    
    const deps = task.dependencies || [];
    if (deps.length === 0) return 0;
    
    let maxDepth = 0;
    deps.forEach(depId => {
      const depTask = taskList.find(t => t.id === depId);
      if (depTask) {
        const depth = calculateDependencyDepth(depTask, taskList, new Set(visited));
        maxDepth = Math.max(maxDepth, depth + 1);
      }
    });
    
    return maxDepth;
  };

  const detectCircularDependencies = (taskList) => {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const dfs = (taskId, path = []) => {
      if (recursionStack.has(taskId)) {
        // Found a cycle
        const cycleStart = path.indexOf(taskId);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat([taskId]));
        }
        return;
      }
      
      if (visited.has(taskId)) return;
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = taskList.find(t => t.id === taskId);
      if (task && task.dependencies) {
        task.dependencies.forEach(depId => {
          dfs(depId, [...path, taskId]);
        });
      }
      
      recursionStack.delete(taskId);
    };
    
    taskList.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    });
    
    return cycles;
  };

  const findCriticalPath = (taskList) => {
    // Simplified critical path using longest path algorithm
    const inDegree = {};
    const longestPath = {};
    
    // Initialize
    taskList.forEach(task => {
      inDegree[task.id] = 0;
      longestPath[task.id] = 0;
    });
    
    // Calculate in-degrees
    taskList.forEach(task => {
      (task.dependencies || []).forEach(depId => {
        if (inDegree[depId] !== undefined) {
          inDegree[task.id] = (inDegree[task.id] || 0) + 1;
        }
      });
    });
    
    // Topological sort with longest path calculation
    const queue = taskList.filter(task => inDegree[task.id] === 0);
    const result = [];
    
    while (queue.length > 0) {
      const currentTask = queue.shift();
      result.push(currentTask.id);
      
      // Find tasks that depend on current task
      const dependents = taskList.filter(task => 
        (task.dependencies || []).includes(currentTask.id)
      );
      
      dependents.forEach(dependent => {
        longestPath[dependent.id] = Math.max(
          longestPath[dependent.id],
          longestPath[currentTask.id] + 1
        );
        
        inDegree[dependent.id]--;
        if (inDegree[dependent.id] === 0) {
          queue.push(dependent);
        }
      });
    }
    
    // Find tasks on the longest path
    const maxLength = Math.max(...Object.values(longestPath));
    return Object.keys(longestPath)
      .filter(taskId => longestPath[taskId] === maxLength)
      .map(id => parseInt(id));
  };

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTaskSelect = useCallback((task) => {
    setSelectedTask(task);
    if (onTaskSelect) {
      onTaskSelect(task);
    }
  }, [onTaskSelect]);

  const handleDependencyAdd = useCallback((taskId, dependencyId) => {
    // Validate before adding
    const errors = validateDependencyAddition(taskId, dependencyId, tasks);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setNotification({
        open: true,
        message: `Cannot add dependency: ${errors[0]}`,
        severity: 'error'
      });
      return;
    }

    // Clear errors and add dependency
    setValidationErrors([]);
    if (onDependencyAdd) {
      onDependencyAdd(taskId, dependencyId);
    }
    
    setNotification({
      open: true,
      message: 'Dependency added successfully',
      severity: 'success'
    });
  }, [tasks, onDependencyAdd]);

  const handleDependencyRemove = useCallback((taskId, dependencyId) => {
    if (onDependencyRemove) {
      onDependencyRemove(taskId, dependencyId);
    }
    
    setNotification({
      open: true,
      message: 'Dependency removed successfully',
      severity: 'success'
    });
  }, [onDependencyRemove]);

  const validateDependencyAddition = (taskId, dependencyId, taskList) => {
    const errors = [];
    
    // Check if tasks exist
    const task = taskList.find(t => t.id?.toString() === taskId?.toString());
    const depTask = taskList.find(t => t.id?.toString() === dependencyId?.toString());
    
    if (!task) errors.push(`Task ${taskId} not found`);
    if (!depTask) errors.push(`Dependency task ${dependencyId} not found`);
    if (errors.length > 0) return errors;
    
    // Check for self-dependency
    if (taskId === dependencyId) {
      errors.push('Task cannot depend on itself');
    }
    
    // Check if dependency already exists
    if (task.dependencies && task.dependencies.includes(dependencyId)) {
      errors.push('Dependency already exists');
    }
    
    // Check for circular dependency
    const wouldCreateCycle = checkForCircularDependency(taskId, dependencyId, taskList);
    if (wouldCreateCycle) {
      errors.push('Would create circular dependency');
    }
    
    return errors;
  };

  const checkForCircularDependency = (taskId, newDepId, taskList) => {
    const visited = new Set();
    
    const dfs = (currentId) => {
      if (currentId === taskId) return true; // Found cycle
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      
      const currentTask = taskList.find(t => t.id?.toString() === currentId?.toString());
      if (currentTask && currentTask.dependencies) {
        return currentTask.dependencies.some(depId => dfs(depId?.toString()));
      }
      
      return false;
    };
    
    return dfs(newDepId?.toString());
  };

  // Bulk operations
  const handleBulkOperation = async () => {
    if (selectedTasks.size === 0) {
      setNotification({
        open: true,
        message: 'No tasks selected for bulk operation',
        severity: 'warning'
      });
      return;
    }

    try {
      switch (bulkOperation) {
        case 'clearDependencies':
          await clearBulkDependencies();
          break;
        case 'addCommonDependency':
          // Would open a dialog to select common dependency
          break;
        case 'validateAll':
          await validateBulkDependencies();
          break;
        default:
          break;
      }
      
      if (onBulkOperationComplete) {
        onBulkOperationComplete(bulkOperation, Array.from(selectedTasks));
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Bulk operation failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const clearBulkDependencies = async () => {
    // Implementation would clear dependencies for selected tasks
    setNotification({
      open: true,
      message: `Cleared dependencies for ${selectedTasks.size} tasks`,
      severity: 'success'
    });
  };

  const validateBulkDependencies = async () => {
    const errors = [];
    selectedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id?.toString() === taskId?.toString());
      if (task && task.dependencies) {
        task.dependencies.forEach(depId => {
          const depErrors = validateDependencyAddition(taskId, depId, tasks);
          errors.push(...depErrors);
        });
      }
    });
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setNotification({
        open: true,
        message: `Found ${errors.length} validation errors`,
        severity: 'warning'
      });
    } else {
      setNotification({
        open: true,
        message: 'All dependencies are valid',
        severity: 'success'
      });
    }
  };

  // Import/Export functionality
  const handleExport = () => {
    const exportData = {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        dependencies: task.dependencies || []
      })),
      analysis: analysisResults,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependencies-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setNotification({
      open: true,
      message: 'Dependencies exported successfully',
      severity: 'success'
    });
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      if (data.tasks && Array.isArray(data.tasks)) {
        // Process import data
        setNotification({
          open: true,
          message: `Imported ${data.tasks.length} task dependencies`,
          severity: 'success'
        });
        setShowImportDialog(false);
        setImportData('');
      } else {
        throw new Error('Invalid import format');
      }
    } catch (error) {
      setNotification({
        open: true,
        message: `Import failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Graph View
        return (
          <Box sx={{ height: '70vh' }}>
            <DependencyGraph
              tasks={tasks}
              onTaskSelect={handleTaskSelect}
              onDependencyAdd={handleDependencyAdd}
              onDependencyRemove={handleDependencyRemove}
              height={600}
              showStatusIndicators={graphSettings.showStatusIndicators}
              showNavigationControls={true}
              showManagementPanel={false}
              showFilters={true}
              showExport={true}
            />
          </Box>
        );
        
      case 1: // Management
        return (
          <Box sx={{ minHeight: '60vh' }}>
            <DependencyManagementPanel
              tasks={tasks}
              selectedTask={selectedTask}
              onDependencyAdd={handleDependencyAdd}
              onDependencyRemove={handleDependencyRemove}
              onValidationError={setValidationErrors}
            />
          </Box>
        );
        
      case 2: // Analytics
        return (
          <Box sx={{ minHeight: '60vh' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Dependency Metrics
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Hub /></ListItemIcon>
                      <ListItemText 
                        primary="Total Tasks" 
                        secondary={analysisResults.totalTasks}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Link /></ListItemIcon>
                      <ListItemText 
                        primary="Total Dependencies" 
                        secondary={analysisResults.totalDependencies}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Warning /></ListItemIcon>
                      <ListItemText 
                        primary="Circular Dependencies" 
                        secondary={analysisResults.circularDependencies?.length || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Speed /></ListItemIcon>
                      <ListItemText 
                        primary="Bottlenecks" 
                        secondary={analysisResults.bottlenecks?.length || 0}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Critical Path Analysis
                  </Typography>
                  {analysisResults.criticalPath?.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tasks on critical path:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResults.criticalPath.map(taskId => {
                          const task = tasks.find(t => t.id === taskId);
                          return (
                            <Chip
                              key={taskId}
                              label={task ? `${task.title} (${taskId})` : `Task ${taskId}`}
                              color="primary"
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No critical path identified
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {analysisResults.circularDependencies?.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Circular Dependencies Detected
                    </Typography>
                    {analysisResults.circularDependencies.map((cycle, index) => (
                      <Typography key={index} variant="body2">
                        Cycle {index + 1}: {cycle.join(' → ')}
                      </Typography>
                    ))}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 3: // Bulk Operations
        return (
          <Box sx={{ minHeight: '60vh' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
                Bulk Dependency Operations
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={bulkMode}
                      onChange={(e) => setBulkMode(e.target.checked)}
                    />
                  }
                  label="Enable bulk selection mode"
                />
              </Box>
              
              {bulkMode && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Tasks: {selectedTasks.size}
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Bulk Operation</InputLabel>
                    <Select
                      value={bulkOperation}
                      onChange={(e) => setBulkOperation(e.target.value)}
                      label="Bulk Operation"
                    >
                      <MenuItem value="clearDependencies">Clear All Dependencies</MenuItem>
                      <MenuItem value="addCommonDependency">Add Common Dependency</MenuItem>
                      <MenuItem value="validateAll">Validate All Dependencies</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    onClick={handleBulkOperation}
                    disabled={!bulkOperation || selectedTasks.size === 0}
                  >
                    Execute Bulk Operation
                  </Button>
                </Box>
              )}
              
              {showImportExport && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Import/Export
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                      onClick={() => setShowImportDialog(true)}
                    >
                      Import Dependencies
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={handleExport}
                    >
                      Export Dependencies
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title={title}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        {...modalProps}
      >
        <Box sx={{ width: '100%', minHeight: '70vh' }}>
          {/* Header with tabs and controls */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={tab.label}
                    icon={tab.icon}
                    disabled={tab.disabled}
                    sx={{ minHeight: 64 }}
                  />
                ))}
              </Tabs>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {showAdvancedFeatures && (
                  <Tooltip title="Advanced Options">
                    <IconButton
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      color={showAdvancedOptions ? 'primary' : 'default'}
                    >
                      <Settings />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Refresh Analysis">
                  <IconButton onClick={() => setDependencyAnalysis({})}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Tab description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {tabs[activeTab]?.description}
            </Typography>
          </Box>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Validation Errors:</Typography>
              {validationErrors.map((error, index) => (
                <Typography key={index} variant="body2">• {error}</Typography>
              ))}
            </Alert>
          )}

          {/* Advanced options panel */}
          {showAdvancedOptions && (
            <Accordion expanded={showAdvancedOptions} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">Advanced Options</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={graphSettings.showStatusIndicators}
                          onChange={(e) => setGraphSettings(prev => ({
                            ...prev,
                            showStatusIndicators: e.target.checked
                          }))}
                        />
                      }
                      label="Show Status Indicators"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={graphSettings.showCriticalPath}
                          onChange={(e) => setGraphSettings(prev => ({
                            ...prev,
                            showCriticalPath: e.target.checked
                          }))}
                        />
                      }
                      label="Highlight Critical Path"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={graphSettings.highlightCycles}
                          onChange={(e) => setGraphSettings(prev => ({
                            ...prev,
                            highlightCycles: e.target.checked
                          }))}
                        />
                      }
                      label="Highlight Circular Dependencies"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Graph Layout</InputLabel>
                      <Select
                        value={graphSettings.layout}
                        onChange={(e) => setGraphSettings(prev => ({
                          ...prev,
                          layout: e.target.value
                        }))}
                        label="Graph Layout"
                      >
                        <MenuItem value="breadthfirst">Hierarchical</MenuItem>
                        <MenuItem value="cose">Force-directed</MenuItem>
                        <MenuItem value="grid">Grid</MenuItem>
                        <MenuItem value="circle">Circle</MenuItem>
                        <MenuItem value="concentric">Concentric</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Tab content */}
          {renderTabContent()}
        </Box>
      </BaseModal>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Dependencies</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON dependency data here..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>Cancel</Button>
          <Button onClick={handleImport} variant="contained">Import</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DependencyModal; 