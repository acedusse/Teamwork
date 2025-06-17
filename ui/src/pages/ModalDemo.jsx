import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Code as CodeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  BaseModal,
  ConfirmationModal,
  ErrorModal,
  LoadingModal,
  TaskFormModal,
  SubtaskFormModal
} from '../components/modals';

/**
 * ModalDemo - Comprehensive demo page for all modal components
 * 
 * Features:
 * - Interactive examples of all modal types
 * - Code snippets for each modal
 * - Different configurations and use cases
 * - Real-world scenarios
 */
const ModalDemo = () => {
  // Modal states
  const [modals, setModals] = useState({
    base: false,
    confirmation: false,
    confirmationDanger: false,
    error: false,
    errorNetwork: false,
    errorValidation: false,
    loading: false,
    loadingProgress: false,
    taskForm: false,
    taskFormEdit: false,
    subtaskForm: false
  });

  // Demo data
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [taskFormData, setTaskFormData] = useState(null);
  const [subtaskFormData, setSubtaskFormData] = useState(null);

  // Sample task data for editing
  const sampleTask = {
    id: '1',
    title: 'Implement User Authentication',
    description: 'Create a secure authentication system with JWT tokens',
    status: 'pending',
    priority: 'high',
    dependencies: ['2', '3'],
    details: 'Use bcrypt for password hashing and implement refresh tokens',
    testStrategy: 'Unit tests for auth functions, integration tests for login flow'
  };

  const sampleSubtask = {
    id: '1.1',
    title: 'Set up JWT middleware',
    description: 'Create middleware to validate JWT tokens',
    status: 'pending',
    dependencies: ['1.2']
  };

  // Modal handlers
  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Simulate loading progress
  const simulateProgress = () => {
    openModal('loadingProgress');
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          closeModal('loadingProgress');
          return 0;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Handle form submissions
  const handleTaskFormSubmit = (data) => {
    setTaskFormData(data);
    closeModal('taskForm');
    closeModal('taskFormEdit');
    console.log('Task form submitted:', data);
  };

  const handleSubtaskFormSubmit = (data) => {
    setSubtaskFormData(data);
    closeModal('subtaskForm');
    console.log('Subtask form submitted:', data);
  };

  // Demo configurations
  const demoConfigs = [
    {
      title: 'Base Modal',
      description: 'Basic modal with custom content and actions',
      category: 'Core',
      modalKey: 'base',
      code: `<BaseModal
  open={open}
  onClose={onClose}
  title="Custom Modal"
  actions={<Button onClick={onClose}>Close</Button>}
>
  <Typography>Your custom content here</Typography>
</BaseModal>`
    },
    {
      title: 'Confirmation Modal',
      description: 'Standard confirmation dialog with customizable actions',
      category: 'Action',
      modalKey: 'confirmation',
      code: `<ConfirmationModal
  open={open}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Confirm Action"
  message="Are you sure you want to proceed?"
/>`
    },
    {
      title: 'Danger Confirmation',
      description: 'High-risk confirmation with destructive styling',
      category: 'Action',
      modalKey: 'confirmationDanger',
      code: `<ConfirmationModal
  open={open}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Task"
  message="This action cannot be undone."
  variant="danger"
  confirmText="Delete"
/>`
    },
    {
      title: 'Error Modal',
      description: 'Error display with detailed information and retry options',
      category: 'Feedback',
      modalKey: 'error',
      code: `<ErrorModal
  open={open}
  onClose={onClose}
  onRetry={handleRetry}
  error={new Error("Something went wrong")}
  type="error"
  showRetry={true}
/>`
    },
    {
      title: 'Network Error',
      description: 'Network-specific error with troubleshooting tips',
      category: 'Feedback',
      modalKey: 'errorNetwork',
      code: `<ErrorModal
  open={open}
  onClose={onClose}
  error={{ message: "Failed to connect to server", code: 500 }}
  type="network"
  showRetry={true}
/>`
    },
    {
      title: 'Validation Error',
      description: 'Form validation error with helpful guidance',
      category: 'Feedback',
      modalKey: 'errorValidation',
      code: `<ErrorModal
  open={open}
  onClose={onClose}
  error="Please fill in all required fields"
  type="validation"
  showRetry={false}
/>`
    },
    {
      title: 'Loading Modal',
      description: 'Indeterminate loading with cancel option',
      category: 'Progress',
      modalKey: 'loading',
      code: `<LoadingModal
  open={open}
  onCancel={onCancel}
  title="Processing..."
  message="Please wait while we save your changes"
  showCancel={true}
/>`
    },
    {
      title: 'Progress Loading',
      description: 'Determinate progress with percentage display',
      category: 'Progress',
      modalKey: 'loadingProgress',
      code: `<LoadingModal
  open={open}
  title="Uploading Files"
  progress={progress}
  variant="determinate"
  progressType="linear"
  estimatedTime={30}
/>`
    },
    {
      title: 'Task Form Modal',
      description: 'Complete task creation and editing form',
      category: 'Forms',
      modalKey: 'taskForm',
      code: `<TaskFormModal
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Create New Task"
  availableTasks={tasks}
/>`
    },
    {
      title: 'Edit Task Form',
      description: 'Task form pre-populated with existing data',
      category: 'Forms',
      modalKey: 'taskFormEdit',
      code: `<TaskFormModal
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Edit Task"
  initialData={taskData}
  availableTasks={tasks}
/>`
    },
    {
      title: 'Subtask Form Modal',
      description: 'Simplified form for creating subtasks',
      category: 'Forms',
      modalKey: 'subtaskForm',
      code: `<SubtaskFormModal
  open={open}
  onClose={onClose}
  onSubmit={handleSubmit}
  parentTaskId="1"
  availableSubtasks={subtasks}
/>`
    }
  ];

  // Group configs by category
  const groupedConfigs = demoConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {});

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Modal Components Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Interactive showcase of all modal components with code examples
        </Typography>
        
        {/* Results Display */}
        {(taskFormData || subtaskFormData) && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Form Submission Results:
            </Typography>
            {taskFormData && (
              <pre style={{ fontSize: '0.8rem', margin: '8px 0' }}>
                Task: {JSON.stringify(taskFormData, null, 2)}
              </pre>
            )}
            {subtaskFormData && (
              <pre style={{ fontSize: '0.8rem', margin: '8px 0' }}>
                Subtask: {JSON.stringify(subtaskFormData, null, 2)}
              </pre>
            )}
          </Alert>
        )}
      </Box>

      {/* Demo Grid */}
      {Object.entries(groupedConfigs).map(([category, configs]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            {category} Modals
          </Typography>
          
          <Grid container spacing={3}>
            {configs.map((config) => (
              <Grid item xs={12} md={6} lg={4} key={config.modalKey}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {config.title}
                      </Typography>
                      <Chip 
                        label={config.category} 
                        size="small" 
                        sx={{ ml: 'auto' }}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {config.description}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Code Example:
                      </Typography>
                      <pre style={{
                        fontSize: '0.7rem',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {config.code}
                      </pre>
                    </Paper>
                  </CardContent>

                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => {
                        if (config.modalKey === 'loadingProgress') {
                          simulateProgress();
                        } else {
                          openModal(config.modalKey);
                        }
                      }}
                      fullWidth
                    >
                      Try It
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* Modal Components */}
      
      {/* Base Modal */}
      <BaseModal
        open={modals.base}
        onClose={() => closeModal('base')}
        title="Custom Base Modal"
        actions={
          <>
            <Button onClick={() => closeModal('base')} variant="outlined">
              Cancel
            </Button>
            <Button onClick={() => closeModal('base')} variant="contained">
              Save
            </Button>
          </>
        }
      >
        <Box sx={{ py: 2 }}>
          <Typography paragraph>
            This is a custom base modal with your own content and actions.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can put any React components here - forms, lists, images, etc.
          </Typography>
        </Box>
      </BaseModal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={modals.confirmation}
        onClose={() => closeModal('confirmation')}
        onConfirm={() => {
          console.log('Confirmed!');
          closeModal('confirmation');
        }}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action?"
      />

      {/* Danger Confirmation Modal */}
      <ConfirmationModal
        open={modals.confirmationDanger}
        onClose={() => closeModal('confirmationDanger')}
        onConfirm={() => {
          console.log('Deleted!');
          closeModal('confirmationDanger');
        }}
        title="Delete Task"
        message="This will permanently delete the task and all its subtasks. This action cannot be undone."
        variant="danger"
        confirmText="Delete Forever"
        icon="delete"
      />

      {/* Error Modal */}
      <ErrorModal
        open={modals.error}
        onClose={() => closeModal('error')}
        onRetry={() => {
          console.log('Retrying...');
          closeModal('error');
        }}
        error={new Error('Something went wrong while processing your request')}
        type="error"
        showRetry={true}
        showReport={true}
        onReport={(error, errorInfo) => {
          console.log('Reporting error:', error, errorInfo);
        }}
      />

      {/* Network Error Modal */}
      <ErrorModal
        open={modals.errorNetwork}
        onClose={() => closeModal('errorNetwork')}
        onRetry={() => {
          console.log('Retrying network request...');
          closeModal('errorNetwork');
        }}
        error={{
          message: 'Failed to connect to the server',
          code: 500,
          details: 'The server is currently unavailable. Please try again later.'
        }}
        type="network"
        showRetry={true}
      />

      {/* Validation Error Modal */}
      <ErrorModal
        open={modals.errorValidation}
        onClose={() => closeModal('errorValidation')}
        error="Please fill in all required fields: Title, Description, and Priority are required."
        type="validation"
        showRetry={false}
      />

      {/* Loading Modal */}
      <LoadingModal
        open={modals.loading}
        onCancel={() => closeModal('loading')}
        title="Processing Request"
        message="Please wait while we save your changes to the server..."
        showCancel={true}
        progressType="circular"
      />

      {/* Progress Loading Modal */}
      <LoadingModal
        open={modals.loadingProgress}
        title="Uploading Files"
        message="Uploading your files to the server..."
        progress={loadingProgress}
        variant="determinate"
        progressType="linear"
        estimatedTime={Math.max(0, (100 - loadingProgress) * 0.5)}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        open={modals.taskForm}
        onClose={() => closeModal('taskForm')}
        onSubmit={handleTaskFormSubmit}
        title="Create New Task"
        availableTasks={[
          { id: '2', title: 'Setup Database' },
          { id: '3', title: 'Create API Endpoints' },
          { id: '4', title: 'Design UI Components' }
        ]}
      />

      {/* Edit Task Form Modal */}
      <TaskFormModal
        open={modals.taskFormEdit}
        onClose={() => closeModal('taskFormEdit')}
        onSubmit={handleTaskFormSubmit}
        title="Edit Task"
        initialData={sampleTask}
        availableTasks={[
          { id: '2', title: 'Setup Database' },
          { id: '3', title: 'Create API Endpoints' },
          { id: '4', title: 'Design UI Components' }
        ]}
      />

      {/* Subtask Form Modal */}
      <SubtaskFormModal
        open={modals.subtaskForm}
        onClose={() => closeModal('subtaskForm')}
        onSubmit={handleSubtaskFormSubmit}
        parentTaskId="1"
        parentTaskTitle="Implement User Authentication"
        availableSubtasks={[
          { id: '1.2', title: 'Create user model' },
          { id: '1.3', title: 'Setup password hashing' }
        ]}
      />
    </Container>
  );
};

export default ModalDemo; 