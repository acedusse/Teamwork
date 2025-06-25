import React, { useState, useEffect } from 'react';
import { 
  Chip, 
  Tooltip, 
  Box, 
  Typography, 
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  LinearProgress,
  Alert,
  Button,
  Divider,
  Stack
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Circle,
  Person,
  Refresh,
  Warning,
  CloudOff,
  CloudQueue,
  Sync,
  SignalWifiOff,
  Router,
  Schedule,
  CheckCircle,
  Error as ErrorIcon,
  Info
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const ConnectionStatus = () => {
  const {
    isConnected,
    isOnline,
    connectionState,
    error,
    connectedUsers,
    connect,
    disconnect,
    currentUser,
    forceReconnect,
    getConnectionStats,
    offlineQueue,
    lastSyncTime,
    clearOfflineQueue
  } = useWebSocket();

  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState({});
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  // Update connection stats periodically
  useEffect(() => {
    const updateStats = () => {
      if (getConnectionStats) {
        setStats(getConnectionStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000); // Update every second

    return () => clearInterval(interval);
  }, [getConnectionStats]);

  // Show offline alert when going offline
  useEffect(() => {
    if (!isOnline || connectionState === 'failed') {
      setShowOfflineAlert(true);
      const timer = setTimeout(() => setShowOfflineAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, connectionState]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReconnect = () => {
    if (forceReconnect) {
      forceReconnect();
    } else if (!isConnected) {
      connect();
    }
    handleClose();
  };

  const handleClearQueue = () => {
    if (clearOfflineQueue) {
      clearOfflineQueue();
    }
    handleClose();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (connectionState === 'failed') return 'error';
    if (connectionState === 'reconnecting') return 'warning';
    if (connectionState === 'connecting') return 'warning';
    if (error && connectionState === 'connected') return 'warning';
    if (isConnected) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (connectionState === 'failed') return 'Connection Failed';
    if (connectionState === 'reconnecting') return 'Reconnecting...';
    if (connectionState === 'connecting') return 'Connecting...';
    if (error && connectionState === 'connected') return 'Connected (Issues)';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff />;
    if (connectionState === 'failed') return <SignalWifiOff />;
    if (connectionState === 'reconnecting') return <Router />;
    if (connectionState === 'connecting') return <Router />;
    if (error && connectionState === 'connected') return <Warning />;
    if (isConnected) return <Wifi />;
    return <WifiOff />;
  };

  const getDetailedStatusInfo = () => {
    const info = [];
    
    if (!isOnline) {
      info.push({ type: 'error', message: 'No internet connection detected' });
    }
    
    if (connectionState === 'reconnecting' && stats.reconnectAttempts > 0) {
      info.push({ 
        type: 'warning', 
        message: `Reconnection attempt ${stats.reconnectAttempts}/10` 
      });
    }
    
    if (stats.offlineQueueSize > 0) {
      info.push({ 
        type: 'info', 
        message: `${stats.offlineQueueSize} messages queued for sync` 
      });
    }
    
    if (error) {
      info.push({ 
        type: 'error', 
        message: error.message || 'Connection error occurred' 
      });
    }
    
    if (stats.hasConflicts) {
      info.push({ 
        type: 'warning', 
        message: 'Data conflicts detected - manual resolution may be required' 
      });
    }

    return info;
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const diff = Date.now() - lastSyncTime;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(lastSyncTime).toLocaleDateString();
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Offline Alert */}
      {showOfflineAlert && (
        <Alert 
          severity="warning" 
          variant="filled" 
          size="small"
          onClose={() => setShowOfflineAlert(false)}
          sx={{ 
            position: 'fixed', 
            top: 80, 
            right: 16, 
            zIndex: 9999,
            minWidth: 300
          }}
        >
          {!isOnline ? 'You are offline. Changes will be queued for sync.' : 'Connection failed. Retrying...'}
        </Alert>
      )}

      {/* Connection Status Chip */}
      <Tooltip title={`${getStatusText()} - Click for details`}>
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          size="small"
          onClick={handleClick}
          sx={{ 
            cursor: 'pointer',
            '& .MuiChip-icon': {
              animation: connectionState === 'connecting' || connectionState === 'reconnecting' 
                ? 'pulse 1.5s infinite' : 'none'
            }
          }}
        />
      </Tooltip>

      {/* Offline Queue Indicator */}
      {stats.offlineQueueSize > 0 && (
        <Tooltip title={`${stats.offlineQueueSize} messages queued`}>
          <Badge 
            badgeContent={stats.offlineQueueSize} 
            color="warning"
            onClick={handleClick}
            sx={{ cursor: 'pointer' }}
          >
            <CloudQueue color="warning" />
          </Badge>
        </Tooltip>
      )}

      {/* Connected Users Count */}
      {isConnected && (
        <Tooltip title="Connected users">
          <Badge 
            badgeContent={connectedUsers.length + 1} // +1 for current user
            color="primary"
            onClick={handleClick}
            sx={{ cursor: 'pointer' }}
          >
            <Person />
          </Badge>
        </Tooltip>
      )}

      {/* Details Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 350, maxWidth: 500 }}>
          {/* Connection Status Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Connection Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getStatusIcon()}
              <Typography variant="body2">
                {getStatusText()}
              </Typography>
            </Box>

            {/* Progress bar for connecting/reconnecting */}
            {(connectionState === 'connecting' || connectionState === 'reconnecting') && (
              <LinearProgress 
                sx={{ mt: 1, mb: 1 }} 
                color={connectionState === 'reconnecting' ? 'warning' : 'primary'}
              />
            )}
          </Box>

          {/* Detailed Status Information */}
          {getDetailedStatusInfo().map((info, index) => (
            <Alert 
              key={index}
              severity={info.type} 
              variant="outlined" 
              size="small"
              sx={{ mb: 1 }}
            >
              {info.message}
            </Alert>
          ))}

          {/* Connection Statistics */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Connection Details
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Network Status:</Typography>
                <Typography variant="caption" color={isOnline ? 'success.main' : 'error.main'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">WebSocket State:</Typography>
                <Typography variant="caption">
                  {connectionState}
                </Typography>
              </Box>
              {stats.reconnectAttempts > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Reconnect Attempts:</Typography>
                  <Typography variant="caption">
                    {stats.reconnectAttempts}/10
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">Last Sync:</Typography>
                <Typography variant="caption">
                  {formatLastSync()}
                </Typography>
              </Box>
              {stats.offlineQueueSize > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Queued Messages:</Typography>
                  <Typography variant="caption">
                    {stats.offlineQueueSize}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1}>
              {(!isConnected || connectionState === 'failed') && (
                <Button 
                  size="small" 
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={handleReconnect}
                  color="primary"
                >
                  {connectionState === 'failed' ? 'Retry Connection' : 'Reconnect'}
                </Button>
              )}
              
              {stats.offlineQueueSize > 0 && (
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<CloudOff />}
                  onClick={handleClearQueue}
                  color="warning"
                >
                  Clear Queue
                </Button>
              )}

              {isConnected && (
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Sync />}
                  onClick={handleReconnect}
                >
                  Force Sync
                </Button>
              )}
            </Stack>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Current User */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              You
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Circle sx={{ color: isConnected ? 'success.main' : 'grey.400', fontSize: 12 }} />
              <Typography variant="body2">
                {currentUser.userName}
              </Typography>
              {!isOnline && (
                <Chip label="Offline" size="small" color="warning" />
              )}
            </Box>
          </Box>

          {/* Connected Users */}
          {isConnected && connectedUsers.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Connected Users ({connectedUsers.length})
              </Typography>
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {connectedUsers.map((user) => (
                  <ListItem key={user.userId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <Circle sx={{ color: 'white', fontSize: 12 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.userName}
                      secondary={`Joined ${new Date(user.joinedAt).toLocaleTimeString()}`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {isConnected && connectedUsers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No other users connected
            </Typography>
          )}

          {/* Offline Mode Information */}
          {!isOnline && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  <strong>Offline Mode Active</strong><br/>
                  • Changes are saved locally<br/>
                  • Messages are queued for sync<br/>
                  • Reconnection is automatic when online
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default ConnectionStatus; 