import { useState, useEffect, Suspense, lazy } from 'react';
import { Box, useTheme, CircularProgress, Typography, Stack } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopAppBar from './components/TopAppBar';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcutHelp, { useKeyboardShortcutHelp } from './components/accessibility/KeyboardShortcutHelp';
import keyboardShortcuts from './services/keyboardShortcuts';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const TaskCreation = lazy(() => import('./pages/TaskCreation'));
const SprintPlanning = lazy(() => import('./pages/SprintPlanning'));
const Settings = lazy(() => import('./pages/Settings'));
const PerformanceDashboard = lazy(() => import('./components/PerformanceDashboard'));

// Lazy load large feature components
const PRDUpload = lazy(() => import('./components/PRDUpload'));
const PRDPreview = lazy(() => import('./components/PRDPreview'));
const PRDEditor = lazy(() => import('./components/PRDEditor'));
const DependencyGraph = lazy(() => import('./components/DependencyGraph'));

// Task management components
const TaskModal = lazy(() => import('./components/TaskModal'));

// Loading component for Suspense fallbacks
const LoadingSpinner = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Enhanced loading component for specific features
const FeatureLoadingSpinner = ({ feature }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px',
      gap: 2,
      p: 3
    }}
  >
    <CircularProgress size={36} color="primary" />
    <Stack spacing={1} alignItems="center">
      <Typography variant="h6" color="text.primary">
        Loading {feature}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we prepare the interface...
      </Typography>
    </Stack>
  </Box>
);

