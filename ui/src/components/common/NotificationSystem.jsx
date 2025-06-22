import React, { useState, useEffect, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Paper,
  Fade,
  Slide
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Task as TaskIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

// Notification types and their configurations
const NOTIFICATION_CONFIG = {
  info: {
    severity: 'info',
    icon: <InfoIcon />,
    color: 'primary',
    autoHideDuration: 5000
  },
  success: {
    severity: 'success',
    icon: <CheckCircleIcon />,
    color: 'success',
    autoHideDuration: 4000
  },
  warning: {
    severity: 'warning',
    icon: <WarningIcon />,
    color: 'warning',
    autoHideDuration: 6000
  },
  error: {
    severity: 'error',
    icon: <ErrorIcon />,
    color: 'error',
    autoHideDuration: 8000
  },
  task_update: {
    severity: 'info',
    icon: <TaskIcon />,
    color: 'primary',
    autoHideDuration: 5000
  }
};

// Task event icons
const TASK_EVENT_ICONS = {
  'task:created': <AddIcon />,
  'task:updated': <EditIcon />,
  'task:deleted': <DeleteIcon />,
  'task:status_changed': <CheckCircleIcon />,
  'task:assigned': <AssignmentIcon />
};

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [currentSnackbar, setCurrentSnackbar] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { socket, isConnected } = useWebSocket();

  // Handle incoming notifications from WebSocket
  const handleNotification = useCallback((notification) => {
    console.log('Received notification:', notification);
    
    const newNotification = {
      ...notification,
      id: notification.id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    setUnreadCount(prev => prev + 1);
    
    // Show snackbar for new notification
    setCurrentSnackbar(newNotification);
    setSnackbarOpen(true);
  }, []);

  // Handle task events and convert them to notifications
  const handleTaskEvent = useCallback((eventData) => {
    console.log('Received task event:', eventData);
    
    const { eventType, task, metadata } = eventData;
    
    // Create a notification from the task event
    let message = '';
    let type = 'info';
    
    switch (eventType) {
      case 'task:created':
        message = `New task created: "${task.title}"`;
        type = 'success';
        break;
      case 'task:updated':
        message = `Task updated: "${task.title}"`;
        type = 'info';
        break;
      case 'task:deleted':
        message = `Task deleted: "${task.title}"`;
        type = 'warning';
        break;
      case 'task:status_changed':
        const statusChange = metadata.statusChange;
        message = `Task "${task.title}" status changed from "${statusChange.from}" to "${statusChange.to}"`;
        type = 'info';
        break;
      case 'task:assigned':
        const assignmentChange = metadata.assignmentChange;
        if (!assignmentChange.from && assignmentChange.to) {
          message = `Task "${task.title}" assigned to ${assignmentChange.to}`;
        } else if (assignmentChange.from && assignmentChange.to) {
          message = `Task "${task.title}" reassigned from ${assignmentChange.from} to ${assignmentChange.to}`;
        }
        type = 'info';
        break;
      default:
        message = `Task event: ${eventType}`;
        type = 'info';
    }

    if (message) {
      const notification = {
        id: `task_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'task_update',
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          taskId: task.id,
          eventType
        },
        read: false
      };

      handleNotification(notification);
    }
  }, [handleNotification]);

  // Set up WebSocket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for direct notifications
    socket.on('notification', handleNotification);
    
    // Listen for task events
    socket.on('task:created', handleTaskEvent);
    socket.on('task:updated', handleTaskEvent);
    socket.on('task:deleted', handleTaskEvent);
    socket.on('task:status_changed', handleTaskEvent);
    socket.on('task:assigned', handleTaskEvent);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('task:created', handleTaskEvent);
      socket.off('task:updated', handleTaskEvent);
      socket.off('task:deleted', handleTaskEvent);
      socket.off('task:status_changed', handleTaskEvent);
      socket.off('task:assigned', handleTaskEvent);
    };
  }, [socket, isConnected, handleNotification, handleTaskEvent]);

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Handle notification menu
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    handleMenuClose();
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Get notification config
  const getNotificationConfig = (type) => {
    return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.info;
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-describedby="notifications-menu"
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          max={99}
          aria-label={`${unreadCount} unread notifications`}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notifications Menu */}
      <Menu
        id="notifications-menu"
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            minWidth: 350,
            maxWidth: 400
          }
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            <Box>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton
                size="small"
                onClick={clearAllNotifications}
                aria-label="Clear all notifications"
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
            {notifications.map((notification, index) => {
              const config = getNotificationConfig(notification.type);
              const isTaskEvent = notification.metadata?.eventType;
              const icon = isTaskEvent 
                ? TASK_EVENT_ICONS[notification.metadata.eventType] || config.icon
                : config.icon;

              return (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => markAsRead(notification.id)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.read ? 'normal' : 'bold',
                              flex: 1
                            }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                          {notification.metadata?.taskId && (
                            <Chip
                              label={`Task #${notification.metadata.taskId}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 16, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Menu>

      {/* Snackbar for new notifications */}
      {currentSnackbar && (
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={getNotificationConfig(currentSnackbar.type).autoHideDuration}
          onClose={handleSnackbarClose}
          TransitionComponent={Slide}
          TransitionProps={{ direction: 'left' }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={getNotificationConfig(currentSnackbar.type).severity}
            variant="filled"
            sx={{ minWidth: 300 }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleSnackbarClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <AlertTitle>
              {currentSnackbar.type === 'task_update' ? 'Task Update' : 'Notification'}
            </AlertTitle>
            {currentSnackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default NotificationSystem; 