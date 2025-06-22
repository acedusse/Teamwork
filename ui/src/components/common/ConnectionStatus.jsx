import React from 'react';
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
  Avatar
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Circle,
  Person,
  Refresh,
  Warning
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

const ConnectionStatus = () => {
  const {
    isConnected,
    isOnline,
    error,
    connectedUsers,
    connect,
    disconnect,
    currentUser
  } = useWebSocket();

  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReconnect = () => {
    if (!isConnected) {
      connect();
    }
    handleClose();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (error) return 'warning';
    if (isConnected) return 'success';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (error) return 'Connection Error';
    if (isConnected) return 'Connected';
    return 'Connecting...';
  };

  const getStatusIcon = () => {
    if (!isOnline || error) return <WifiOff />;
    if (isConnected) return <Wifi />;
    return <Warning />;
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              animation: !isConnected && isOnline ? 'pulse 1.5s infinite' : 'none'
            }
          }}
        />
      </Tooltip>

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
        <Box sx={{ p: 2, minWidth: 300 }}>
          {/* Connection Details */}
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
            
            {error && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                Error: {error.message || 'Connection failed'}
              </Typography>
            )}

            {!isConnected && isOnline && (
              <Box sx={{ mt: 1 }}>
                <IconButton 
                  size="small" 
                  onClick={handleReconnect}
                  color="primary"
                >
                  <Refresh />
                </IconButton>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Retry connection
                </Typography>
              </Box>
            )}
          </Box>

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
        </Box>
      </Popover>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default ConnectionStatus; 