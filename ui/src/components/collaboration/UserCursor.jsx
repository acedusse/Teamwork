import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Avatar,
  Typography,
  Fade,
  Portal,
  Button,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Mouse } from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

/**
 * Individual User Cursor Component
 */
const UserCursor = ({ user, position, isVisible = true }) => {
  const [showLabel, setShowLabel] = useState(true);
  
  // Hide label after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabel(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [position]);

  // Show label when cursor moves
  useEffect(() => {
    setShowLabel(true);
  }, [position.x, position.y]);

  const getUserColor = (userId) => {
    // Generate consistent color based on user ID
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!isVisible || !position) return null;

  const cursorColor = getUserColor(user.userId);

  return (
    <Box
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-2px, -2px)',
        transition: 'all 0.1s ease-out'
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        style={{
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
        }}
      >
        <path
          d="M5.5 2L15 11.5L11 12.5L9 16L7 15L9 11.5L5.5 2Z"
          fill={cursorColor}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User label */}
      <Fade in={showLabel} timeout={200}>
        <Box
          sx={{
            position: 'absolute',
            left: 20,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: cursorColor,
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: `4px solid ${cursorColor}`
            }
          }}
        >
          <Avatar
            sx={{
              width: 16,
              height: 16,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '0.6rem'
            }}
          >
            {getInitials(user.userName)}
          </Avatar>
          <Typography variant="caption" color="inherit">
            {user.userName}
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

/**
 * User Cursors Manager Component
 * Manages and displays all user cursors
 */
const UserCursorsManager = ({ 
  enabled = true,
  throttleMs = 50,
  hideAfterMs = 5000,
  showOwnCursor = false
}) => {
  const { 
    socket, 
    isConnected, 
    connectedUsers, 
    currentUser,
    sendCursorUpdate,
    on
  } = useWebSocket();
  
  const [userCursors, setUserCursors] = useState(new Map());
  const [isTrackingCursor] = useState(enabled);
  const lastSentPosition = useRef({ x: 0, y: 0 });
  const throttleTimer = useRef(null);

  // Handle incoming cursor updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleCursorUpdate = (data) => {
      // Don't show our own cursor unless explicitly requested
      if (data.userId === currentUser.userId && !showOwnCursor) return;

      const user = connectedUsers.find(u => u.userId === data.userId);
      if (!user) return;

      setUserCursors(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          user,
          position: { x: data.x, y: data.y },
          timestamp: Date.now(),
          isVisible: true
        });
        return updated;
      });

      // Hide cursor after inactivity
      setTimeout(() => {
        setUserCursors(prev => {
          const updated = new Map(prev);
          const cursor = updated.get(data.userId);
          if (cursor && Date.now() - cursor.timestamp >= hideAfterMs) {
            cursor.isVisible = false;
            updated.set(data.userId, cursor);
          }
          return updated;
        });
      }, hideAfterMs);
    };

    const cleanup = on('cursorUpdate', handleCursorUpdate);
    return cleanup;
  }, [socket, isConnected, connectedUsers, currentUser.userId, showOwnCursor, hideAfterMs, on]);

  // Track mouse movement and send updates
  const handleMouseMove = useCallback((event) => {
    if (!isTrackingCursor || !isConnected) return;

    const { clientX: x, clientY: y } = event;
    
    // Throttle cursor updates
    if (throttleTimer.current) return;
    
    // Only send if position changed significantly
    const dx = Math.abs(x - lastSentPosition.current.x);
    const dy = Math.abs(y - lastSentPosition.current.y);
    if (dx < 5 && dy < 5) return;

    throttleTimer.current = setTimeout(() => {
      throttleTimer.current = null;
    }, throttleMs);

    lastSentPosition.current = { x, y };
    
    sendCursorUpdate({
      x,
      y,
      timestamp: Date.now(),
      page: window.location.pathname
    });
  }, [isTrackingCursor, isConnected, throttleMs, sendCursorUpdate]);

  // Handle mouse leave (hide cursor for others)
  const handleMouseLeave = useCallback(() => {
    if (!isConnected) return;
    
    sendCursorUpdate({
      x: -1,
      y: -1,
      timestamp: Date.now(),
      page: window.location.pathname,
      hidden: true
    });
  }, [isConnected, sendCursorUpdate]);

  // Add/remove event listeners
  useEffect(() => {
    if (!enabled || !isTrackingCursor) return;

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, isTrackingCursor, handleMouseMove, handleMouseLeave]);

  // Clean up old cursors
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setUserCursors(prev => {
        const updated = new Map();
        prev.forEach((cursor, userId) => {
          if (now - cursor.timestamp < hideAfterMs * 2) {
            updated.set(userId, cursor);
          }
        });
        return updated;
      });
    }, hideAfterMs);

    return () => clearInterval(cleanup);
  }, [hideAfterMs]);

  // Remove cursors for disconnected users
  useEffect(() => {
    const connectedUserIds = new Set(connectedUsers.map(u => u.userId));
    setUserCursors(prev => {
      const updated = new Map();
      prev.forEach((cursor, userId) => {
        if (connectedUserIds.has(userId)) {
          updated.set(userId, cursor);
        }
      });
      return updated;
    });
  }, [connectedUsers]);

  if (!enabled) return null;

  return (
    <Portal>
      {Array.from(userCursors.values()).map(({ user, position, isVisible }) => (
        <UserCursor
          key={user.userId}
          user={user}
          position={position}
          isVisible={isVisible}
        />
      ))}
    </Portal>
  );
};

/**
 * Cursor Tracking Toggle Component
 */
const CursorTrackingToggle = ({ 
  enabled, 
  onToggle, 
  variant = 'switch' // 'switch', 'button', 'chip'
}) => {
  const { isConnected } = useWebSocket();

  if (!isConnected) return null;

  switch (variant) {
    case 'button':
      return (
        <Button
          variant={enabled ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onToggle(!enabled)}
          startIcon={<Mouse />}
        >
          {enabled ? 'Hide Cursors' : 'Show Cursors'}
        </Button>
      );

    case 'chip':
      return (
        <Chip
          icon={<Mouse />}
          label={enabled ? 'Cursors On' : 'Cursors Off'}
          color={enabled ? 'primary' : 'default'}
          variant={enabled ? 'filled' : 'outlined'}
          onClick={() => onToggle(!enabled)}
          clickable
        />
      );

    default: // 'switch'
      return (
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              size="small"
            />
          }
          label="Show Cursors"
        />
      );
  }
};

// PropTypes
UserCursor.propTypes = {
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired
  }).isRequired,
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  isVisible: PropTypes.bool
};

UserCursorsManager.propTypes = {
  enabled: PropTypes.bool,
  throttleMs: PropTypes.number,
  hideAfterMs: PropTypes.number,
  showOwnCursor: PropTypes.bool
};

CursorTrackingToggle.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['switch', 'button', 'chip'])
};

export default UserCursorsManager;
export { UserCursor, CursorTrackingToggle }; 