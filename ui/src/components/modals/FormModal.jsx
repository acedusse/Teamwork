import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Alert,
  AlertTitle,
  CircularProgress,
  LinearProgress,
  Box,
  Typography
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import ConfirmationModal from './ConfirmationModal';

/**
 * FormModal - Modal component specifically designed for forms
 * 
 * Features:
 * - Form validation and error handling
 * - Unsaved changes detection and confirmation
 * - Loading states and progress tracking
 * - Auto-save functionality (optional)
 * - Network connectivity awareness
 * - Retry mechanism for failed submissions
 * - Accessibility compliant form handling
 */
const FormModal = ({
  open = false,
  onClose,
  onSubmit,
  onCancel,
  title,
  children,
  // Form props
  initialData = {},
  validationSchema,
  validateOnChange = true,
  validateOnBlur = true,
  // Button props
  submitText = 'Save',
  cancelText = 'Cancel',
  submitColor = 'primary',
  cancelColor = 'inherit',
  submitVariant = 'contained',
  cancelVariant = 'outlined',
  // State props
  isSubmitting = false,
  submitProgress = 0,
  errors = {},
  hasUnsavedChanges = false,
  // Network and retry props
  isOnline = true,
  maxRetries = 3,
  retryCount = 0,
  onRetry,
  // Auto-save props
  enableAutoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  // Confirmation props
  confirmUnsavedChanges = true,
  unsavedChangesMessage = 'You have unsaved changes. Are you sure you want to close?',
  // Custom styling
  maxWidth = 'md',
  sx = {},
  contentSx = {},
  // Additional props
  ...other
}) => {
  // Internal state
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [formData, setFormData] = useState(initialData);
  
  // Refs
  const formRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Reset form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // Auto-save functionality
  useEffect(() => {
    if (enableAutoSave && onAutoSave && hasUnsavedChanges && isOnline) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave(formData);
      }, autoSaveInterval);
    }

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [enableAutoSave, onAutoSave, hasUnsavedChanges, isOnline, formData, autoSaveInterval]);

  // Handle form submission
  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();
    
    if (isSubmitting) return;

    try {
      setSubmitError(null);
      setShowRetryOption(false);
      
      if (onSubmit) {
        await onSubmit(formData, event);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error);
      
      // Show retry option for retryable errors
      const isRetryable = error.name !== 'ValidationError' && 
                         error.status !== 400 && 
                         retryCount < maxRetries;
      setShowRetryOption(isRetryable);
    }
  }, [formData, onSubmit, isSubmitting, retryCount, maxRetries]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      handleSubmit();
    }
  }, [onRetry, handleSubmit]);

  // Handle cancel
  const handleCancel = useCallback((event) => {
    if (onCancel) {
      onCancel(event);
    } else {
      handleClose(event);
    }
  }, [onCancel]);

  // Handle close with unsaved changes check
  const handleClose = useCallback((event, reason) => {
    if (hasUnsavedChanges && confirmUnsavedChanges && reason !== 'unsavedConfirmed') {
      setShowUnsavedConfirm(true);
      return;
    }
    
    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    onClose?.(event, reason);
  }, [hasUnsavedChanges, confirmUnsavedChanges, onClose]);

  // Handle unsaved changes confirmation
  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedConfirm(false);
    onClose?.(null, 'unsavedConfirmed');
  }, [onClose]);

  // Handle unsaved changes cancel
  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedConfirm(false);
  }, []);

  // Get error information for display
  const getErrorInfo = useCallback((error) => {
    if (!isOnline) {
      return {
        type: 'network',
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        canRetry: true,
        icon: <ErrorIcon />
      };
    }

    if (error?.name === 'ValidationError' || error?.status === 400) {
      return {
        type: 'validation',
        title: 'Validation Error',
        message: error.message || 'Please check your input and try again.',
        canRetry: false,
        icon: <WarningIcon />
      };
    }

    if (error?.status >= 500) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'There was a problem with the server. Please try again later.',
        canRetry: true,
        icon: <ErrorIcon />
      };
    }

    return {
      type: 'unknown',
      title: 'Unexpected Error',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      canRetry: true,
      icon: <ErrorIcon />
    };
  }, [isOnline]);

  // Form actions
  const actions = (
    <>
      <Button
        onClick={handleCancel}
        color={cancelColor}
        variant={cancelVariant}
        disabled={isSubmitting}
        startIcon={<CancelIcon />}
        sx={{ minWidth: 100 }}
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        onClick={handleSubmit}
        color={submitColor}
        variant={submitVariant}
        disabled={isSubmitting || (!isOnline && !submitError)}
        startIcon={isSubmitting ? <CircularProgress size={16} /> : <SaveIcon />}
        sx={{
          minWidth: 120,
          '&.Mui-disabled': {
            backgroundColor: isSubmitting ? 'primary.main' : undefined,
            color: isSubmitting ? 'primary.contrastText' : undefined,
            opacity: isSubmitting ? 0.8 : undefined,
          }
        }}
      >
        {isSubmitting ? 'Saving...' : submitText}
      </Button>
    </>
  );

  const errorInfo = submitError ? getErrorInfo(submitError) : null;

  return (
    <>
      <BaseModal
        open={open}
        onClose={handleClose}
        title={title}
        actions={actions}
        maxWidth={maxWidth}
        disableEscapeKeyDown={isSubmitting}
        disableBackdropClick={isSubmitting}
        sx={sx}
        contentSx={{
          '& form': {
            width: '100%',
          },
          ...contentSx
        }}
        {...other}
      >
        {/* Progress Indicator */}
        {isSubmitting && submitProgress > 0 && submitProgress < 100 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={submitProgress}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" align="center">
              Saving...
            </Typography>
          </Box>
        )}

        {/* Network Status */}
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>No Internet Connection</AlertTitle>
            You are currently offline. Changes will be saved when connection is restored.
          </Alert>
        )}

        {/* Submit Error */}
        {errorInfo && (
          <Alert 
            severity={errorInfo.type === 'validation' ? 'warning' : 'error'} 
            sx={{ mb: 2 }}
            icon={errorInfo.icon}
            action={
              errorInfo.canRetry && showRetryOption ? (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRetry}
                  startIcon={<RefreshIcon />}
                  disabled={isSubmitting}
                >
                  Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                </Button>
              ) : (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setSubmitError(null)}
                >
                  Dismiss
                </Button>
              )
            }
          >
            <AlertTitle>{errorInfo.title}</AlertTitle>
            {errorInfo.message}
          </Alert>
        )}

        {/* Form Content */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          {children}
        </form>
      </BaseModal>

      {/* Unsaved Changes Confirmation */}
      <ConfirmationModal
        open={showUnsavedConfirm}
        onClose={handleUnsavedCancel}
        onConfirm={handleUnsavedConfirm}
        onCancel={handleUnsavedCancel}
        type="warning"
        title="Unsaved Changes"
        message={unsavedChangesMessage}
        confirmText="Close Without Saving"
        cancelText="Stay"
        confirmColor="warning"
        autoFocusConfirm={false}
      />
    </>
  );
};

FormModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  initialData: PropTypes.object,
  validationSchema: PropTypes.object,
  validateOnChange: PropTypes.bool,
  validateOnBlur: PropTypes.bool,
  submitText: PropTypes.string,
  cancelText: PropTypes.string,
  submitColor: PropTypes.string,
  cancelColor: PropTypes.string,
  submitVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  cancelVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  isSubmitting: PropTypes.bool,
  submitProgress: PropTypes.number,
  errors: PropTypes.object,
  hasUnsavedChanges: PropTypes.bool,
  isOnline: PropTypes.bool,
  maxRetries: PropTypes.number,
  retryCount: PropTypes.number,
  onRetry: PropTypes.func,
  enableAutoSave: PropTypes.bool,
  autoSaveInterval: PropTypes.number,
  onAutoSave: PropTypes.func,
  confirmUnsavedChanges: PropTypes.bool,
  unsavedChangesMessage: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  sx: PropTypes.object,
  contentSx: PropTypes.object
};

export default FormModal; 