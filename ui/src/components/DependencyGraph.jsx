import React, { useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { 
  Box, 
  Typography, 
  useTheme, 
  Paper,
  Chip,
  Tooltip,
  IconButton,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import { 
  CheckCircle, 
  Schedule, 
  PlayArrow, 
  Block,
  Cancel,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Fullscreen,
  GridView,
  AccountTree,
  Radar,
  Hub,
  Settings,
  Visibility,
  FilterList,
  GetApp
} from '@mui/icons-material';
import DependencyManagementPanel from './DependencyManagementPanel';
import GraphFilters from './GraphFilters';
import GraphExport from './GraphExport';

/**
 * Enhanced DependencyGraph renders an interactive dependency graph using Cytoscape.js
 * with task status indicators, better styling, and task information display.
 *
 * Props:
 *   tasks: Array of task objects with { id, title, status, dependencies, description, etc. }
 *   onTaskSelect: Function called when a task node is selected
 *   onDependencyAdd: Function called when adding a dependency (taskId, dependencyId)
 *   onDependencyRemove: Function called when removing a dependency (taskId, dependencyId)
 *   height: Optional height (default: 400)
 *   showStatusIndicators: Boolean to show/hide status indicators (default: true)
 *   showNavigationControls: Boolean to show/hide navigation controls (default: true)
 *   showManagementPanel: Boolean to show/hide dependency management panel (default: true)
 *   showFilters: Boolean to show/hide filtering panel (default: true)
 *   showExport: Boolean to show/hide export functionality (default: true)
 */
export default function DependencyGraph({ 
  tasks = [], 
  onTaskSelect,
  onDependencyAdd,
  onDependencyRemove,
  height = 400,
  showStatusIndicators = true,
  showNavigationControls = true,
  showManagementPanel = true,
  showFilters = true,
  showExport = true
}) {
  const theme = useTheme();
  const cyRef = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentLayout, setCurrentLayout] = useState('breadthfirst');
  const [activeTab, setActiveTab] = useState(0);
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [analysisData, setAnalysisData] = useState({});

  // Available layout options
  const layoutOptions = [
    { value: 'breadthfirst', label: 'Hierarchical', icon: <AccountTree /> },
    { value: 'cose', label: 'Force-directed', icon: <Hub /> },
    { value: 'grid', label: 'Grid', icon: <GridView /> },
    { value: 'circle', label: 'Circle', icon: <Radar /> },
    { value: 'concentric', label: 'Concentric', icon: <CenterFocusStrong /> }
  ];

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return theme.palette.success.main;
      case 'in-progress':
      case 'in progress':
        return theme.palette.warning.main;
      case 'pending':
        return theme.palette.info.main;
      case 'blocked':
        return theme.palette.error.main;
      case 'cancelled':
      case 'canceled':
        return theme.palette.grey[500];
      default:
        return theme.palette.primary.main;
    }
  };

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'in-progress':
      case 'in progress':
        return <PlayArrow fontSize="small" />;
      case 'pending':
        return <Schedule fontSize="small" />;
      case 'blocked':
        return <Block fontSize="small" />;
      case 'cancelled':
      case 'canceled':
        return <Cancel fontSize="small" />;
      default:
        return <Schedule fontSize="small" />;
    }
  };

  // Navigation control functions
  const handleZoomIn = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 1.2);
      cy.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.zoom(cy.zoom() * 0.8);
      cy.center();
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50);
    }
  };

  const handleCenter = () => {
    if (cyRef.current) {
      cyRef.current.center();
    }
  };

  const handleLayoutChange = (layoutName) => {
    if (cyRef.current) {
      setCurrentLayout(layoutName);
      
      const layoutConfigs = {
        breadthfirst: {
          name: 'breadthfirst',
          fit: true,
          directed: true,
          padding: 30,
          spacingFactor: 1.5,
          avoidOverlap: true
        },
        cose: {
          name: 'cose',
          fit: true,
          padding: 30,
          nodeRepulsion: 10000,
          idealEdgeLength: 100,
          edgeElasticity: 100,
          nestingFactor: 5
        },
        grid: {
          name: 'grid',
          fit: true,
          padding: 30,
          avoidOverlap: true,
          condense: false,
          rows: undefined,
          cols: undefined
        },
        circle: {
          name: 'circle',
          fit: true,
          padding: 30,
          avoidOverlap: true,
          radius: undefined
        },
        concentric: {
          name: 'concentric',
          fit: true,
          padding: 30,
          avoidOverlap: true,
          concentric: (node) => node.degree(),
          levelWidth: () => 2
        }
      };

      const layout = cyRef.current.layout(layoutConfigs[layoutName] || layoutConfigs.breadthfirst);
      layout.run();
    }
  };

  // Handle dependency management
  const handleDependencyAdd = (taskId, dependencyId) => {
    if (onDependencyAdd) {
      onDependencyAdd(taskId, dependencyId);
    }
    // Update selected task to refresh the UI
    const updatedTask = tasks.find(t => t.id?.toString() === taskId);
    if (updatedTask) {
      setSelectedTask(updatedTask);
    }
  };

  const handleDependencyRemove = (taskId, dependencyId) => {
    if (onDependencyRemove) {
      onDependencyRemove(taskId, dependencyId);
    }
    // Update selected task to refresh the UI
    const updatedTask = tasks.find(t => t.id?.toString() === taskId);
    if (updatedTask) {
      setSelectedTask(updatedTask);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filtered, filterSettings) => {
    setFilteredTasks(filtered);
  };

  // Handle analysis changes
  const handleAnalysisChange = (analysis) => {
    setAnalysisData(analysis);
  };

  // Convert tasks to cytoscape elements
  const convertTasksToElements = (tasks) => {
    if (!tasks || tasks.length === 0) {
      // Demo graph if no data provided
      return [
        { data: { id: '1', label: 'Task 1', status: 'done', type: 'demo' } },
        { data: { id: '2', label: 'Task 2', status: 'in-progress', type: 'demo' } },
        { data: { id: '3', label: 'Task 3', status: 'pending', type: 'demo' } },
        { data: { id: '4', label: 'Task 4', status: 'pending', type: 'demo' } },
        { data: { source: '1', target: '2' } },
        { data: { source: '1', target: '3' } },
        { data: { source: '2', target: '4' } },
        { data: { source: '3', target: '4' } },
      ];
    }

    const nodes = tasks.map(task => ({
      data: {
        id: task.id?.toString(),
        label: task.title || `Task ${task.id}`,
        status: task.status || 'pending',
        description: task.description || '',
        priority: task.priority || 'medium',
        type: 'task',
        taskData: task
      }
    }));

    const edges = [];
    tasks.forEach(task => {
      if (task.dependencies && Array.isArray(task.dependencies)) {
        task.dependencies.forEach(depId => {
          // Check if the dependency exists in our task list
          if (tasks.some(t => t.id?.toString() === depId?.toString())) {
            edges.push({
              data: {
                source: depId?.toString(),
                target: task.id?.toString()
              }
            });
          }
        });
      }
    });

    return [...nodes, ...edges];
  };

  const cyElements = convertTasksToElements(filteredTasks);

  // Enhanced cytoscape styles
  const cyStyle = [
    {
      selector: 'node[type="task"]',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': theme.palette.text.primary,
        'background-color': (ele) => getStatusColor(ele.data('status')),
        'border-width': 3,
        'border-color': theme.palette.divider,
        'font-size': 12,
        'font-weight': 'bold',
        'width': 80,
        'height': 80,
        'text-wrap': 'wrap',
        'text-max-width': 70,
        'text-overflow-wrap': 'anywhere',
        'overlay-opacity': 0.1,
        'overlay-color': theme.palette.action.hover,
      },
    },
    {
      selector: 'node[type="demo"]',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': theme.palette.text.primary,
        'background-color': (ele) => getStatusColor(ele.data('status')),
        'border-width': 2,
        'border-color': theme.palette.primary.dark,
        'font-size': 14,
        'width': 60,
        'height': 60,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': theme.palette.secondary.main,
        'target-arrow-color': theme.palette.secondary.main,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 1.2,
      },
    },
    {
      selector: ':selected',
      style: {
        'background-color': theme.palette.action.selected,
        'border-color': theme.palette.primary.main,
        'border-width': 4,
        'line-color': theme.palette.primary.main,
        'target-arrow-color': theme.palette.primary.main,
        'source-arrow-color': theme.palette.primary.main,
      },
    },
    {
      selector: 'node:hover',
      style: {
        'overlay-opacity': 0.2,
        'overlay-color': theme.palette.primary.main,
      },
    },
  ];

  // Handle node selection
  const handleNodeSelect = (event) => {
    const node = event.target;
    const taskData = node.data('taskData');
    setSelectedTask(taskData);
    if (onTaskSelect && taskData) {
      onTaskSelect(taskData);
    }
  };

  // Setup cytoscape event handlers
  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      
      // Remove existing listeners
      cy.removeAllListeners();
      
      // Add event listeners
      cy.on('tap', 'node', handleNodeSelect);
      cy.on('tap', (event) => {
        // Deselect when clicking on background
        if (event.target === cy) {
          setSelectedTask(null);
          if (onTaskSelect) {
            onTaskSelect(null);
          }
        }
      });

      // Add keyboard shortcuts
      cy.on('keydown', (event) => {
        if (event.originalEvent) {
          switch (event.originalEvent.key) {
            case '=':
            case '+':
              handleZoomIn();
              break;
            case '-':
              handleZoomOut();
              break;
            case 'f':
              handleFit();
              break;
            case 'c':
              handleCenter();
              break;
          }
        }
      });
    }
  }, [filteredTasks, onTaskSelect]);

  // Update filtered tasks when main tasks change
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filters Panel */}
      {showFilters && (
        <Box sx={{ mb: 2 }}>
          <GraphFilters
            tasks={tasks}
            onFilterChange={handleFilterChange}
            onAnalysisChange={handleAnalysisChange}
          />
        </Box>
      )}

      {/* Main Graph View */}
      <Paper sx={{ width: '100%', height: height + 60, p: 2, mb: showManagementPanel ? 2 : 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Dependency Graph ({filteredTasks.length} tasks)
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Export Controls */}
            {showExport && (
              <GraphExport
                tasks={filteredTasks}
                cyRef={cyRef}
                analysisData={analysisData}
              />
            )}

            {/* Layout Selector */}
            {showNavigationControls && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={currentLayout}
                  label="Layout"
                  onChange={(e) => handleLayoutChange(e.target.value)}
                >
                  {layoutOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Navigation Controls */}
            {showNavigationControls && (
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Zoom In (+)">
                  <IconButton onClick={handleZoomIn}>
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out (-)">
                  <IconButton onClick={handleZoomOut}>
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fit to View (F)">
                  <IconButton onClick={handleFit}>
                    <Fullscreen />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Center (C)">
                  <IconButton onClick={handleCenter}>
                    <CenterFocusStrong />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
            )}

            {/* Status Indicators */}
            {showStatusIndicators && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<CheckCircle fontSize="small" />}
                  label="Done"
                  size="small"
                  sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText }}
                />
                <Chip
                  icon={<PlayArrow fontSize="small" />}
                  label="In Progress"
                  size="small"
                  sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText }}
                />
                <Chip
                  icon={<Schedule fontSize="small" />}
                  label="Pending"
                  size="small"
                  sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}
                />
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ position: 'relative', height: height, bgcolor: theme.palette.background.default, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
          <CytoscapeComponent
            elements={cyElements}
            style={{ width: '100%', height: '100%' }}
            stylesheet={cyStyle}
            layout={{ 
              name: currentLayout, 
              fit: true, 
              directed: true, 
              padding: 30,
              spacingFactor: 1.5,
              avoidOverlap: true
            }}
            minZoom={0.3}
            maxZoom={3}
            boxSelectionEnabled={true}
            autoungrabify={false}
            wheelSensitivity={0.2}
            cy={(cy) => { cyRef.current = cy; }}
          />

          {/* Keyboard Shortcuts Help */}
          {showNavigationControls && (
            <Paper
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                p: 1,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                opacity: 0.8
              }}
            >
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                Keyboard Shortcuts:
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                +/- Zoom • F Fit • C Center
              </Typography>
            </Paper>
          )}

          {/* Task Info Panel */}
          {selectedTask && !showManagementPanel && (
            <Paper
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 280,
                p: 2,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 3,
                maxHeight: height - 40,
                overflow: 'auto'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getStatusIcon(selectedTask.status)}
                <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                  {selectedTask.title}
                </Typography>
              </Box>
              
              <Chip
                label={selectedTask.status || 'pending'}
                size="small"
                sx={{ 
                  bgcolor: getStatusColor(selectedTask.status),
                  color: theme.palette.getContrastText(getStatusColor(selectedTask.status)),
                  mb: 1
                }}
              />
              
              {selectedTask.priority && (
                <Chip
                  label={`Priority: ${selectedTask.priority}`}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, mb: 1 }}
                />
              )}

              {selectedTask.description && (
                <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                  {selectedTask.description}
                </Typography>
              )}

              {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    Dependencies: {selectedTask.dependencies.join(', ')}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Management Panel */}
      {showManagementPanel && (
        <Paper sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Task Details" icon={<Visibility />} />
            <Tab label="Dependency Management" icon={<Settings />} />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            {activeTab === 0 && (
              // Task Details Tab
              <Box>
                {selectedTask ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getStatusIcon(selectedTask.status)}
                      <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                        {selectedTask.title}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={selectedTask.status || 'pending'}
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(selectedTask.status),
                          color: theme.palette.getContrastText(getStatusColor(selectedTask.status))
                        }}
                      />
                      
                      {selectedTask.priority && (
                        <Chip
                          label={`Priority: ${selectedTask.priority}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {selectedTask.description && (
                      <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        {selectedTask.description}
                      </Typography>
                    )}

                    {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Dependencies:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedTask.dependencies.map(depId => {
                            const depTask = tasks.find(t => t.id?.toString() === depId?.toString());
                            return (
                              <Chip
                                key={depId}
                                label={depTask ? `${depTask.title} (${depId})` : `Task ${depId}`}
                                size="small"
                                variant="outlined"
                                color={depTask?.status === 'done' ? 'success' : 'default'}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Visibility sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a task in the graph to view its details
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              // Dependency Management Tab
              <DependencyManagementPanel
                tasks={tasks}
                selectedTask={selectedTask}
                onDependencyAdd={handleDependencyAdd}
                onDependencyRemove={handleDependencyRemove}
                onValidationError={(errors) => {
                  console.warn('Dependency validation errors:', errors);
                }}
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