// Mock task data for testing - replace with actual data from API
const mockTasks = [
  {
    id: '1',
    title: 'Setup React Project Foundation',
    status: 'done',
    priority: 'high',
    dependencies: [],
    description: 'Initialize React project with TypeScript, Material-UI, and routing.'
  },
  {
    id: '2',
    title: 'Implement Navigation System',
    status: 'done',
    priority: 'high',
    dependencies: ['1'],
    description: 'Create sidebar navigation and top app bar components.'
  },
  {
    id: '3',
    title: 'Integrate with Node.js Backend',
    status: 'done',
    priority: 'high',
    dependencies: ['2'],
    description: 'Set up API integration and data management.'
  },
  {
    id: '4',
    title: 'Build PRD Upload Interface',
    status: 'done',
    priority: 'high',
    dependencies: ['3'],
    description: 'Create file upload and processing interface for PRDs.'
  },
  {
    id: '5',
    title: 'Develop Kanban Task Board',
    status: 'done',
    priority: 'high',
    dependencies: ['3'],
    description: 'Build drag-and-drop task board with status columns.'
  },
  {
    id: '6',
    title: 'Create Task Detail Panel',
    status: 'done',
    priority: 'high',
    dependencies: ['5'],
    description: 'Implement detailed task editing and management interface.'
  },
  {
    id: '7',
    title: 'Implement Sprint Planning',
    status: 'done',
    priority: 'high',
    dependencies: ['6'],
    description: 'Build sprint management and timeline visualization.'
  },
  {
    id: '8',
    title: 'Build Dependency Graph Visualization',
    status: 'review',
    priority: 'medium',
    dependencies: ['6'],
    description: 'Create interactive dependency graph with controls and management tools.'
  },
  {
    id: '9',
    title: 'AI Model Configuration Interface',
    status: 'pending',
    priority: 'medium',
    dependencies: ['3'],
    description: 'Build interface for configuring AI models and providers.'
  },
  {
    id: '10',
    title: 'Implement Keyboard Shortcuts',
    status: 'pending',
    priority: 'medium',
    dependencies: ['5', '6'],
    description: 'Add keyboard shortcuts and hotkeys for power users.'
  }
];

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const { isOpen: showKeyboardHelp, openHelp, closeHelp } = useKeyboardShortcutHelp();
  const theme = useTheme();
  const navigate = useNavigate();

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Mock tasks data for dependencies (TODO: Replace with actual data from API)
  const mockTasks = [
    { id: '1', title: 'Setup React Project Foundation' },
    { id: '2', title: 'Implement Navigation System' },
    { id: '3', title: 'Integrate with Node.js Backend' },
    { id: '4', title: 'Build PRD Upload Interface' },
    { id: '5', title: 'Develop Kanban Task Board' },
  ];

  // Set up keyboard shortcuts and event listeners
  useEffect(() => {
    // Expose React Router navigate function to keyboard shortcuts service
    window.routerNavigate = navigate;

    // Listen for keyboard shortcut events
    const handleShowKeyboardHelp = () => {
      openHelp();
    };

    const handleCreateNewTask = () => {
      // Navigate to task creation page
      navigate('/tasks/new');
    };

    const handleEscapePressed = () => {
      // Close keyboard help dialog
      closeHelp();
      // Dispatch event for other components to handle escape
      const event = new CustomEvent('closeModalsAndPanels');
      document.dispatchEvent(event);
    };

    // Add event listeners
    document.addEventListener('showKeyboardHelp', handleShowKeyboardHelp);
    document.addEventListener('createNewTask', handleCreateNewTask);
    document.addEventListener('escapePressed', handleEscapePressed);

    // Cleanup function
    return () => {
      document.removeEventListener('showKeyboardHelp', handleShowKeyboardHelp);
      document.removeEventListener('createNewTask', handleCreateNewTask);
      document.removeEventListener('escapePressed', handleEscapePressed);
      
      // Clean up the navigate function
      delete window.routerNavigate;
    };
  }, [navigate]);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleSaveContent = (content) => {
    console.log('Saved content:', content);
    // Implement save logic here
  };

  const handleTaskSelect = (task) => {
    console.log('Selected task:', task);
    // Implement task selection logic
  };

  const handleDependencyAdd = (taskId, dependencyId) => {
    console.log('Adding dependency:', taskId, 'depends on', dependencyId);
    // Implement dependency addition logic
  };

  const handleDependencyRemove = (taskId, dependencyId) => {
    console.log('Removing dependency:', taskId, 'no longer depends on', dependencyId);
    // Implement dependency removal logic
  };

  // Task modal handlers
  const handleOpenCreateTask = () => {
    // Navigate to task creation page instead of opening modal
    navigate('/tasks/new');
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = async (taskData, isEditMode) => {
    try {
      if (isEditMode) {
        // Update existing task
        console.log('Updating task:', taskData);
        // TODO: Implement task update logic
      } else {
        // Create new task
        console.log('Creating new task:', taskData);
        // TODO: Implement task creation logic
      }
      
      // Close modal on success
      handleCloseTaskModal();
      
      // Show success notification
      // TODO: Implement notification system
      
    } catch (error) {
      console.error('Error saving task:', error);
      // Error will be handled by the modal component
      throw error;
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      console.log('Deleting task:', taskId);
      // TODO: Implement task deletion logic
      
      // Close modal on success
      handleCloseTaskModal();
      
      // Show success notification
      // TODO: Implement notification system
      
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <TopAppBar onMenuClick={handleDrawerToggle} onCreateTask={handleOpenCreateTask} />
      <Sidebar open={sidebarOpen} onClose={handleDrawerToggle} />
      <Box
        component="main"
        role="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${240}px)` },
          mt: '64px', // Height of the AppBar
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          '&:focus': {
            outline: 'none'
          }
        }}
      >
        <Routes>
          <Route 
            path="/" 
            element={
              <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
                <Dashboard />
              </Suspense>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Task Board" />}>
                <TaskBoard onEditTask={handleOpenEditTask} />
              </Suspense>
            } 
          />
          <Route 
            path="/tasks/new" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Task Creation" />}>
                <TaskCreation />
              </Suspense>
            } 
          />
          <Route 
            path="/prd" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="PRD Management" />}>
                <Box>
                  <Suspense fallback={<LoadingSpinner message="Loading PRD Upload..." />}>
                    <PRDUpload onFileSelect={handleFileSelect} />
                  </Suspense>
                  <Suspense fallback={<LoadingSpinner message="Loading PRD Preview..." />}>
                    <PRDPreview file={selectedFile} />
                  </Suspense>
                  <Suspense fallback={<LoadingSpinner message="Loading PRD Editor..." />}>
                    <PRDEditor file={selectedFile} onSave={handleSaveContent} />
                  </Suspense>
                </Box>
              </Suspense>
            } 
          />
          <Route 
            path="/sprints" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Sprint Planning" />}>
                <SprintPlanning />
              </Suspense>
            } 
          />
          <Route 
            path="/dependencies" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Dependency Graph" />}>
                <DependencyGraph 
                  tasks={mockTasks}
                  onTaskSelect={handleTaskSelect}
                  onDependencyAdd={handleDependencyAdd}
                  onDependencyRemove={handleDependencyRemove}
                  height={600}
                  showStatusIndicators={true}
                  showNavigationControls={true}
                  showManagementPanel={true}
                  showFilters={true}
                  showExport={true}
                />
              </Suspense>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Settings" />}>
                <Settings />
              </Suspense>
            } 
          />
          <Route 
            path="/performance" 
            element={
              <Suspense fallback={<FeatureLoadingSpinner feature="Performance Dashboard" />}>
                <PerformanceDashboard />
              </Suspense>
            } 
          />
        </Routes>
      </Box>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutHelp
        isOpen={showKeyboardHelp}
        onClose={closeHelp}
      />

      {/* Task Creation/Edit Modal */}
      <Suspense fallback={<Box />}>
        <TaskModal
          open={taskModalOpen}
          onClose={handleCloseTaskModal}
          onSubmit={handleTaskSubmit}
          onDelete={handleTaskDelete}
          task={editingTask}
          allTasks={mockTasks}
        />
      </Suspense>
    </Box>
  );
}

function App() {
  // Validate environment in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Dynamic import to avoid Jest issues
      import('./config/production.js').then(({ validateEnvironment }) => {
        try {
          validateEnvironment();
        } catch (error) {
          console.error('Environment validation failed:', error);
        }
      }).catch(() => {
        // Ignore errors in Jest/testing
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div data-testid="app-ready">
          <AppContent />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
