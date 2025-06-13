import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Paper,
  Divider,
  FormHelperText,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Fade,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  CheckCircle,
  Error as ErrorIcon,
  Info as InfoIcon,
  CloudOff as OfflineIcon,
  CloudQueue as QueuedIcon,
  Sync as SyncIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, useBlocker } from 'react-router-dom';

// Import offline services
import offlineService from '../services/offlineService';
import autosaveService from '../services/autosaveService';
import OfflineTaskService from '../api/taskServiceOffline';

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

// Enhanced validation rules
const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
  },
  description: {
    maxLength: 1000,
  },
  priority: {
    required: false,
    validOptions: ['low', 'medium', 'high'],
  },
  dueDate: {
    required: false,
    minDate: new Date(),
  },
  assignee: {
    required: false,
  },
  tags: {
    maxCount: 10,
    maxTagLength: 50,
  },
  dependencies: {
    maxCount: 20,
    preventSelfReference: true,
  }
};

// Enhanced error messages
const ERROR_MESSAGES = {
  title: {
    required: 'Task title is required',
    minLength: 'Title must be at least 3 characters long',
    maxLength: 'Title must be 100 characters or less',
    pattern: 'Title contains invalid characters. Use only letters, numbers, spaces, and basic punctuation.',
  },
  description: {
    maxLength: 'Description must be 1000 characters or less',
  },
  priority: {
    invalid: 'Please select a valid priority level',
  },
  dueDate: {
    past: 'Due date must be current or future date',
    invalid: 'Please enter a valid date',
  },
  assignee: {
    invalid: 'Please select a valid team member',
  },
  tags: {
    maxCount: 'Maximum 10 tags allowed',
    maxTagLength: 'Tag names must be 50 characters or less',
    duplicate: 'Duplicate tags are not allowed',
  },
  dependencies: {
    maxCount: 'Maximum 20 dependencies allowed',
    selfReference: 'A task cannot depend on itself',
    circular: 'Circular dependencies are not allowed',
  }
};

const TaskCreationForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const navigate = useNavigate();
  
  // Accessibility refs for focus management
  const formRef = useRef(null);
  const titleFieldRef = useRef(null);
  const submitButtonRef = useRef(null);
  const statusAnnouncementRef = useRef(null);
  const errorSummaryRef = useRef(null);
  
  // Initial form data for comparison
  const initialFormData = {
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    dueDate: initialData.dueDate || null,
    assignee: initialData.assignee || null,
    tags: initialData.tags || [],
    dependencies: initialData.dependencies || [],
  };
  
  // Form state
  const [formData, setFormData] = useState(initialFormData);

  // Enhanced error state with real-time validation
  const [errors, setErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState(''); // 'validating', 'saving', 'syncing', 'success', 'error'
  
  // Unsaved changes state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Form draft persistence
  const [draftSaved, setDraftSaved] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success', 'error', 'warning', 'info'
    autoHideDuration: 6000
  });

  // Validation guidance state
  const [showValidationHelp, setShowValidationHelp] = useState(false);
  const [validationHelpText, setValidationHelpText] = useState('');

  // Enhanced accessibility state
  const [focusedField, setFocusedField] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [formProgress, setFormProgress] = useState(0);

  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [queuedRequests, setQueuedRequests] = useState([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [draftInfo, setDraftInfo] = useState(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  // Initialize offline task service
  const offlineTaskService = useRef(OfflineTaskService);

  // Draft persistence configuration
  const draftContext = 'task-creation-form';
  const draftKey = `${draftContext}_draft`;

  // Network timeout handling
  const [networkTimeout, setNetworkTimeout] = useState(null);
  const NETWORK_TIMEOUT_DURATION = 30000; // 30 seconds

  // Network timeout utility
  const createTimeoutPromise = (promise, timeoutMs = NETWORK_TIMEOUT_DURATION) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        setNetworkTimeout(true);
        reject(new Error('Network request timed out. Please check your connection and try again.'));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          setNetworkTimeout(null);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          setNetworkTimeout(null);
          reject(error);
        });
    });
  };

  // Enhanced validation function for individual fields
  const validateField = useCallback((fieldName, value, allFormData = formData) => {
    const rules = VALIDATION_RULES[fieldName];
    const messages = ERROR_MESSAGES[fieldName];
    
    if (!rules) return '';

    let errorKey = '';
    let errorMessage = '';

    switch (fieldName) {
      case 'title':
        if (rules.required && (!value || !value.trim())) {
          errorKey = 'required';
          errorMessage = messages.required;
        } else if (value && value.trim().length < rules.minLength) {
          errorKey = 'minLength';
          errorMessage = messages.minLength;
        } else if (value && value.trim().length > rules.maxLength) {
          errorKey = 'maxLength';
          errorMessage = messages.maxLength;
        } else if (value && !rules.pattern.test(value.trim())) {
          errorKey = 'pattern';
          errorMessage = messages.pattern;
        }
        break;

      case 'description':
        if (value && value.length > rules.maxLength) {
          errorKey = 'maxLength';
          errorMessage = messages.maxLength;
        }
        break;

      case 'priority':
        if (value && !rules.validOptions.includes(value)) {
          errorKey = 'invalid';
          errorMessage = messages.invalid;
        }
        break;

      case 'dueDate':
        if (value) {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errorKey = 'invalid';
            errorMessage = messages.invalid;
          } else if (date < new Date().setHours(0, 0, 0, 0)) {
            errorKey = 'past';
            errorMessage = messages.past;
          }
        }
        break;

      case 'tags':
        if (value && value.length > rules.maxCount) {
          errorKey = 'maxCount';
          errorMessage = messages.maxCount;
        } else if (value && value.some(tag => tag.length > rules.maxTagLength)) {
          errorKey = 'maxTagLength';
          errorMessage = messages.maxTagLength;
        } else if (value && new Set(value).size !== value.length) {
          errorKey = 'duplicate';
          errorMessage = messages.duplicate;
        }
        break;

      case 'dependencies':
        if (value && value.length > rules.maxCount) {
          errorKey = 'maxCount';
          errorMessage = messages.maxCount;
        }
        break;

      default:
        break;
    }

    // Show validation guidance if there's an error and field is touched
    if (errorMessage && fieldTouched[fieldName]) {
      showValidationGuidance(fieldName, errorKey);
    }

    return errorMessage;
  }, [formData, fieldTouched, showValidationGuidance]);

  // Real-time validation for all fields
  const validateAllFields = useCallback((formDataToValidate = formData) => {
    const newErrors = {};
    
    Object.keys(VALIDATION_RULES).forEach(fieldName => {
      const error = validateField(fieldName, formDataToValidate[fieldName], formDataToValidate);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    return newErrors;
  }, [formData, validateField]);

  // Check if form is valid
  const checkFormValidity = useCallback(() => {
    const newErrors = validateAllFields();
    const valid = Object.keys(newErrors).length === 0 && formData.title.trim().length > 0;
    setIsFormValid(valid);
    return valid;
  }, [validateAllFields, formData.title]);

  // Real-time validation effect
  useEffect(() => {
    const newErrors = validateAllFields();
    setErrors(newErrors);
    checkFormValidity();
  }, [formData, validateAllFields, checkFormValidity]);

  // Check for unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData, initialFormData]);

  // Enhanced offline detection and connectivity management
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setOfflineMessage('');
      announceToScreenReader('Connection restored. Syncing data...', 'polite');
      handleSyncOnReconnection();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setOfflineMessage('You are currently offline. Your work will be saved locally and synced when connection is restored.');
      announceToScreenReader('Connection lost. Working offline.', 'assertive');
    };

    // Set up offline service listeners
    offlineService.addListener('task-creation-form', {
      online: handleOnline,
      offline: handleOffline
    });

    // Set up native browser events as fallback
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state check
    setIsOffline(!navigator.onLine);

    return () => {
      offlineService.removeListener('task-creation-form');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced auto-save draft using autosave service
  useEffect(() => {
    if (hasUnsavedChanges && Object.keys(fieldTouched).length > 0) {
      const draftData = {
        formData,
        timestamp: new Date().toISOString(),
        version: '2.0', // Version for compatibility
        context: draftContext
      };
      
      // Save using autosave service for better management
      autosaveService.saveToStorage(draftContext, draftData);
      setDraftSaved(true);
      
      // Update draft info for UI
      setDraftInfo({
        lastSaved: new Date(),
        hasChanges: true
      });
      
      // Clear draft saved indicator after 3 seconds
      const timer = setTimeout(() => setDraftSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [formData, hasUnsavedChanges, fieldTouched, draftContext]);

  // Enhanced draft loading on component mount
  useEffect(() => {
    if (!initialData.title) { // Only load if no initial data
      const savedDraft = autosaveService.loadFromStorage(draftContext);
      
      if (savedDraft && savedDraft.data) {
        const { formData: draftFormData, timestamp, version } = savedDraft.data;
        const draftAge = new Date() - new Date(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (draftAge < maxAge && version === '2.0') {
          setDraftInfo({
            lastSaved: new Date(timestamp),
            hasChanges: true,
            age: draftAge
          });
          setShowDraftRestore(true);
        } else {
          // Clean up old draft
          autosaveService.removeFromStorage(draftContext);
        }
      }
    }
  }, [initialData.title, draftContext]);

  // Block navigation if there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Effect to check for unsaved changes whenever form data changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [checkForUnsavedChanges]);

  // Handle navigation blocking
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowConfirmDialog(true);
      setPendingNavigation(() => blocker.proceed);
    }
  }, [blocker]);

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSubmitting]);

  // Accessibility enhancements: Calculate form completion progress for screen readers
  useEffect(() => {
    const requiredFields = ['title'];
    const optionalFields = ['description', 'priority', 'dueDate', 'assignee', 'tags', 'dependencies'];
    const totalFields = requiredFields.length + optionalFields.length;
    
    let completedFields = 0;
    requiredFields.forEach(field => {
      if (formData[field] && formData[field].toString().trim()) completedFields++;
    });
    optionalFields.forEach(field => {
      if (formData[field] && (
        (Array.isArray(formData[field]) && formData[field].length > 0) ||
        (!Array.isArray(formData[field]) && formData[field].toString().trim())
      )) completedFields++;
    });
    
    const progress = Math.round((completedFields / totalFields) * 100);
    setFormProgress(progress);
  }, [formData]);

  // Accessibility: Announce status changes to screen readers
  const announceToScreenReader = useCallback((message, priority = 'polite') => {
    setAnnouncementText(message);
    setStatusMessage(message);
    
    // Clear the announcement after a short delay to allow for multiple announcements
    setTimeout(() => {
      setAnnouncementText('');
    }, 1000);
  }, []);

  // Handle sync on reconnection
  const handleSyncOnReconnection = useCallback(async () => {
    if (isOffline || syncInProgress) return;

    setSyncInProgress(true);
    try {
      // Get queued requests from offline service
      const queueStatus = offlineService.getQueueStatus();
      setQueuedRequests(queueStatus.requests || []);

      if (queueStatus.count > 0) {
        announceToScreenReader(`Syncing ${queueStatus.count} queued requests...`, 'polite');
        await offlineService.processQueue();
        announceToScreenReader('Sync completed successfully.', 'polite');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      announceToScreenReader('Sync failed. Some changes may not be saved.', 'assertive');
    } finally {
      setSyncInProgress(false);
      setQueuedRequests([]);
    }
  }, [isOffline, syncInProgress]);

  // Handle draft restoration
  const handleRestoreDraft = useCallback(() => {
    const savedDraft = autosaveService.loadFromStorage(draftContext);
    if (savedDraft && savedDraft.data && savedDraft.data.formData) {
      setFormData(savedDraft.data.formData);
      setShowDraftRestore(false);
      setHasUnsavedChanges(true);
      announceToScreenReader('Draft restored successfully.', 'polite');
      showInfoNotification('Draft restored from previous session.');
    }
  }, [draftContext]);

  // Handle draft dismissal
  const handleDismissDraft = useCallback(() => {
    autosaveService.removeFromStorage(draftContext);
    setShowDraftRestore(false);
    setDraftInfo(null);
    announceToScreenReader('Draft dismissed.', 'polite');
  }, [draftContext]);

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    autosaveService.removeFromStorage(draftContext);
    setDraftInfo(null);
    setHasUnsavedChanges(false);
  }, [draftContext]);

  // Accessibility: Enhanced keyboard navigation
  const handleFormKeyDown = useCallback((event) => {
    // Form-level keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        if (!showConfirmDialog) {
          event.preventDefault();
          handleCancel();
        }
        break;
      case 'Enter':
        // Allow Enter for textarea (description field)
        if (event.target.tagName.toLowerCase() === 'textarea') {
          return;
        }
        // If focused on submit button, let it submit
        if (event.target === submitButtonRef.current) {
          return;
        }
        // Prevent form submission on Enter in other fields
        if (event.target.tagName.toLowerCase() === 'input' || 
            event.target.tagName.toLowerCase() === 'select') {
          event.preventDefault();
          // Move to next field or submit button
          const nextField = getNextFocusableElement(event.target);
          if (nextField) {
            nextField.focus();
          } else {
            submitButtonRef.current?.focus();
          }
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (!isSubmitting && isFormValid) {
            handleSubmit(event);
          }
        }
        break;
    }
  }, [showConfirmDialog, isSubmitting, isFormValid, handleCancel, handleSubmit]);

  // Accessibility: Helper function to get next focusable element
  const getNextFocusableElement = useCallback((currentElement) => {
    const focusableElements = formRef.current?.querySelectorAll(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements) return null;
    
    const focusableArray = Array.from(focusableElements);
    const currentIndex = focusableArray.indexOf(currentElement);
    
    if (currentIndex === -1) return null;
    
    return focusableArray[currentIndex + 1] || null;
  }, []);

  // Accessibility: Enhanced focus management with contextual help
  const handleFieldFocus = useCallback((fieldName) => {
    setFocusedField(fieldName);
    
    // Provide contextual help for complex fields
    const fieldGuidance = {
      title: 'Enter a clear, descriptive title for your task. This will help team members understand what needs to be done.',
      description: 'Provide additional details about the task. Include acceptance criteria, requirements, or context that would be helpful.',
      priority: 'Select the urgency level. High priority tasks will be highlighted for immediate attention.',
      dueDate: 'Choose when this task should be completed. Leave empty if there\'s no specific deadline.',
      assignee: 'Select who will be responsible for completing this task. Leave empty for unassigned tasks.',
      tags: 'Add labels to categorize and make your task easier to find. You can select from existing tags or create new ones.',
      dependencies: 'Select other tasks that must be completed before this task can start. This helps with project planning and task ordering.'
    };
    
    if (fieldGuidance[fieldName]) {
      setValidationHelpText(fieldGuidance[fieldName]);
      setShowValidationHelp(true);
      
      // Auto-hide help after 8 seconds
      setTimeout(() => {
        setShowValidationHelp(false);
      }, 8000);
    }
  }, []);

  // Handle form field changes with real-time validation
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setFieldTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Handle autocomplete changes
  const handleAutocompleteChange = (field) => (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    setFieldTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Handle date changes
  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      dueDate: newDate
    }));
    
    setFieldTouched(prev => ({
      ...prev,
      dueDate: true
    }));
  };

  // Handle field blur for validation timing
  const handleFieldBlur = (fieldName) => () => {
    setFieldTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  // Comprehensive form validation
  const validateForm = () => {
    const newErrors = validateAllFields();
    setErrors(newErrors);
    
    // Mark all fields as touched to show errors
    const allFieldsTouched = Object.keys(VALIDATION_RULES).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setFieldTouched(allFieldsTouched);
    
    return Object.keys(newErrors).length === 0;
  };

  // Notification helper functions
  const showNotification = useCallback((message, severity = 'success', autoHideDuration = 6000) => {
    setNotification({
      open: true,
      message,
      severity,
      autoHideDuration
    });
  }, []);

  const showSuccessNotification = useCallback((message) => {
    showNotification(message, 'success', 4000);
  }, [showNotification]);

  const showErrorNotification = useCallback((message) => {
    showNotification(message, 'error', 8000);
  }, [showNotification]);

  const showWarningNotification = useCallback((message) => {
    showNotification(message, 'warning', 6000);
  }, [showNotification]);

  const showInfoNotification = useCallback((message) => {
    showNotification(message, 'info', 5000);
  }, [showNotification]);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Validation guidance helper
  const showValidationGuidance = useCallback((fieldName, error) => {
    const guidanceMessages = {
      title: {
        required: 'Task titles help team members understand what needs to be done. Try to be specific and actionable.',
        minLength: 'A good task title should be descriptive enough to understand the scope of work.',
        maxLength: 'Keep titles concise but informative. Use the description field for additional details.',
        pattern: 'Task titles should use standard characters. Avoid special symbols that might cause issues in different systems.'
      },
      description: {
        maxLength: 'Use clear, concise language in descriptions. Break down complex tasks into subtasks if needed.'
      },
      priority: {
        invalid: 'Priority helps determine task order. High = urgent/important, Medium = standard work, Low = nice-to-have.'
      },
      dueDate: {
        past: 'Due dates should be in the future to allow time for completion.',
        invalid: 'Please select a valid date from the date picker.'
      },
      tags: {
        maxCount: 'Too many tags can make tasks hard to organize. Focus on the most relevant categories.',
        maxTagLength: 'Keep tag names short and consistent for better organization.',
        duplicate: 'Duplicate tags don\'t add value. Each tag should represent a unique category or attribute.'
      },
      dependencies: {
        maxCount: 'Too many dependencies can create bottlenecks. Consider if all are truly necessary.',
        selfReference: 'A task cannot depend on itself - this would create an impossible situation.',
        circular: 'Circular dependencies prevent tasks from being completed. Review the dependency chain.'
      }
    };

    const guidance = guidanceMessages[fieldName]?.[error.split(' ')[0].toLowerCase()];
    if (guidance) {
      setValidationHelpText(guidance);
      setShowValidationHelp(true);
      
      // Auto-hide validation help after 10 seconds
      setTimeout(() => {
        setShowValidationHelp(false);
      }, 10000);
    }
  }, []);

  // Enhanced form submission with offline support and comprehensive error handling
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      // Show validation error notification
      const errorCount = Object.keys(errors).length;
      const errorMessage = `Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting.`;
      showErrorNotification(errorMessage);
      
      // Accessibility: Announce validation errors to screen readers
      announceToScreenReader(errorMessage, 'assertive');
      
      // Focus on first field with error for keyboard users
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && formRef.current) {
        const errorElement = formRef.current.querySelector(`[name="${firstErrorField}"], [aria-label*="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.focus();
        }
      }
      
      // Show the first validation error as guidance
      const firstError = Object.entries(errors)[0];
      if (firstError) {
        const [fieldName, errorMessage] = firstError;
        showValidationGuidance(fieldName, errorMessage);
      }
      
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress(0);
    setSubmissionStatus('validating');
    
    // Accessibility: Announce submission start with offline context
    const submissionMessage = isOffline ? 
      'Creating task offline, will sync when connection is restored...' : 
      'Creating task, please wait...';
    announceToScreenReader(submissionMessage, 'polite');
    
    try {
      // Show info notification that submission is starting
      const infoMessage = isOffline ? 
        'Creating task offline...' : 
        'Creating your task...';
      showInfoNotification(infoMessage, 2000);
      
      // Update progress to indicate validation complete
      setSubmissionProgress(20);
      setSubmissionStatus('saving');
      
      // Prepare data for submission
      const taskData = {
        ...formData,
        assigneeId: formData.assignee?.id,
        dependencyIds: formData.dependencies.map(dep => dep.id),
        createdOffline: isOffline,
        offlineTimestamp: isOffline ? new Date().toISOString() : null
      };

      let createdTask;
      
      if (isOffline) {
        // Handle offline task creation
        try {
          setSubmissionProgress(50);
          createdTask = await offlineTaskService.current.createTask(taskData);
          setSubmissionProgress(100);
          setSubmissionStatus('success');
          
          // Clear draft after successful offline creation
          clearDraft();
          
          // Show offline success notification
          const offlineMessage = `Task "${formData.title}" created offline. It will sync when connection is restored.`;
          showSuccessNotification(offlineMessage);
          announceToScreenReader(offlineMessage, 'polite');
          
          // Navigate with offline indication
          setTimeout(() => {
            navigate('/tasks', { 
              state: { 
                message: offlineMessage,
                newTask: createdTask,
                openTaskId: createdTask.id,
                openDetailPanel: true,
                isOfflineTask: true
              }
            });
          }, 1500);
          
        } catch (offlineError) {
          console.error('Offline task creation failed:', offlineError);
          
          // Queue the request for later
          const queueId = offlineService.queueRequest({
            url: '/api/tasks',
            options: {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            },
            context: `createTask-${Date.now()}`,
            priority: 9,
            onSuccess: (response) => {
              clearDraft();
              showSuccessNotification(`Task "${formData.title}" synced successfully!`);
            },
            onError: (error) => {
              showErrorNotification(`Failed to sync task "${formData.title}". Please try again when online.`);
            }
          });
          
          // Show queued notification
          const queuedMessage = `Task "${formData.title}" queued for creation. It will be created when connection is restored.`;
          showInfoNotification(queuedMessage);
          announceToScreenReader(queuedMessage, 'polite');
          
          // Navigate with queued indication
          setTimeout(() => {
            navigate('/tasks', { 
              state: { 
                message: queuedMessage,
                queuedTaskData: taskData,
                queueId: queueId,
                isQueuedTask: true
              }
            });
          }, 1500);
        }
      } else {
        // Handle online task creation with timeout
        setSubmissionProgress(40);
        try {
          if (onSubmit) {
            createdTask = await createTimeoutPromise(onSubmit(taskData));
          } else {
            // Simulate API call delay with progress updates
            await createTimeoutPromise(
              new Promise(resolve => {
                let progress = 40;
                const interval = setInterval(() => {
                  progress += 15;
                  setSubmissionProgress(Math.min(progress, 90));
                }, 200);
                
                setTimeout(() => {
                  clearInterval(interval);
                  resolve();
                }, 1500);
              })
            );
            
            // Default behavior - log and create mock task
            console.log('Task created:', taskData);
            createdTask = { id: Date.now().toString(), ...taskData }; // Mock created task
          }
          
          setSubmissionProgress(100);
          setSubmissionStatus('success');
        } catch (timeoutError) {
          setSubmissionStatus('error');
          if (timeoutError.message.includes('timed out')) {
            throw new Error('Network request timed out. Please check your connection and try again.');
          }
          throw timeoutError;
        }

        // Clear draft after successful online creation
        clearDraft();
        
        // Show success notification
        const successMessage = `Task "${formData.title}" created successfully!`;
        showSuccessNotification(successMessage);
        
        // Accessibility: Announce success to screen readers
        announceToScreenReader(successMessage, 'polite');

        // Navigate to the newly created task detail view
        if (createdTask && createdTask.id) {
          // Small delay to show success notification before navigation
          setTimeout(() => {
            navigate('/tasks', { 
              state: { 
                message: successMessage,
                newTask: createdTask,
                openTaskId: createdTask.id,
                openDetailPanel: true
              }
            });
          }, 1500);
        } else {
          // Fallback navigation
          setTimeout(() => {
            navigate('/tasks', { 
              state: { 
                message: successMessage
              }
            });
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Reset submission states on error
      setSubmissionProgress(0);
      setSubmissionStatus('error');
      
      // Determine error type and show appropriate notification
      let errorMessage = 'Failed to create task. Please try again.';
      
      if (error.name === 'ValidationError') {
        errorMessage = 'Task data validation failed. Please check your inputs and try again.';
      } else if (error.name === 'NetworkError' || error.message.includes('timed out')) {
        errorMessage = 'Network error or timeout. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = `Failed to create task: ${error.message}`;
      }
      
      showErrorNotification(errorMessage);
      
      // Accessibility: Announce error to screen readers
      announceToScreenReader(errorMessage, 'assertive');
      
      // If it's a validation error, show guidance
      if (error.name === 'ValidationError' && error.fields) {
        const firstFieldError = Object.entries(error.fields)[0];
        if (firstFieldError) {
          const [fieldName, fieldError] = firstFieldError;
          showValidationGuidance(fieldName, fieldError);
        }
      }
    } finally {
      setIsSubmitting(false);
      // Reset submission states after a delay to show final state
      setTimeout(() => {
        setSubmissionProgress(0);
        setSubmissionStatus('');
      }, 2000);
    }
  };

  // Handle cancel with enhanced draft management
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
      setPendingNavigation(() => () => {
        clearDraft();
        if (onCancel) {
          onCancel();
        } else {
          navigate('/tasks');
        }
      });
    } else {
      clearDraft();
      if (onCancel) {
        onCancel();
      } else {
        navigate('/tasks');
      }
    }
  };

  // Handle confirmation dialog actions
  const handleConfirmLeave = () => {
    setShowConfirmDialog(false);
    clearDraft();
    if (pendingNavigation) {
      pendingNavigation();
    }
    setPendingNavigation(null);
  };

  const handleCancelLeave = () => {
    setShowConfirmDialog(false);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
    setPendingNavigation(null);
  };

  // Get error for field (only show if field is touched)
  const getFieldError = (fieldName) => {
    return fieldTouched[fieldName] ? errors[fieldName] : '';
  };

  // Initial offline state setup
  useEffect(() => {
    // Set initial offline state based on navigator.onLine
    setIsOffline(!navigator.onLine);
    if (!navigator.onLine) {
      setOfflineMessage('You are currently offline. Your work will be saved locally and synced when connection is restored.');
    }
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Accessibility: Live region for screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        ref={statusAnnouncementRef}
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {announcementText}
      </div>
      
      {/* Accessibility: Skip link for keyboard navigation */}
      <a 
        href="#main-form-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: '#000',
          color: '#fff',
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          transition: 'top 0.2s ease-in-out'
        }}
        onFocus={(e) => {
          e.target.style.top = '6px';
        }}
        onBlur={(e) => {
          e.target.style.top = '-40px';
        }}
      >
        Skip to form content
      </a>
      
      <Paper 
        component="form" 
        onSubmit={handleSubmit} 
        onKeyDown={handleFormKeyDown}
        ref={formRef}
        sx={{ p: 3 }}
        role="form"
        aria-labelledby="form-title"
        aria-describedby="form-description"
      >
        {/* Form header with progress indicator */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1" id="form-title" gutterBottom>
            Create New Task
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            id="form-description"
            sx={{ mb: 2 }}
          >
            Fill out the form below to create a new task. Required fields are marked with an asterisk (*).
            Form completion: {formProgress}%
          </Typography>
          
          {/* Accessibility: Visual progress indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <div 
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
                role="progressbar"
                aria-valuenow={formProgress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`Form completion progress: ${formProgress}%`}
              >
                <div 
                  style={{
                    width: `${formProgress}%`,
                    height: '100%',
                    backgroundColor: formProgress < 30 ? '#f44336' : formProgress < 70 ? '#ff9800' : '#4caf50',
                    transition: 'width 0.3s ease, background-color 0.3s ease'
                  }}
                />
              </div>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: '40px' }}>
              {formProgress}%
            </Typography>
          </Box>
        </Box>
        
        {/* Offline Status Alert */}
        {isOffline && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            icon={<OfflineIcon />}
            action={
              syncInProgress && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SyncIcon sx={{ 
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                  <Typography variant="caption">Syncing...</Typography>
                </Box>
              )
            }
          >
            <Typography variant="body2">
              <strong>Offline Mode:</strong> {offlineMessage}
            </Typography>
            {queuedRequests.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {queuedRequests.length} request(s) queued for sync
              </Typography>
            )}
          </Alert>
        )}

        {/* Draft Restoration Alert */}
        {showDraftRestore && draftInfo && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            icon={<RestoreIcon />}
            action={
              <Stack direction="row" spacing={1}>
                <Tooltip title="Restore your previous work">
                  <IconButton 
                    size="small" 
                    onClick={handleRestoreDraft}
                    aria-label="Restore draft"
                  >
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dismiss draft">
                  <IconButton 
                    size="small" 
                    onClick={handleDismissDraft}
                    aria-label="Dismiss draft"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          >
            <Typography variant="body2">
              <strong>Draft Available:</strong> You have unsaved work from{' '}
              {draftInfo.lastSaved && new Date(draftInfo.lastSaved).toLocaleString()}
            </Typography>
          </Alert>
        )}

        {/* Auto-save Status */}
        {draftSaved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 16 }} />
              <Typography variant="body2">Draft saved automatically</Typography>
            </Box>
          </Alert>
        )}

        {/* Sync Progress */}
        {syncInProgress && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Syncing data with server...
            </Typography>
          </Box>
        )}

        {/* Submission Progress */}
        {isSubmitting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={submissionProgress}
              sx={{
                '& .MuiLinearProgress-bar': {
                  transition: 'transform 0.4s ease-in-out',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {submissionStatus === 'validating' && 'Validating form data...'}
                {submissionStatus === 'saving' && 'Saving task...'}
                {submissionStatus === 'syncing' && 'Syncing with server...'}
                {submissionStatus === 'success' && 'Task created successfully!'}
                {submissionStatus === 'error' && 'Submission failed'}
                {!submissionStatus && 'Processing...'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {submissionProgress}%
              </Typography>
            </Box>
            {networkTimeout && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                Request is taking longer than expected. Please check your connection.
              </Typography>
            )}
          </Box>
        )}

        {/* Validation Help Alert */}
        <Fade in={showValidationHelp}>
          <Alert 
            severity="info" 
            sx={{ mb: 2, display: showValidationHelp ? 'flex' : 'none' }}
            icon={<InfoIcon />}
            onClose={() => setShowValidationHelp(false)}
          >
            <Typography variant="body2">
              <strong>Tip:</strong> {validationHelpText}
            </Typography>
          </Alert>
        </Fade>
        
        <Divider sx={{ mb: 3 }} />

        {/* Main form content area */}
        <main id="main-form-content" role="main">
          <Grid container spacing={3} component="fieldset" sx={{ border: 'none', m: 0, p: 0 }}>
            <legend className="sr-only">Task Details Form</legend>
          {/* Title Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title *"
              name="title"
              value={formData.title}
              onChange={handleChange('title')}
              onFocus={() => handleFieldFocus('title')}
              onBlur={handleFieldBlur('title')}
              error={!!getFieldError('title')}
              helperText={getFieldError('title') || `${formData.title.length}/${VALIDATION_RULES.title.maxLength} characters`}
              required
              autoFocus
              ref={titleFieldRef}
              aria-describedby="title-helper-text title-guidance"
              inputProps={{
                'aria-label': 'Task title, required field',
                'aria-required': 'true',
                'aria-invalid': !!getFieldError('title'),
                maxLength: VALIDATION_RULES.title.maxLength,
              }}
              FormHelperTextProps={{
                id: 'title-helper-text',
                'aria-live': 'polite'
              }}
            />
            <div id="title-guidance" className="sr-only">
              A clear, descriptive title helps team members understand what needs to be done.
            </div>
          </Grid>

          {/* Description Field */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description (Optional)"
              name="description"
              value={formData.description}
              onChange={handleChange('description')}
              onFocus={() => handleFieldFocus('description')}
              onBlur={handleFieldBlur('description')}
              error={!!getFieldError('description')}
              helperText={getFieldError('description') || `${formData.description.length}/${VALIDATION_RULES.description.maxLength} characters`}
              aria-describedby="description-helper-text description-guidance"
              inputProps={{
                'aria-label': 'Task description, optional field',
                maxLength: VALIDATION_RULES.description.maxLength,
              }}
              FormHelperTextProps={{
                id: 'description-helper-text',
                'aria-live': 'polite'
              }}
            />
            <div id="description-guidance" className="sr-only">
              Provide additional details, acceptance criteria, or context for this task.
            </div>
          </Grid>

          {/* Priority and Due Date Row */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!getFieldError('priority')}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                name="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleChange('priority')}
                onFocus={() => handleFieldFocus('priority')}
                onBlur={handleFieldBlur('priority')}
                aria-describedby="priority-helper-text priority-guidance"
                inputProps={{
                  'aria-label': 'Task priority level',
                }}
              >
                <MenuItem value="low" aria-describedby="priority-low-desc">
                  <Box>
                    <Typography component="span">Low</Typography>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Nice-to-have features, non-urgent improvements
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="medium" aria-describedby="priority-medium-desc">
                  <Box>
                    <Typography component="span">Medium</Typography>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Standard work items, planned features
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="high" aria-describedby="priority-high-desc">
                  <Box>
                    <Typography component="span">High</Typography>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Urgent tasks, critical fixes, time-sensitive work
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
              <FormHelperText id="priority-helper-text" aria-live="polite">
                {getFieldError('priority') || 'Select the urgency level for this task'}
              </FormHelperText>
            </FormControl>
            <div id="priority-guidance" className="sr-only">
              Priority helps determine task order and resource allocation.
            </div>
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Due Date (Optional)"
              value={formData.dueDate}
              onChange={handleDateChange}
              onOpen={() => handleFieldFocus('dueDate')}
              onClose={() => handleFieldBlur('dueDate')()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  name: 'dueDate',
                  error: !!getFieldError('dueDate'),
                  helperText: getFieldError('dueDate') || 'Leave empty if no specific deadline',
                  onBlur: handleFieldBlur('dueDate'),
                  onFocus: () => handleFieldFocus('dueDate'),
                  'aria-describedby': 'duedate-helper-text duedate-guidance',
                  inputProps: {
                    'aria-label': 'Task due date, optional field',
                  },
                  FormHelperTextProps: {
                    id: 'duedate-helper-text',
                    'aria-live': 'polite'
                  }
                }
              }}
            />
            <div id="duedate-guidance" className="sr-only">
              Choose when this task should be completed. Leave empty if there's no specific deadline.
            </div>
          </Grid>

          {/* Assignee Field */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={mockUsers}
              getOptionLabel={(option) => `${option.name} (${option.email})`}
              value={formData.assignee}
              onChange={handleAutocompleteChange('assignee')}
              onFocus={() => handleFieldFocus('assignee')}
              onBlur={handleFieldBlur('assignee')}
              aria-describedby="assignee-guidance"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assignee (Optional)"
                  name="assignee"
                  error={!!getFieldError('assignee')}
                  helperText={getFieldError('assignee') || 'Select who will be responsible for this task'}
                  aria-describedby="assignee-helper-text assignee-guidance"
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'Task assignee, optional field',
                  }}
                  FormHelperTextProps={{
                    id: 'assignee-helper-text',
                    'aria-live': 'polite'
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box component="div" sx={{ flexGrow: 1 }}>
                    <Typography component="div">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <div id="assignee-guidance" className="sr-only">
              Select who will be responsible for completing this task. Leave empty for unassigned tasks.
            </div>
          </Grid>

          {/* Tags Field */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={mockTags}
              value={formData.tags}
              onChange={handleAutocompleteChange('tags')}
              onFocus={() => handleFieldFocus('tags')}
              onBlur={handleFieldBlur('tags')}
              freeSolo
              aria-describedby="tags-guidance"
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={index}
                    aria-label={`Tag: ${option}. Press Delete to remove.`}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags (Optional)"
                  name="tags"
                  placeholder="Select or create tags"
                  error={!!getFieldError('tags')}
                  helperText={getFieldError('tags') || `${formData.tags.length}/${VALIDATION_RULES.tags.maxCount} tags selected`}
                  aria-describedby="tags-helper-text tags-guidance"
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'Task tags, optional field. Type to search or create new tags',
                  }}
                  FormHelperTextProps={{
                    id: 'tags-helper-text',
                    'aria-live': 'polite'
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  <Typography component="div">
                    {option}
                  </Typography>
                </li>
              )}
            />
            <div id="tags-guidance" className="sr-only">
              Add labels to categorize and make your task easier to find. You can select from existing tags or create new ones.
            </div>
          </Grid>

          {/* Dependencies Field */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={mockExistingTasks}
              getOptionLabel={(option) => option.title}
              value={formData.dependencies}
              onChange={handleAutocompleteChange('dependencies')}
              onFocus={() => handleFieldFocus('dependencies')}
              onBlur={handleFieldBlur('dependencies')}
              aria-describedby="dependencies-guidance"
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={`#${option.id}: ${option.title}`}
                    {...getTagProps({ index })}
                    key={option.id}
                    aria-label={`Dependency: Task ${option.id}, ${option.title}. Press Delete to remove.`}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Dependencies (Optional)"
                  name="dependencies"
                  placeholder="Select tasks that must be completed first"
                  error={!!getFieldError('dependencies')}
                  helperText={getFieldError('dependencies') || `${formData.dependencies.length}/${VALIDATION_RULES.dependencies.maxCount} dependencies selected. Tasks that must be completed before this task can start.`}
                  aria-describedby="dependencies-helper-text dependencies-guidance"
                  inputProps={{
                    ...params.inputProps,
                    'aria-label': 'Task dependencies, optional field. Select prerequisite tasks',
                  }}
                  FormHelperTextProps={{
                    id: 'dependencies-helper-text',
                    'aria-live': 'polite'
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box component="div" sx={{ flexGrow: 1 }}>
                    <Typography component="div">
                      #{option.id}: {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This task must be completed before the new task can start
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <div id="dependencies-guidance" className="sr-only">
              Select other tasks that must be completed before this task can start. This helps with project planning and task ordering.
            </div>
          </Grid>
          </Grid>
        </main>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="flex-end"
          component="section"
          aria-labelledby="form-actions-label"
          role="group"
        >
          <Typography id="form-actions-label" className="sr-only">
            Form Actions
          </Typography>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            startIcon={<CancelIcon />}
            aria-label="Cancel task creation and return to previous page"
            aria-describedby="cancel-help"
          >
            Cancel
          </Button>
          <div id="cancel-help" className="sr-only">
            Cancels task creation. Any unsaved changes will be lost.
          </div>
          
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isFormValid}
            startIcon={
              isSubmitting ? (
                submissionStatus === 'success' ? <SuccessIcon /> : 
                submissionStatus === 'error' ? <ErrorIcon /> :
                <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} />
              ) : <SaveIcon />
            }
            ref={submitButtonRef}
            aria-label={
              isSubmitting ? 
                `${submissionStatus === 'validating' ? 'Validating' : 
                  submissionStatus === 'saving' ? 'Saving' : 
                  submissionStatus === 'success' ? 'Task created successfully' :
                  submissionStatus === 'error' ? 'Submission failed' : 'Creating'} task, please wait...` : 
              !isFormValid ? 'Create task button disabled due to validation errors' : 
              'Create task and add to project'
            }
            aria-describedby="submit-help"
            sx={{
              '& .MuiSvgIcon-root': {
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              },
            }}
          >
            {isSubmitting ? 
              (submissionStatus === 'validating' ? 'Validating...' :
               submissionStatus === 'saving' ? 'Saving...' :
               submissionStatus === 'syncing' ? 'Syncing...' :
               submissionStatus === 'success' ? 'Success!' :
               submissionStatus === 'error' ? 'Failed' :
               'Creating...') : 
              'Create Task'}
          </Button>
          <div id="submit-help" className="sr-only">
            {!isFormValid ? 
              'Please fix validation errors before submitting the form.' :
              'Creates the task with the information provided and adds it to your project.'}
          </div>
        </Stack>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelLeave}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            You have unsaved changes that will be lost if you leave this page. 
            Your progress has been automatically saved as a draft and can be restored later.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLeave} aria-label="Stay on page">
            Stay
          </Button>
          <Button onClick={handleConfirmLeave} color="warning" aria-label="Leave and discard changes">
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity} 
          variant="filled"
          icon={
            notification.severity === 'success' ? <SuccessIcon /> :
            notification.severity === 'error' ? <ErrorIcon /> :
            notification.severity === 'warning' ? <WarningIcon /> :
            <InfoIcon />
          }
          sx={{ minWidth: '300px' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

// Add accessibility CSS styles
const styles = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .skip-link:focus {
    position: absolute !important;
    top: 6px !important;
    left: 6px !important;
    background: #000 !important;
    color: #fff !important;
    padding: 8px !important;
    text-decoration: none !important;
    border-radius: 4px !important;
    font-size: 14px !important;
    font-weight: bold !important;
    z-index: 1000 !important;
  }
`;

// Inject CSS if not already injected
if (typeof document !== 'undefined' && !document.getElementById('task-form-accessibility-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'task-form-accessibility-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default TaskCreationForm; 