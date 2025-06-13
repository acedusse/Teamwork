import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  Warning,
  CheckCircle,
  Link,
  LinkOff,
  AccountTree
} from '@mui/icons-material';

/**
 * DependencyManagementPanel provides an interface for managing task dependencies
 * with validation to prevent circular dependencies.
 *
 * Props:
 *   tasks: Array of task objects
 *   selectedTask: Currently selected task object
 *   onDependencyAdd: Function called when adding a dependency (taskId, dependencyId)
 *   onDependencyRemove: Function called when removing a dependency (taskId, dependencyId)
 *   onValidationError: Function called when validation fails
 */
export default function DependencyManagementPanel({
  tasks = [],
  selectedTask,
  onDependencyAdd,
  onDependencyRemove,
  onValidationError
}) {
  const [newDependencyId, setNewDependencyId] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dependencyPath, setDependencyPath] = useState([]);

  // Get available tasks for dependency selection (excluding current task and its dependents)
  const getAvailableDependencies = () => {
    if (!selectedTask || !tasks) return [];
    
    const currentTaskId = selectedTask.id?.toString();
    const existingDependencies = selectedTask.dependencies || [];
    
    // Find all tasks that depend on the current task (direct and indirect)
    const getDependents = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return [];
      visited.add(taskId);
      
      const directDependents = tasks.filter(task => 
        task.dependencies && task.dependencies.includes(taskId)
      );
      
      let allDependents = [...directDependents];
      directDependents.forEach(dependent => {
        allDependents = [
          ...allDependents,
          ...getDependents(dependent.id?.toString(), visited)
        ];
      });
      
      return allDependents;
    };
    
    const dependents = getDependents(currentTaskId);
    const dependentIds = dependents.map(task => task.id?.toString());
    
    return tasks.filter(task => {
      const taskId = task.id?.toString();
      return (
        taskId !== currentTaskId && // Not the current task
        !existingDependencies.includes(taskId) && // Not already a dependency
        !dependentIds.includes(taskId) // Not a dependent (would create cycle)
      );
    });
  };

  // Validate dependencies for circular references
  const validateDependencies = (taskId, newDepId, allTasks = tasks) => {
    const errors = [];
    
    // Check for direct circular dependency
    const newDependency = allTasks.find(t => t.id?.toString() === newDepId);
    if (newDependency && newDependency.dependencies?.includes(taskId)) {
      errors.push(`Circular dependency detected: Task ${newDepId} already depends on Task ${taskId}`);
    }
    
    // Check for indirect circular dependency using DFS
    const visited = new Set();
    const recursionStack = new Set();
    
    const hasCycle = (currentId, targetId) => {
      if (recursionStack.has(currentId)) return true;
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      recursionStack.add(currentId);
      
      const currentTask = allTasks.find(t => t.id?.toString() === currentId);
      if (currentTask && currentTask.dependencies) {
        for (const depId of currentTask.dependencies) {
          if (depId === targetId || hasCycle(depId, targetId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(currentId);
      return false;
    };
    
    if (hasCycle(newDepId, taskId)) {
      errors.push(`Indirect circular dependency detected through dependency chain`);
    }
    
    return errors;
  };

  // Find dependency path between two tasks
  const findDependencyPath = (fromId, toId, allTasks = tasks, path = []) => {
    if (fromId === toId) return [...path, fromId];
    if (path.includes(fromId)) return null; // Cycle detected
    
    const fromTask = allTasks.find(t => t.id?.toString() === fromId);
    if (!fromTask || !fromTask.dependencies) return null;
    
    for (const depId of fromTask.dependencies) {
      const result = findDependencyPath(depId, toId, allTasks, [...path, fromId]);
      if (result) return result;
    }
    
    return null;
  };

  // Handle adding a new dependency
  const handleAddDependency = () => {
    if (!selectedTask || !newDependencyId) return;
    
    const taskId = selectedTask.id?.toString();
    const errors = validateDependencies(taskId, newDependencyId);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      if (onValidationError) {
        onValidationError(errors);
      }
      return;
    }
    
    // Clear any previous errors
    setValidationErrors([]);
    
    // Call the add dependency callback
    if (onDependencyAdd) {
      onDependencyAdd(taskId, newDependencyId);
    }
    
    setNewDependencyId('');
    setShowAddDialog(false);
  };

  // Handle removing a dependency
  const handleRemoveDependency = (dependencyId) => {
    if (!selectedTask) return;
    
    const taskId = selectedTask.id?.toString();
    if (onDependencyRemove) {
      onDependencyRemove(taskId, dependencyId);
    }
  };

  // Get task by ID
  const getTaskById = (id) => {
    return tasks.find(task => task.id?.toString() === id?.toString());
  };

  // Clear errors when selected task changes
  useEffect(() => {
    setValidationErrors([]);
    setNewDependencyId('');
  }, [selectedTask]);

  if (!selectedTask) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box>
          <AccountTree sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a task to manage its dependencies
          </Typography>
        </Box>
      </Paper>
    );
  }

  const availableDependencies = getAvailableDependencies();
  const currentDependencies = selectedTask.dependencies || [];

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Link sx={{ mr: 1 }} />
        <Typography variant="h6">
          Dependency Management
        </Typography>
      </Box>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Task: {selectedTask.title} (ID: {selectedTask.id})
      </Typography>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Dependency Validation Errors:
          </Typography>
          {validationErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              • {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Current Dependencies */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Current Dependencies ({currentDependencies.length})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowAddDialog(true)}
            disabled={availableDependencies.length === 0}
          >
            Add Dependency
          </Button>
        </Box>

        {currentDependencies.length === 0 ? (
          <Box sx={{ 
            p: 2, 
            border: '2px dashed', 
            borderColor: 'divider', 
            borderRadius: 1, 
            textAlign: 'center',
            bgcolor: 'action.hover'
          }}>
            <Typography variant="body2" color="text.secondary">
              No dependencies defined for this task
            </Typography>
          </Box>
        ) : (
          <List dense>
            {currentDependencies.map((depId) => {
              const depTask = getTaskById(depId);
              return (
                <ListItem key={depId} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {depTask ? depTask.title : `Task ${depId}`}
                        </Typography>
                        <Chip 
                          label={depTask?.status || 'unknown'} 
                          size="small" 
                          color={depTask?.status === 'done' ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={`ID: ${depId}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove dependency">
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveDependency(depId)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Add Dependency Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Dependency</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a task that must be completed before "{selectedTask.title}" can start.
          </Typography>
          
          {availableDependencies.length === 0 ? (
            <Alert severity="info">
              No available tasks to add as dependencies. This may be because all eligible tasks are already dependencies, 
              or adding them would create circular dependencies.
            </Alert>
          ) : (
            <Autocomplete
              options={availableDependencies}
              getOptionLabel={(option) => `${option.title} (ID: ${option.id})`}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{option.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.id} • Status: {option.status}
                      </Typography>
                    </Box>
                    <Chip 
                      label={option.status} 
                      size="small" 
                      color={option.status === 'done' ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
              )}
              value={availableDependencies.find(task => task.id?.toString() === newDependencyId) || null}
              onChange={(event, newValue) => {
                setNewDependencyId(newValue ? newValue.id?.toString() : '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Task"
                  placeholder="Choose a task to add as dependency"
                  fullWidth
                />
              )}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddDependency}
            variant="contained"
            disabled={!newDependencyId}
          >
            Add Dependency
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dependency Information */}
      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Dependency Rules:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="• Dependencies must be completed before this task can start"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Circular dependencies are automatically prevented"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="• Tasks cannot depend on their own dependents"
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
} 