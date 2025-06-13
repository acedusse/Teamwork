import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Collapse,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Stack,
  LinearProgress,
  Tooltip,
  Fade
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  Wifi as OnlineIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Schedule as QueueIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import { useOfflineStatus } from '../hooks/useOfflineStatus';
import offlineService from '../services/offlineService';

/**
 * OfflineBanner Component
 * Displays offline status and provides information about queued actions
 */
export default function OfflineBanner({
  position = 'top', // 'top', 'bottom', 'fixed-top', 'fixed-bottom'
  showOnlineMessage = true,
  autoHideOnline = 5000, // Auto-hide online message after 5 seconds
  showQueueInfo = true,
  allowManualDismiss = true,
  variant = 'filled', // 'filled', 'outlined', 'standard'
  showRetryButton = true,
  onRetry = null,
  className = ''
}) {
  const {
    isOnline,
    isOffline,
    offlineDurationFormatted,
    checkConnectivity,
    isChecking
  } = useOfflineStatus({
    onOnline: () => {
      setShowOnlineAlert(true);
      if (autoHideOnline > 0) {
        setTimeout(() => setShowOnlineAlert(false), autoHideOnline);
      }
    }
  });

  const [showOfflineAlert, setShowOfflineAlert] = useState(isOffline);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [queueStatus, setQueueStatus] = useState({ total: 0 });
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Update offline alert visibility
  useEffect(() => {
    setShowOfflineAlert(isOffline);
  }, [isOffline]);

  // Update queue status
  useEffect(() => {
    const updateQueueStatus = () => {
      const status = offlineService.getQueueStatus();
      setQueueStatus(status);
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000); // Update every 5 seconds

    // Listen for queue processing events
    const handleOnline = () => {
      setIsProcessingQueue(true);
      setTimeout(() => setIsProcessingQueue(false), 3000);
    };

    offlineService.addListener('banner', { online: handleOnline });

    return () => {
      clearInterval(interval);
      offlineService.removeListener('banner');
    };
  }, []);

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await checkConnectivity();
    }
  };

  const handleDismissOffline = () => {
    setShowOfflineAlert(false);
  };

  const handleDismissOnline = () => {
    setShowOnlineAlert(false);
  };

  const getPositionStyles = () => {
    const baseStyles = {
      width: '100%',
      zIndex: 9999
    };

    switch (position) {
      case 'fixed-top':
        return {
          ...baseStyles,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0
        };
      case 'fixed-bottom':
        return {
          ...baseStyles,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0
        };
      case 'top':
      case 'bottom':
      default:
        return baseStyles;
    }
  };

  const QueueStatusChip = () => {
    if (!showQueueInfo || queueStatus.total === 0) return null;

    return (
      <Tooltip title={`${queueStatus.total} actions queued for when you're back online`}>
        <Chip
          icon={<QueueIcon />}
          label={`${queueStatus.total} queued`}
          size="small"
          color="warning"
          variant="outlined"
        />
      </Tooltip>
    );
  };

  const OfflineAlertContent = () => (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <OfflineIcon />
          <Typography variant="h6" component="div">
            You're offline
          </Typography>
          {offlineDurationFormatted && (
            <Chip 
              label={`for ${offlineDurationFormatted}`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        
        <Typography variant="body2" sx={{ mb: showQueueInfo ? 1 : 0 }}>
          Your changes are being saved locally and will sync when you're back online.
        </Typography>
        
        {showQueueInfo && queueStatus.total > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <QueueStatusChip />
            {queueStatus.highPriority > 0 && (
              <Chip
                label={`${queueStatus.highPriority} high priority`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
            {isProcessingQueue && (
              <Chip
                icon={<RefreshIcon className="rotating" />}
                label="Processing queue..."
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Stack>
        )}
      </Box>
      
      <Stack direction="row" spacing={1}>
        {showRetryButton && (
          <Button
            variant="outlined"
            size="small"
            startIcon={isChecking ? <RefreshIcon className="rotating" /> : <RefreshIcon />}
            onClick={handleRetry}
            disabled={isChecking}
          >
            Check Connection
          </Button>
        )}
        
        {allowManualDismiss && (
          <IconButton
            size="small"
            onClick={handleDismissOffline}
            aria-label="Dismiss offline notification"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );

  const OnlineAlertContent = () => (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
      <OnlineIcon color="success" />
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" component="div">
          You're back online!
        </Typography>
        <Typography variant="body2">
          {queueStatus.total > 0 
            ? `Processing ${queueStatus.total} queued actions...`
            : 'All your data is up to date.'
          }
        </Typography>
      </Box>
      
      {isProcessingQueue && (
        <Box sx={{ width: 100 }}>
          <LinearProgress />
        </Box>
      )}
      
      {allowManualDismiss && (
        <IconButton
          size="small"
          onClick={handleDismissOnline}
          aria-label="Dismiss online notification"
        >
          <CloseIcon />
        </IconButton>
      )}
    </Stack>
  );

  return (
    <Box sx={getPositionStyles()} className={className}>
      {/* Offline Alert */}
      <Collapse in={showOfflineAlert && isOffline}>
        <Alert
          severity="warning"
          variant={variant}
          sx={{ borderRadius: position.includes('fixed') ? 0 : 1 }}
        >
          <OfflineAlertContent />
        </Alert>
      </Collapse>

      {/* Online Alert */}
      <Fade in={showOnlineAlert && isOnline && showOnlineMessage}>
        <Alert
          severity="success"
          variant={variant}
          sx={{ 
            borderRadius: position.includes('fixed') ? 0 : 1,
            display: showOnlineAlert && isOnline && showOnlineMessage ? 'flex' : 'none'
          }}
        >
          <OnlineAlertContent />
        </Alert>
      </Fade>

      {/* CSS for rotating icon */}
      <style jsx>{`
        .rotating {
          animation: rotate 2s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
}

/**
 * Compact OfflineBanner for use in headers or limited space
 */
export function CompactOfflineBanner({
  showText = true,
  onClick = null,
  className = ''
}) {
  const { isOnline, isOffline, offlineDurationFormatted } = useOfflineStatus();
  const [queueStatus, setQueueStatus] = useState({ total: 0 });

  useEffect(() => {
    const updateQueueStatus = () => {
      setQueueStatus(offlineService.getQueueStatus());
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline) return null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Chip
      icon={<OfflineIcon />}
      label={
        showText ? (
          queueStatus.total > 0 
            ? `Offline • ${queueStatus.total} queued`
            : `Offline${offlineDurationFormatted ? ` • ${offlineDurationFormatted}` : ''}`
        ) : 'Offline'
      }
      color="warning"
      variant="outlined"
      size="small"
      onClick={handleClick}
      clickable={!!onClick}
      className={className}
      sx={{
        '& .MuiChip-icon': {
          color: 'warning.main'
        }
      }}
    />
  );
}

/**
 * OfflineStatusIndicator - Simple status indicator
 */
export function OfflineStatusIndicator({
  size = 'small',
  showTooltip = true,
  className = ''
}) {
  const { isOnline, offlineDurationFormatted } = useOfflineStatus();
  const [queueStatus, setQueueStatus] = useState({ total: 0 });

  useEffect(() => {
    const updateQueueStatus = () => {
      setQueueStatus(offlineService.getQueueStatus());
    };

    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getTooltipContent = () => {
    if (isOnline) {
      return 'Online - All systems operational';
    }
    
    let content = `Offline${offlineDurationFormatted ? ` for ${offlineDurationFormatted}` : ''}`;
    if (queueStatus.total > 0) {
      content += ` • ${queueStatus.total} actions queued`;
    }
    return content;
  };

  const indicator = (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        width: size === 'small' ? 12 : 16,
        height: size === 'small' ? 12 : 16,
        borderRadius: '50%',
        backgroundColor: isOnline ? 'success.main' : 'warning.main',
        position: 'relative',
        '&::after': !isOnline ? {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: 'warning.main',
          animation: 'pulse 2s infinite'
        } : undefined
      }}
    />
  );

  if (!showTooltip) return indicator;

  return (
    <>
      <Tooltip title={getTooltipContent()}>
        {indicator}
      </Tooltip>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
} 