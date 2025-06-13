import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Schedule as QueueIcon
} from '@mui/icons-material';

// Import our offline components and services
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useAutosave } from '../hooks/useAutosave';
import OfflineBanner, { CompactOfflineBanner, OfflineStatusIndicator } from './OfflineBanner';
import AutosaveIndicator, { AutosaveStatusBadge } from './AutosaveIndicator';
import offlineTaskService from '../api/taskServiceOffline';
import offlineService from '../services/offlineService';

/**
 * OfflineDemo Component
 * Demonstrates the complete offline functionality system
 */
export default function OfflineDemo() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [demoData, setDemoData] = useState({
    name: 'Demo Project',
    description: 'Testing offline functionality...'
  });
  const [forceOffline, setForceOffline] = useState(false);

  // Use our offline status hook
  const offlineStatus = useOfflineStatus({
    checkInterval: 5000,
    onOnline: () => {
      console.log('Back online! Syncing data...');
      loadTasks();
    },
    onOffline: () => {
      console.log('Gone offline! Using cached data...');
    }
  });

  // Use autosave for demo data
  const autosave = useAutosave({
    data: demoData,
    onSave: async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Demo data saved:', data);
      return { success: true };
    },
    delay: 2000,
    enabled: true
  });

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Update offline service based on force offline toggle
  useEffect(() => {
    if (forceOffline) {
      offlineService.isOnline = false;
    } else {
      offlineService.isOnline = navigator.onLine;
    }
  }, [forceOffline]);

  const loadTasks = async () => {
    try {
      const taskList = await offlineTaskService.getTasks();
      setTasks(taskList);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const newTask = await offlineTaskService.createTask({
        title: newTaskTitle,
        description: 'Created via offline demo',
        status: 'pending',
        priority: 'medium'
      });

      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const updatedTask = await offlineTaskService.updateTask(taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await offlineTaskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getOfflineServiceStatus = () => {
    return offlineService.getStatus();
  };

  const getCacheStatus = () => {
    return offlineTaskService.getCacheStatus();
  };

  const clearCache = () => {
    offlineTaskService.clearCache();
    setTasks([]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Offline Banner Demo */}
      <OfflineBanner
        position="top"
        showOnlineMessage={true}
        showQueueInfo={true}
      />

      {/* Header */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Offline Functionality Demo
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <OfflineStatusIndicator />
            <CompactOfflineBanner onClick={() => console.log('Offline banner clicked')} />
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Demo Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demo Controls
              </Typography>
              
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={forceOffline}
                      onChange={(e) => setForceOffline(e.target.checked)}
                    />
                  }
                  label="Force Offline Mode"
                />
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadTasks}
                  fullWidth
                >
                  Reload Tasks
                </Button>
                
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={clearCache}
                  fullWidth
                >
                  Clear Cache
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              
              <Stack spacing={1}>
                <Chip
                  icon={offlineStatus.isOnline ? <OnlineIcon /> : <OfflineIcon />}
                  label={offlineStatus.isOnline ? 'Online' : 'Offline'}
                  color={offlineStatus.isOnline ? 'success' : 'warning'}
                  variant="outlined"
                />
                
                {offlineStatus.isOffline && offlineStatus.offlineDurationFormatted && (
                  <Typography variant="body2" color="text.secondary">
                    Offline for: {offlineStatus.offlineDurationFormatted}
                  </Typography>
                )}
                
                {offlineStatus.connectionType && (
                  <Typography variant="body2" color="text.secondary">
                    Connection: {offlineStatus.connectionType.type}
                    {offlineStatus.connectionType.downlink && 
                      ` (${offlineStatus.connectionType.downlink} Mbps)`
                    }
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Queue Status */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Queue Status
              </Typography>
              
              {(() => {
                const status = getOfflineServiceStatus();
                const cache = getCacheStatus();
                
                return (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Queued requests: {status.queueStatus.total}
                    </Typography>
                    <Typography variant="body2">
                      Cached items: {cache.cachedItems}
                    </Typography>
                    <Typography variant="body2">
                      Pending changes: {cache.pendingChanges}
                    </Typography>
                  </Stack>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        {/* Autosave Demo */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Autosave Demo
                </Typography>
                <AutosaveIndicator
                  saveStatus={autosave.status}
                  lastSaved={autosave.lastSavedTime}
                  hasUnsavedChanges={autosave.hasUnsavedChanges}
                  isSaving={autosave.isSaving}
                  variant="chip"
                />
              </Stack>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Project Name"
                    value={demoData.name}
                    onChange={(e) => setDemoData(prev => ({ ...prev, name: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={autosave.saveNow}
                      disabled={autosave.isSaving}
                      startIcon={<SaveIcon />}
                    >
                      Save Now
                    </Button>
                    <AutosaveStatusBadge
                      hasUnsavedChanges={autosave.hasUnsavedChanges}
                      isSaving={autosave.isSaving}
                    />
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Project Description"
                    value={demoData.description}
                    onChange={(e) => setDemoData(prev => ({ ...prev, description: e.target.value }))}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Task Management Demo */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Management (with Offline Support)
              </Typography>
              
              {/* Add new task */}
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  label="New Task Title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  size="small"
                  fullWidth
                  onKeyPress={(e) => e.key === 'Enter' && createTask()}
                />
                <Button
                  variant="contained"
                  onClick={createTask}
                  startIcon={<AddIcon />}
                  disabled={!newTaskTitle.trim()}
                >
                  Add
                </Button>
              </Stack>

              {/* Task list */}
              <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List>
                  {tasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography>
                                {editingTask?.id === task.id ? (
                                  <TextField
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask(prev => ({
                                      ...prev,
                                      title: e.target.value
                                    }))}
                                    size="small"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateTask(task.id, { title: editingTask.title });
                                      }
                                    }}
                                  />
                                ) : (
                                  task.title
                                )}
                              </Typography>
                              {task._isOptimistic && (
                                <Chip
                                  label="Pending sync"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption">
                                Status: {task.status}
                              </Typography>
                              <Typography variant="caption">
                                Priority: {task.priority}
                              </Typography>
                              {task.updatedAt && (
                                <Typography variant="caption">
                                  Updated: {new Date(task.updatedAt).toLocaleTimeString()}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <Stack direction="row">
                          <IconButton
                            size="small"
                            onClick={() => setEditingTask(editingTask?.id === task.id ? null : task)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteTask(task.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </ListItem>
                      {index < tasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {tasks.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No tasks yet"
                        secondary="Add a task above to get started"
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>

              {offlineStatus.isOffline && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You're working offline. Changes will be saved locally and synced when you're back online.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 