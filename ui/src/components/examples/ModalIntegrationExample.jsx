import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  AccountTree as DependencyIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useModalIntegration } from '../../hooks/useModalIntegration';

/**
 * ModalIntegrationExample - Demonstrates modal system integration
 * 
 * This component shows how to:
 * - Use the modal integration hook
 * - Open different types of modals
 * - Handle modal data and callbacks
 * - Integrate with application state
 * - Use convenience methods for common operations
 */
const ModalIntegrationExample = () => {
  const {
    // Modal actions
    createTask,
    editTask,
    viewTask,
    configureAgent,
    manageSession,
    manageDependencies,
    confirmAction,
    confirmDelete,
    showError,
    showLoading,
    showSuccess,
    showInfo,
    
    // State
    isAnyModalOpen,
    openModalCount,
    currentModal,
    modalInteractions,
    
    // Utilities
    closeAllModals,
    getPerformanceMetrics,
    createModalLink
  } = useModalIntegration();

  // Example data
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Implement User Authentication',
      description: 'Create secure login system with JWT tokens',
      status: 'pending',
      priority: 'high',
      assignee: 'John Doe',
      dueDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Design Dashboard UI',
      description: 'Create responsive dashboard with charts and widgets',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'Jane Smith',
      dueDate: '2024-01-20'
    },
    {
      id: '3',
      title: 'Setup Database Schema',
      description: 'Design and implement database tables',
      status: 'done',
      priority: 'high',
      assignee: 'Bob Johnson',
      dueDate: '2024-01-10'
    }
  ]);

  const [agents] = useState([
    { id: '1', name: 'Development Assistant', type: 'coding', status: 'active' },
    { id: '2', name: 'Testing Agent', type: 'qa', status: 'active' },
    { id: '3', name: 'Documentation Helper', type: 'docs', status: 'inactive' }
  ]);

  const [sessions] = useState([
    { id: '1', name: 'Sprint Planning Session', participants: 5, status: 'active' },
    { id: '2', name: 'Code Review Meeting', participants: 3, status: 'scheduled' }
  ]);

  // Example handlers
  const handleCreateTask = () => {
    createTask({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending'
    });
  };

  const handleEditTask = (task) => {
    editTask(task);
  };

  const handleViewTask = (task) => {
    viewTask(task);
  };

  const handleDeleteTask = async (task) => {
    const confirmed = await confirmDelete(task.title);
    if (confirmed) {
      setTasks(prev => prev.filter(t => t.id !== task.id));
      showSuccess(`Task "${task.title}" has been deleted successfully`);
    }
  };

  const handleConfigureAgent = (agent) => {
    configureAgent(agent);
  };

  const handleManageSession = (session) => {
    manageSession(session);
  };

  const handleManageDependencies = () => {
    manageDependencies(tasks);
  };

  const handleShowError = () => {
    showError('This is an example error message');
  };

  const handleShowLoading = () => {
    showLoading('Processing your request...');
    setTimeout(() => {
      closeAllModals();
      showSuccess('Operation completed successfully!');
    }, 3000);
  };

  const handleShowInfo = () => {
    showInfo('This is an informational message with helpful details about the current operation.');
  };

  const handleBulkAction = async () => {
    const confirmed = await confirmAction(
      'This will perform a bulk operation on all selected items. Continue?',
      {
        type: 'warning',
        confirmText: 'Continue',
        cancelText: 'Cancel'
      }
    );
    
    if (confirmed) {
      showSuccess('Bulk operation completed successfully');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Modal System Integration Example
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Modal System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Chip 
              label={`${openModalCount} Modal${openModalCount !== 1 ? 's' : ''} Open`}
              color={isAnyModalOpen ? 'primary' : 'default'}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              size="small" 
              onClick={closeAllModals}
              disabled={!isAnyModalOpen}
            >
              Close All Modals
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Task Management Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Demonstrate task-related modal operations
              </Typography>
              
              <List>
                {tasks.map((task) => (
                  <ListItem 
                    key={task.id}
                    secondaryAction={
                      <Box>
                        <Tooltip title="View Task">
                          <IconButton onClick={() => handleViewTask(task)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Task">
                          <IconButton onClick={() => handleEditTask(task)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton onClick={() => handleDeleteTask(task)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip size="small" label={task.status} />
                          <Chip size="small" label={task.priority} color="primary" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleCreateTask}
                variant="contained"
              >
                Create New Task
              </Button>
              <Button 
                startIcon={<DependencyIcon />} 
                onClick={handleManageDependencies}
              >
                Manage Dependencies
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Agent Management Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure AI agents and their capabilities
              </Typography>
              
              <List>
                {agents.map((agent) => (
                  <ListItem 
                    key={agent.id}
                    secondaryAction={
                      <Tooltip title="Configure Agent">
                        <IconButton onClick={() => handleConfigureAgent(agent)}>
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      <GroupIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={agent.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip size="small" label={agent.type} />
                          <Chip 
                            size="small" 
                            label={agent.status} 
                            color={agent.status === 'active' ? 'success' : 'default'}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<AddIcon />} 
                onClick={() => handleConfigureAgent({})}
                variant="contained"
              >
                Add New Agent
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Session Management Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Session Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage collaborative sessions and meetings
              </Typography>
              
              <List>
                {sessions.map((session) => (
                  <ListItem 
                    key={session.id}
                    secondaryAction={
                      <Tooltip title="Manage Session">
                        <IconButton onClick={() => handleManageSession(session)}>
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={session.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip size="small" label={`${session.participants} participants`} />
                          <Chip size="small" label={session.status} color="primary" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button 
                startIcon={<AddIcon />} 
                onClick={() => handleManageSession({})}
                variant="contained"
              >
                Create New Session
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Modal Examples Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modal Examples
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Test different types of modals and notifications
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth
                    startIcon={<InfoIcon />}
                    onClick={handleShowInfo}
                    variant="outlined"
                  >
                    Show Info
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth
                    startIcon={<ErrorIcon />}
                    onClick={handleShowError}
                    variant="outlined"
                    color="error"
                  >
                    Show Error
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth
                    startIcon={<PlayIcon />}
                    onClick={handleShowLoading}
                    variant="outlined"
                  >
                    Show Loading
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    fullWidth
                    startIcon={<WarningIcon />}
                    onClick={handleBulkAction}
                    variant="outlined"
                    color="warning"
                  >
                    Confirm Action
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      {Object.keys(modalInteractions).length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modal interaction data for performance analysis
          </Typography>
          <pre style={{ fontSize: '12px', marginTop: '8px' }}>
            {JSON.stringify(getPerformanceMetrics(), null, 2)}
          </pre>
        </Paper>
      )}

      {/* Deep Linking Examples */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Deep Linking Examples
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          These links demonstrate deep linking to specific modals:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            size="small" 
            href={createModalLink('task', { mode: 'create' })}
            target="_blank"
          >
            Create Task Link
          </Button>
          <Button 
            size="small" 
            href={createModalLink('agent')}
            target="_blank"
          >
            Agent Config Link
          </Button>
          <Button 
            size="small" 
            href={createModalLink('dependency')}
            target="_blank"
          >
            Dependencies Link
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ModalIntegrationExample; 