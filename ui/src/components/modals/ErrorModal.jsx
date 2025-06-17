import React from 'react';
import {
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

/**
 * ErrorModal - Modal component for displaying errors with detailed information
 * 
 * Features:
 * - Error type classification (error, warning, network, validation)
 * - Detailed error information with stack traces
 * - Retry functionality for recoverable errors
 * - Copy error details to clipboard
 * - Bug reporting integration
 * - User-friendly error messages
 */
const ErrorModal = ({
  open = false,
  onClose,
  onRetry,
  onReport,
  error,
  title,
  type = 'error',
  showDetails = true,
  showRetry = true,
  showReport = false,
  retryText = 'Try Again',
  reportText = 'Report Bug',
  closeText = 'Close',
  // Custom styling
  maxWidth = 'md',
  sx = {},
  contentSx = {},
  // Additional props
  ...other
}) => {
  // Error type configurations
  const errorTypes = {
    error: {
      icon: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
      color: 'error',
      defaultTitle: 'An Error Occurred',
      severity: 'error'
    },
    warning: {
      icon: <WarningIcon color="warning" sx={{ fontSize: 48 }} />,
      color: 'warning',
      defaultTitle: 'Warning',
      severity: 'warning'
    },
    network: {
      icon: <ErrorIcon color="error" sx={{ fontSize: 48 }} />,
      color: 'error',
      defaultTitle: 'Network Error',
      severity: 'error'
    },
    validation: {
      icon: <WarningIcon color="warning" sx={{ fontSize: 48 }} />,
      color: 'warning',
      defaultTitle: 'Validation Error',
      severity: 'warning'
    }
  };

  const config = errorTypes[type] || errorTypes.error;

  // Extract error information
  const getErrorInfo = () => {
    if (!error) return null;

    // Handle different error formats
    if (typeof error === 'string') {
      return {
        message: error,
        code: null,
        stack: null,
        details: null
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.code || error.status,
        stack: error.stack,
        details: error.details || null,
        name: error.name
      };
    }

    // Handle custom error objects
    return {
      message: error.message || 'Unknown error',
      code: error.code || error.status,
      stack: error.stack,
      details: error.details || error.data,
      name: error.name || 'Error'
    };
  };

  const errorInfo = getErrorInfo();

  // Handle copy error details
  const handleCopyError = async () => {
    if (!errorInfo) return;

    const errorText = `
Error: ${errorInfo.message}
${errorInfo.code ? `Code: ${errorInfo.code}` : ''}
${errorInfo.name ? `Type: ${errorInfo.name}` : ''}
${errorInfo.stack ? `\nStack Trace:\n${errorInfo.stack}` : ''}
${errorInfo.details ? `\nDetails:\n${JSON.stringify(errorInfo.details, null, 2)}` : ''}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      console.log('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  // Handle retry
  const handleRetry = () => {
    if (onRetry) {
      onRetry(error);
    }
  };

  // Handle report
  const handleReport = () => {
    if (onReport) {
      onReport(error, errorInfo);
    }
  };

  // Determine if error is retryable
  const isRetryable = () => {
    if (!showRetry || !onRetry) return false;
    
    // Network errors are usually retryable
    if (type === 'network') return true;
    
    // Server errors (5xx) are retryable
    if (errorInfo?.code >= 500) return true;
    
    // Timeout errors are retryable
    if (errorInfo?.name === 'TimeoutError') return true;
    
    return false;
  };

  // Actions
  const actions = (
    <>
      {showReport && onReport && (
        <Button
          onClick={handleReport}
          variant="outlined"
          color="inherit"
          startIcon={<BugReportIcon />}
          sx={{ minWidth: 120 }}
        >
          {reportText}
        </Button>
      )}
      
      {isRetryable() && (
        <Button
          onClick={handleRetry}
          variant="outlined"
          color={config.color}
          startIcon={<RefreshIcon />}
          sx={{ minWidth: 120 }}
        >
          {retryText}
        </Button>
      )}
      
      <Button
        onClick={onClose}
        variant="contained"
        color={config.color}
        startIcon={<CloseIcon />}
        sx={{ minWidth: 100 }}
      >
        {closeText}
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title || config.defaultTitle}
      actions={actions}
      maxWidth={maxWidth}
      sx={{
        '& .MuiDialog-paper': {
          overflow: 'visible',
        },
        ...sx
      }}
      contentSx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...contentSx
      }}
      {...other}
    >
      {/* Error Icon */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mb: 2 
      }}>
        {config.icon}
      </Box>

      {/* Main Error Message */}
      {errorInfo?.message && (
        <Alert severity={config.severity} sx={{ mb: 2 }}>
          <AlertTitle>
            {errorInfo.name || 'Error'}
            {errorInfo.code && (
              <Chip 
                label={`Code: ${errorInfo.code}`} 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </AlertTitle>
          {errorInfo.message}
        </Alert>
      )}

      {/* Error Details */}
      {showDetails && errorInfo && (errorInfo.stack || errorInfo.details) && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Technical Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Copy Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyError}
                  variant="outlined"
                >
                  Copy Details
                </Button>
              </Box>

              {/* Error Details */}
              {errorInfo.details && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Error Details:
                  </Typography>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {typeof errorInfo.details === 'string' 
                      ? errorInfo.details 
                      : JSON.stringify(errorInfo.details, null, 2)
                    }
                  </pre>
                </Paper>
              )}

              {/* Stack Trace */}
              {errorInfo.stack && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Stack Trace:
                  </Typography>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {errorInfo.stack}
                  </pre>
                </Paper>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Helpful Tips */}
      {type === 'network' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>Troubleshooting Tips</AlertTitle>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </Alert>
      )}

      {type === 'validation' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>How to Fix</AlertTitle>
          Please review your input and make sure all required fields are filled out correctly.
        </Alert>
      )}
    </BaseModal>
  );
};

ErrorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onRetry: PropTypes.func,
  onReport: PropTypes.func,
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(Error)
  ]),
  title: PropTypes.node,
  type: PropTypes.oneOf(['error', 'warning', 'network', 'validation']),
  showDetails: PropTypes.bool,
  showRetry: PropTypes.bool,
  showReport: PropTypes.bool,
  retryText: PropTypes.string,
  reportText: PropTypes.string,
  closeText: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  sx: PropTypes.object,
  contentSx: PropTypes.object
};

export default ErrorModal; 