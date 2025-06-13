import React from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle } from '@mui/material';
import { RefreshRounded as RefreshIcon, BugReport as BugIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log error details
    this.logError(error, errorInfo, errorId);
  }

  logError = async (error, errorInfo, errorId) => {
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
    };

    // Console logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', errorData);
    }

    // Send to error reporting service in production
    try {
      const { productionConfig } = await import('../config/production.js');
      if (productionConfig.errorReporting.enabled) {
        try {
          await fetch(productionConfig.errorReporting.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorData),
          });
        } catch (reportingError) {
          console.error('Failed to report error:', reportingError);
        }
      }
    } catch (configError) {
      // Config not available (e.g., in tests), skip error reporting
      console.log('Error reporting config not available');
    }
  };

  getUserId = () => {
    // Get user ID from localStorage or return anonymous
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData).id : 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n\n` +
      `Error Message: ${this.state.error?.message || 'Unknown error'}\n\n` +
      `Timestamp: ${new Date().toISOString()}\n\n` +
      `Steps to reproduce:\n1. \n2. \n3. \n\n` +
      `Additional context:\n`
    );
    
    window.open(`mailto:support@taskmaster.com?subject=${subject}&body=${body}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            backgroundColor: 'background.default',
          }}
          role="alert"
          aria-live="assertive"
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
            elevation={3}
          >
            <Box sx={{ mb: 3 }}>
              <BugIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main',
                  mb: 2,
                }}
                aria-hidden="true"
              />
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                color="error"
              >
                Something went wrong
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                paragraph
              >
                We apologize for the inconvenience. An unexpected error has occurred.
              </Typography>
            </Box>

            <Alert 
              severity="error" 
              sx={{ mb: 3, textAlign: 'left' }}
            >
              <AlertTitle>Error Details</AlertTitle>
              <Typography variant="body2" component="div">
                <strong>Error ID:</strong> {this.state.errorId}
              </Typography>
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                    <strong>Message:</strong> {this.state.error?.message}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="pre" 
                    sx={{ 
                      mt: 1, 
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      maxHeight: 200,
                    }}
                  >
                    {this.state.error?.stack}
                  </Typography>
                </>
              )}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
                size="large"
              >
                Reload Application
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReportBug}
                size="large"
              >
                Report Bug
              </Button>
            </Box>

            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 3, display: 'block' }}
            >
              If this problem persists, please contact support with Error ID: {this.state.errorId}
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 