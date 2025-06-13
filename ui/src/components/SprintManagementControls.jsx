import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Warning as WarningIcon,
  Assignment as TaskIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

export default function SprintManagementControls({ 
  sprint, 
  tasks = [], 
  onStatusChange, 
  disabled = false 
}) {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null,
    title: '',
    message: '',
    severity: 'info'
  });

  // Get tasks assigned to this sprint
  const sprintTasks = tasks.filter(task => task.sprintId === sprint.id);
  const completedTasks = sprintTasks.filter(task => task.status === 'done' || task.status === 'completed');
  const pendingTasks = sprintTasks.filter(task => task.status !== 'done' && task.status !== 'completed');
  const completionPercentage = sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0;

  const handleAction = (action) => {
    let title, message, severity;
    
    switch (action) {
      case 'start':
        title = 'Start Sprint';
        message = `Are you sure you want to start "${sprint.name}"? This will mark the sprint as active and begin tracking progress.`;
        severity = 'info';
        break;
      case 'pause':
        title = 'Pause Sprint';
        message = `Are you sure you want to pause "${sprint.name}"? This will temporarily halt sprint progress tracking.`;
        severity = 'warning';
        break;
      case 'complete':
        title = 'Complete Sprint';
        message = pendingTasks.length > 0
          ? `Warning: "${sprint.name}" still has ${pendingTasks.length} incomplete task(s). Are you sure you want to complete this sprint?`
          : `Are you sure you want to complete "${sprint.name}"? This action cannot be undone.`;
        severity = pendingTasks.length > 0 ? 'warning' : 'info';
        break;
      default:
        return;
    }

    setConfirmDialog({
      open: true,
      action,
      title,
      message,
      severity
    });
  };

  const handleConfirm = () => {
    const { action } = confirmDialog;
    let newStatus;

    switch (action) {
      case 'start':
        newStatus = 'active';
        break;
      case 'pause':
        newStatus = 'paused';
        break;
      case 'complete':
        newStatus = 'completed';
        break;
      default:
        return;
    }

    onStatusChange(sprint.id, newStatus);
    setConfirmDialog({ open: false, action: null, title: '', message: '', severity: 'info' });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, action: null, title: '', message: '', severity: 'info' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'active':
        return 'primary';
      case 'paused':
        return 'warning';
      case 'planned':
        return 'default';
      default:
        return 'default';
    }
  };

  const canStart = sprint.status === 'planned' || sprint.status === 'paused';
  const canPause = sprint.status === 'active';
  const canComplete = sprint.status === 'active' || sprint.status === 'paused';

  return (
    <Box>
      {/* Current Status and Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            Sprint Status:
          </Typography>
          <Chip
            label={sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
            color={getStatusColor(sprint.status)}
            variant="filled"
            size="medium"
          />
        </Box>

        {sprintTasks.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TaskIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Progress: {completedTasks.length} of {sprintTasks.length} tasks completed ({Math.round(completionPercentage)}%)
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{ height: 8, borderRadius: 1, mb: 2 }}
            />
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="success"
          startIcon={<StartIcon />}
          onClick={() => handleAction('start')}
          disabled={disabled || !canStart}
          size="large"
        >
          {sprint.status === 'paused' ? 'Resume Sprint' : 'Start Sprint'}
        </Button>

        <Button
          variant="outlined"
          color="warning"
          startIcon={<PauseIcon />}
          onClick={() => handleAction('pause')}
          disabled={disabled || !canPause}
          size="large"
        >
          Pause Sprint
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<CompleteIcon />}
          onClick={() => handleAction('complete')}
          disabled={disabled || !canComplete}
          size="large"
        >
          Complete Sprint
        </Button>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          {confirmDialog.severity === 'warning' && (
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
          )}
          {confirmDialog.severity === 'error' && (
            <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
          )}
          {confirmDialog.title}
        </DialogTitle>
        
        <DialogContent>
          <Alert severity={confirmDialog.severity} sx={{ mb: 2 }}>
            {confirmDialog.message}
          </Alert>

          {/* Show pending tasks for completion warning */}
          {confirmDialog.action === 'complete' && pendingTasks.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Incomplete Tasks:
              </Typography>
              <List dense>
                {pendingTasks.slice(0, 5).map((task) => (
                  <ListItem key={task.id} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <TaskIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={`Priority: ${task.priority}, Status: ${task.status}`}
                    />
                  </ListItem>
                ))}
                {pendingTasks.length > 5 && (
                  <ListItem sx={{ pl: 0 }}>
                    <ListItemText
                      primary={`... and ${pendingTasks.length - 5} more tasks`}
                      sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          {/* Sprint summary for completion */}
          {confirmDialog.action === 'complete' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sprint Summary:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Duration: {Math.ceil((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24))} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Total Tasks: {sprintTasks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Completed: {completedTasks.length} ({Math.round(completionPercentage)}%)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Remaining: {pendingTasks.length}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={confirmDialog.severity === 'warning' ? 'warning' : 'primary'}
            autoFocus
          >
            {confirmDialog.action === 'complete' ? 'Complete Sprint' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 