import React from 'react';
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Fade,
  Backdrop
} from '@mui/material';
import {
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';

/**
 * LoadingModal - Modal component for displaying loading states
 * 
 * Features:
 * - Circular and linear progress indicators
 * - Determinate and indeterminate progress
 * - Cancellable operations
 * - Custom loading messages
 * - Progress percentage display
 * - Estimated time remaining
 * - Backdrop overlay option
 */
const LoadingModal = ({
  open = false,
  onCancel,
  title = 'Loading...',
  message,
  progress,
  progressType = 'circular',
  variant = 'indeterminate',
  showProgress = true,
  showCancel = false,
  cancelText = 'Cancel',
  estimatedTime,
  // Styling
  maxWidth = 'sm',
  sx = {},
  contentSx = {},
  backdropProps = {},
  // Additional props
  ...other
}) => {
  // Format estimated time
  const formatEstimatedTime = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds remaining`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  // Progress component based on type
  const ProgressComponent = () => {
    if (!showProgress) return null;

    const progressProps = {
      variant,
      ...(variant === 'determinate' && { value: progress || 0 }),
      size: progressType === 'circular' ? 60 : undefined,
      thickness: progressType === 'circular' ? 4 : undefined,
      sx: {
        ...(progressType === 'linear' && { width: '100%', mb: 2 })
      }
    };

    return progressType === 'circular' ? (
      <CircularProgress {...progressProps} />
    ) : (
      <LinearProgress {...progressProps} />
    );
  };

  // Actions
  const actions = showCancel && onCancel ? (
    <Button
      onClick={onCancel}
      variant="outlined"
      color="inherit"
      startIcon={<CancelIcon />}
      sx={{ minWidth: 100 }}
    >
      {cancelText}
    </Button>
  ) : null;

  return (
    <>
      {/* Custom backdrop for non-modal loading */}
      {open && !other.disableBackdrop && (
        <Backdrop
          open={open}
          sx={{
            zIndex: (theme) => theme.zIndex.modal - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            ...backdropProps.sx
          }}
          {...backdropProps}
        />
      )}

      <BaseModal
        open={open}
        onClose={showCancel ? onCancel : undefined}
        title={title}
        actions={actions}
        maxWidth={maxWidth}
        disableEscapeKeyDown={!showCancel}
        sx={{
          '& .MuiDialog-paper': {
            overflow: 'visible',
          },
          ...sx
        }}
        contentSx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          py: 4,
          ...contentSx
        }}
        {...other}
      >
        {/* Loading Icon */}
        <Fade in={open} timeout={300}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            {progressType === 'circular' ? (
              <ProgressComponent />
            ) : (
              <HourglassIcon 
                sx={{ 
                  fontSize: 48, 
                  color: 'primary.main',
                  animation: 'pulse 2s infinite'
                }} 
              />
            )}
          </Box>
        </Fade>

        {/* Linear Progress */}
        {progressType === 'linear' && (
          <Box sx={{ width: '100%' }}>
            <ProgressComponent />
          </Box>
        )}

        {/* Progress Percentage */}
        {variant === 'determinate' && typeof progress === 'number' && (
          <Typography variant="h6" color="primary">
            {Math.round(progress)}%
          </Typography>
        )}

        {/* Loading Message */}
        {message && (
          <Typography 
            variant="body1" 
            color="text.secondary" 
            align="center"
            sx={{ maxWidth: '80%' }}
          >
            {message}
          </Typography>
        )}

        {/* Estimated Time */}
        {estimatedTime && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
          >
            {formatEstimatedTime(estimatedTime)}
          </Typography>
        )}

        {/* Loading Animation Styles */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              opacity: 1;
            }
          }
        `}</style>
      </BaseModal>
    </>
  );
};

LoadingModal.propTypes = {
  open: PropTypes.bool,
  onCancel: PropTypes.func,
  title: PropTypes.node,
  message: PropTypes.node,
  progress: PropTypes.number,
  progressType: PropTypes.oneOf(['circular', 'linear']),
  variant: PropTypes.oneOf(['determinate', 'indeterminate']),
  showProgress: PropTypes.bool,
  showCancel: PropTypes.bool,
  cancelText: PropTypes.string,
  estimatedTime: PropTypes.number,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  sx: PropTypes.object,
  contentSx: PropTypes.object,
  backdropProps: PropTypes.object
};

export default LoadingModal; 