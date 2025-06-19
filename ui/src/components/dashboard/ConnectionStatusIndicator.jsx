import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Refresh,
  CloudQueue,
  Error as ErrorIcon,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * Connection Status Indicator Component
 * 
 * Displays real-time connection status for Flow Optimization data
 * Part of Task 6.7 implementation for real-time data integration
 */
const ConnectionStatusIndicator = ({
  connectionStatus,
  lastUpdated,
  isLoading,
  onRefresh,
  error,
  cacheStats,
  className
}) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi />,
          color: 'success',
          label: 'Real-time',
          description: 'Connected via WebSocket'
        };
      case 'connecting':
        return {
          icon: <CircularProgress size={16} />,
          color: 'warning',
          label: 'Connecting',
          description: 'Establishing WebSocket connection'
        };
      case 'disconnected':
        return {
          icon: <WifiOff />,
          color: 'error',
          label: 'Offline',
          description: 'WebSocket disconnected'
        };
      case 'polling':
        return {
          icon: <CloudQueue />,
          color: 'info',
          label: 'Polling',
          description: 'Using fallback polling'
        };
      case 'error':
        return {
          icon: <ErrorIcon />,
          color: 'error',
          label: 'Error',
          description: 'Connection error occurred'
        };
      default:
        return {
          icon: <Schedule />,
          color: 'default',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Format last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <Box 
      className={className}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        p: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {/* Connection Status Chip */}
      <Tooltip title={statusConfig.description}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          variant="outlined"
          size="small"
          sx={{ 
            fontWeight: 500,
            '& .MuiChip-icon': {
              fontSize: '1rem'
            }
          }}
        />
      </Tooltip>

      {/* Last Updated */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          Last updated
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
          {formatLastUpdated(lastUpdated)}
        </Typography>
      </Box>

      {/* Cache Stats (if available) */}
      {cacheStats && (
        <Tooltip title={`Cache: ${cacheStats.cacheSize} items, ${cacheStats.optimisticUpdatesCount} pending updates`}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
            <Typography variant="caption" color="text.secondary">
              Cached
            </Typography>
          </Box>
        </Tooltip>
      )}

      {/* Error Message */}
      {error && (
        <Tooltip title={error}>
          <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
        </Tooltip>
      )}

      {/* Manual Refresh Button */}
      <Tooltip title="Refresh data">
        <IconButton
          onClick={onRefresh}
          disabled={isLoading}
          size="small"
          sx={{ 
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'primary.contrastText'
            }
          }}
        >
          {isLoading ? (
            <CircularProgress size={16} />
          ) : (
            <Refresh />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

ConnectionStatusIndicator.propTypes = {
  connectionStatus: PropTypes.oneOf([
    'connected',
    'connecting', 
    'disconnected',
    'polling',
    'error',
    'unknown'
  ]).isRequired,
  lastUpdated: PropTypes.instanceOf(Date),
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  error: PropTypes.string,
  cacheStats: PropTypes.shape({
    cacheSize: PropTypes.number,
    optimisticUpdatesCount: PropTypes.number,
    lastCacheUpdate: PropTypes.number
  }),
  className: PropTypes.string
};

ConnectionStatusIndicator.defaultProps = {
  lastUpdated: null,
  isLoading: false,
  error: null,
  cacheStats: null,
  className: ''
};

export default ConnectionStatusIndicator; 