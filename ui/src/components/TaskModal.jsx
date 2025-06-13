import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Chip,
  Autocomplete,
  Stack,
  Divider,
  FormHelperText,
  Grid,
  IconButton,
  DialogContentText,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Backdrop,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  Warning as WarningIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Wifi as ConnectivityIcon,
  WifiOff as NoConnectivityIcon
} from '@mui/icons-material';

// Mock data - replace with actual data from API
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
];

const mockTags = [
  'Frontend',
  'Backend',
  'API',
  'Database',
  'Testing',
  'Documentation',
  'Bug Fix',
  'Enhancement',
  'Security',
  'Performance'
];

const mockExistingTasks = [
  { id: '1', title: 'Setup React Project Foundation' },
  { id: '2', title: 'Implement Navigation System' },
  { id: '3', title: 'Integrate with Node.js Backend' },
  { id: '4', title: 'Build PRD Upload Interface' },
  { id: '5', title: 'Develop Kanban Task Board' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'cancelled', label: 'Cancelled' }
];

const TaskModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  onDelete,
  task = null, // null for create mode, task object for edit mode
  allTasks = [] // for dependency selection
}) => {
  const isEditMode = task && task.id;
  
  // Initial form data based on mode
  const getInitialFormData = useCallback(() => {
    if (isEditMode && task) {
      return {
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignee: task.assignee || null,
        tags: task.tags || [],
        dependencies: task.dependencies || [],
      };
    }
    return {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: null,
      assignee: null,
      tags: [],
      dependencies: [],
    };
  }, [isEditMode, task]);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData());
  const [initialFormData, setInitialFormData] = useState(getInitialFormData());

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Enhanced loading and error states
  const [submitError, setSubmitError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryOption, setShowRetryOption] = useState(false);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open) {
      const newInitialData = getInitialFormData();
      setFormData(newInitialData);
      setInitialFormData(newInitialData);
      setErrors({});
      setHasUnsavedChanges(false);
      setShowConfirmDialog(false);
      setShowDeleteConfirm(false);
      // Reset error states
      setSubmitError(null);
      setDeleteError(null);
      setRetryCount(0);
      setShowRetryOption(false);
      setOperationProgress(0);
    }
  }, [open, task, getInitialFormData]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData, initialFormData]);

  // Effect to check for unsaved changes whenever form data changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Utility function to determine error type and message
  const getErrorInfo = (error) => {
    if (!isOnline) {
      return {
        type: 'network',
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        canRetry: true,
        icon: <NoConnectivityIcon />
      };
    }

    if (error.name === 'TimeoutError' || error.code === 'NETWORK_TIMEOUT') {
      return {
        type: 'timeout',
        title: 'Request Timeout',
        message: 'The operation took too long to complete. Please try again.',
        canRetry: true,
        icon: <ErrorIcon />
      };
    }

    if (error.status >= 500) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'There was a problem with the server. Please try again later.',
        canRetry: true,
        icon: <ErrorIcon />
      };
    }

    if (error.status === 400) {
      return {
        type: 'validation',
        title: 'Invalid Data',
        message: error.message || 'Please check your input and try again.',
        canRetry: false,
        icon: <WarningIcon />
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        message: 'You are not authorized to perform this action.',
        canRetry: false,
        icon: <ErrorIcon />
      };
    }

    return {
      type: 'unknown',
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred. Please try again.',
      canRetry: true,
      icon: <ErrorIcon />
    };
  };

  // Enhanced operation with progress tracking and retry logic
  const performOperation = async (operation, operationType = 'submit') => {
    const maxRetries = 3;
    let currentRetry = 0;

    const attemptOperation = async () => {
      try {
        setOperationProgress(10);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setOperationProgress(prev => Math.min(prev + 20, 90));
        }, 200);

        const result = await operation();
        
        clearInterval(progressInterval);
        setOperationProgress(100);
        
        // Show success message
        const successMsg = operationType === 'delete' 
          ? 'Task deleted successfully!' 
          : isEditMode 
            ? 'Task updated successfully!' 
            : 'Task created successfully!';
        
        setSuccessMessage(successMsg);
        setShowSuccessMessage(true);
        
        // Reset progress after a short delay
        setTimeout(() => setOperationProgress(0), 1000);
        
        return result;
      } catch (error) {
        setOperationProgress(0);
        
        const errorInfo = getErrorInfo(error);
        
        if (operationType === 'delete') {
          setDeleteError(errorInfo);
        } else {
          setSubmitError(errorInfo);
        }

        if (errorInfo.canRetry && currentRetry < maxRetries) {
          setRetryCount(currentRetry + 1);
          setShowRetryOption(true);
          throw error; // Re-throw to allow retry
        }
        
        throw error;
      }
    };

    while (currentRetry <= maxRetries) {
      try {
        return await attemptOperation();
      } catch (error) {
        currentRetry++;
        if (currentRetry > maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, currentRetry) * 1000));
      }
    }
  };

  // Clear error messages
  const clearErrors = () => {
    setSubmitError(null);
    setDeleteError(null);
    setShowRetryOption(false);
    setRetryCount(0);
  };

  // Handle form field changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle autocomplete changes
  const handleAutocompleteChange = (field) => (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle date changes
  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      dueDate: newDate
    }));
    
    if (errors.dueDate) {
      setErrors(prev => ({
        ...prev,
        dueDate: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    // Due date validation
    if (formData.dueDate && formData.dueDate < new Date()) {
      newErrors.dueDate = 'Due date must be current or future date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clear any previous errors
    clearErrors();
    setIsSubmitting(true);
    
    try {
      const operation = async () => {
        // Prepare data for submission
        const taskData = {
          ...formData,
          assigneeId: formData.assignee?.id,
          dependencyIds: formData.dependencies.map(dep => dep.id),
        };

        if (isEditMode) {
          taskData.id = task.id;
        }

        if (onSubmit) {
          return await onSubmit(taskData, isEditMode);
        }
      };

      await performOperation(operation, 'submit');

      // Clear unsaved changes flag since form was successfully submitted
      setHasUnsavedChanges(false);
      
      // Close modal on success after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving task:', error);
      // Error is already handled by performOperation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle retry operation
  const handleRetry = async () => {
    if (submitError) {
      await handleSubmit({ preventDefault: () => {} });
    } else if (deleteError) {
      await handleConfirmedDelete();
    }
  };

  // Handle modal close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  // Handle confirmed close (discard changes)
  const handleConfirmedClose = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  // Handle delete action
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Handle confirmed delete
  const handleConfirmedDelete = async () => {
    if (onDelete && task?.id) {
      clearErrors();
      setIsDeleting(true);
      setShowDeleteConfirm(false);
      
      try {
        const operation = async () => {
          return await onDelete(task.id);
        };

        await performOperation(operation, 'delete');
        
        // Close modal on success after a brief delay to show success message
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } catch (error) {
        console.error('Error deleting task:', error);
        // Error is already handled by performOperation
        setShowDeleteConfirm(true); // Re-show confirmation dialog on error
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle escape key
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && !showConfirmDialog && !showDeleteConfirm) {
      handleClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        onKeyDown={handleKeyDown}
        aria-labelledby="task-modal-title"
        PaperProps={{
          sx: {
            minHeight: '600px',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle
          id="task-modal-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditMode ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6">
              {isEditMode ? `Edit Task: ${task?.title}` : 'Create New Task'}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Progress Indicator */}
          {operationProgress > 0 && operationProgress < 100 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={operationProgress}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                {isDeleting ? 'Deleting task...' : isEditMode ? 'Updating task...' : 'Creating task...'}
              </Typography>
            </Box>
          )}

          {/* Network Status Indicator */}
          {!isOnline && (
            <Alert severity="warning" sx={{ mb: 2 }} icon={<NoConnectivityIcon />}>
              <AlertTitle>No Internet Connection</AlertTitle>
              You are currently offline. Changes will be saved when connection is restored.
            </Alert>
          )}

          {/* Submit Error Alert */}
          {submitError && (
            <Alert 
              severity={submitError.type === 'validation' ? 'warning' : 'error'} 
              sx={{ mb: 2 }}
              icon={submitError.icon}
              action={
                submitError.canRetry && showRetryOption ? (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleRetry}
                    startIcon={<RefreshIcon />}
                    disabled={isSubmitting}
                  >
                    Retry {retryCount > 0 && `(${retryCount}/${3})`}
                  </Button>
                ) : (
                  <Button color="inherit" size="small" onClick={clearErrors}>
                    Dismiss
                  </Button>
                )
              }
            >
              <AlertTitle>{submitError.title}</AlertTitle>
              {submitError.message}
            </Alert>
          )}

          {/* Delete Error Alert */}
          {deleteError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              icon={deleteError.icon}
              action={
                deleteError.canRetry && showRetryOption ? (
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleRetry}
                    startIcon={<RefreshIcon />}
                    disabled={isDeleting}
                  >
                    Retry {retryCount > 0 && `(${retryCount}/${3})`}
                  </Button>
                ) : (
                  <Button color="inherit" size="small" onClick={clearErrors}>
                    Dismiss
                  </Button>
                )
              }
            >
              <AlertTitle>{deleteError.title}</AlertTitle>
              {deleteError.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  error={!!errors.title}
                  helperText={errors.title || `${formData.title.length}/100 characters`}
                  required
                  autoFocus
                  aria-describedby="title-helper-text"
                />
              </Grid>

              {/* Description Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  error={!!errors.description}
                  helperText={errors.description || `${formData.description.length}/1000 characters`}
                  aria-describedby="description-helper-text"
                />
              </Grid>

              {/* Priority and Status Row */}
              <Grid item xs={12} md={isEditMode ? 4 : 6}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleChange('priority')}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                  {errors.priority && (
                    <FormHelperText>{errors.priority}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Status Field (Edit mode only) */}
              {isEditMode && (
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={!!errors.status}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange('status')}
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.status && (
                      <FormHelperText>{errors.status}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              {/* Due Date */}
              <Grid item xs={12} md={isEditMode ? 4 : 6}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dueDate,
                      helperText: errors.dueDate,
                    }
                  }}
                />
              </Grid>

              {/* Assignee Field */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={mockUsers}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  value={formData.assignee}
                  onChange={handleAutocompleteChange('assignee')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assignee"
                      error={!!errors.assignee}
                      helperText={errors.assignee}
                    />
                  )}
                />
              </Grid>

              {/* Tags Field */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={mockTags}
                  value={formData.tags}
                  onChange={handleAutocompleteChange('tags')}
                  freeSolo
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Select or create tags"
                      error={!!errors.tags}
                      helperText={errors.tags}
                    />
                  )}
                />
              </Grid>

              {/* Dependencies Field */}
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={allTasks.filter(t => t.id !== task?.id)} // Exclude current task from dependencies
                  getOptionLabel={(option) => option.title}
                  value={formData.dependencies}
                  onChange={handleAutocompleteChange('dependencies')}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={`#${option.id}: ${option.title}`}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Dependencies"
                      placeholder="Select tasks that must be completed first"
                      error={!!errors.dependencies}
                      helperText={errors.dependencies || 'Tasks that must be completed before this task can start'}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          {/* Delete Button (Edit mode only) */}
          {isEditMode && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting || !isOnline}
              startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
              sx={{ mr: 'auto' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}

          {/* Cancel Button */}
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>

          {/* Save/Update Button */}
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || isDeleting || (!isOnline && !submitError)}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSubmit}
            sx={{
              position: 'relative',
              '&.Mui-disabled': {
                backgroundColor: isSubmitting ? 'primary.main' : undefined,
                color: isSubmitting ? 'primary.contrastText' : undefined,
                opacity: isSubmitting ? 0.8 : undefined,
              }
            }}
          >
            {isSubmitting 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Task' : 'Create Task')
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop for Heavy Operations */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={operationProgress === 100}
      >
        <SuccessIcon sx={{ fontSize: 48 }} />
        <Typography variant="h6">Success!</Typography>
        <Typography variant="body2">{successMessage}</Typography>
      </Backdrop>

      {/* Success Message Snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          variant="filled"
          icon={<SuccessIcon />}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Unsaved Changes
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            You have unsaved changes in the task form. If you close now, 
            your changes will be lost. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="primary">
            Stay
          </Button>
          <Button 
            onClick={handleConfirmedClose} 
            color="warning" 
            variant="contained"
            autoFocus
          >
            Close Without Saving
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Delete Task
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Delete Progress Indicator */}
          {isDeleting && operationProgress > 0 && operationProgress < 100 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={operationProgress}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Deleting task...
              </Typography>
            </Box>
          )}
          
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteConfirm(false)} 
            color="primary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmedDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting || !isOnline}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            autoFocus
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaskModal; 