import React from 'react';
import {
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

/**
 * ConfirmationModal - Reusable confirmation dialog component
 * 
 * Features:
 * - Multiple confirmation types (warning, error, info, success, delete)
 * - Customizable buttons and actions
 * - Loading states for async operations
 * - Keyboard shortcuts (Enter to confirm, Escape to cancel)
 * - Accessibility compliant
 */
const ConfirmationModal = ({
  open = false,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  description,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  cancelColor = 'inherit',
  confirmVariant = 'contained',
  cancelVariant = 'outlined',
  isLoading = false,
  loadingText = 'Processing...',
  disabled = false,
  showIcon = true,
  maxWidth = 'sm',
  destructive = false,
  autoFocusConfirm = false,
  // Custom styling
  sx = {},
  contentSx = {},
  // Additional props
  ...other
}) => {
  // Icon mapping based on type
  const iconMap = {
    warning: <WarningIcon color="warning" sx={{ fontSize: 48 }} />,
    error: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
    info: <InfoIcon color="info" sx={{ fontSize: 48 }} />,
    help: <HelpIcon color="primary" sx={{ fontSize: 48 }} />,
    delete: <DeleteIcon color="error" sx={{ fontSize: 48 }} />,
    success: <SuccessIcon color="success" sx={{ fontSize: 48 }} />
  };

  // Color mapping for destructive actions
  const getConfirmColor = () => {
    if (destructive || type === 'delete' || type === 'error') {
      return 'error';
    }
    return confirmColor;
  };

  // Default titles based on type
  const getDefaultTitle = () => {
    switch (type) {
      case 'delete':
        return 'Delete Confirmation';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      case 'help':
        return 'Help';
      case 'success':
        return 'Success';
      default:
        return 'Confirm Action';
    }
  };

  // Handle confirm action
  const handleConfirm = async (event) => {
    if (onConfirm) {
      await onConfirm(event);
    }
  };

  // Handle cancel action
  const handleCancel = (event) => {
    if (onCancel) {
      onCancel(event);
    } else {
      onClose?.(event, 'cancel');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isLoading && !disabled) {
      event.preventDefault();
      handleConfirm(event);
    }
  };

  // Actions
  const actions = (
    <>
      <Button
        onClick={handleCancel}
        color={cancelColor}
        variant={cancelVariant}
        disabled={isLoading}
        sx={{ minWidth: 100 }}
      >
        {cancelText}
      </Button>
      <Button
        onClick={handleConfirm}
        color={getConfirmColor()}
        variant={confirmVariant}
        disabled={isLoading || disabled}
        autoFocus={autoFocusConfirm}
        startIcon={isLoading ? <CircularProgress size={16} /> : null}
        sx={{ 
          minWidth: 120,
          '&.Mui-disabled': {
            backgroundColor: isLoading ? 'primary.main' : undefined,
            color: isLoading ? 'primary.contrastText' : undefined,
            opacity: isLoading ? 0.8 : undefined,
          }
        }}
      >
        {isLoading ? loadingText : confirmText}
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title || getDefaultTitle()}
      actions={actions}
      maxWidth={maxWidth}
      onKeyDown={handleKeyDown}
      disableEscapeKeyDown={isLoading}
      disableBackdropClick={isLoading}
      sx={{
        '& .MuiDialog-paper': {
          textAlign: 'center',
        },
        ...sx
      }}
      contentSx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 3,
        ...contentSx
      }}
      {...other}
    >
      {/* Icon */}
      {showIcon && (
        <Box sx={{ mb: 1 }}>
          {iconMap[type]}
        </Box>
      )}

      {/* Message */}
      {message && (
        <Typography
          variant="h6"
          component="p"
          sx={{
            fontWeight: 500,
            textAlign: 'center',
            mb: description ? 1 : 0
          }}
        >
          {message}
        </Typography>
      )}

      {/* Description */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: 1.5
          }}
        >
          {description}
        </Typography>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {loadingText}
          </Typography>
        </Box>
      )}
    </BaseModal>
  );
};

ConfirmationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  title: PropTypes.node,
  message: PropTypes.node.isRequired,
  description: PropTypes.node,
  type: PropTypes.oneOf(['warning', 'error', 'info', 'help', 'delete', 'success']),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
  cancelColor: PropTypes.string,
  confirmVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  cancelVariant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  disabled: PropTypes.bool,
  showIcon: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  destructive: PropTypes.bool,
  autoFocusConfirm: PropTypes.bool,
  sx: PropTypes.object,
  contentSx: PropTypes.object
};

export default ConfirmationModal; 