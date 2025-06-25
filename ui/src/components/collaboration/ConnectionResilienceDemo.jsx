import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  CloudOff,
  CloudQueue,
  Sync,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Router,
  Schedule,
  Send,
  Refresh,
  Clear
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const ConnectionResilienceDemo = () => {
  const {
    isConnected,
    isOnline,
    connectionState,
    error,
    offlineQueue,
    lastSyncTime,
    connect,
    disconnect,
    emit,
    forceReconnect,
    clearOfflineQueue,
    getConnectionStats,
    processOfflineQueue
  } = useWebSocket();

  const [stats, setStats] = useState({});
  const [testMessage, setTestMessage] = useState('');
  const [messagePriority, setMessagePriority] = useState('normal');
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update stats periodically
  useEffect(() => {
    if (!autoRefresh) return;

    const updateStats = () => {
      if (getConnectionStats) {
        setStats(getConnectionStats());
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [getConnectionStats, autoRefresh]);

  // Simulate offline mode
  useEffect(() => {
    if (simulateOffline) {
      disconnect();
    } else {
      connect();
    }
  }, [simulateOffline, connect, disconnect]);

  const handleSendTestMessage = () => {
    if (testMessage.trim()) {
      emit('test_message', {
        message: testMessage,
        timestamp: Date.now(),
        userId: 'demo-user'
      }, {
        priority: messagePriority,
        queueWhenOffline: true
      });
      setTestMessage('');
    }
  };

  const handleForceReconnect = () => {
    if (forceReconnect) {
      forceReconnect();
    }
  };

  const handleProcessQueue = () => {
    if (processOfflineQueue) {
      processOfflineQueue();
    }
  };

  const handleClearQueue = () => {
    if (clearOfflineQueue) {
      clearOfflineQueue();
    }
  };

  const getConnectionStateColor = () => {
    switch (connectionState) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'reconnecting': return 'warning';
      case 'disconnected': return 'error';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStateIcon = () => {
    switch (connectionState) {
      case 'connected': return <Wifi color="success" />;
      case 'connecting': return <Router color="warning" />;
      case 'reconnecting': return <Router color="warning" />;
      case 'disconnected': return <WifiOff color="error" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return <WifiOff />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Connection Resilience Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test and demonstrate WebSocket connection resilience features including offline queuing,
        automatic reconnection, and data synchronization.
      </Typography>

      <Grid container spacing={3}>
        {/* Connection Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getConnectionStateIcon()}
                <Typography variant="body1">
                  {connectionState}
                </Typography>
                <Chip 
                  label={isOnline ? 'Online' : 'Offline'} 
                  color={isOnline ? 'success' : 'error'}
                  size="small"
                />
              </Box>

              {(connectionState === 'connecting' || connectionState === 'reconnecting') && (
                <LinearProgress sx={{ mb: 2 }} color={getConnectionStateColor()} />
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error.message || 'Connection error'}
                </Alert>
              )}

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Wifi />
                  </ListItemIcon>
                  <ListItemText
                    primary="WebSocket Connected"
                    secondary={isConnected ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudOff />
                  </ListItemIcon>
                  <ListItemText
                    primary="Network Online"
                    secondary={isOnline ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Refresh />
                  </ListItemIcon>
                  <ListItemText
                    primary="Reconnect Attempts"
                    secondary={`${stats.reconnectAttempts || 0}/10`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Sync"
                    secondary={formatTimestamp(lastSyncTime)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Offline Queue Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Offline Queue
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudQueue />
                <Typography variant="body1">
                  {stats.offlineQueueSize || 0} messages queued
                </Typography>
              </Box>

              {offlineQueue && offlineQueue.length > 0 && (
                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {offlineQueue.slice(0, 5).map((message, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Send color={
                          message.priority === 'high' ? 'error' :
                          message.priority === 'low' ? 'disabled' : 'primary'
                        } />
                      </ListItemIcon>
                      <ListItemText
                        primary={message.event}
                        secondary={`${message.priority} priority - ${formatTimestamp(message.timestamp)}`}
                      />
                    </ListItem>
                  ))}
                  {offlineQueue.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${offlineQueue.length - 5} more messages`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              )}

              {(!offlineQueue || offlineQueue.length === 0) && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircle color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No messages in queue
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Test Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={simulateOffline}
                        onChange={(e) => setSimulateOffline(e.target.checked)}
                      />
                    }
                    label="Simulate Offline"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                      />
                    }
                    label="Auto Refresh Stats"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={handleForceReconnect}
                    startIcon={<Refresh />}
                    disabled={connectionState === 'connecting'}
                    fullWidth
                  >
                    Force Reconnect
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={handleProcessQueue}
                    startIcon={<Sync />}
                    disabled={!isConnected || !offlineQueue || offlineQueue.length === 0}
                    fullWidth
                  >
                    Process Queue
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Message Testing */}
              <Typography variant="subtitle1" gutterBottom>
                Test Message Queuing
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Test Message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
                  sx={{ flexGrow: 1 }}
                />
                
                <TextField
                  select
                  label="Priority"
                  value={messagePriority}
                  onChange={(e) => setMessagePriority(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </TextField>
                
                <Button
                  variant="contained"
                  onClick={handleSendTestMessage}
                  startIcon={<Send />}
                  disabled={!testMessage.trim()}
                >
                  Send
                </Button>
              </Stack>

              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Messages sent while offline will be queued and sent when connection is restored
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleClearQueue}
                  startIcon={<Clear />}
                  disabled={!offlineQueue || offlineQueue.length === 0}
                >
                  Clear Queue
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Connection Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connection Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {stats.reconnectAttempts || 0}
                    </Typography>
                    <Typography variant="caption">
                      Reconnect Attempts
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.offlineQueueSize || 0}
                    </Typography>
                    <Typography variant="caption">
                      Queued Messages
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={stats.hasConflicts ? 'error.main' : 'success.main'}>
                      {stats.hasConflicts ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption">
                      Data Conflicts
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {stats.queuedMessages || 0}
                    </Typography>
                    <Typography variant="caption">
                      Pending Messages
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConnectionResilienceDemo; 