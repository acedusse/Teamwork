import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  Cloud as OnlineIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import TaskCreationForm from './TaskCreationForm';
import offlineService from '../services/offlineService';
import autosaveService from '../services/autosaveService';

const OfflineTaskCreationDemo = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ count: 0, requests: [] });
  const [draftCount, setDraftCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Update queue status
  const updateQueueStatus = () => {
    const status = offlineService.getQueueStatus();
    setQueueStatus(status);
  };

  // Update draft count
  const updateDraftCount = () => {
    const contexts = autosaveService.getAllStoredContexts();
    setDraftCount(contexts.length);
  };

  // Simulate offline/online toggle
  const toggleOfflineMode = () => {
    const newOfflineState = !isOffline;
    setIsOffline(newOfflineState);
    
    // Simulate browser events
    if (newOfflineState) {
      window.dispatchEvent(new Event('offline'));
    } else {
      window.dispatchEvent(new Event('online'));
    }
  };

  // Clear all drafts
  const clearAllDrafts = () => {
    autosaveService.clearAllData();
    updateDraftCount();
  };

  // Clear queue
  const clearQueue = () => {
    offlineService.clearQueue();
    updateQueueStatus();
  };

  // Mock task submission
  const handleTaskSubmit = async (taskData) => {
    console.log('Demo: Task submitted:', taskData);
    
    if (isOffline) {
      // Simulate offline behavior
      throw new Error('Network unavailable - task queued for sync');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `demo-${Date.now()}`,
      ...taskData,
      createdAt: new Date().toISOString()
    };
  };

  useEffect(() => {
    // Update status periodically
    const interval = setInterval(() => {
      updateQueueStatus();
      updateDraftCount();
    }, 1000);

    // Initial update
    updateQueueStatus();
    updateDraftCount();

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Offline Task Creation Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This demo showcases the offline support and draft persistence features implemented in Task 13.10.
        Toggle offline mode to test how the task creation form handles offline scenarios.
      </Typography>

      {/* Demo Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demo Controls
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isOffline}
                onChange={toggleOfflineMode}
                color="warning"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOffline ? <OfflineIcon color="warning" /> : <OnlineIcon color="success" />}
                {isOffline ? 'Offline Mode' : 'Online Mode'}
              </Box>
            }
          />
          
          <Button
            variant="outlined"
            onClick={() => setShowForm(!showForm)}
            startIcon={<SaveIcon />}
          >
            {showForm ? 'Hide' : 'Show'} Task Creation Form
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Status Information */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip
            label={`Queued Requests: ${queueStatus.count}`}
            color={queueStatus.count > 0 ? 'warning' : 'default'}
            variant={queueStatus.count > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Draft Count: ${draftCount}`}
            color={draftCount > 0 ? 'info' : 'default'}
            variant={draftCount > 0 ? 'filled' : 'outlined'}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={clearQueue}
            disabled={queueStatus.count === 0}
          >
            Clear Queue
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={clearAllDrafts}
            disabled={draftCount === 0}
            startIcon={<RestoreIcon />}
          >
            Clear All Drafts
          </Button>
        </Stack>
      </Paper>

      {/* Current Status */}
      <Alert 
        severity={isOffline ? 'warning' : 'success'} 
        sx={{ mb: 3 }}
        icon={isOffline ? <OfflineIcon /> : <OnlineIcon />}
      >
        <Typography variant="body2">
          <strong>Current Status:</strong> {isOffline ? 'Offline' : 'Online'}
          {queueStatus.count > 0 && (
            <span> • {queueStatus.count} request(s) queued for sync</span>
          )}
          {draftCount > 0 && (
            <span> • {draftCount} draft(s) saved locally</span>
          )}
        </Typography>
      </Alert>

      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li><strong>Online Mode:</strong> Fill out the form and submit - task should be created normally</li>
            <li><strong>Offline Mode:</strong> Toggle offline mode, fill out the form and submit - task should be queued</li>
            <li><strong>Draft Persistence:</strong> Start filling the form, refresh the page - draft should be restored</li>
            <li><strong>Sync on Reconnection:</strong> Create tasks offline, then toggle back online - queued tasks should sync</li>
          </ol>
        </Typography>
      </Paper>

      {/* Task Creation Form */}
      {showForm && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Task Creation Form (Enhanced with Offline Support)
          </Typography>
          <TaskCreationForm
            onSubmit={handleTaskSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Paper>
      )}

      {/* Queue Details */}
      {queueStatus.count > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Queued Requests
          </Typography>
          {queueStatus.requests.map((request, index) => (
            <Alert key={index} severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>{request.context}</strong> - Priority: {request.priority} - 
                Attempts: {request.attempts || 0} - 
                Queued: {new Date(request.timestamp).toLocaleTimeString()}
              </Typography>
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default OfflineTaskCreationDemo; 