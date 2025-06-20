import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  AvatarGroup,
  Avatar,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Description as TemplateIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Flag as PriorityIcon,
  Link as DependencyIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Group as GroupIcon,

  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Label as TagIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CloudOff as OfflineIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

// Mock data - replace with actual API calls
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '/avatars/john.jpg' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '/avatars/jane.jpg' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', avatar: '/avatars/mike.jpg' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', avatar: '/avatars/sarah.jpg' },
];

const mockTags = [
  'Frontend', 'Backend', 'API', 'Database', 'Testing', 'Documentation', 
  'Bug Fix', 'Enhancement', 'Security', 'Performance', 'UI/UX', 'DevOps'
];

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'in-progress', label: 'In Progress', color: 'info' },
  { value: 'review', label: 'Review', color: 'secondary' },
  { value: 'testing', label: 'Testing', color: 'primary' },
  { value: 'done', label: 'Done', color: 'success' },
  { value: 'blocked', label: 'Blocked', color: 'error' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'success', icon: '🟢' },
  { value: 'medium', label: 'Medium', color: 'warning', icon: '🟡' },
  { value: 'high', label: 'High', color: 'error', icon: '🔴' },
  { value: 'critical', label: 'Critical', color: 'error', icon: '🚨' }
];

const taskTemplates = [
  { id: 'bug-fix', name: 'Bug Fix', description: 'Standard bug fix template' },
  { id: 'feature', name: 'Feature Development', description: 'New feature template' },
  { id: 'research', name: 'Research Task', description: 'Research and investigation template' },
  { id: 'documentation', name: 'Documentation', description: 'Documentation task template' }
];

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const TaskModal = ({ 
  open = false,
  onClose,
  onSubmit,
  onDelete,
  onDuplicate,
  task = null, // null for create mode, task object for edit mode
  allTasks = [], // for dependency selection
  isLoading = false,
  error = null,
  maxWidth = 'lg',
  fullWidth = true
}) => {
  const isEditMode = Boolean(task && task.id);
  const [activeTab, setActiveTab] = useState(0);
  
  // Get initial form data
  const getInitialFormData = useCallback(() => {
    if (isEditMode && task) {
      return {
        title: task.title || '',
        description: task.description || '',
        details: task.details || '',
        testStrategy: task.testStrategy || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignee: task.assignee || null,
        tags: task.tags || [],
        dependencies: task.dependencies || [],
        estimatedHours: task.estimatedHours || '',
        actualHours: task.actualHours || '',
        subtasks: task.subtasks || [],
        comments: task.comments || [],
        attachments: task.attachments || [],
        watchers: task.watchers || []
      };
    }
    return {
      title: '',
      description: '',
      details: '',
      testStrategy: '',
      priority: 'medium',
      status: 'pending',
      dueDate: null,
      assignee: null,
      tags: [],
      dependencies: [],
      estimatedHours: '',
      actualHours: '',
      subtasks: [],
      comments: [],
      attachments: [],
      watchers: []
    };
  }, [isEditMode, task]);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData());
  const [initialFormData, setInitialFormData] = useState(getInitialFormData());
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '', assignee: null });
  const [newComment, setNewComment] = useState('');
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open) {
      const newInitialData = getInitialFormData();
      setFormData(newInitialData);
      setInitialFormData(newInitialData);
      setErrors({});
      setHasUnsavedChanges(false);
      setActiveTab(0);
      setNewSubtask({ title: '', description: '', assignee: null });
      setNewComment('');
      setExpandedAccordions({});
    }
  }, [open, task, getInitialFormData]);

  // Check for unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData, initialFormData]);

  useEffect(() => {
    checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }
    
    if (formData.details && formData.details.length > 3000) {
      newErrors.details = 'Details must be 3000 characters or less';
    }
    
    if (formData.testStrategy && formData.testStrategy.length > 1500) {
      newErrors.testStrategy = 'Test strategy must be 1500 characters or less';
    }
    
    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }
    
    if (formData.actualHours && (isNaN(formData.actualHours) || formData.actualHours < 0)) {
      newErrors.actualHours = 'Actual hours must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form field changes
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAutocompleteChange = (field) => (event, newValue) => {
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({ ...prev, dueDate: newDate }));
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle accordion expansion
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
  };

  // Subtask management
  const handleAddSubtask = () => {
    if (newSubtask.title.trim()) {
      const subtask = {
        id: Date.now(), // Use proper ID generation in real app
        title: newSubtask.title,
        description: newSubtask.description,
        assignee: newSubtask.assignee,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, subtask]
      }));
      
      setNewSubtask({ title: '', description: '', assignee: null });
    }
  };

  const handleRemoveSubtask = (subtaskId) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };

  const handleUpdateSubtaskStatus = (subtaskId, newStatus) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === subtaskId ? { ...st, status: newStatus } : st
      )
    }));
  };

  // Comment management
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newComment,
        author: { name: 'Current User', id: 'current' }, // Use actual user in real app
        createdAt: new Date().toISOString()
      };
      
      setFormData(prev => ({
        ...prev,
        comments: [...prev.comments, comment]
      }));
      
      setNewComment('');
    }
  };

  // Task operations
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose?.();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmedDelete = async () => {
    try {
      await onDelete?.(task);
      setShowDeleteConfirm(false);
      onClose?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicatedTask = {
        ...formData,
        title: `${formData.title} (Copy)`,
        status: 'pending',
        subtasks: formData.subtasks.map(st => ({ ...st, status: 'pending' }))
      };
      await onDuplicate?.(duplicatedTask);
      onClose?.();
    } catch (error) {
      console.error('Error duplicating task:', error);
    }
  };

  const handleApplyTemplate = (template) => {
    // Apply template data to form
    const templateData = getTemplateData(template);
    setFormData(prev => ({ ...prev, ...templateData }));
    setShowTemplateDialog(false);
  };

  const getTemplateData = (template) => {
    // Return template-specific data
    switch (template.id) {
      case 'bug-fix':
        return {
          tags: ['Bug Fix'],
          testStrategy: 'Test the fix thoroughly and verify the bug is resolved',
          priority: 'high'
        };
      case 'feature':
        return {
          tags: ['Enhancement'],
          testStrategy: 'Create comprehensive test cases for the new feature',
          priority: 'medium'
        };
      case 'research':
        return {
          tags: ['Research'],
          testStrategy: 'Document findings and present recommendations',
          priority: 'low'
        };
      case 'documentation':
        return {
          tags: ['Documentation'],
          testStrategy: 'Review documentation for accuracy and completeness',
          priority: 'low'
        };
      default:
        return {};
    }
  };

  // Computed values
  const completedSubtasks = formData.subtasks.filter(st => st.status === 'done').length;
  const totalSubtasks = formData.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const dependencyTasks = useMemo(() => {
    return allTasks.filter(t => formData.dependencies.includes(t.id));
  }, [allTasks, formData.dependencies]);

  // Modal actions
  const modalActions = (
    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
      {/* Left side actions */}
      <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
        {isEditMode && (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              onClick={handleDuplicate}
              startIcon={<CopyIcon />}
              disabled={isSubmitting}
            >
              Duplicate
            </Button>
          </>
        )}
        <Button
          variant="outlined"
          onClick={() => setShowTemplateDialog(true)}
          startIcon={<TemplateIcon />}
          disabled={isSubmitting}
        >
          Templates
        </Button>
      </Stack>

      {/* Right side actions */}
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          startIcon={<CancelIcon />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {isSubmitting 
            ? (isEditMode ? 'Updating...' : 'Creating...') 
            : (isEditMode ? 'Update Task' : 'Create Task')
          }
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <BaseModal
        open={open}
        onClose={onClose}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            {isEditMode ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6">
              {isEditMode ? `Edit Task: ${task?.title}` : 'Create New Task'}
            </Typography>
            {hasUnsavedChanges && (
              <Chip size="small" label="Unsaved Changes" color="warning" />
            )}
          </Stack>
        }
        actions={modalActions}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        dividers
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '600px',
            maxHeight: '90vh'
          }
        }}
      >
        {/* Loading indicator */}
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error.message || 'An error occurred while processing the task.'}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Task editing tabs">
            <Tab label="Basic Info" id="task-tab-0" aria-controls="task-tabpanel-0" />
            <Tab 
              label={
                <Badge badgeContent={totalSubtasks} color="primary">
                  Subtasks
                </Badge>
              } 
              id="task-tab-1" 
              aria-controls="task-tabpanel-1" 
            />
            <Tab label="Dependencies" id="task-tab-2" aria-controls="task-tabpanel-2" />
            <Tab 
              label={
                <Badge badgeContent={formData.comments.length} color="primary">
                  Activity
                </Badge>
              } 
              id="task-tab-3" 
              aria-controls="task-tabpanel-3" 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        
        {/* Basic Info Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Title */}
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
              />
            </Grid>

            {/* Description */}
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
                placeholder="Provide a clear description of what needs to be done..."
              />
            </Grid>

            {/* Priority and Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.priority}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={handleChange('priority')}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{option.icon}</span>
                        <Typography>{option.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errors.priority && <FormHelperText>{errors.priority}</FormHelperText>}
              </FormControl>
            </Grid>

            {isEditMode && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.status}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={handleChange('status')}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip
                          size="small"
                          label={option.label}
                          color={option.color}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Due Date */}
            <Grid item xs={12} md={6}>
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

            {/* Assignee */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={mockUsers}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                value={formData.assignee}
                onChange={handleAutocompleteChange('assignee')}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, width: 24, height: 24 }}>
                      {option.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
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

            {/* Tags */}
            <Grid item xs={12}>
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

            {/* Estimated and Actual Hours */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Hours"
                value={formData.estimatedHours}
                onChange={handleChange('estimatedHours')}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>

            {isEditMode && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Actual Hours"
                  value={formData.actualHours}
                  onChange={handleChange('actualHours')}
                  error={!!errors.actualHours}
                  helperText={errors.actualHours}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
            )}

            {/* Implementation Details */}
            <Grid item xs={12}>
              <Accordion 
                expanded={expandedAccordions.details}
                onChange={handleAccordionChange('details')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Implementation Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Implementation Details"
                    value={formData.details}
                    onChange={handleChange('details')}
                    error={!!errors.details}
                    helperText={errors.details || `${formData.details.length}/3000 characters`}
                    placeholder="Provide detailed implementation instructions, requirements, and notes..."
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Test Strategy */}
            <Grid item xs={12}>
              <Accordion 
                expanded={expandedAccordions.testStrategy}
                onChange={handleAccordionChange('testStrategy')}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Test Strategy</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Test Strategy"
                    value={formData.testStrategy}
                    onChange={handleChange('testStrategy')}
                    error={!!errors.testStrategy}
                    helperText={errors.testStrategy || `${formData.testStrategy.length}/1500 characters`}
                    placeholder="Describe how this task should be tested and verified..."
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Subtasks Tab */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            {/* Subtask Progress */}
            {totalSubtasks > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="h6">Progress</Typography>
                    <Chip 
                      label={`${completedSubtasks}/${totalSubtasks} completed`}
                      color={completedSubtasks === totalSubtasks ? 'success' : 'primary'}
                      variant="outlined"
                    />
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={subtaskProgress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(subtaskProgress)}% complete
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Add New Subtask */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Add New Subtask</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Subtask Title"
                    value={newSubtask.title}
                    onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter subtask title..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Description (Optional)"
                    value={newSubtask.description}
                    onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter subtask description..."
                  />
                  <Autocomplete
                    options={mockUsers}
                    getOptionLabel={(option) => option.name}
                    value={newSubtask.assignee}
                    onChange={(event, newValue) => setNewSubtask(prev => ({ ...prev, assignee: newValue }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Assignee (Optional)" />
                    )}
                  />
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.title.trim()}
                  startIcon={<AddIcon />}
                >
                  Add Subtask
                </Button>
              </CardActions>
            </Card>

            {/* Existing Subtasks */}
            {formData.subtasks.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Subtasks</Typography>
                  <List>
                    {formData.subtasks.map((subtask, index) => (
                      <ListItem key={subtask.id} divider={index < formData.subtasks.length - 1}>
                        <ListItemIcon>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateSubtaskStatus(
                              subtask.id, 
                              subtask.status === 'done' ? 'pending' : 'done'
                            )}
                          >
                            {subtask.status === 'done' ? <CheckIcon color="success" /> : <UncheckedIcon />}
                          </IconButton>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              sx={{ 
                                textDecoration: subtask.status === 'done' ? 'line-through' : 'none',
                                color: subtask.status === 'done' ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {subtask.title}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              {subtask.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {subtask.description}
                                </Typography>
                              )}
                              {subtask.assignee && (
                                <Chip
                                  size="small"
                                  avatar={<Avatar sx={{ width: 16, height: 16 }}>{subtask.assignee.name.charAt(0)}</Avatar>}
                                  label={subtask.assignee.name}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSubtask(subtask.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Stack>
        </TabPanel>

        {/* Dependencies Tab */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            {/* Dependency Selection */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Task Dependencies</Typography>
                <Autocomplete
                  multiple
                  options={allTasks.filter(t => t.id !== task?.id)}
                  getOptionLabel={(option) => `#${option.id}: ${option.title}`}
                  value={dependencyTasks}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      dependencies: newValue.map(t => t.id)
                    }));
                  }}
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
                      helperText="Tasks that must be completed before this task can start"
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Dependency Visualization */}
            {dependencyTasks.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Dependency Details</Typography>
                  <List>
                    {dependencyTasks.map((depTask, index) => (
                      <ListItem key={depTask.id} divider={index < dependencyTasks.length - 1}>
                        <ListItemIcon>
                          <DependencyIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`#${depTask.id}: ${depTask.title}`}
                          secondary={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Chip
                                size="small"
                                label={depTask.status}
                                color={statusOptions.find(s => s.value === depTask.status)?.color || 'default'}
                                variant="outlined"
                              />
                              {depTask.priority && (
                                <Chip
                                  size="small"
                                  label={depTask.priority}
                                  color={priorityOptions.find(p => p.value === depTask.priority)?.color || 'default'}
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Dependency Warnings */}
            {dependencyTasks.some(t => t.status !== 'done') && (
              <Alert severity="warning">
                <AlertTitle>Dependency Warning</AlertTitle>
                Some dependencies are not yet completed. This task may be blocked until dependencies are resolved.
              </Alert>
            )}
          </Stack>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={activeTab} index={3}>
          <Stack spacing={3}>
            {/* Add Comment */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Add Comment</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                />
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  startIcon={<CommentIcon />}
                >
                  Add Comment
                </Button>
              </CardActions>
            </Card>

            {/* Activity Timeline */}
            {(formData.comments.length > 0 || isEditMode) && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Activity Timeline</Typography>
                  <Stack spacing={2}>
                    {/* Comments */}
                    {formData.comments.map((comment) => (
                      <Box key={comment.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <CommentIcon fontSize="small" />
                        </Avatar>
                        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2">
                              {comment.author.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                          <Typography variant="body2">
                            {comment.text}
                          </Typography>
                        </Paper>
                      </Box>
                    ))}

                    {/* Task Creation */}
                    {isEditMode && task.createdAt && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <AddIcon fontSize="small" />
                        </Avatar>
                        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Task Created
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </TabPanel>
      </BaseModal>

      {/* Delete Confirmation Dialog */}
      <BaseModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Task</Typography>
          </Stack>
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmedDelete}
              startIcon={<DeleteIcon />}
            >
              Delete Task
            </Button>
          </Stack>
        }
        maxWidth="sm"
      >
        <Alert severity="warning">
          <AlertTitle>Confirm Deletion</AlertTitle>
          Are you sure you want to delete "{task?.title}"? This action cannot be undone.
          {totalSubtasks > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              This will also delete {totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}.
            </Typography>
          )}
        </Alert>
      </BaseModal>

      {/* Template Selection Dialog */}
      <BaseModal
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <TemplateIcon color="primary" />
            <Typography variant="h6">Apply Template</Typography>
          </Stack>
        }
        maxWidth="sm"
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Select a template to apply predefined settings to this task.
          </Typography>
          {taskTemplates.map((template) => (
            <Card 
              key={template.id} 
              variant="outlined" 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => handleApplyTemplate(template)}
            >
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </BaseModal>
    </LocalizationProvider>
  );
};

TaskModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  task: PropTypes.object,
  allTasks: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool
};

export default TaskModal; 